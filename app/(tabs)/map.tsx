import BottomSheet from '@/components/BottomSheet';
import PinSheet from '@/components/sheets/PinSheet';
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
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

    // FIX: Adicionada verificação de 'mounted' para evitar state updates após unmount
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        let mounted = true;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (!mounted) return;

                if (status !== 'granted') {
                    setIsLocationReady(true);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                if (!mounted) return;

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
                        if (mounted) {
                            setUserLocation([loc.coords.longitude, loc.coords.latitude]);
                        }
                    }
                );
            } catch (error) {
                console.error('Erro ao buscar localização inicial:', error);
                if (mounted) {
                    setIsLocationReady(true);
                }
            }
        })();

        return () => {
            mounted = false;
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
            Alert.alert('Erro', 'Não foi possível abrir o formulário.')
        );
        setPendingCoord(null);
    }, [pendingCoord]);

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