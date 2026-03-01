import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 300000, // 5 minutes for large uploads
});

// Request interceptor — attach access token
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — auto refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRequest =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh-token');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                await SecureStore.setItemAsync('accessToken', data.accessToken);
                await SecureStore.setItemAsync('refreshToken', data.refreshToken);

                processQueue(null, data.accessToken);

                // Update the retried request with the new token
                if (originalRequest.headers.set) {
                    originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`);
                } else {
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                }

                // For FormData, we must let Axios resynchronize the Content-Type header
                // (especially for the boundary) on the retry. Stale boundaries cause Network Errors.
                if (originalRequest.data instanceof FormData) {
                    if (originalRequest.headers.delete) {
                        originalRequest.headers.delete('Content-Type');
                        originalRequest.headers.delete('content-type');
                    } else {
                        delete originalRequest.headers['Content-Type'];
                        delete originalRequest.headers['content-type'];
                    }
                }

                return api(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);
                // Only clear tokens if we actually got a response (401, etc.)
                // If it's a network error (no response), keep the tokens!
                if (refreshError.response) {
                    await SecureStore.deleteItemAsync('accessToken');
                    await SecureStore.deleteItemAsync('refreshToken');
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
