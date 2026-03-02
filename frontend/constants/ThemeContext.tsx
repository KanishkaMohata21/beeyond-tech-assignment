import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Dark palette (current) ───
const DARK_COLORS = {
    primary: '#6C63FF',
    primaryLight: '#8B83FF',
    primaryDark: '#4A42E8',
    accent: '#FF6B9D',
    accentLight: '#FF8FB5',
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceLight: '#252540',
    card: '#1E1E35',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0C0',
    textMuted: '#6B6B8D',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FF9800',
    border: '#2A2A45',
    overlay: 'rgba(0,0,0,0.1)',
    white: '#FFFFFF',
    black: '#000000',
    favorite: '#FF4081',
    offline: '#FF6B35',
};

// ─── Light palette ───
const LIGHT_COLORS = {
    primary: '#6C63FF',
    primaryLight: '#8B83FF',
    primaryDark: '#4A42E8',
    accent: '#FF6B9D',
    accentLight: '#FF8FB5',
    background: '#F5F5FA',
    surface: '#FFFFFF',
    surfaceLight: '#EEEEF5',
    card: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#6B6B8D',
    textMuted: '#9999B0',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FF9800',
    border: '#E0E0F0',
    overlay: 'rgba(0,0,0,0.4)',
    white: '#FFFFFF',
    black: '#000000',
    favorite: '#FF4081',
    offline: '#FF6B35',
};

export type ThemeColors = typeof DARK_COLORS;

interface ThemeContextValue {
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    colors: LIGHT_COLORS,
    isDark: false,
    toggleTheme: () => { },
});

const THEME_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((value) => {
            if (value !== null) {
                setIsDark(value === 'dark');
            }
        });
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
            return next;
        });
    }, []);

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    return (
        <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

// Re-export for backward compat in non-component code
export { DARK_COLORS, LIGHT_COLORS };
