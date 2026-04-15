import { Colors } from '@/constants/theme';
import { SurfSchool } from '@/types';
import { GraduationCap, Instagram, MapPin as MapPinIcon, MessageCircle } from 'lucide-react-native';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SchoolSheetProps {
    school: SurfSchool;
}

export default function SchoolSheet({ school }: SchoolSheetProps) {
    const openInstagram = () => {
        if (!school.instagram) return;
        Linking.openURL(`https://instagram.com/${school.instagram}`);
    };

    const openWhatsApp = () => {
        if (!school.whatsapp) return;
        Linking.openURL(`https://wa.me/${school.whatsapp}`);
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <GraduationCap size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{school.name}</Text>
            </View>

            {school.imageUrl && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: school.imageUrl }} style={styles.image} resizeMode="cover" />
                </View>
            )}

            <Text style={styles.description}>
                Escola parceira para aulas de iniciacao e evolucao no surf.
            </Text>

            {(school.instagram || school.whatsapp) && (
                <View style={styles.contactSection}>
                    {school.instagram && (
                        <TouchableOpacity style={styles.contactLink} onPress={openInstagram}>
                            <Instagram size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>@{school.instagram}</Text>
                        </TouchableOpacity>
                    )}
                    {school.whatsapp && (
                        <TouchableOpacity style={styles.contactLink} onPress={openWhatsApp}>
                            <MessageCircle size={16} color={Colors.light.icon} />
                            <Text style={styles.contactLinkText}>{school.whatsapp}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {school.address && (
                <View style={styles.addressRow}>
                    <MapPinIcon size={14} color={Colors.light.icon} />
                    <Text style={styles.addressText}>{school.address}</Text>
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
