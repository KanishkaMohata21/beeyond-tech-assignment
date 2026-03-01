import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONTS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchFavoritesThunk, toggleFavoriteThunk } from '@/store/thunks/mediaThunks';
import MediaCard from '@/components/MediaCard';
import OfflineBanner from '@/components/OfflineBanner';
import FullscreenViewer from '@/components/FullscreenViewer';
import { useOfflineToast } from '@/components/OfflineToast';

export default function FavoritesScreen() {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const favorites = useAppSelector((s) => s.media.favorites);
    const [refreshing, setRefreshing] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const { showOfflineToast, OfflineToast } = useOfflineToast();
    const { colors } = useTheme();
    const isOnline = useAppSelector((s) => s.network.isOnline);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchFavoritesThunk());
        }, [dispatch])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchFavoritesThunk());
        setRefreshing(false);
    };

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => (
            <MediaCard
                fileUrl={item.file_url}
                mediaType={item.media_type}
                isFavorite={item.is_favorite}
                onPress={() => setSelectedIndex(index)}
                onFavoriteToggle={() => {
                    if (showOfflineToast()) return;
                    dispatch(toggleFavoriteThunk(item._id));
                }}
            />
        ),
        [dispatch, showOfflineToast]
    );

    const keyExtractor = useCallback((item: any) => item._id, []);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No favorites yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap the heart icon on any media to add it to favorites
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            {!isOnline && <OfflineBanner />}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Favorites</Text>
                <Text style={[styles.headerCount, { color: colors.textMuted }]}>{favorites.length} items</Text>
            </View>

            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                numColumns={3}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={renderEmpty}
                removeClippedSubviews={true}
            />

            <FullscreenViewer
                visible={selectedIndex !== null}
                mediaList={favorites}
                initialIndex={selectedIndex ?? 0}
                onClose={() => setSelectedIndex(null)}
                onFavoriteToggle={(id) => dispatch(toggleFavoriteThunk(id))}
            />

            <OfflineToast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    headerTitle: {
        ...FONTS.title,
    },
    headerCount: {
        ...FONTS.regular,
    },
    grid: {
        paddingHorizontal: 8,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
    },
    emptyTitle: {
        ...FONTS.large,
        marginTop: SPACING.sm,
    },
    emptySubtitle: {
        ...FONTS.regular,
        textAlign: 'center',
        lineHeight: 22,
    },
});
