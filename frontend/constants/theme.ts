import { DARK_COLORS } from './ThemeContext';

// Static COLORS export for backward compat (used in non-component files like OfflineToast styles)
export const COLORS = DARK_COLORS;

export const GRADIENTS = {
    primary: ['#6C63FF', '#8B83FF', '#A78BFA'] as const,
    accent: ['#FF6B9D', '#FF8FB5', '#FFA8C5'] as const,
    dark: ['#0F0F1A', '#1A1A2E', '#252540'] as const,
    card: ['#1E1E35', '#252540'] as const,
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FONTS = {
    regular: { fontSize: 14 },
    medium: { fontSize: 16 },
    large: { fontSize: 20, fontWeight: '600' as const },
    title: { fontSize: 28, fontWeight: '700' as const },
    hero: { fontSize: 36, fontWeight: '800' as const },
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    glow: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};
