import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledPrompts from '../data/prompts.json';

const PROMPT_SOURCES_KEY = 'phiamanus_prompt_sources';
const LOCAL_PROMPTS_KEY = 'phiamanus_local_prompts';

export interface Prompt {
    id: string;
    title: string;
    subtitle: string;
    body: string;
    tags: string[];
    icon: string;
    iconColor: string;
    iconBg: string;
}

export interface PromptCategory {
    category: string;
    sourceId: string;
    prompts: Prompt[];
}

export interface PromptSource {
    id: string;
    name: string;
    type: 'remote' | 'local';
    url?: string;
}

export interface LocalPrompt extends Prompt {
    // same shape, stored separately in AsyncStorage
}

const DEFAULT_SOURCE: PromptSource = {
    id: 'default',
    name: 'PhiaManus Library',
    type: 'remote',
    url: 'https://raw.githubusercontent.com/sophiesticated94/PhiaManus/master/prompts.json',
};

// Module-level cache
let cachedCategories: PromptCategory[] | null = null;

function parseBundledPrompts(sourceId: string): PromptCategory[] {
    return (bundledPrompts as any[]).map((cat: any) => ({
        category: cat.category,
        sourceId,
        prompts: cat.prompts as Prompt[],
    }));
}

async function fetchRemoteSource(source: PromptSource): Promise<PromptCategory[]> {
    if (!source.url) return [];
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data as any[]).map((cat: any) => ({
        category: cat.category,
        sourceId: source.id,
        prompts: cat.prompts as Prompt[],
    }));
}

function mergeCategories(all: PromptCategory[][]): PromptCategory[] {
    const merged: Map<string, PromptCategory> = new Map();
    for (const group of all) {
        for (const cat of group) {
            const existing = merged.get(cat.category);
            if (existing) {
                // Merge prompts, avoiding duplicates by id
                const existingIds = new Set(existing.prompts.map(p => p.id));
                const newPrompts = cat.prompts.filter(p => !existingIds.has(p.id));
                existing.prompts = [...existing.prompts, ...newPrompts];
            } else {
                merged.set(cat.category, { ...cat, prompts: [...cat.prompts] });
            }
        }
    }
    return Array.from(merged.values());
}

interface UsePromptsReturn {
    categories: PromptCategory[];
    sources: PromptSource[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addSource: (name: string, url: string) => Promise<void>;
    removeSource: (id: string) => Promise<void>;
    addLocalPrompt: (prompt: Omit<LocalPrompt, 'id'>) => Promise<void>;
    editLocalPrompt: (id: string, updates: Partial<LocalPrompt>) => Promise<void>;
    deleteLocalPrompt: (id: string) => Promise<void>;
}

export function usePrompts(): UsePromptsReturn {
    const [categories, setCategories] = useState<PromptCategory[]>([]);
    const [sources, setSources] = useState<PromptSource[]>([]);
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
            // Load sources from AsyncStorage; seed default on first run
            let savedSources: PromptSource[] = [];
            const sourcesJson = await AsyncStorage.getItem(PROMPT_SOURCES_KEY);
            if (sourcesJson) {
                let parsed = JSON.parse(sourcesJson);
                parsed = [DEFAULT_SOURCE, ...parsed.filter((s: PromptSource) => s.id !== 'default')];
                savedSources = parsed;
            } else {
                savedSources = [DEFAULT_SOURCE];
                await AsyncStorage.setItem(PROMPT_SOURCES_KEY, JSON.stringify(savedSources));
            }
            setSources(savedSources);

            // Always include bundled prompts as fallback
            const allGroups: PromptCategory[][] = [parseBundledPrompts('default')];

            // Fetch remote sources (skip default since bundled is already included)
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

            // Load local custom prompts
            const localJson = await AsyncStorage.getItem(LOCAL_PROMPTS_KEY);
            const localPrompts: LocalPrompt[] = localJson ? JSON.parse(localJson) : [];
            if (localPrompts.length > 0) {
                allGroups.push([{
                    category: 'Custom',
                    sourceId: 'local',
                    prompts: localPrompts,
                }]);
            }

            const merged = mergeCategories(allGroups);
            cachedCategories = merged;
            setCategories(merged);
        } catch (e: any) {
            setError(e.message ?? 'Failed to load prompts');
            // Use bundled as fallback
            const fallback = parseBundledPrompts('default');
            setCategories(fallback);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-load on first use
    if (!initialized) {
        setInitialized(true);
        load();
    }

    const refresh = useCallback(async () => {
        cachedCategories = null;
        await load(true);
    }, [load]);

    const addSource = useCallback(async (name: string, url: string) => {
        const newSource: PromptSource = {
            id: `remote-${Date.now()}`,
            name,
            type: 'remote',
            url,
        };
        const sourcesJson = await AsyncStorage.getItem(PROMPT_SOURCES_KEY);
        const current: PromptSource[] = sourcesJson ? JSON.parse(sourcesJson) : [DEFAULT_SOURCE];
        const updated = [...current, newSource];
        await AsyncStorage.setItem(PROMPT_SOURCES_KEY, JSON.stringify(updated));
        setSources(updated);
        await refresh();
    }, [refresh]);

    const removeSource = useCallback(async (id: string) => {
        if (id === 'default') return; // cannot remove default
        const sourcesJson = await AsyncStorage.getItem(PROMPT_SOURCES_KEY);
        const current: PromptSource[] = sourcesJson ? JSON.parse(sourcesJson) : [DEFAULT_SOURCE];
        const updated = current.filter(s => s.id !== id);
        await AsyncStorage.setItem(PROMPT_SOURCES_KEY, JSON.stringify(updated));
        setSources(updated);
        await refresh();
    }, [refresh]);

    const getLocalPrompts = async (): Promise<LocalPrompt[]> => {
        const json = await AsyncStorage.getItem(LOCAL_PROMPTS_KEY);
        return json ? JSON.parse(json) : [];
    };

    const saveLocalPrompts = async (prompts: LocalPrompt[]) => {
        await AsyncStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify(prompts));
        cachedCategories = null;
        await load(true);
    };

    const addLocalPrompt = useCallback(async (prompt: Omit<LocalPrompt, 'id'>) => {
        const current = await getLocalPrompts();
        const newPrompt: LocalPrompt = { ...prompt, id: `local-${Date.now()}` };
        await saveLocalPrompts([...current, newPrompt]);
    }, []);

    const editLocalPrompt = useCallback(async (id: string, updates: Partial<LocalPrompt>) => {
        const current = await getLocalPrompts();
        const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
        await saveLocalPrompts(updated);
    }, []);

    const deleteLocalPrompt = useCallback(async (id: string) => {
        const current = await getLocalPrompts();
        await saveLocalPrompts(current.filter(p => p.id !== id));
    }, []);

    return {
        categories,
        sources,
        isLoading,
        error,
        refresh,
        addSource,
        removeSource,
        addLocalPrompt,
        editLocalPrompt,
        deleteLocalPrompt,
    };
}
