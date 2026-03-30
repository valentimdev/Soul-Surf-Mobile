import BottomSheet from '@/components/BottomSheet';
import PinSheet from '@/components/sheets/PinSheet';
import { Colors } from '@/constants/theme';
import { beachService } from '@/services/beaches/beachService';
import { PointOfInterestDTO, poiService } from '@/services/beaches/poiService';
import { MapPin, SpotType } from '@/types';
import { BeachDTO } from '@/types/api';
import { Camera, CameraRef, MapView, MarkerView } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { GraduationCap, Locate, MapPin as MapPinIcon, Search, Store, Waves, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const POI_TYPE_MAP: Record<PointOfInterestDTO['categoria'], SpotType | null> = {
    SURF_SCHOOL: 'escolinha',
    SURF_SHOP: 'loja',
    BOARD_REPAIR: 'reparo',
    SWIMMING_SCHOOL: null,
    TOURIST_SPOT: null,
};

function beachToPin(b: BeachDTO): MapPin {
    return {
        id: `beach-${b.id}`,
        name: b.nome,
        type: 'pico',
        coordinate: [b.longitude, b.latitude],
        address: b.localizacao,
    };
}

function poiToPin(poi: PointOfInterestDTO): MapPin | null {
    const type = POI_TYPE_MAP[poi.categoria];
    if (!type) return null;
    return {
        id: `poi-${poi.id}`,
        name: poi.nome,
        type,
        coordinate: [poi.longitude, poi.latitude],
        address: poi.descricao,
        whatsapp: poi.telefone ? poi.telefone.replace(/\D/g, '') : undefined,
    };
}

const PIN_ICONS: Record<MapPin['type'], React.ComponentType<any>> = {
    pico: Waves,
    escolinha: GraduationCap,
    reparo: Wrench,
    loja: Store,
};

const ALL_TYPES: SpotType[] = ['pico', 'escolinha', 'reparo', 'loja'];

export default function MapScreen() {
    const [allPins, setAllPins] = useState<MapPin[]>([]);
    const [activeFilters, setActiveFilters] = useState<SpotType[]>([...ALL_TYPES]);
    const [loading, setLoading] = useState(true);

    const [isLocationReady, setIsLocationReady] = useState(false);
    const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [pickingLocation, setPickingLocation] = useState(false);
    const [pendingCoord, setPendingCoord] = useState<[number, number] | null>(null);
    const [showPoiModal, setShowPoiModal] = useState(false);
    const cameraRef = useRef<CameraRef>(null);

    const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeV87FW1Ut1h5b91oGwOcvndbESRr-I4JTfFirj-MU03ivCRg/viewform';

    const LAT_ENTRY = 'entry.1566997971';
    const LNG_ENTRY = 'entry.1252285469';

    useEffect(() => {
        (async () => {
            try {
                const beaches = await beachService.getAllBeaches();
                const beachPins = beaches.map(beachToPin);
                setAllPins(beachPins);
            } catch (err) {
                console.error('Erro ao carregar pins do mapa:', err);
            } finally {
                setLoading(false);
            }
        })();
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
                setUserLocation([location.coords.longitude, location.coords.latitude]);

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

    const toggleFilter = useCallback((type: SpotType) => {
        setActiveFilters((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    }, []);

    const visiblePins = allPins.filter((p) => activeFilters.includes(p.type));

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
        setSelectedPin(pin);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setSelectedPin(null);
    }, []);

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

    const initialCameraCenter = userLocation ?? [-38.5016, -3.7172];

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <MapView
                    style={styles.map}
                    mapStyle="https://tiles.openfreemap.org/styles/positron"
                    onPress={handleMapPress}
                >
                    <Camera
                        ref={cameraRef}
                        defaultSettings={{
                            zoomLevel: 12,
                            centerCoordinate: initialCameraCenter,
                        }}
                    />

                    {visiblePins.map((pin) => {
                        const IconComponent = PIN_ICONS[pin.type];
                        return (
                            <MarkerView
                                key={pin.id}
                                coordinate={pin.coordinate}
                                anchor={{ x: 0.5, y: 1 }}
                            >
                                <TouchableOpacity
                                    style={styles.pinContainer}
                                    onPress={() => handlePinPress(pin)}
                                >
                                    <View style={styles.pinBubble}>
                                        <IconComponent size={20} color={Colors.light.background} />
                                    </View>
                                    <View style={styles.pinArrow} />
                                </TouchableOpacity>
                            </MarkerView>
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
                        />
                        <Search size={20} color={Colors.light.icon} />
                    </View>

                    <View style={styles.filterRow}>
                        {(
                            [
                                { type: 'pico' as SpotType, Icon: Waves, label: 'Picos' },
                                { type: 'escolinha' as SpotType, Icon: GraduationCap, label: 'Escolinhas' },
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
                                    <Icon size={18} color={isActive ? Colors.light.background : Colors.light.text} />
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

                {/* Botão minha localização */}
                <TouchableOpacity
                    style={styles.myLocationButton}
                    onPress={handleGoToMyLocation}
                    disabled={!userLocation}
                >
                    <Locate size={22} color={userLocation ? Colors.light.text : '#aaa'} />
                </TouchableOpacity>

                {/* Botão marcar POI */}
                <TouchableOpacity
                    style={[styles.markPoiButton, pickingLocation && styles.markPoiButtonActive]}
                    onPress={handleTogglePickingMode}
                >
                    <MapPinIcon size={22} color={pickingLocation ? '#fff' : Colors.light.text} />
                </TouchableOpacity>

                <BottomSheet
                    visible={selectedPin !== null}
                    onClose={handleCloseSheet}
                >
                    {selectedPin && <PinSheet pin={selectedPin} />}
                </BottomSheet>

                {/* Modal de confirmação de POI */}
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
                                Você quer adicionar um novo ponto de interesse nessa localização?
                            </Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalBtnOutline} onPress={handleCancelPoi}>
                                    <Text style={styles.modalBtnOutlineText}>Não</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalBtnFill} onPress={handleConfirmPoi}>
                                    <Text style={styles.modalBtnFillText}>Sim, abrir formulário</Text>
                                </TouchableOpacity>
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
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
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
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    markPoiButtonActive: {
        backgroundColor: Colors.light.text,
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
        alignItems: 'center',
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
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
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
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#2A4B7C',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 3,
        justifyContent: 'center',
    },
    filterButton: {
        backgroundColor: Colors.light.text,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#2A4B7C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    filterButtonInactive: {
        backgroundColor: Colors.light.background,
        borderWidth: 1.5,
        borderColor: Colors.light.text,
        opacity: 0.7,
    },
    filterText: {
        fontSize: 13,
        color: Colors.light.background,
        fontWeight: '500',
    },
    filterTextInactive: {
        color: Colors.light.text,
    },
    pinContainer: {
        alignItems: 'center',
    },
    pinBubble: {
        backgroundColor: Colors.light.text,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2A4B7C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    pinArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.light.text,
        marginTop: -2,
    },
});