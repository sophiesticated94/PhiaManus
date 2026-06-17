import { useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export type ConnectionType = 'none' | 'websocket' | 'supabase';

export interface ConnectionConfig {
    ip?: string;
    port?: string;
    pairId: string;
    token: string;
}

export function usePhiaManusSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionType, setConnectionType] = useState<ConnectionType>('none');
    const [error, setError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<any | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenRef = useRef<string | null>(null);

    const sendMessage = useCallback((payload: any) => {
        if (connectionType === 'websocket' && wsRef.current) {
            wsRef.current.send(JSON.stringify(payload));
        } else if (connectionType === 'supabase' && supabaseChannelRef.current && tokenRef.current) {
            supabaseChannelRef.current.send({
                type: 'broadcast',
                event: 'client_message',
                payload: {
                    token: tokenRef.current,
                    data: payload
                }
            });
        } else {
            console.warn('Cannot send message, not connected.');
        }
    }, [connectionType]);

    const connect = useCallback((config: ConnectionConfig) => {
        setIsConnected(false);
        setConnectionType('none');
        setError(null);
        tokenRef.current = config.token;

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (supabaseChannelRef.current) {
            supabaseChannelRef.current.unsubscribe();
            supabaseChannelRef.current = null;
        }

        const attemptSupabaseFallback = async () => {
            console.log('Falling back to Supabase...');
            try {
                const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const channel = supabase.channel(`phiamanus_${config.pairId}`, {
                    config: {
                        presence: { key: 'client' },
                    },
                });

                channel.on('broadcast', { event: 'host_message' }, (payload) => {
                    if (payload.payload?.token !== config.token) {
                        console.warn('Unauthorized Supabase message received');
                        return;
                    }
                    const data = payload.payload.data;
                    setLastMessage(data);
                    console.log('Received from host:', data);
                }).subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Connected via Supabase');
                        setConnectionType('supabase');
                        setIsConnected(true);
                        supabaseChannelRef.current = channel;
                        saveCredentials(config);
                    } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        setError('Supabase connection failed.');
                        setConnectionType('none');
                        setIsConnected(false);
                    }
                });
            } catch (err) {
                console.error(err);
                setError('Failed to initialize Supabase fallback.');
            }
        };

        if (config.ip && config.port) {
            const wsUrl = `ws://${config.ip}:${config.port}`;
            console.log(`Attempting WebSocket connection to ${wsUrl}...`);
            const ws = new WebSocket(wsUrl);

            let hasOpened = false;

            timeoutRef.current = setTimeout(() => {
                if (!hasOpened) {
                    console.warn('WebSocket connection timed out (3000ms). Closing and falling back.');
                    ws.close();
                    attemptSupabaseFallback();
                }
            }, 3000);

            ws.onopen = () => {
                hasOpened = true;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                console.log('WebSocket connected!');
                ws.send(JSON.stringify({ type: 'auth', token: config.token }));
                
                setConnectionType('websocket');
                setIsConnected(true);
                wsRef.current = ws;
                saveCredentials(config);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Filter out internal messages
                    if (data.status === 'connected') return;
                    setLastMessage(data);
                } catch (e) {
                    console.log('Received via WS:', event.data);
                }
            };

            ws.onerror = (e) => {
                console.error('WebSocket error:', e);
            };

            ws.onclose = () => {
                if (!hasOpened) {
                   if (timeoutRef.current) clearTimeout(timeoutRef.current);
                   attemptSupabaseFallback();
                } else {
                   setIsConnected(false);
                   setConnectionType('none');
                }
            };
        } else {
            attemptSupabaseFallback();
        }
    }, []);

    const saveCredentials = async (config: ConnectionConfig) => {
        try {
            await SecureStore.setItemAsync('pairId', config.pairId);
            await SecureStore.setItemAsync('token', config.token);
            if (config.ip) await SecureStore.setItemAsync('lastIp', config.ip);
            if (config.port) await SecureStore.setItemAsync('lastPort', config.port);
        } catch (e) {
            console.error('Failed to save to SecureStore', e);
        }
    };

    const restoreConnection = useCallback(async () => {
        try {
            const pairId = await SecureStore.getItemAsync('pairId');
            const token = await SecureStore.getItemAsync('token');
            const ip = await SecureStore.getItemAsync('lastIp');
            const port = await SecureStore.getItemAsync('lastPort');

            if (pairId && token) {
                console.log('Found saved credentials, attempting connection...');
                connect({ pairId, token, ip: ip || undefined, port: port || undefined });
            }
        } catch (e) {
            console.error('Failed to restore connection', e);
        }
    }, [connect]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (wsRef.current) wsRef.current.close();
            if (supabaseChannelRef.current) supabaseChannelRef.current.unsubscribe();
        };
    }, []);

    return {
        isConnected,
        connectionType,
        error,
        lastMessage,
        sendMessage,
        connect,
        restoreConnection,
    };
}
