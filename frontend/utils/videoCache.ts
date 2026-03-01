import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCacheDir = () => {
    // @ts-ignore - cacheDirectory moved in newer SDK but available for legacy compatibility
    if (!FileSystem.cacheDirectory) {
        console.warn('FileSystem.cacheDirectory is not available yet');
        return null;
    }
    // @ts-ignore
    return `${FileSystem.cacheDirectory}video_cache/`;
};

const VIDEO_CACHE_REGISTRY_KEY = 'video_cache_registry';
const MAX_CACHED_VIDEOS = 15; // Limit to 15 videos to save storage

interface CachedVideo {
    url: string;
    localUri: string;
    timestamp: number;
}

export const initVideoCache = async () => {
    const cacheDir = getCacheDir();
    if (!cacheDir) return;

    try {
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        }
    } catch (e) {
        console.warn('Failed to initialize video cache directory:', e);
    }
};

export const getVideoUri = async (url: string): Promise<string> => {
    try {
        const registryRaw = await AsyncStorage.getItem(VIDEO_CACHE_REGISTRY_KEY);
        let registry: CachedVideo[] = registryRaw ? JSON.parse(registryRaw) : [];

        const cached = registry.find((v) => v.url === url);
        if (cached) {
            // Update timestamp for LRU
            cached.timestamp = Date.now();
            await AsyncStorage.setItem(VIDEO_CACHE_REGISTRY_KEY, JSON.stringify(registry));

            // Verify file still exists
            const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
            if (fileInfo.exists) {
                return cached.localUri;
            }

            // If file missing, remove from registry
            registry = registry.filter((v) => v.url !== url);
            await AsyncStorage.setItem(VIDEO_CACHE_REGISTRY_KEY, JSON.stringify(registry));
        }

        return url;
    } catch (e) {
        console.warn('Error checking video cache:', e);
        return url;
    }
};

export const cacheVideo = async (url: string) => {
    try {
        await initVideoCache();

        const registryRaw = await AsyncStorage.getItem(VIDEO_CACHE_REGISTRY_KEY);
        let registry: CachedVideo[] = registryRaw ? JSON.parse(registryRaw) : [];

        // Check if already caching
        if (registry.find(v => v.url === url)) return;

        const cacheDir = getCacheDir();
        if (!cacheDir) {
            console.warn('Cannot cache video: FileSystem not ready');
            return;
        }

        // Strip query params and get extension
        const urlWithoutQuery = url.split('?')[0];
        const baseFilename = urlWithoutQuery.split('/').pop() || `video_${Date.now()}.mp4`;
        const localUri = `${cacheDir}${baseFilename}`;

        // Download the video
        console.log(`Starting video download: ${url} -> ${localUri}`);
        const downloadResumable = FileSystem.createDownloadResumable(url, localUri);
        const result = await downloadResumable.downloadAsync();

        if (result && result.uri) {
            console.log(`Successfully cached video: ${result.uri}`);
            // Add to registry
            registry.push({
                url,
                localUri: result.uri,
                timestamp: Date.now(),
            });

            // Handle LRU - Remove oldest if over limit
            if (registry.length > MAX_CACHED_VIDEOS) {
                registry.sort((a, b) => a.timestamp - b.timestamp);
                const oldest = registry.shift();
                if (oldest) {
                    try {
                        await FileSystem.deleteAsync(oldest.localUri, { idempotent: true });
                    } catch (e) {
                        console.warn('Failed to delete oldest cached video:', e);
                    }
                }
            }

            await AsyncStorage.setItem(VIDEO_CACHE_REGISTRY_KEY, JSON.stringify(registry));
        } else {
            console.warn('Download finished but no URI returned');
        }
    } catch (e) {
        console.error('Failed to cache video:', e);
    }
};

export const clearVideoCache = async () => {
    const cacheDir = getCacheDir();
    if (!cacheDir) return;

    try {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        await AsyncStorage.removeItem(VIDEO_CACHE_REGISTRY_KEY);
        await initVideoCache();
    } catch (e) {
        console.error('Failed to clear video cache:', e);
    }
};
