import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledExtensions from '../data/extensions.json';

const EXTENSION_SOURCES_KEY = 'phiamanus_extension_sources';

export interface Extension {
    id: string;
    name: string;
    author: string;
    repo: string; // "owner/repo"
    description: string;
    tags: string[];
    stars: number;
    avatarUrl: string;
}

export interface ExtensionSource {
    id: string;
    name: string;
    type: 'default' | 'github';
    repo?: string; // "owner/repo" for github sources
}

const DEFAULT_SOURCE: ExtensionSource = {
    id: 'default',
    name: 'PhiaManus Library',
    type: 'default',
};

// Module-level cache
let cachedExtensions: Extension[] | null = null;

function parseBundledExtensions(): Extension[] {
    return bundledExtensions as Extension[];
}

async function fetchGitHubExtension(repo: string): Promise<Extension | null> {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            id: repo.replace('/', '-'),
            name: data.name,
            author: data.owner?.login ?? repo.split('/')[0],
            repo,
            description: data.description ?? '',
            tags: data.topics ?? [],
            stars: data.stargazers_count ?? 0,
            avatarUrl: data.owner?.avatar_url ?? '',
        };
    } catch {
        return null;
    }
}

interface UseExtensionsReturn {
    extensions: Extension[];
    sources: ExtensionSource[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addSource: (repo: string) => Promise<void>;
    removeSource: (id: string) => Promise<void>;
}

export function useExtensions(): UseExtensionsReturn {
    const [extensions, setExtensions] = useState<Extension[]>([]);
    const [sources, setSources] = useState<ExtensionSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const load = useCallback(async (force = false) => {
        if (cachedExtensions && !force) {
            setExtensions(cachedExtensions);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const sourcesJson = await AsyncStorage.getItem(EXTENSION_SOURCES_KEY);
            let savedSources: ExtensionSource[] = sourcesJson
                ? JSON.parse(sourcesJson)
                : [DEFAULT_SOURCE];

            // Always ensure default is first and present
            savedSources = [
                DEFAULT_SOURCE,
                ...savedSources.filter(s => s.id !== 'default'),
            ];

            setSources(savedSources);

            // Start with bundled extensions
            const allExtensions: Extension[] = [...parseBundledExtensions()];
            const existingIds = new Set(allExtensions.map(e => e.id));

            // Fetch user-added GitHub repos
            for (const source of savedSources) {
                if (source.type === 'github' && source.repo) {
                    const ext = await fetchGitHubExtension(source.repo);
                    if (ext && !existingIds.has(ext.id)) {
                        allExtensions.push(ext);
                        existingIds.add(ext.id);
                    }
                }
            }

            cachedExtensions = allExtensions;
            setExtensions(allExtensions);
        } catch (e: any) {
            setError(e.message ?? 'Failed to load extensions');
            setExtensions(parseBundledExtensions());
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (!initialized) {
        setInitialized(true);
        load();
    }

    const refresh = useCallback(async () => {
        cachedExtensions = null;
        await load(true);
    }, [load]);

    const addSource = useCallback(async (repo: string) => {
        const newSource: ExtensionSource = {
            id: `github-${repo.replace('/', '-')}`,
            name: repo,
            type: 'github',
            repo,
        };
        const sourcesJson = await AsyncStorage.getItem(EXTENSION_SOURCES_KEY);
        const current: ExtensionSource[] = sourcesJson
            ? JSON.parse(sourcesJson)
            : [DEFAULT_SOURCE];
        const updated = [...current.filter(s => s.id !== newSource.id), newSource];
        await AsyncStorage.setItem(EXTENSION_SOURCES_KEY, JSON.stringify(updated));
        cachedExtensions = null;
        await load(true);
    }, [load]);

    const removeSource = useCallback(async (id: string) => {
        if (id === 'default') return;
        const sourcesJson = await AsyncStorage.getItem(EXTENSION_SOURCES_KEY);
        const current: ExtensionSource[] = sourcesJson
            ? JSON.parse(sourcesJson)
            : [DEFAULT_SOURCE];
        const updated = current.filter(s => s.id !== id);
        await AsyncStorage.setItem(EXTENSION_SOURCES_KEY, JSON.stringify(updated));
        cachedExtensions = null;
        await load(true);
    }, [load]);

    return {
        extensions,
        sources,
        isLoading,
        error,
        refresh,
        addSource,
        removeSource,
    };
}
