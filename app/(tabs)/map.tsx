import { Colors } from '@/constants/theme';
import { Camera, MapView } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { GraduationCap, Search, Store, Waves, Wrench } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MapScreen() {
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

    useEffect(() => {
        const requestLocationPermission = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationStatus(status === 'granted' ? 'granted' : 'denied');
        };

        requestLocationPermission();
    }, []);

    if (locationStatus === 'loading') {
        return (
            <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color={Colors.light.text} />
                <Text style={styles.statusText}>Solicitando permissao de localizacao...</Text>
            </View>
        );
    }

    if (locationStatus === 'denied') {
        return (
            <View style={styles.statusContainer}>
                <Text style={styles.statusTitle}>Permissao de localizacao negada</Text>
                <Text style={styles.statusText}>
                    Para usar o mapa completo, permita o acesso a localizacao nas configuracoes do dispositivo.
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={styles.map}
                mapStyle="https://tiles.openfreemap.org/styles/positron"
            >
                <Camera
                    zoomLevel={12}
                    centerCoordinate={[-38.5016, -3.7172]}
                />

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

        </View>

    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
    statusContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
        backgroundColor: Colors.light.background,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 14,
        color: Colors.light.text,
        textAlign: 'center',
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
        gap: 2
    },
    filterText: {
        fontSize: 13,
        color: Colors.light.background,
        fontWeight: '500',
    },
});
