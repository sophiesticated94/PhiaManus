import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, pinkTheme, DEFAULT_THEME_ID } from './themes';
import { useThemes } from '../hooks/useThemes';

interface ThemeContextValue {
    theme: Theme;
    themeName: string;
    setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: pinkTheme,
    themeName: DEFAULT_THEME_ID,
    setTheme: () => {},
});

const THEME_STORAGE_KEY = 'phiamanus_theme_name';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeName, setThemeName] = useState<string>(DEFAULT_THEME_ID);
    const { categories } = useThemes();

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved) {
                setThemeName(saved);
            }
        });
    }, []);

    const setTheme = (name: string) => {
        setThemeName(name);
        AsyncStorage.setItem(THEME_STORAGE_KEY, name);
    };

    const activeTheme = useMemo(() => {
        for (const cat of categories) {
            const found = cat.themes.find(t => t.id === themeName);
            if (found) return found.colors;
        }
        return pinkTheme; // fallback if not found
    }, [categories, themeName]);

    return (
        <ThemeContext.Provider value={{ theme: activeTheme, themeName, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
