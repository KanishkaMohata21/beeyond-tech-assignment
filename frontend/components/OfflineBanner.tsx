import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';

export default function OfflineBanner() {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.offline }]}>
            <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
            <Text style={styles.text}>You are offline</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
    },
    text: {
        ...FONTS.regular,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
});
