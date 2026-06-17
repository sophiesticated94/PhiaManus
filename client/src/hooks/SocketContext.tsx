import React, { createContext, useContext, useEffect } from 'react';
import { usePhiaManusSocket } from './usePhiaManusSocket';

type SocketContextType = ReturnType<typeof usePhiaManusSocket>;

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = usePhiaManusSocket();
    
    useEffect(() => {
        socket.restoreConnection();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
    return ctx;
};
