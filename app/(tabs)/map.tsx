import { Colors } from '@/constants/theme';
import { Camera, MapView } from '@maplibre/maplibre-react-native';
import { GraduationCap, Search, Store, Waves, Wrench } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
export default function MapScreen() {
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
