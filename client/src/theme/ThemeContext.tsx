import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, pinkTheme, DEFAULT_THEME_ID } from './themes';
import { useThemes } from '../hooks/useThemes';
import { interpolateTheme, getThemeHue } from '../utils/color';

export interface ThemeState {
    category: string;
    value: number;
}

interface ThemeContextValue {
    theme: Theme;
    themeState: ThemeState;
    setThemeState: (state: ThemeState) => void;
}

const DEFAULT_THEME_STATE: ThemeState = { category: 'Default Themes', value: 0 };

const ThemeContext = createContext<ThemeContextValue>({
    theme: pinkTheme,
    themeState: DEFAULT_THEME_STATE,
    setThemeState: () => {},
});

const THEME_STORAGE_KEY = 'phiamanus_theme_state';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeState, setThemeStateInternal] = useState<ThemeState>(DEFAULT_THEME_STATE);
    const { categories } = useThemes();

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved) {
                try {
                    setThemeStateInternal(JSON.parse(saved));
                } catch (e) {
                    console.warn('Failed to parse theme state', e);
                }
            }
        });
    }, []);

    const setThemeState = (state: ThemeState) => {
        setThemeStateInternal(state);
        AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
    };

    const activeTheme = useMemo(() => {
        const cat = categories.find(c => c.category === themeState.category) || categories[0];
        if (!cat || cat.themes.length === 0) return pinkTheme;

        // Sort themes by hue
        const sortedThemes = [...cat.themes].sort((a, b) => getThemeHue(a) - getThemeHue(b));

        const maxVal = sortedThemes.length - 1;
        const clampedValue = Math.max(0, Math.min(maxVal, themeState.value));
        
        const index1 = Math.floor(clampedValue);
        const index2 = Math.min(maxVal, index1 + 1);
        const ratio = clampedValue - index1;

        if (index1 === index2) {
            return sortedThemes[index1].colors;
        }

        return interpolateTheme(sortedThemes[index1].colors, sortedThemes[index2].colors, ratio);
    }, [categories, themeState]);

    return (
        <ThemeContext.Provider value={{ theme: activeTheme, themeState, setThemeState }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
