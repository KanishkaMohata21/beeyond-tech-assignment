import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProfileThunk, logoutThunk } from '@/store/thunks/authThunks';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.auth.user);
    const { media, favorites } = useAppSelector((s) => s.media);
    const router = useRouter();
    const { colors, isDark, toggleTheme } = useTheme();

    useEffect(() => {
        dispatch(fetchProfileThunk());
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutThunk());
        router.replace('/(auth)/login');
    };

    const initial = user?.email?.charAt(0)?.toUpperCase() || '?';

    return (
        <ScrollView
            style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
            </View>

            <View style={[styles.avatarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LinearGradient
                    colors={['#6C63FF', '#FF6B9D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                >
                    <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
                <Text style={[styles.email, { color: colors.textPrimary }]}>{user?.email || 'Unknown'}</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderColor: colors.border }]}>
                    <LinearGradient
                        colors={['#6C63FF20', '#6C63FF10']}
                        style={styles.statGradient}
                    >
                        <Ionicons name="images" size={22} color={colors.primary} />
                        <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{media.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Media</Text>
                    </LinearGradient>
                </View>
                <View style={[styles.statCard, { borderColor: colors.border }]}>
                    <LinearGradient
                        colors={['#FF6B9D20', '#FF6B9D10']}
                        style={styles.statGradient}
                    >
                        <Ionicons name="heart" size={22} color={colors.favorite} />
                        <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{favorites.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
                    </LinearGradient>
                </View>
            </View>

            {/* Theme Toggle */}
            <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                        <Ionicons
                            name={isDark ? 'moon' : 'sunny'}
                            size={20}
                            color={isDark ? '#8B83FF' : '#FF9800'}
                        />
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#E0E0F0', true: '#6C63FF40' }}
                        thumbColor={isDark ? '#6C63FF' : '#FFFFFF'}
                    />
                </View>
            </View>

            <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                        <Ionicons name="mail-outline" size={20} color={colors.primary} />
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email || '---'}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>1.0.0</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    headerTitle: {
        ...FONTS.title,
    },
    avatarCard: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        ...SHADOWS.medium,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.glow,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    email: {
        ...FONTS.medium,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    statCard: {
        flex: 1,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
    },
    statGradient: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.xs,
    },
    statNumber: {
        ...FONTS.title,
        fontSize: 24,
    },
    statLabel: {
        ...FONTS.regular,
        fontSize: 12,
    },
    infoSection: {
        marginHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    infoLabel: {
        ...FONTS.regular,
    },
    infoValue: {
        ...FONTS.regular,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: SPACING.xs,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: '#FF525240',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
