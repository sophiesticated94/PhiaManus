import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemes } from './useThemes';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('useThemes hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default to returning null for AsyncStorage to simulate first run
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('loads default bundled categories on first load', async () => {
        const { result } = renderHook(() => useThemes());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.categories).toEqual([]);

        // Wait for async load to finish
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.categories.length).toBeGreaterThan(0);
        
        // Ensure Original pink theme is in there
        const originalCat = result.current.categories.find(c => c.category === 'Original');
        expect(originalCat).toBeDefined();
        expect(originalCat?.themes.find(t => t.id === 'pink')).toBeDefined();
    });

    it('adds and saves a local custom theme', async () => {
        const { result } = renderHook(() => useThemes());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Mock getting an empty array for local themes
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

        const newTheme = {
            name: 'Test Custom',
            colors: {
                accent: '#000',
                accentSoft: '#000',
                accentDark: '#000',
                bg: '#000',
                surface: '#000',
                surfaceElevated: '#000',
                surfaceHighlight: '#000',
                border: '#000',
                borderSubtle: '#000',
                textPrimary: '#000',
                textSecondary: '#000',
                textMuted: '#000',
                success: '#000',
                danger: '#000',
                warning: '#000',
                info: '#000',
            }
        };

        await act(async () => {
            await result.current.addLocalTheme(newTheme);
        });

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'phiamanus_local_themes',
            expect.stringContaining('Test Custom')
        );
    });
});
