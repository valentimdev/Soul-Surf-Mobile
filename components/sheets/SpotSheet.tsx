import { Colors } from '@/constants/theme';
import { SurfSpot } from '@/types';
import { Waves } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SpotSheetProps {
    spot: SurfSpot;
}

export default function SpotSheet({ spot }: SpotSheetProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <Waves size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{spot.name}</Text>
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
