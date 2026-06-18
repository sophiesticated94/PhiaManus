import { Theme } from '../theme/themes';

export function hexToRgb(hex: string): { r: number, g: number, b: number } {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

export function interpolateColor(color1: string, color2: string, ratio: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    // Clamp ratio between 0 and 1
    const t = Math.max(0, Math.min(1, ratio));
    
    const r = c1.r + (c2.r - c1.r) * t;
    const g = c1.g + (c2.g - c1.g) * t;
    const b = c1.b + (c2.b - c1.b) * t;
    
    return rgbToHex(r, g, b);
}

export function interpolateTheme(theme1: Theme, theme2: Theme, ratio: number): Theme {
    return {
        bg: interpolateColor(theme1.bg, theme2.bg, ratio),
        surface: interpolateColor(theme1.surface, theme2.surface, ratio),
        surfaceElevated: interpolateColor(theme1.surfaceElevated, theme2.surfaceElevated, ratio),
        textPrimary: interpolateColor(theme1.textPrimary, theme2.textPrimary, ratio),
        textSecondary: interpolateColor(theme1.textSecondary, theme2.textSecondary, ratio),
        textMuted: interpolateColor(theme1.textMuted, theme2.textMuted, ratio),
        border: interpolateColor(theme1.border, theme2.border, ratio),
        borderHighlight: interpolateColor(theme1.borderHighlight, theme2.borderHighlight, ratio),
        accent: interpolateColor(theme1.accent, theme2.accent, ratio),
        accentTransparent: interpolateColor(theme1.accentTransparent, theme2.accentTransparent, ratio),
        danger: interpolateColor(theme1.danger, theme2.danger, ratio),
        success: interpolateColor(theme1.success, theme2.success, ratio),
    };
}

export function getThemeHue(theme: Theme): number {
    const rgb = hexToRgb(theme.accent);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.h;
}
