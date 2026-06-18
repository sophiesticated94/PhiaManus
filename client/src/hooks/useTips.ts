import { useState, useCallback } from 'react';
import bundledTips from '../data/tips.json';

export interface Tip {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    body: string;
}

export interface TipCategory {
    category: string;
    tips: Tip[];
}

function parseBundledTips(): TipCategory[] {
    return (bundledTips as any[]).map((cat: any) => ({
        category: cat.category,
        tips: cat.tips as Tip[],
    }));
}

interface UseTipsReturn {
    categories: TipCategory[];
    isLoading: boolean;
}

export function useTips(): UseTipsReturn {
    const [categories] = useState<TipCategory[]>(() => parseBundledTips());
    const [isLoading] = useState(false);

    return {
        categories,
        isLoading,
    };
}
