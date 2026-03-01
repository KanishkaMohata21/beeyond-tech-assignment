import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { RADIUS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

export default function SkeletonLoader({ count = 12 }: { count?: number }) {
    const shimmer = useRef(new Animated.Value(0)).current;
    const { colors } = useTheme();

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmer]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <Animated.View key={index} style={[styles.card, { opacity, backgroundColor: colors.surfaceLight }]} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        margin: 4,
        borderRadius: RADIUS.md,
    },
});
