import { createSlice } from '@reduxjs/toolkit';
import {
    loginThunk,
    registerThunk,
    loadSessionThunk,
    fetchProfileThunk,
    logoutThunk,
} from '@/store/thunks/authThunks';

interface User {
    id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Register
        builder
            .addCase(registerThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state) => {
                state.isLoading = false;
                state.error = null;
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Load Session
        builder
            .addCase(loadSessionThunk.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadSessionThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload) {
                    state.isAuthenticated = true;
                    state.user = action.payload;
                }
            })
            .addCase(loadSessionThunk.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
            });

        // Fetch Profile
        builder
            .addCase(fetchProfileThunk.fulfilled, (state, action) => {
                state.user = action.payload;
            });

        // Logout
        builder
            .addCase(logoutThunk.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.error = null;
            });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
