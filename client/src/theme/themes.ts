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
    accent: '#ff2a9d',         // Neon hot pink
    accentSoft: 'rgba(255, 42, 157, 0.2)', // Soft neon pink
    accentDark: '#d9187a',       // Darker hot pink
    bg: '#1a0510',             // Very dark pink/purple background
    surface: '#2d0a1b',          // Elevated pink surface
    surfaceElevated: '#3f0d26',    // Higher pink surface
    surfaceHighlight: '#4d1230',   // Highlighted pink surface
    border: '#5c1639',           // Pink border
    borderSubtle: '#3b0d24',       // Subtle pink border
    textPrimary: '#ffffff',
    textSecondary: '#ffb3d9',      // Light pink text
    textMuted: '#995c7a',        // Muted pink text
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

export const themes: Record<string, Theme> = {
    pink: pinkTheme,
};

export const DEFAULT_THEME = 'pink';
