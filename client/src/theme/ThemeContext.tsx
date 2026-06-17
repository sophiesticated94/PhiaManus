import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, themes, pinkTheme, DEFAULT_THEME } from './themes';

interface ThemeContextValue {
    theme: Theme;
    themeName: string;
    setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: pinkTheme,
    themeName: DEFAULT_THEME,
    setTheme: () => {},
});

const THEME_STORAGE_KEY = 'phiamanus_theme_name';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeName, setThemeName] = useState<string>(DEFAULT_THEME);

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved && themes[saved]) {
                setThemeName(saved);
            }
        });
    }, []);

    const setTheme = (name: string) => {
        if (themes[name]) {
            setThemeName(name);
            AsyncStorage.setItem(THEME_STORAGE_KEY, name);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: themes[themeName] ?? pinkTheme, themeName, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
