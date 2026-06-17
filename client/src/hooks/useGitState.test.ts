import { renderHook, act } from '@testing-library/react-native';
import { useGitState } from './useGitState';
import * as SocketContext from './SocketContext';

// Mock the context
jest.mock('./SocketContext');

describe('useGitState', () => {
    let mockSendMessage: jest.Mock;

    beforeEach(() => {
        mockSendMessage = jest.fn();
        (SocketContext.useSocketContext as jest.Mock).mockReturnValue({
            sendMessage: mockSendMessage,
            lastMessage: null,
        });
    });

    it('requests initial state', () => {
        const { result } = renderHook(() => useGitState());

        act(() => {
            result.current.requestStatus();
            result.current.requestBranches();
        });

        expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'REQUEST_GIT_STATUS' }));
        expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'REQUEST_GIT_BRANCHES' }));
    });

    it('handles git actions', () => {
        const { result } = renderHook(() => useGitState());

        act(() => {
            result.current.stageFile('test.txt');
        });

        expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'stage', file: 'test.txt' }));
    });

    it('updates state on incoming message', () => {
        // Change the mock to simulate an incoming message
        (SocketContext.useSocketContext as jest.Mock).mockReturnValue({
            sendMessage: mockSendMessage,
            lastMessage: JSON.stringify({
                type: 'GIT_STATUS_RESPONSE',
                payload: { staged: ['file1.ts'] }
            }),
        });

        const { result } = renderHook(() => useGitState());

        expect(result.current.status).toEqual({ staged: ['file1.ts'] });
    });
});
