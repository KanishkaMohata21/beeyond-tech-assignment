import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Media } from '@/services/api/mediaApi';
import {
    fetchMediaThunk,
    refreshMediaThunk,
    uploadMediaThunk,
    toggleFavoriteThunk,
    fetchFavoritesThunk,
    deleteMediaThunk,
} from '@/store/thunks/mediaThunks';

interface MediaState {
    media: Media[];
    favorites: Media[];
    page: number;
    hasMore: boolean;
    isLoading: boolean;
    isRefreshing: boolean;
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
}

const initialState: MediaState = {
    media: [],
    favorites: [],
    page: 1,
    hasMore: true,
    isLoading: false,
    isRefreshing: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
};

const mediaSlice = createSlice({
    name: 'media',
    initialState,
    reducers: {
        setUploadProgress: (state, action: PayloadAction<number>) => {
            state.uploadProgress = action.payload;
        },
        clearMediaError: (state) => {
            state.error = null;
        },
        resetMedia: () => initialState,
    },
    extraReducers: (builder) => {
        // Fetch Media (paginated)
        builder
            .addCase(fetchMediaThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMediaThunk.fulfilled, (state, action) => {
                const { media, pagination, reset } = action.payload;
                state.isLoading = false;
                state.media = reset ? media : [...state.media, ...media];
                state.page = pagination.page + 1;
                state.hasMore = pagination.page < pagination.totalPages;
                state.error = null;
            })
            .addCase(fetchMediaThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Refresh Media
        builder
            .addCase(refreshMediaThunk.pending, (state) => {
                state.isRefreshing = true;
            })
            .addCase(refreshMediaThunk.fulfilled, (state, action) => {
                state.isRefreshing = false;
                state.media = action.payload.media;
                state.page = 2;
                state.hasMore = 1 < action.payload.pagination.totalPages;
                state.error = null;
            })
            .addCase(refreshMediaThunk.rejected, (state, action) => {
                state.isRefreshing = false;
                state.error = action.payload as string;
            });

        // Upload Media
        builder
            .addCase(uploadMediaThunk.pending, (state) => {
                state.isUploading = true;
                state.uploadProgress = 0;
            })
            .addCase(uploadMediaThunk.fulfilled, (state) => {
                state.isUploading = false;
                state.uploadProgress = 100;
            })
            .addCase(uploadMediaThunk.rejected, (state) => {
                state.isUploading = false;
                state.uploadProgress = 0;
            });

        // Toggle Favorite (optimistic)
        builder
            .addCase(toggleFavoriteThunk.pending, (state, action) => {
                const id = action.meta.arg;
                // Optimistically flip the favorite flag immediately
                state.media = state.media.map((m) =>
                    m._id === id ? { ...m, is_favorite: !m.is_favorite } : m
                );
                const item = state.media.find((m) => m._id === id);
                if (item && item.is_favorite) {
                    // It was just flipped to true — add to favorites
                    if (!state.favorites.find((f) => f._id === id)) {
                        state.favorites = [...state.favorites, item];
                    }
                } else {
                    // It was just flipped to false — remove from favorites
                    state.favorites = state.favorites.filter((m) => m._id !== id);
                }
            })
            .addCase(toggleFavoriteThunk.fulfilled, (state, action) => {
                // Reconcile with server response (in case optimistic was wrong)
                const updated = action.payload;
                state.media = state.media.map((m) =>
                    m._id === updated._id ? { ...m, is_favorite: updated.is_favorite } : m
                );
                if (updated.is_favorite) {
                    if (!state.favorites.find((f) => f._id === updated._id)) {
                        state.favorites = [...state.favorites, updated];
                    }
                } else {
                    state.favorites = state.favorites.filter((m) => m._id !== updated._id);
                }
            })
            .addCase(toggleFavoriteThunk.rejected, (state, action) => {
                // Revert the optimistic update
                const id = action.meta.arg;
                state.media = state.media.map((m) =>
                    m._id === id ? { ...m, is_favorite: !m.is_favorite } : m
                );
                const item = state.media.find((m) => m._id === id);
                if (item && item.is_favorite) {
                    if (!state.favorites.find((f) => f._id === id)) {
                        state.favorites = [...state.favorites, item];
                    }
                } else {
                    state.favorites = state.favorites.filter((m) => m._id !== id);
                }
            });

        // Fetch Favorites
        builder
            .addCase(fetchFavoritesThunk.fulfilled, (state, action) => {
                state.favorites = action.payload;
            });

        // Delete Media (optimistic)
        builder
            .addCase(deleteMediaThunk.pending, (state, action) => {
                const id = action.meta.arg;
                state.media = state.media.filter((m) => m._id !== id);
                state.favorites = state.favorites.filter((m) => m._id !== id);
            })
            .addCase(deleteMediaThunk.rejected, (state, action) => {
                // Could re-fetch to restore, but for now just log
                state.error = action.payload as string;
            });
    },
});

export const { setUploadProgress, clearMediaError, resetMedia } = mediaSlice.actions;
export default mediaSlice.reducer;
