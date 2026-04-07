import { Colors } from '@/constants/theme';
import { SurfStore } from '@/types';
import { Store } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StoreSheetProps {
    store: SurfStore;
}

export default function StoreSheet({ store }: StoreSheetProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <Store size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{store.name}</Text>
            </View>

            {/* Placeholder */}
        </View>
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
});
