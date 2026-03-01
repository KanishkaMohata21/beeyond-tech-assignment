import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/services/api/authApi';

const CACHED_USER_KEY = 'cached_user_profile';

export const loginThunk = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const data = await authApi.login({ email, password });
            await authApi.storeTokens(data.accessToken, data.refreshToken);
            // Cache user profile for offline access
            await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || err.message || 'Login failed'
            );
        }
    }
);

export const registerThunk = createAsyncThunk(
    'auth/register',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const data = await authApi.register({ email, password });
            return data.user;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || err.message || 'Registration failed'
            );
        }
    }
);

export const loadSessionThunk = createAsyncThunk(
    'auth/loadSession',
    async (_, { rejectWithValue }) => {
        try {
            const token = await authApi.getAccessToken();
            if (!token) {
                return null;
            }

            try {
                // Try to verify session with the server
                const data = await authApi.getProfile();
                // Cache the fresh profile for offline use
                await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
                return data.user;
            } catch (apiErr: any) {
                // If we have a response it's a server-side error
                if (apiErr.response) {
                    // If it's a definitive session failure (401/403), clear everything
                    if (apiErr.response.status === 401 || apiErr.response.status === 403) {
                        await authApi.clearTokens();
                        await AsyncStorage.removeItem(CACHED_USER_KEY);
                        return rejectWithValue('Session expired');
                    }
                }

                // For network errors (no response) or other generic failures, 
                // try to fall back to the cached profile
                const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
                if (cached) {
                    try {
                        return JSON.parse(cached);
                    } catch (e) {
                        // Ignore parse errors and fail
                    }
                }

                return rejectWithValue('Network error - Session check failed');
            }
        } catch (err: any) {
            return rejectWithValue('Session load failed');
        }
    }
);

export const fetchProfileThunk = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const data = await authApi.getProfile();
            // Update cache
            await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
            return data.user;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
        }
    }
);

export const logoutThunk = createAsyncThunk(
    'auth/logout',
    async () => {
        await authApi.clearTokens();
        await AsyncStorage.removeItem(CACHED_USER_KEY);
    }
);
