import BottomSheet from '@/components/BottomSheet';
import SpotSheet from '@/components/sheets/SpotSheet';
import { Colors } from '@/constants/theme';
import { SurfSpot } from '@/types';
import { Camera, MapView, MarkerView } from '@maplibre/maplibre-react-native';
import { GraduationCap, Search, Store, Waves, Wrench } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const DEMO_SPOT: SurfSpot = {
    id: '1',
    name: 'Praia do Futuro',
    type: 'pico',
    coordinate: [-38.5016, -3.7172],
};

export default function MapScreen() {
    const [sheetVisible, setSheetVisible] = useState(false);

    const handlePinPress = useCallback(() => {
        setSheetVisible(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setSheetVisible(false);
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <MapView
                    style={styles.map}
                    mapStyle="https://tiles.openfreemap.org/styles/positron"
                >
                    <Camera
                        defaultSettings={{
                            zoomLevel: 12,
                            centerCoordinate: [-38.5016, -3.7172],
                        }}
                    />

                    <MarkerView coordinate={[-38.5016, -3.7172]} anchor={{ x: 0.5, y: 1 }}>
                        <TouchableOpacity
                            style={styles.pinContainer}
                            onPress={handlePinPress}
                        >
                            <View style={styles.pinBubble}>
                                <Waves size={20} color={Colors.light.background} />
                            </View>
                            <View style={styles.pinArrow} />
                        </TouchableOpacity>
                    </MarkerView>
                </MapView>

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
                        <TouchableOpacity style={styles.filterButton}>
                            <Waves size={18} color={Colors.light.background} />
                            <Text style={styles.filterText}>Picos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterButton}>
                            <GraduationCap size={18} color={Colors.light.background} />
                            <Text style={styles.filterText}>Escolinhas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterButton}>
                            <Wrench size={18} color={Colors.light.background} />
                            <Text style={styles.filterText}>Reparos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterButton}>
                            <Store size={18} color={Colors.light.background} />
                            <Text style={styles.filterText}>Lojas</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <BottomSheet
                    visible={sheetVisible}
                    onClose={handleCloseSheet}
                >
                    <SpotSheet spot={DEMO_SPOT} />
                </BottomSheet>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
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
    filterText: {
        fontSize: 13,
        color: Colors.light.background,
        fontWeight: '500',
    },
    pinContainer: {
        alignItems: 'center',
    },
    pinBubble: {
        backgroundColor: Colors.light.icon,
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
        borderTopColor: Colors.light.icon,
        marginTop: -1,
    },
});
