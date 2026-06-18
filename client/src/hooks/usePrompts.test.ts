import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrompts } from './usePrompts';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('usePrompts hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default to returning null for AsyncStorage to simulate first run
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('loads default bundled categories on first load', async () => {
        const { result } = renderHook(() => usePrompts());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.categories).toEqual([]);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.categories.length).toBeGreaterThan(0);
        
        // Ensure default categories are loaded
        const hasCategories = result.current.categories.length > 0;
        expect(hasCategories).toBe(true);
    });

    it('includes a local source in the sources list if local prompts exist', async () => {
        // Setup: Mock local prompts returning some data
        const localPrompts = [{ id: 'local-1', title: 'My Custom Prompt', body: 'Test', tags: [] }];
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'phiamanus_local_prompts') return Promise.resolve(JSON.stringify(localPrompts));
            return Promise.resolve(null);
        });

        const { result } = renderHook(() => usePrompts());

        await act(async () => {
            await result.current.refresh();
        });

        // categories should include 'Custom'
        const customCat = result.current.categories.find(c => c.category === 'Custom');
        expect(customCat).toBeDefined();

        // sources should include 'local' type source
        const localSource = result.current.sources.find(s => s.type === 'local');
        expect(localSource).toBeDefined();
        expect(localSource?.id).toBe('local');
    });
});
