import { Colors } from '@/constants/theme';
import { RepairShop } from '@/types';
import { Instagram, MapPin as MapPinIcon, MessageCircle, Wrench } from 'lucide-react-native';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RepairSheetProps {
    shop: RepairShop;
}

export default function RepairSheet({ shop }: RepairSheetProps) {
    const openInstagram = () => {
        if (!shop.instagram) return;
        Linking.openURL(`https://instagram.com/${shop.instagram}`);
    };

    const openWhatsApp = () => {
        if (!shop.whatsapp) return;
        Linking.openURL(`https://wa.me/${shop.whatsapp}`);
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <Wrench size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{shop.name}</Text>
            </View>

            {shop.imageUrl && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: shop.imageUrl }} style={styles.image} resizeMode="cover" />
                </View>
            )}

            <Text style={styles.description}>
                Assistencia especializada para pranchas, quilhas e pequenos reparos.
            </Text>

            {(shop.instagram || shop.whatsapp) && (
                <View style={styles.contactSection}>
                    {shop.instagram && (
                        <TouchableOpacity style={styles.contactLink} onPress={openInstagram}>
                            <Instagram size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>@{shop.instagram}</Text>
                        </TouchableOpacity>
                    )}
                    {shop.whatsapp && (
                        <TouchableOpacity style={styles.contactLink} onPress={openWhatsApp}>
                            <MessageCircle size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>{shop.whatsapp}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {shop.address && (
                <View style={styles.addressRow}>
                    <MapPinIcon size={14} color={Colors.light.icon} />
                    <Text style={styles.addressText}>{shop.address}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    iconBadge: {
        backgroundColor: Colors.light.icon,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: 170,
        borderRadius: 12,
    },
    description: {
        fontSize: 14,
        color: '#5B6470',
        lineHeight: 20,
        marginBottom: 16,
    },
    contactSection: {
        gap: 10,
        marginBottom: 16,
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
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
    },
});
