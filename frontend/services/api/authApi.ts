import api from '@/services/api';
import * as SecureStore from 'expo-secure-store';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface AuthResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string };
}

export interface RegisterResponse {
    message: string;
    user: { id: string; email: string };
}

export interface ProfileResponse {
    user: { id: string; email: string };
}

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    refreshToken: async (data: RefreshTokenRequest) => {
        const response = await api.post('/auth/refresh-token', data);
        return response.data;
    },

    getProfile: async (): Promise<ProfileResponse> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    storeTokens: async (accessToken: string, refreshToken: string) => {
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
    },

    clearTokens: async () => {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
    },

    getAccessToken: async (): Promise<string | null> => {
        return SecureStore.getItemAsync('accessToken');
    },

    getRefreshToken: async (): Promise<string | null> => {
        return SecureStore.getItemAsync('refreshToken');
    },
};
