import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVideoUri } from './videoCache';

// @ts-ignore
const THUMB_CACHE_DIR = `${FileSystem.cacheDirectory}thumb_cache/`;
const THUMB_REGISTRY_KEY = 'thumb_cache_registry_v2';

/**
 * Initialize the thumbnail cache directory.
 */
export const initThumbCache = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(THUMB_CACHE_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(THUMB_CACHE_DIR, { intermediates: true });
        }
    } catch (e) {
        console.error('[thumbnailCache] Failed to init cache dir:', e);
    }
};

/**
 * Get or generate a thumbnail for a video URL.
 * It handles local caching and retries with different time offsets for robustness.
 */
export const getThumbnail = async (videoUrl: string): Promise<string | null> => {
    try {
        await initThumbCache();

        // 1. Check persistent registry (AsyncStorage)
        const cacheKey = `thumb_v3_${videoUrl}`; // Versioned key
        const cachedUri = await AsyncStorage.getItem(cacheKey);

        if (cachedUri) {
            const info = await FileSystem.getInfoAsync(cachedUri).catch(() => ({ exists: false }));
            if (info.exists) {
                return cachedUri;
            }
        }

        // 2. Resolve source (local if cached, otherwise remote)
        const localVideoUri = await getVideoUri(videoUrl);
        const source = localVideoUri || videoUrl;

        console.log(`[thumbnailCache] Generating for: ${videoUrl} from source: ${source}`);

        // 3. Generate thumbnail with retries
        // Some videos fail at 0ms, some have black frames early on. 
        // We try 1s, then 100ms, then 0ms.
        const offsets = [1000, 100, 0];
        let generatedUri: string | null = null;
        let lastError: any = null;

        for (const time of offsets) {
            try {
                const result = await VideoThumbnails.getThumbnailAsync(source, {
                    time,
                    quality: 0.6,
                });
                if (result && result.uri) {
                    generatedUri = result.uri;
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`[thumbnailCache] Failed at ${time}ms for ${videoUrl}:`, err);
            }
        }

        if (!generatedUri) {
            console.error(`[thumbnailCache] All attempts failed for ${videoUrl}:`, lastError);
            return null;
        }

        // 4. Move to persistent cache
        const filename = `thumb_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
        const persistentUri = `${THUMB_CACHE_DIR}${filename}`;

        await FileSystem.copyAsync({
            from: generatedUri,
            to: persistentUri
        });

        // 5. Update registry
        await AsyncStorage.setItem(cacheKey, persistentUri);

        return persistentUri;
    } catch (e) {
        console.error('[thumbnailCache] Unexpected error:', e);
        return null;
    }
};

/**
 * Clear the thumbnail cache.
 */
export const clearThumbCache = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(THUMB_CACHE_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(THUMB_CACHE_DIR, { idempotent: true });
        }
        // We don't necessarily need to clear all keys from AsyncStorage, 
        // but it's cleaner to keep them in sync if we had a dedicated list.
        await initThumbCache();
    } catch (e) {
        console.error('[thumbnailCache] Failed to clear cache:', e);
    }
};
