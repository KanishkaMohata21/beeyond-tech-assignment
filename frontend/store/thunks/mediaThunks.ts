import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediaApi, Media } from '@/services/api/mediaApi';

const CACHED_MEDIA_KEY = 'cached_media_list';
const CACHED_FAVORITES_KEY = 'cached_favorites_list';

export const fetchMediaThunk = createAsyncThunk(
    'media/fetchMedia',
    async ({ page, reset }: { page: number; reset?: boolean }, { rejectWithValue }) => {
        try {
            const data = await mediaApi.getMedia(page, 20);
            // Cache first page for offline use
            if (reset || page === 1) {
                await AsyncStorage.setItem(CACHED_MEDIA_KEY, JSON.stringify(data));
            }
            return { ...data, reset };
        } catch (err: any) {
            // If offline and first load, use cached data
            if (!err.response && (reset || page === 1)) {
                const cached = await AsyncStorage.getItem(CACHED_MEDIA_KEY);
                if (cached) {
                    const data = JSON.parse(cached);
                    return { ...data, reset: true };
                }
            }
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch media');
        }
    }
);

export const refreshMediaThunk = createAsyncThunk(
    'media/refreshMedia',
    async (_, { rejectWithValue }) => {
        try {
            const data = await mediaApi.getMedia(1, 20);
            // Update cache
            await AsyncStorage.setItem(CACHED_MEDIA_KEY, JSON.stringify(data));
            return data;
        } catch (err: any) {
            // If offline, use cached data
            if (!err.response) {
                const cached = await AsyncStorage.getItem(CACHED_MEDIA_KEY);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to refresh media');
        }
    }
);

export const uploadMediaThunk = createAsyncThunk(
    'media/uploadMedia',
    async (
        assets: { uri: string; type: 'image' | 'video' | 'audio'; fileName: string }[],
        { rejectWithValue, dispatch }
    ) => {
        try {
            const data = await mediaApi.uploadMedia(assets, (progress) => {
                dispatch({
                    type: 'media/setUploadProgress',
                    payload: progress
                });
            });
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Upload failed');
        }
    }
);

export const toggleFavoriteThunk = createAsyncThunk(
    'media/toggleFavorite',
    async (id: string, { rejectWithValue }) => {
        try {
            const data = await mediaApi.toggleFavorite(id);
            return data.media;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to toggle favorite');
        }
    }
);

export const fetchFavoritesThunk = createAsyncThunk(
    'media/fetchFavorites',
    async (_, { rejectWithValue }) => {
        try {
            const data = await mediaApi.getFavorites();
            // Cache favorites for offline
            await AsyncStorage.setItem(CACHED_FAVORITES_KEY, JSON.stringify(data.media));
            return data.media;
        } catch (err: any) {
            // If offline, use cached favorites
            if (!err.response) {
                const cached = await AsyncStorage.getItem(CACHED_FAVORITES_KEY);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch favorites');
        }
    }
);

export const deleteMediaThunk = createAsyncThunk(
    'media/deleteMedia',
    async (id: string, { rejectWithValue }) => {
        try {
            await mediaApi.deleteMedia(id);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete media');
        }
    }
);
