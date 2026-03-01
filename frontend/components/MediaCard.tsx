import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';
import { getThumbnail } from '@/utils/thumbnailCache';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

interface MediaCardProps {
    fileUrl: string;
    mediaType: 'image' | 'video';
    isFavorite: boolean;
    onPress?: () => void;
    onFavoriteToggle?: () => void;
}

export default function MediaCard({
    fileUrl,
    mediaType,
    isFavorite,
    onPress,
    onFavoriteToggle,
}: MediaCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const { colors } = useTheme();

    useEffect(() => {
        setThumbnail(null); // Clear thumbnail on fileUrl change to prevent ghosting
        if (mediaType === 'video') {
            generateThumbnail();
        } else {
            setIsLoading(true);
        }
    }, [fileUrl, mediaType]);

    const generateThumbnail = async () => {
        try {
            setIsLoading(true);
            const thumbUri = await getThumbnail(fileUrl);
            if (thumbUri) {
                setThumbnail(thumbUri);
            }
        } catch (e) {
            console.error(`[MediaCard] Failed to get thumbnail for ${fileUrl}:`, e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
            <TouchableOpacity
                style={styles.mediaTouch}
                onPress={onPress}
                activeOpacity={0.85}
            >
                {mediaType === 'image' ? (
                    <>
                        <Image
                            source={{ uri: fileUrl }}
                            style={styles.image}
                            resizeMode="cover"
                            onLoadStart={() => setIsLoading(true)}
                            onLoadEnd={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                        {isLoading && (
                            <View style={[styles.loadingOverlay, { backgroundColor: colors.surfaceLight }]}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        )}
                    </>
                ) : (
                    /* Video thumbnail */
                    <View style={[styles.videoThumbnail, { backgroundColor: colors.surfaceLight }]}>
                        {thumbnail ? (
                            <ExpoImage // Use ExpoImage for better performance
                                source={{ uri: thumbnail }}
                                style={styles.image}
                                contentFit="cover" // Use contentFit for ExpoImage
                                onLoadStart={() => setIsLoading(true)}
                                onLoadEnd={() => setIsLoading(false)}
                                onError={() => setIsLoading(false)}
                            />
                        ) : (
                            !isLoading && (
                                <View style={[styles.placeholderThumbnail, { backgroundColor: colors.surfaceLight }]}>
                                    <Ionicons name="videocam" size={32} color={colors.textMuted} />
                                </View>
                            )
                        )}

                        {/* Play button overlay - more refined */}
                        <View style={styles.playOverlay}>
                            <View style={styles.playCircle}>
                                <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                            </View>
                        </View>

                        {isLoading && (
                            <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        )}
                    </View>
                )}

                {/* Video badge */}
                {mediaType === 'video' && (
                    <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={14} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Favorite button - now a sibling, no bubbling to card onPress */}
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                    // Though it's a sibling, stopPropagation is still good practice
                    // if there are any other touch listeners on parents
                    e.stopPropagation?.();
                    onFavoriteToggle?.();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <Ionicons
                    name="heart"
                    size={18}
                    color={isFavorite ? '#FF5252' : 'rgba(255, 255, 255, 0.6)'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        margin: 4,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    mediaTouch: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderThumbnail: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    playCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(108, 99, 255, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    videoBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 999,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    favoriteButton: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 999,
        padding: 4,
    },
});
