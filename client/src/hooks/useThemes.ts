import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledThemes from '../data/themes.json';
import { ThemeDef, ThemeCategoryDef } from '../theme/themes';

const THEME_SOURCES_KEY = 'phiamanus_theme_sources';
const LOCAL_THEMES_KEY = 'phiamanus_local_themes';

export interface ThemeSource {
    id: string;
    name: string;
    type: 'remote' | 'local';
    url?: string;
}

const DEFAULT_SOURCE: ThemeSource = {
    id: 'default',
    name: 'PhiaManus Default Themes',
    type: 'remote',
    url: 'https://raw.githubusercontent.com/sophiesticated94/PhiaManus/master/client/src/data/themes.json',
};

let cachedCategories: ThemeCategoryDef[] | null = null;

function parseBundledThemes(sourceId: string): ThemeCategoryDef[] {
    return (bundledThemes as any[]).map((cat: any) => ({
        category: cat.category,
        sourceId,
        themes: cat.themes as ThemeDef[],
    }));
}

async function fetchRemoteSource(source: ThemeSource): Promise<ThemeCategoryDef[]> {
    if (!source.url) return [];
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data as any[]).map((cat: any) => ({
        category: cat.category,
        sourceId: source.id,
        themes: cat.themes as ThemeDef[],
    }));
}

function mergeCategories(all: ThemeCategoryDef[][]): ThemeCategoryDef[] {
    const merged: Map<string, ThemeCategoryDef> = new Map();
    for (const group of all) {
        for (const cat of group) {
            const existing = merged.get(cat.category);
            if (existing) {
                const existingIds = new Set(existing.themes.map(t => t.id));
                const newThemes = cat.themes.filter(t => !existingIds.has(t.id));
                existing.themes = [...existing.themes, ...newThemes];
            } else {
                merged.set(cat.category, { ...cat, themes: [...cat.themes] });
            }
        }
    }
    return Array.from(merged.values());
}

interface UseThemesReturn {
    categories: ThemeCategoryDef[];
    sources: ThemeSource[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addSource: (name: string, url: string) => Promise<void>;
    removeSource: (id: string) => Promise<void>;
    addLocalTheme: (theme: Omit<ThemeDef, 'id'>) => Promise<void>;
    editLocalTheme: (id: string, updates: Partial<ThemeDef>) => Promise<void>;
    deleteLocalTheme: (id: string) => Promise<void>;
}

export function useThemes(): UseThemesReturn {
    const [categories, setCategories] = useState<ThemeCategoryDef[]>([]);
    const [sources, setSources] = useState<ThemeSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const load = useCallback(async (force = false) => {
        if (cachedCategories && !force) {
            setCategories(cachedCategories);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            let savedSources: ThemeSource[] = [];
            const sourcesJson = await AsyncStorage.getItem(THEME_SOURCES_KEY);
            if (sourcesJson) {
                let parsed = JSON.parse(sourcesJson);
                parsed = [DEFAULT_SOURCE, ...parsed.filter((s: ThemeSource) => s.id !== 'default')];
                savedSources = parsed;
            } else {
                savedSources = [DEFAULT_SOURCE];
                await AsyncStorage.setItem(THEME_SOURCES_KEY, JSON.stringify(savedSources));
            }
            setSources(savedSources);

            const allGroups: ThemeCategoryDef[][] = [parseBundledThemes('default')];

            for (const source of savedSources) {
                if (source.type === 'remote' && source.id !== 'default') {
                    try {
                        const cats = await fetchRemoteSource(source);
                        allGroups.push(cats);
                    } catch (e) {
                        console.warn(`Failed to fetch source ${source.name}:`, e);
                    }
                }
            }

            const localJson = await AsyncStorage.getItem(LOCAL_THEMES_KEY);
            const localThemes: ThemeDef[] = localJson ? JSON.parse(localJson) : [];
            if (localThemes.length > 0) {
                allGroups.push([{
                    category: 'Custom',
                    sourceId: 'local',
                    themes: localThemes,
                }]);
            }

            const merged = mergeCategories(allGroups);
            cachedCategories = merged;
            setCategories(merged);
        } catch (e: any) {
            setError(e.message ?? 'Failed to load themes');
            const fallback = parseBundledThemes('default');
            setCategories(fallback);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (!initialized) {
        setInitialized(true);
        load();
    }

    const refresh = useCallback(async () => {
        cachedCategories = null;
        await load(true);
    }, [load]);

    const addSource = useCallback(async (name: string, url: string) => {
        const newSource: ThemeSource = {
            id: `remote-${Date.now()}`,
            name,
            type: 'remote',
            url,
        };
        const sourcesJson = await AsyncStorage.getItem(THEME_SOURCES_KEY);
        const current: ThemeSource[] = sourcesJson ? JSON.parse(sourcesJson) : [DEFAULT_SOURCE];
        const updated = [...current, newSource];
        await AsyncStorage.setItem(THEME_SOURCES_KEY, JSON.stringify(updated));
        setSources(updated);
        await refresh();
    }, [refresh]);

    const removeSource = useCallback(async (id: string) => {
        if (id === 'default') return;
        const sourcesJson = await AsyncStorage.getItem(THEME_SOURCES_KEY);
        const current: ThemeSource[] = sourcesJson ? JSON.parse(sourcesJson) : [DEFAULT_SOURCE];
        const updated = current.filter(s => s.id !== id);
        await AsyncStorage.setItem(THEME_SOURCES_KEY, JSON.stringify(updated));
        setSources(updated);
        await refresh();
    }, [refresh]);

    const getLocalThemes = async (): Promise<ThemeDef[]> => {
        const json = await AsyncStorage.getItem(LOCAL_THEMES_KEY);
        return json ? JSON.parse(json) : [];
    };

    const saveLocalThemes = async (themes: ThemeDef[]) => {
        await AsyncStorage.setItem(LOCAL_THEMES_KEY, JSON.stringify(themes));
        cachedCategories = null;
        await load(true);
    };

    const addLocalTheme = useCallback(async (theme: Omit<ThemeDef, 'id'>) => {
        const current = await getLocalThemes();
        const newTheme: ThemeDef = { ...theme, id: `local-${Date.now()}` };
        await saveLocalThemes([...current, newTheme]);
    }, []);

    const editLocalTheme = useCallback(async (id: string, updates: Partial<ThemeDef>) => {
        const current = await getLocalThemes();
        const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
        await saveLocalThemes(updated);
    }, []);

    const deleteLocalTheme = useCallback(async (id: string) => {
        const current = await getLocalThemes();
        await saveLocalThemes(current.filter(t => t.id !== id));
    }, []);

    return {
        categories,
        sources,
        isLoading,
        error,
        refresh,
        addSource,
        removeSource,
        addLocalTheme,
        editLocalTheme,
        deleteLocalTheme,
    };
}
