import { renderHook } from '@testing-library/react-native';
import { useTips } from '../hooks/useTips';

jest.mock('../data/tips.json', () => [
    {
        category: 'Getting Started',
        tips: [
            {
                id: 'what-is-antigravity',
                title: 'What is Antigravity?',
                subtitle: 'Learn about the AI-powered coding assistant',
                icon: '❓',
                iconBg: '#3b82f6',
                body: '# What is Antigravity?\n\nA great tool.',
            },
        ],
    },
    {
        category: 'Advanced Tips',
        tips: [
            {
                id: 'ide-rules-files',
                title: 'IDE Rules Files',
                subtitle: 'Customize AI behavior with rules',
                icon: '📄',
                iconBg: '#8b5cf6',
                body: '# IDE Rules Files\n\nCustomize your workflow.',
            },
        ],
    },
]);

describe('useTips', () => {
    it('loads categories from bundled JSON', () => {
        const { result } = renderHook(() => useTips());
        expect(result.current.categories).toHaveLength(2);
        expect(result.current.categories[0].category).toBe('Getting Started');
        expect(result.current.categories[1].category).toBe('Advanced Tips');
    });

    it('maps tips correctly', () => {
        const { result } = renderHook(() => useTips());
        const tips = result.current.categories[0].tips;
        expect(tips).toHaveLength(1);
        expect(tips[0].id).toBe('what-is-antigravity');
        expect(tips[0].title).toBe('What is Antigravity?');
        expect(tips[0].icon).toBe('❓');
        expect(tips[0].iconBg).toBe('#3b82f6');
    });

    it('is never loading (bundled data is synchronous)', () => {
        const { result } = renderHook(() => useTips());
        expect(result.current.isLoading).toBe(false);
    });
});
