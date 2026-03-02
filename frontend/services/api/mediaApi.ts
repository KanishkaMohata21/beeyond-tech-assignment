import api from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

export interface Media {
    _id: string;
    user_id: string;
    media_type: 'image' | 'video' | 'audio';
    file_url: string;
    is_favorite: boolean;
    created_at: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface MediaListResponse {
    media: Media[];
    pagination: PaginationInfo;
}

export interface MediaResponse {
    message: string;
    media: Media;
}

export interface FavoritesResponse {
    media: Media[];
}

export const mediaApi = {
    getMedia: async (page: number = 1, limit: number = 20): Promise<MediaListResponse> => {
        const response = await api.get(`/media?page=${page}&limit=${limit}`);
        return response.data;
    },

    uploadSingleFile: async (
        asset: { uri: string; type: 'image' | 'video' | 'audio'; fileName: string },
        onProgress?: (progress: number) => void
    ): Promise<Media> => {
        const formData = new FormData();
        const fileName = asset.fileName || `upload_${Date.now()}.${asset.type === 'image' ? 'jpg' : asset.type === 'video' ? 'mp4' : 'm4a'}`;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        let mimeType: string;
        if (['jpg', 'jpeg'].includes(extension)) mimeType = 'image/jpeg';
        else if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'mp4') mimeType = 'video/mp4';
        else if (extension === 'mov') mimeType = 'video/quicktime';
        else if (extension === 'avi') mimeType = 'video/x-msvideo';
        else if (extension === 'webm') mimeType = 'video/webm';
        else if (extension === 'mp3') mimeType = 'audio/mpeg';
        else if (extension === 'wav') mimeType = 'audio/wav';
        else if (extension === 'm4a') mimeType = 'audio/x-m4a';
        else if (extension === 'aac') mimeType = 'audio/aac';
        else if (extension === 'ogg') mimeType = 'audio/ogg';
        else {
            if (asset.type === 'image') mimeType = 'image/jpeg';
            else if (asset.type === 'video') mimeType = 'video/mp4';
            else mimeType = 'audio/x-m4a';
        }

        formData.append('files', {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
        } as any);

        try {
            // Using Axios for single file to get upload progress!
            const response = await api.post('/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        onProgress(progress);
                    }
                },
            });

            // The backend returns { media: Media | Media[] }
            return response.data.media;
        } catch (err: any) {
            console.error('[mediaApi] Upload Error:', err);
            throw err;
        }
    },

    uploadMedia: async (
        assets: { uri: string; type: 'image' | 'video' | 'audio'; fileName: string }[],
        onProgress?: (progress: number) => void
    ): Promise<Media[]> => {
        const formData = new FormData();

        assets.forEach((asset) => {
            const fileName = asset.fileName || `upload_${Date.now()}.${asset.type === 'image' ? 'jpg' : asset.type === 'video' ? 'mp4' : 'm4a'}`;
            const extension = fileName.split('.').pop()?.toLowerCase() || '';

            let mimeType: string;
            if (['jpg', 'jpeg'].includes(extension)) mimeType = 'image/jpeg';
            else if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'gif') mimeType = 'image/gif';
            else if (extension === 'webp') mimeType = 'image/webp';
            else if (extension === 'mp4') mimeType = 'video/mp4';
            else if (extension === 'mov') mimeType = 'video/quicktime';
            else if (extension === 'avi') mimeType = 'video/x-msvideo';
            else if (extension === 'webm') mimeType = 'video/webm';
            else if (extension === 'mp3') mimeType = 'audio/mpeg';
            else if (extension === 'wav') mimeType = 'audio/wav';
            else if (extension === 'm4a') mimeType = 'audio/x-m4a';
            else if (extension === 'aac') mimeType = 'audio/aac';
            else if (extension === 'ogg') mimeType = 'audio/ogg';
            else {
                if (asset.type === 'image') mimeType = 'image/jpeg';
                else if (asset.type === 'video') mimeType = 'video/mp4';
                else mimeType = 'audio/x-m4a';
            }

            formData.append('files', {
                uri: asset.uri,
                name: fileName,
                type: mimeType,
            } as any);
        });

        try {
            const response = await api.post('/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        onProgress(progress);
                    }
                },
            });

            // The backend returns { media: Media[] } for multiple files
            return Array.isArray(response.data.media) ? response.data.media : [response.data.media];
        } catch (err: any) {
            // Handle the specific 50MB limit error message as requested
            throw new Error('max size allowed is 50mb please lower your file size');
        }
    },

    toggleFavorite: async (id: string): Promise<MediaResponse> => {
        const response = await api.patch(`/media/${id}/favorite`);
        return response.data;
    },

    getFavorites: async (): Promise<FavoritesResponse> => {
        const response = await api.get('/media/favorites');
        return response.data;
    },

    deleteMedia: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/media/${id}`);
        return response.data;
    },
};
