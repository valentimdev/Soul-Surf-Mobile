import BottomSheet from '@/components/BottomSheet';
import PinSheet from '@/components/sheets/PinSheet';
import { useAppAlert } from '@/components/AppAlert';
import { Colors } from '@/constants/theme';
import { beachService } from '@/services/beaches/beachService';
import { PointOfInterestDTO, poiService } from '@/services/beaches/poiService';
import { MapPin, SpotType } from '@/types';
import { BeachDTO } from '@/types/api';
import {
    Camera,
    CameraRef,
    MapView,
    MarkerView,
    PointAnnotation,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { GraduationCap, Locate, MapPin as MapPinIcon, Search, Store, Waves, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';

const POI_TYPE_MAP: Record<PointOfInterestDTO['categoria'], SpotType | null> = {
    SURF_SCHOOL: 'escolinha',
    SURF_SHOP: 'loja',
    BOARD_REPAIR: 'reparo',
    SWIMMING_SCHOOL: null,
    TOURIST_SPOT: null,
};

const PIN_ICONS: Record<MapPin['type'], React.ComponentType<any>> = {
    pico: Waves,
    escolinha: GraduationCap,
    reparo: Wrench,
    loja: Store,
};

function beachToPin(b: BeachDTO): MapPin {
    return {
        id: `beach-${b.id}`,
        sourceType: 'beach',
        beachId: b.id,
        beachName: b.nome,
        name: b.nome,
        type: 'pico',
        coordinate: [b.longitude, b.latitude],
        description: b.descricao,
        address: b.localizacao,
        imageUrl: b.caminhoFoto,
    };
}

function poiToPin(poi: PointOfInterestDTO): MapPin | null {
    const type = POI_TYPE_MAP[poi.categoria];
    if (!type) return null;
    return {
        id: `poi-${poi.id}`,
        sourceType: 'poi',
        poiId: poi.id,
        beachId: poi.beach?.id,
        beachName: poi.beach?.nome,
        name: poi.nome,
        type,
        coordinate: [poi.longitude, poi.latitude],
        description: poi.descricao,
        address: poi.beach?.localizacao || poi.descricao,
        imageUrl: poi.caminhoFoto,
        whatsapp: poi.telefone ? poi.telefone.replace(/\D/g, '') : undefined,
    };
}

const ALL_TYPES: SpotType[] = ['pico', 'escolinha', 'reparo', 'loja'];

type MapCanvasProps = {
    cameraRef: React.RefObject<CameraRef | null>;
    onMapPress: (e: any) => void;
    onPinPress: (pin: MapPin) => void;
    selectedPinId: string | null;
    pendingCoord: [number, number] | null;
    userLocation: [number, number] | null;
    visiblePins: MapPin[];
};

const MapCanvas = React.memo(function MapCanvas({
    cameraRef,
    onMapPress,
    onPinPress,
    selectedPinId,
    pendingCoord,
    userLocation,
    visiblePins,
}: MapCanvasProps) {
    return (
        <MapView
            style={styles.map}
            mapStyle="https://tiles.openfreemap.org/styles/positron"
            onPress={onMapPress}
        >
            <Camera
                ref={cameraRef}
                defaultSettings={{
                    centerCoordinate: userLocation ?? [-38.5016, -3.7172],
                    zoomLevel: 12,
                }}
            />

            {visiblePins.map((pin) => {
                const IconComponent = PIN_ICONS[pin.type];

                return (
                    <PointAnnotation
                        id={pin.id}
                        key={pin.id}
                        coordinate={pin.coordinate}
                        anchor={{ x: 0.5, y: 0.5 }}
                        selected={selectedPinId === pin.id}
                        onSelected={() => onPinPress(pin)}
                    >
                        <View collapsable={false} style={styles.pinContainer}>
                            <View collapsable={false} style={styles.pinBubble}>
                                <IconComponent size={20} color={Colors.light.background} />
                            </View>
                        </View>
                    </PointAnnotation>
                );
            })}

            {userLocation && (
                <MarkerView coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={styles.userLocationOuter}>
                        <View style={styles.userLocationDot} />
                    </View>
                </MarkerView>
            )}

            {pendingCoord && (
                <MarkerView coordinate={pendingCoord} anchor={{ x: 0.5, y: 1 }}>
                    <View style={styles.pendingPin} />
                </MarkerView>
            )}
        </MapView>
    );
});

export default function MapScreen() {
    const router = useRouter();
    const { showAlert } = useAppAlert();
    const [allPins, setAllPins] = useState<MapPin[]>([]);
    const [activeFilters, setActiveFilters] = useState<SpotType[]>([...ALL_TYPES]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);

    const [isLocationReady, setIsLocationReady] = useState(false);
    const [selectedPinData, setSelectedPinData] = useState<MapPin | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [pickingLocation, setPickingLocation] = useState(false);
    const [pendingCoord, setPendingCoord] = useState<[number, number] | null>(null);
    const [showPoiModal, setShowPoiModal] = useState(false);
    const cameraRef = useRef<CameraRef>(null);
    const initialCameraCenterRef = useRef<[number, number]>([-38.5016, -3.7172]);
    const hasInitializedCameraRef = useRef(false);
    const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeV87FW1Ut1h5b91oGwOcvndbESRr-I4JTfFirj-MU03ivCRg/viewform';
    const LAT_ENTRY = 'entry.1566997971';
    const LNG_ENTRY = 'entry.1252285469';

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const [beachesResult, poisResult] = await Promise.allSettled([
                    beachService.getAllBeaches(),
                    poiService.getAllPois(),
                ]);

                if (!mounted) return;

                const beachesData = beachesResult.status === 'fulfilled'
                    ? beachesResult.value
                    : [];
                const poisData = poisResult.status === 'fulfilled'
                    ? poisResult.value
                    : [];

                if (beachesResult.status === 'rejected') {
                    console.error('Erro ao carregar praias do mapa:', beachesResult.reason);
                }

                if (poisResult.status === 'rejected') {
                    console.error('Erro ao carregar POIs do mapa:', poisResult.reason);
                }

                const beachPins = beachesData.map(beachToPin);
                const poiPins = poisData
                    .map(poiToPin)
                    .filter((pin): pin is MapPin => pin !== null);

                setAllPins([...beachPins, ...poiPins]);
            } catch (err) {
                console.error('Erro ao carregar pins do mapa:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setIsLocationReady(true);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                const currentUserLocation: [number, number] = [
                    location.coords.longitude,
                    location.coords.latitude,
                ];
                initialCameraCenterRef.current = currentUserLocation;
                setUserLocation(currentUserLocation);
                setIsLocationReady(true);

                subscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 5 },
                    (loc: Location.LocationObject) => {
                        setUserLocation([loc.coords.longitude, loc.coords.latitude]);
                    }
                );
            } catch (error) {
                console.error('Erro ao buscar localização inicial:', error);
                setIsLocationReady(true);
            }
        })();

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (!isLocationReady || hasInitializedCameraRef.current || !cameraRef.current) return;

        hasInitializedCameraRef.current = true;
        cameraRef.current.setCamera({
            centerCoordinate: initialCameraCenterRef.current,
            zoomLevel: 12,
            animationDuration: 0,
        });
    }, [isLocationReady]);

    const toggleFilter = useCallback((type: SpotType) => {
        setActiveFilters((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    }, []);

    const handleGoToMyLocation = useCallback(() => {
        if (!userLocation || !cameraRef.current) return;
        cameraRef.current.setCamera({
            centerCoordinate: userLocation,
            zoomLevel: 15,
            animationDuration: 600,
        });
    }, [userLocation]);

    const handleTogglePickingMode = useCallback(() => {
        setPickingLocation((prev) => {
            if (prev) setPendingCoord(null);
            return !prev;
        });
    }, []);

    const handleMapPress = useCallback((e: any) => {
        if (!pickingLocation) return;
        const coords: [number, number] = e.geometry.coordinates;
        setPendingCoord(coords);
        setShowPoiModal(true);
    }, [pickingLocation]);

    const handleConfirmPoi = useCallback(() => {
        if (!pendingCoord) return;
        setShowPoiModal(false);
        setPickingLocation(false);
        const [lng, lat] = pendingCoord;
        const url = `${GOOGLE_FORMS_URL}?usp=pp_url&${LAT_ENTRY}=${lat.toFixed(6)}&${LNG_ENTRY}=${lng.toFixed(6)}`;
        Linking.openURL(url).catch(() =>
            showAlert('Erro', 'Não foi possível abrir o formulário.')
        );
        setPendingCoord(null);
    }, [pendingCoord, showAlert]);

    const handleCancelPoi = useCallback(() => {
        setShowPoiModal(false);
        setPendingCoord(null);
        setPickingLocation(false);
    }, []);

    const handlePinPress = useCallback((pin: MapPin) => {
        setSelectedPinData(pin);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setSelectedPinData(null);
    }, []);

    const handleOpenBeachDetails = useCallback((pin: MapPin) => {
        if (!pin.beachId) return;

        setSelectedPinData(null);
        router.push({
            pathname: '../beach/[id]',
            params: { id: String(pin.beachId) },
        });
    }, [router]);

    const normalizedSearch = searchText.trim().toLowerCase();
    const visiblePins = useMemo(() => {
        return allPins.filter((pin) => {
            if (!activeFilters.includes(pin.type)) return false;
            if (!normalizedSearch) return true;

            const searchable = [
                pin.name,
                pin.beachName,
                pin.address,
                pin.description,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchable.includes(normalizedSearch);
        });
    }, [allPins, activeFilters, normalizedSearch]);

    if (!isLocationReady) {
        return (
            <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background }]}>
                <ActivityIndicator size="large" color={Colors.light.text} />
                <Text style={{ marginTop: 12, color: Colors.light.text, fontWeight: '500' }}>
                    Buscando sua localização...
                </Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <MapCanvas
                    cameraRef={cameraRef}
                    onMapPress={handleMapPress}
                    onPinPress={handlePinPress}
                    selectedPinId={selectedPinData?.id ?? null}
                    pendingCoord={pendingCoord}
                    userLocation={userLocation}
                    visiblePins={visiblePins}
                />

                {pickingLocation && (
                    <View style={styles.pickingBanner}>
                        <MapPinIcon size={16} color='#fff' />
                        <Text style={styles.pickingBannerText}>Toque no mapa para marcar o local</Text>
                    </View>
                )}

                <View style={styles.overlayContainer}>
                    <View style={styles.topOverlay}>
                        <TextInput
                            placeholder="Buscar picos, lojas, escolas..."
                            placeholderTextColor={Colors.light.text}
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <Search size={20} color={Colors.light.icon} />
                    </View>

                    <View style={styles.filterRow}>
                        {(
                            [
                                { type: 'pico' as SpotType, Icon: Waves, label: 'Picos' },
                                { type: 'escolinha' as SpotType, Icon: GraduationCap, label: 'Escolas' },
                                { type: 'reparo' as SpotType, Icon: Wrench, label: 'Reparos' },
                                { type: 'loja' as SpotType, Icon: Store, label: 'Lojas' },
                            ] as const
                        ).map(({ type, Icon, label }) => {
                            const isActive = activeFilters.includes(type);
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.filterButton, !isActive && styles.filterButtonInactive]}
                                    onPress={() => toggleFilter(type)}
                                >
                                    <Icon size={16} color={isActive ? Colors.light.background : Colors.light.text} />
                                    <Text style={[styles.filterText, !isActive && styles.filterTextInactive]}>{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {loading && (
                        <ActivityIndicator
                            size="small"
                            color={Colors.light.text}
                            style={{ alignSelf: 'center', marginTop: 4 }}
                        />
                    )}
                </View>

                <View pointerEvents="box-none" style={styles.floatingControls}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.myLocationButton,
                            pressed && styles.floatingButtonPressed,
                        ]}
                        onPress={handleGoToMyLocation}
                        disabled={!userLocation}
                        hitSlop={8}
                    >
                        <Locate size={22} color={userLocation ? Colors.light.text : '#aaa'} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.markPoiButton,
                            pickingLocation && styles.markPoiButtonActive,
                            pressed && styles.floatingButtonPressed,
                        ]}
                        onPress={handleTogglePickingMode}
                        hitSlop={8}
                    >
                        <MapPinIcon size={22} color={pickingLocation ? '#fff' : Colors.light.text} />
                    </Pressable>
                </View>

                <BottomSheet
                    visible={selectedPinData !== null}
                    onClose={handleCloseSheet}
                >
                    {selectedPinData && (
                        <PinSheet
                            pin={selectedPinData}
                            onOpenBeachDetails={handleOpenBeachDetails}
                        />
                    )}
                </BottomSheet>

                <Modal
                    transparent
                    visible={showPoiModal}
                    animationType="fade"
                    onRequestClose={handleCancelPoi}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <MapPinIcon size={32} color={Colors.light.text} style={{ marginBottom: 12 }} />
                            <Text style={styles.modalTitle}>Novo ponto de interesse</Text>
                            <Text style={styles.modalBody}>
                                Você quer adicionar um novo ponto de interesse nessa localização? Você sera redirecionado para um formulario.
                            </Text>
                            <View style={styles.modalActions}>
                                <Pressable style={styles.modalBtnOutline} onPress={handleCancelPoi}>
                                    <Text style={styles.modalBtnOutlineText}>Não</Text>
                                </Pressable>
                                <Pressable style={styles.modalBtnFill} onPress={handleConfirmPoi}>
                                    <Text style={styles.modalBtnFillText}>Sim, abrir formulário</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
    userLocationOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(37, 99, 235, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(37, 99, 235, 0.4)',
    },
    userLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2563EB',
        borderWidth: 2,
        borderColor: '#fff',
    },
    floatingControls: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'box-none',
        zIndex: 30,
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 90,
        right: 16,
        backgroundColor: Colors.light.background,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    markPoiButton: {
        position: 'absolute',
        bottom: 32,
        right: 16,
        backgroundColor: Colors.light.background,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    markPoiButtonActive: {
        backgroundColor: Colors.light.text,
    },
    floatingButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    pendingPin: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E11D48',
        borderWidth: 2.5,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    pickingBanner: {
        position: 'absolute',
        bottom: 96,
        alignSelf: 'center',
        backgroundColor: Colors.light.text,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 6,
    },
    pickingBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'stretch',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalBody: {
        fontSize: 14,
        color: '#555',
        textAlign: 'left',
        lineHeight: 21,
        marginBottom: 12,
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2DEC3',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#2A4B7C',
        marginBottom: 10,
    },
    modalInputMultiline: {
        minHeight: 84,
        textAlignVertical: 'top',
    },
    modalTypeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    modalTypeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D7D2B6',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#F8F6EE',
    },
    modalTypeButtonActive: {
        backgroundColor: Colors.light.text,
        borderColor: Colors.light.text,
    },
    modalTypeText: {
        fontSize: 13,
        color: Colors.light.text,
        fontWeight: '600',
    },
    modalTypeTextActive: {
        color: '#fff',
    },
    modalSectionLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 8,
    },
    modalBeachRow: {
        gap: 8,
        paddingBottom: 2,
    },
    modalBeachButton: {
        borderWidth: 1,
        borderColor: '#D7D2B6',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: '#F8F6EE',
    },
    modalBeachButtonActive: {
        backgroundColor: '#DCEFF6',
        borderColor: Colors.light.icon,
    },
    modalBeachText: {
        fontSize: 13,
        color: Colors.light.text,
    },
    modalBeachTextActive: {
        fontWeight: '700',
    },
    modalEmptyBeachText: {
        fontSize: 13,
        color: '#6B7280',
        paddingVertical: 6,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 14,
    },
    modalBtnOutline: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalBtnOutlineText: {
        color: Colors.light.text,
        fontWeight: '600',
    },
    modalBtnFill: {
        flex: 2,
        backgroundColor: Colors.light.text,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalBtnFillText: {
        color: '#fff',
        fontWeight: '600',
    },
    overlayContainer: {
        position: 'absolute',
        top: 56,
        left: 16,
        right: 16,
        zIndex: 10,
        gap: 12,
    },
    topOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 12,
        paddingLeft: 8,
        backgroundColor: Colors.light.background,
        borderRadius: 28,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#2A4B7C',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
    },
    filterButton: {
        backgroundColor: Colors.light.text,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#2A4B7C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    filterButtonInactive: {
        backgroundColor: Colors.light.background,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
        opacity: 0.8,
    },
    filterText: {
        fontSize: 12,
        color: Colors.light.background,
        fontWeight: '600',
    },
    filterTextInactive: {
        color: Colors.light.text,
    },
    pinContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    pinBubble: {
        backgroundColor: Colors.light.text,
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Colors.light.icon,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2A4B7C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
});
