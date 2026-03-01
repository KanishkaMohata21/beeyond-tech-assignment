import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAppSelector } from '@/store';

/**
 * Hook that provides a function to show an offline toast
 * and the component to render it.
 */
export function useOfflineToast() {
    const isOnline = useAppSelector((s) => s.network.isOnline);
    const [visible, setVisible] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showOfflineToast = useCallback(() => {
        if (isOnline) return false; // not offline, action can proceed

        // Clear any existing timer
        if (timerRef.current) clearTimeout(timerRef.current);

        setVisible(true);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();

        timerRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -20,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setVisible(false));
        }, 2500);

        return true; // was offline, toast shown
    }, [isOnline, opacity, translateY]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const OfflineToast = useCallback(() => {
        const insets = useSafeAreaInsets();
        if (!visible) return null;

        return (
            <Animated.View
                style={[
                    styles.container,
                    { top: insets.top + 8, opacity, transform: [{ translateY }] },
                ]}
            >
                <Ionicons name="cloud-offline" size={16} color={COLORS.white} />
                <Text style={styles.text}>You're offline</Text>
            </Animated.View>
        );
    }, [visible, opacity, translateY]);

    return { showOfflineToast, OfflineToast };
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: RADIUS.full,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    text: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
});
