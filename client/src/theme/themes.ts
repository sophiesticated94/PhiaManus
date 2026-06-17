export interface Theme {
    // Brand
    accent: string;
    accentSoft: string;
    accentDark: string;
    // Backgrounds
    bg: string;
    surface: string;
    surfaceElevated: string;
    surfaceHighlight: string;
    // Borders
    border: string;
    borderSubtle: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // Semantic
    success: string;
    danger: string;
    warning: string;
    info: string;
}

export const pinkTheme: Theme = {
    accent: '#e91e8c',
    accentSoft: 'rgba(233, 30, 140, 0.15)',
    accentDark: '#c2185b',
    bg: '#0a0a0a',
    surface: '#161616',
    surfaceElevated: '#222222',
    surfaceHighlight: '#2e2e2e',
    border: '#2a2a2a',
    borderSubtle: '#1e1e1e',
    textPrimary: '#ffffff',
    textSecondary: '#aaaaaa',
    textMuted: '#555555',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

export const themes: Record<string, Theme> = {
    pink: pinkTheme,
};

export const DEFAULT_THEME = 'pink';
