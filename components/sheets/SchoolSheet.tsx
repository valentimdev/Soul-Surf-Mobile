import { Colors } from '@/constants/theme';
import { SurfSchool } from '@/types';
import { GraduationCap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SchoolSheetProps {
    school: SurfSchool;
}

export default function SchoolSheet({ school }: SchoolSheetProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconBadge}>
                    <GraduationCap size={20} color={Colors.light.background} />
                </View>
                <Text style={styles.name}>{school.name}</Text>
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
