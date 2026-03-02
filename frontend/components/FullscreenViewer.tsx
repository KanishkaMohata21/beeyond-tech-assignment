import React, { useRef, useCallback, useState } from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    FlatList,
    Text,
    Animated,
    PanResponder,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/ThemeContext';
import { Video, ResizeMode } from 'expo-av';
import { useOfflineToast } from '@/components/OfflineToast';
import { getVideoUri, cacheVideo } from '@/utils/videoCache';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 80;

interface MediaItem {
    _id: string;
    file_url: string;
    media_type: 'image' | 'video' | 'audio';
    is_favorite: boolean;
}

interface FullscreenViewerProps {
    visible: boolean;
    mediaList: MediaItem[];
    initialIndex: number;
    onClose: () => void;
    onFavoriteToggle?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function FullscreenViewer({
    visible,
    mediaList,
    initialIndex,
    onClose,
    onFavoriteToggle,
    onDelete,
}: FullscreenViewerProps) {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const { showOfflineToast, OfflineToast } = useOfflineToast();
    const { colors } = useTheme();

    // Swipe-to-dismiss animation values
    const translateY = useRef(new Animated.Value(0)).current;
    const backdropOpacity = useRef(new Animated.Value(1)).current;
    const imageScale = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Respond to vertical swipes
                const isVerticalSwipe = Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
                return isVerticalSwipe;
            },
            onPanResponderGrant: () => {
                // No-op
            },
            onPanResponderMove: (_, gestureState) => {
                const dy = gestureState.dy;
                translateY.setValue(dy);

                // Fade backdrop based on drag distance (more aggressive fade when swiping down)
                const progress = Math.min(Math.abs(dy) / 250, 1);
                backdropOpacity.setValue(1 - progress * 0.7);
                imageScale.setValue(1 - progress * 0.2);
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dy, vy } = gestureState;

                // Dismiss if swiped down significantly or with high velocity
                if (dy > DISMISS_THRESHOLD || vy > 0.5) {
                    // Dismiss — animate out (downwards)
                    Animated.parallel([
                        Animated.timing(translateY, {
                            toValue: SCREEN_HEIGHT,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(backdropOpacity, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        onClose();
                        // Reset for next time
                        translateY.setValue(0);
                        backdropOpacity.setValue(1);
                        imageScale.setValue(1);
                    });
                }
                // Also allow dismissing by swiping UP if it's very significant
                else if (dy < -DISMISS_THRESHOLD * 1.5 || vy < -0.8) {
                    Animated.parallel([
                        Animated.timing(translateY, {
                            toValue: -SCREEN_HEIGHT,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(backdropOpacity, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        onClose();
                        translateY.setValue(0);
                        backdropOpacity.setValue(1);
                        imageScale.setValue(1);
                    });
                }
                else {
                    // Spring back if not enough distance/velocity
                    Animated.parallel([
                        Animated.spring(translateY, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 250,
                            friction: 25,
                        }),
                        Animated.spring(backdropOpacity, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 250,
                            friction: 25,
                        }),
                        Animated.spring(imageScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 250,
                            friction: 25,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    // Reset active index when modal opens
    const isOnline = useAppSelector((s) => s.network.isOnline);
    const [videoUris, setVideoUris] = useState<Record<string, string>>({});

    // Fetch video URIs (local or remote)
    React.useEffect(() => {
        const resolveUris = async () => {
            const uris: Record<string, string> = {};
            for (const item of mediaList) {
                if (item.media_type === 'video') {
                    const resolved = await getVideoUri(item.file_url);
                    uris[item.file_url] = resolved;

                    // If we're online and it's not cached, start background caching
                    if (isOnline && resolved === item.file_url) {
                        cacheVideo(item.file_url);
                    }
                }
            }
            setVideoUris(uris);
        };

        if (visible) {
            resolveUris();
        }
    }, [visible, mediaList, isOnline]);

    React.useEffect(() => {
        if (visible) {
            // If the item we were on was deleted, adjust activeIndex
            if (activeIndex >= mediaList.length && mediaList.length > 0) {
                const newIndex = Math.max(0, mediaList.length - 1);
                setActiveIndex(newIndex);
                flatListRef.current?.scrollToIndex({
                    index: newIndex,
                    animated: true,
                });
            } else if (mediaList.length === 0 && visible) {
                // If the list is empty, close the viewer
                onClose();
            }
        }
    }, [mediaList.length, visible]);

    React.useEffect(() => {
        if (visible) {
            setActiveIndex(initialIndex);
            translateY.setValue(0);
            backdropOpacity.setValue(1);
            imageScale.setValue(1);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                });
            }, 50);
        }
    }, [visible, initialIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const currentItem = mediaList[activeIndex];

    const renderMediaItem = useCallback(({ item, index }: { item: MediaItem; index: number }) => (
        <View style={styles.slide}>
            {item.media_type === 'video' || item.media_type === 'audio' ? (
                <View style={styles.videoContainer}>
                    {item.media_type === 'video' && (!isOnline && (!videoUris[item.file_url] || videoUris[item.file_url] === item.file_url)) ? (
                        <View style={styles.offlinePlaceholder}>
                            <Ionicons name="cloud-offline-outline" size={48} color="rgba(255, 255, 255, 0.6)" />
                            <Text style={styles.offlineText}>Please connect to internet to watch this video</Text>
                        </View>
                    ) : (
                        item.media_type === 'audio' ? (
                            <View style={[styles.audioPlayerContainer, { backgroundColor: colors.surfaceLight + '20' }]}>
                                <View style={styles.audioIconCircle}>
                                    <Ionicons name="musical-notes" size={60} color={colors.primary} />
                                </View>
                                <Text style={[styles.audioTitle, { color: '#FFFFFF' }]}>Audio Recording</Text>
                                <Video
                                    source={{ uri: item.file_url }}
                                    style={styles.audioVideo}
                                    useNativeControls
                                    shouldPlay={activeIndex === index && visible}
                                    resizeMode={ResizeMode.CONTAIN}
                                />
                            </View>
                        ) : (
                            <Video
                                source={{ uri: videoUris[item.file_url] || item.file_url }}
                                style={styles.video}
                                resizeMode={ResizeMode.CONTAIN}
                                useNativeControls
                                shouldPlay={activeIndex === index && visible}
                                isLooping
                            />
                        )
                    )}
                </View>
            ) : (
                <Image
                    source={{ uri: item.file_url }}
                    style={styles.image}
                    resizeMode="contain"
                />
            )}
        </View>
    ), [isOnline, videoUris, activeIndex, visible]);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
    }), []);

    const keyExtractor = useCallback((item: MediaItem) => item._id, []);

    if (!visible || mediaList.length === 0) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <View style={StyleSheet.absoluteFill} />
            </Animated.View>

            <View style={styles.fullContainer}>
                {/* Header controls */}
                <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: backdropOpacity }]}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.headerButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="close" size={26} color="#FFFFFF" />
                    </TouchableOpacity>


                    <View style={styles.headerActions}>
                        {onDelete && currentItem && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (showOfflineToast()) return;
                                    Alert.alert(
                                        'Delete Media',
                                        'Are you sure you want to delete this item?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: () => {
                                                    onDelete(currentItem._id);
                                                    // Handle closing if it's the last item in the parent or local effect
                                                    if (mediaList.length === 1) {
                                                        onClose();
                                                    }
                                                }
                                            },
                                        ]
                                    );
                                }}
                                style={styles.headerButton}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons name="trash-outline" size={24} color="#FF5252" />
                            </TouchableOpacity>
                        )}
                        {onFavoriteToggle && currentItem && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (showOfflineToast()) return;
                                    onFavoriteToggle(currentItem._id);
                                }}
                                style={styles.headerButton}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons
                                    name="heart"
                                    size={24}
                                    color={currentItem.is_favorite ? '#FF5252' : 'rgba(255, 255, 255, 0.4)'}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                <OfflineToast />

                {/* Swipeable content with pan gesture */}
                <Animated.View
                    style={[
                        styles.swipeContainer,
                        {
                            transform: [
                                { translateY },
                                { scale: imageScale },
                            ],
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <FlatList
                        ref={flatListRef}
                        data={mediaList}
                        renderItem={(props) => renderMediaItem({ ...props })}
                        keyExtractor={keyExtractor}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={initialIndex}
                        getItemLayout={getItemLayout}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        bounces={false}
                        decelerationRate="fast"
                        removeClippedSubviews
                    />
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    fullContainer: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counter: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    swipeContainer: {
        flex: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
    },
    videoContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offlinePlaceholder: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    offlineText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.8,
        lineHeight: 22,
    },
    audioPlayerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        width: SCREEN_WIDTH * 0.85,
        padding: 40,
        borderRadius: 30,
    },
    audioIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    audioTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    audioVideo: {
        width: '100%',
        height: 50,
        marginTop: 10,
    },
});
