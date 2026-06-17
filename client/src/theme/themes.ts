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

export interface ThemeDef {
    id: string;
    name: string;
    colors: Theme;
}

export interface ThemeCategoryDef {
    category: string;
    sourceId: string;
    themes: ThemeDef[];
}

export const pinkTheme: Theme = {
    accent: '#ff2a9d',         
    accentSoft: 'rgba(255, 42, 157, 0.2)',
    accentDark: '#d9187a',       
    bg: '#1a0510',             
    surface: '#2d0a1b',          
    surfaceElevated: '#3f0d26',    
    surfaceHighlight: '#4d1230',   
    border: '#5c1639',           
    borderSubtle: '#3b0d24',       
    textPrimary: '#ffffff',
    textSecondary: '#ffb3d9',      
    textMuted: '#995c7a',        
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

export const DEFAULT_THEME_ID = 'pink';
