import { Colors } from '@/constants/theme';
import { SurfSpot } from '@/types';
import {
    Droplets,
    Eye,
    MapPin,
    Thermometer,
    Waves,
    WavesArrowUp,
    Wind,
} from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface SpotSheetProps {
    spot: SurfSpot;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 64; // padding de 16 cada lado do sheet + 16 cada lado interno

export default function SpotSheet({ spot }: SpotSheetProps) {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} >
            {/* Header */}
            <Text style={styles.label}>Pico de Surf</Text>
            <Text style={styles.name}>{spot.name}</Text>

            {/* Imagem da praia */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: 'https://granmareiro.com.br/blog/wp-content/uploads/2024/10/praia-do-fututo.webp' }}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>

            {/* Condições Atuais */}
            <View style={styles.conditionsCard}>
                <View style={styles.conditionsHeader}>
                    <Waves size={18} color={Colors.light.text} />
                    <Text style={styles.conditionsTitle}>Condições Atuais</Text>
                </View>

                {/* Linha 1: Temperatura + Vento */}
                <View style={styles.conditionRow}>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <Thermometer size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Temperatura</Text>
                        </View>
                        <Text style={styles.conditionValue}>24°C</Text>
                    </View>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <Wind size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Vento</Text>
                        </View>
                        <Text style={styles.conditionValue}>15 km/h NE</Text>
                    </View>
                </View>

                {/* Linha 2: Ondas + Maré */}
                <View style={styles.conditionRow}>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <Waves size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Ondas</Text>
                        </View>
                        <Text style={styles.conditionValue}>1.5 - 2m</Text>
                    </View>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <WavesArrowUp size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Maré</Text>
                        </View>
                        <Text style={styles.conditionValue}>Enchendo</Text>
                    </View>
                </View>

                {/* Visibilidade */}
                <View style={styles.conditionRow}>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <Eye size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Visibilidade</Text>
                        </View>
                        <Text style={styles.conditionValue}>Boa • Céu limpo</Text>
                    </View>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionIconRow}>
                            <Droplets size={14} color={Colors.light.icon} />
                            <Text style={styles.conditionLabel}>Balneabilidade</Text>
                        </View>
                        <Text style={styles.conditionValue}>Boa</Text>
                    </View>
                </View>
            </View> 

            {/* Coordenadas */}
            <View style={styles.coordsRow}>
                <MapPin size={14} color={Colors.light.icon} />
                <Text style={styles.coordsText}>
                    Lat: {spot.coordinate[1].toFixed(4)}, Lng: {spot.coordinate[0].toFixed(4)}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: Colors.light.icon,
        fontWeight: '500',
        marginBottom: 2,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 16,
    },
    ratingText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    conditionsCard: {
        backgroundColor: '#f0eadd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E8E0D0',
    },
    conditionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    conditionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
    },
    conditionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    conditionItem: {
        flex: 1,
    },
    conditionIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    conditionLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    conditionValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    coordsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    coordsText: {
        fontSize: 13,
        color: '#6B7280',
    },
});
