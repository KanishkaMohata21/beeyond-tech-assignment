import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMediaThunk, refreshMediaThunk, toggleFavoriteThunk, deleteMediaThunk } from '@/store/thunks/mediaThunks';
import MediaCard from '@/components/MediaCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import OfflineBanner from '@/components/OfflineBanner';
import UploadModal from '@/components/UploadModal';
import FullscreenViewer from '@/components/FullscreenViewer';
import { useOfflineToast } from '@/components/OfflineToast';

export default function GalleryScreen() {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const { media, isLoading, isRefreshing, hasMore, error, page } = useAppSelector((s) => s.media);
    const [uploadVisible, setUploadVisible] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const { showOfflineToast, OfflineToast } = useOfflineToast();
    const { colors } = useTheme();
    const isOnline = useAppSelector((s) => s.network.isOnline);

    useFocusEffect(
        useCallback(() => {
            if (media.length === 0) {
                dispatch(fetchMediaThunk({ page: 1, reset: true }));
            }
        }, [])
    );

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            dispatch(fetchMediaThunk({ page }));
        }
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

    const renderEmpty = () => {
        if (isLoading) return <SkeletonLoader />;

        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => dispatch(fetchMediaThunk({ page: 1, reset: true }))}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cloud-upload-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No media yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Upload your first photo or video to get started
                </Text>
                <TouchableOpacity
                    style={styles.uploadEmptyButton}
                    onPress={() => {
                        if (showOfflineToast()) return;
                        setUploadVisible(true);
                    }}
                >
                    <LinearGradient
                        colors={['#6C63FF', '#8B83FF']}
                        style={styles.uploadEmptyGradient}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.uploadEmptyText}>Upload Media</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    const renderFooter = () => {
        if (!isLoading || media.length === 0) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} size="small" />
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            {!isOnline && <OfflineBanner />}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gallery</Text>
                <Text style={[styles.headerCount, { color: colors.textMuted }]}>{media.length} items</Text>
            </View>

            <FlatList
                data={media}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                numColumns={3}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => dispatch(refreshMediaThunk())}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                removeClippedSubviews={true}
                maxToRenderPerBatch={20}
                windowSize={10}
                initialNumToRender={15}
            />

            {media.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => {
                        if (showOfflineToast()) return;
                        setUploadVisible(true);
                    }}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#6C63FF', '#FF6B9D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            <UploadModal
                visible={uploadVisible}
                onClose={() => setUploadVisible(false)}
            />

            <FullscreenViewer
                visible={selectedIndex !== null}
                mediaList={media}
                initialIndex={selectedIndex ?? 0}
                onClose={() => setSelectedIndex(null)}
                onFavoriteToggle={(id) => dispatch(toggleFavoriteThunk(id))}
                onDelete={(id) => dispatch(deleteMediaThunk(id))}
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
    retryButton: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    uploadEmptyButton: {
        marginTop: SPACING.md,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.glow,
    },
    uploadEmptyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    uploadEmptyText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    footer: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        borderRadius: RADIUS.full,
        ...SHADOWS.glow,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
