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

export const cottonCandyTheme: Theme = {
    accent: '#ffb3ba', // Soft pastel pink
    accentSoft: 'rgba(255, 179, 186, 0.2)',
    accentDark: '#ff99a3',
    bg: '#fdfbfb', // Very light background
    surface: '#ffffff',
    surfaceElevated: '#f0f4f8', // Soft pastel blue tint
    surfaceHighlight: '#e2ebf3',
    border: '#ffd6db',
    borderSubtle: '#ffeeef',
    textPrimary: '#4a4a4a',
    textSecondary: '#8da3b5', // Soft blue text
    textMuted: '#b0c4de',
    success: '#81c784',
    danger: '#e57373',
    warning: '#ffb74d',
    info: '#64b5f6',
};

export const barbieCoreTheme: Theme = {
    accent: '#e0218a', // Vibrant magenta
    accentSoft: 'rgba(224, 33, 138, 0.2)',
    accentDark: '#b81970',
    bg: '#ffffff', // Pure white
    surface: '#fff0f8', // Hot pink tint
    surfaceElevated: '#ffe0f0',
    surfaceHighlight: '#ffcce6',
    border: '#ff99d1',
    borderSubtle: '#ffbfe1',
    textPrimary: '#1a1a1a',
    textSecondary: '#d61f84', // Magenta text
    textMuted: '#e665ad',
    success: '#4caf50',
    danger: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
};

export const lilacDreamTheme: Theme = {
    accent: '#c8a2c8', // Lilac
    accentSoft: 'rgba(200, 162, 200, 0.2)',
    accentDark: '#a982a9',
    bg: '#1a1829', // Deep purple-black
    surface: '#27243d',
    surfaceElevated: '#322e4c',
    surfaceHighlight: '#3c385c',
    border: '#534d7a',
    borderSubtle: '#3e395e',
    textPrimary: '#f4f1f8',
    textSecondary: '#d8b4e2', // Lavender text
    textMuted: '#9788a8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

export const cherryBlossomTheme: Theme = {
    accent: '#ffb7c5', // Cherry blossom pink
    accentSoft: 'rgba(255, 183, 197, 0.2)',
    accentDark: '#e59ba9',
    bg: '#2b2a2a', // Soft charcoal gray
    surface: '#363535',
    surfaceElevated: '#424141',
    surfaceHighlight: '#4d4c4c',
    border: '#5c5a5a',
    borderSubtle: '#474545',
    textPrimary: '#fffafa',
    textSecondary: '#ffcdd7', // Pale pink text
    textMuted: '#a8a5a5',
    success: '#66bb6a',
    danger: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',
};

export const roseGoldTheme: Theme = {
    accent: '#b76e79', // Rose gold
    accentSoft: 'rgba(183, 110, 121, 0.2)',
    accentDark: '#935861',
    bg: '#1c1516', // Very dark rose
    surface: '#2e2426',
    surfaceElevated: '#3d3133',
    surfaceHighlight: '#4c3f41',
    border: '#6b575a',
    borderSubtle: '#45383a',
    textPrimary: '#fcf8f8',
    textSecondary: '#d9b6bc', // Metallic pink text
    textMuted: '#a3898d',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

export const uglyManTheme: Theme = {
    accent: '#8a8832', // Mustard yellow
    accentSoft: 'rgba(138, 136, 50, 0.2)',
    accentDark: '#6b6a25',
    bg: '#4a4233', // Muddy brown
    surface: '#5c5443',
    surfaceElevated: '#6e6552',
    surfaceHighlight: '#807762',
    border: '#9e9786', // Dull gray
    borderSubtle: '#7d7768',
    textPrimary: '#deddd9',
    textSecondary: '#b8b4a7',
    textMuted: '#8a867c',
    success: '#4f5c3b',
    danger: '#82453f',
    warning: '#8a7732',
    info: '#3f5d75',
};

export const themes: Record<string, Theme> = {
    pink: pinkTheme,
    cottonCandy: cottonCandyTheme,
    barbieCore: barbieCoreTheme,
    lilacDream: lilacDreamTheme,
    cherryBlossom: cherryBlossomTheme,
    roseGold: roseGoldTheme,
    uglyMan: uglyManTheme,
};

export const DEFAULT_THEME = 'pink';
