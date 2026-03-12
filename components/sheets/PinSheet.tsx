import { Colors } from '@/constants/theme';
import { MapPin } from '@/types';
import {
    Droplets,
    Eye,
    Instagram,
    MapPin as MapPinIcon,
    MessageCircle,
    Thermometer,
    Waves,
    WavesArrowUp,
    Wind,
} from 'lucide-react-native';
import React from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PinSheetProps {
    pin: MapPin;
}

const TYPE_LABELS: Record<MapPin['type'], string> = {
    pico: 'Pico de Surf',
    escolinha: 'Escola de Surf',
    reparo: 'Reparo de Pranchas',
    loja: 'Surf Shop',
};

export default function PinSheet({ pin }: PinSheetProps) {
    const isSpot = pin.type === 'pico';
    const isEstablishment = !isSpot;

    const openInstagram = () => {
        if (pin.instagram) {
            Linking.openURL(`https://instagram.com/${pin.instagram}`);
        }
    };

    const openWhatsApp = () => {
        if (pin.whatsapp) {
            Linking.openURL(`https://wa.me/${pin.whatsapp}`);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            {/* Header */}
            <Text style={styles.label}>{TYPE_LABELS[pin.type]}</Text>
            <Text style={styles.name}>{pin.name}</Text>

            {/* Imagem */}
            {pin.imageUrl && (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: pin.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>
            )}

            {/* Condições Atuais — apenas para picos */}
            {isSpot && (
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

                    {/* Linha 3: Visibilidade + Balneabilidade */}
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
            )}

            {/* Contato — apenas para estabelecimentos */}
            {isEstablishment && (pin.instagram || pin.whatsapp) && (
                <View style={styles.contactSection}>
                    {pin.instagram && (
                        <TouchableOpacity style={styles.contactLink} onPress={openInstagram}>
                            <Instagram size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>@{pin.instagram}</Text>
                        </TouchableOpacity>
                    )}
                    {pin.whatsapp && (
                        <TouchableOpacity style={styles.contactLink} onPress={openWhatsApp}>
                            <MessageCircle size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>{pin.whatsapp}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Endereço */}
            {pin.address && (
                <View style={styles.addressRow}>
                    <MapPinIcon size={14} color={Colors.light.icon} />
                    <Text style={styles.addressText}>{pin.address}</Text>
                </View>
            )}
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

    // Condições Atuais
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

    // Contato
    contactSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 16,
        gap: 10,
    },
    contactLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactLinkText: {
        fontSize: 14,
        color: Colors.light.icon,
        fontWeight: '500',
    },

    // Endereço
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    addressText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
});
