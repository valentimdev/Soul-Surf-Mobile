import { Colors } from '@/constants/theme';
import { SurfStore } from '@/types';
import { Instagram, MapPin as MapPinIcon, MessageCircle, Store } from 'lucide-react-native';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoreSheetProps {
    store: SurfStore;
}

export default function StoreSheet({ store }: StoreSheetProps) {
    const openInstagram = () => {
        if (!store.instagram) return;
        Linking.openURL(`https://instagram.com/${store.instagram}`);
    };

    const openWhatsApp = () => {
        if (!store.whatsapp) return;
        Linking.openURL(`https://wa.me/${store.whatsapp}`);
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <Store size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{store.name}</Text>
            </View>

            {store.imageUrl && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: store.imageUrl }} style={styles.image} resizeMode="cover" />
                </View>
            )}

            <Text style={styles.description}>
                Loja com equipamentos, acessorios e itens essenciais para surf.
            </Text>

            {(store.instagram || store.whatsapp) && (
                <View style={styles.contactSection}>
                    {store.instagram && (
                        <TouchableOpacity style={styles.contactLink} onPress={openInstagram}>
                            <Instagram size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>@{store.instagram}</Text>
                        </TouchableOpacity>
                    )}
                    {store.whatsapp && (
                        <TouchableOpacity style={styles.contactLink} onPress={openWhatsApp}>
                            <MessageCircle size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>{store.whatsapp}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {store.address && (
                <View style={styles.addressRow}>
                    <MapPinIcon size={14} color={Colors.light.icon} />
                    <Text style={styles.addressText}>{store.address}</Text>
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
