import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../hooks/SocketContext', () => ({
    useSocketContext: jest.fn(() => ({
        sendMessage: jest.fn(),
        lastMessage: null,
    })),
}));

jest.mock('../data/extensions.json', () => [
    {
        id: 'superpowers',
        name: 'superpowers',
        author: 'obra',
        repo: 'obra/superpowers',
        description: 'Core skills library',
        tags: ['Context', 'Skills'],
        stars: 176200,
        avatarUrl: 'https://avatars.githubusercontent.com/u/783',
    },
    {
        id: 'context7',
        name: 'context7',
        author: 'upstash',
        repo: 'upstash/context7',
        description: 'Up-to-date code docs',
        tags: ['MCP', 'Skills'],
        stars: 54300,
        avatarUrl: 'https://avatars.githubusercontent.com/u/108982349',
    },
]);

global.fetch = jest.fn();

// Import after mocks so jest.mock takes effect
import { useExtensions } from '../hooks/useExtensions';

describe('useExtensions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('loads bundled extensions after refresh', async () => {
        const { result } = renderHook(() => useExtensions());
        await act(async () => {
            await result.current.refresh();
        });
        expect(result.current.extensions).toHaveLength(2);
        expect(result.current.extensions[0].name).toBe('superpowers');
        expect(result.current.extensions[1].name).toBe('context7');
    });

    it('default source is always present after refresh', async () => {
        const { result } = renderHook(() => useExtensions());
        await act(async () => {
            await result.current.refresh();
        });
        const defaultSource = result.current.sources.find(s => s.id === 'default');
        expect(defaultSource).toBeDefined();
        expect(defaultSource?.type).toBe('default');
        expect(result.current.sources[0].id).toBe('default');
    });

    it('removeSource ignores default source', async () => {
        const { result } = renderHook(() => useExtensions());
        await act(async () => {
            await result.current.refresh();
        });
        await act(async () => {
            await result.current.removeSource('default');
        });
        // AsyncStorage.setItem should NOT have been called for removing default
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('addSource persists to AsyncStorage', async () => {
        const { result } = renderHook(() => useExtensions());
        await act(async () => {
            await result.current.refresh();
        });
        await act(async () => {
            await result.current.addSource('microsoft/playwright-mcp');
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'phiamanus_extension_sources',
            expect.stringContaining('microsoft/playwright-mcp')
        );
    });
});
