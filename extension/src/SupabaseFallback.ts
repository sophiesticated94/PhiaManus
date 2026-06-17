import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

let supabase: SupabaseClient | null = null;

export function setupSupabaseFallback(pairId: string, authToken: string, workspaceManager: any) {
    if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    const channel = supabase.channel(`phiamanus_${pairId}`, {
        config: {
            presence: {
                key: 'host',
            },
        },
    });

    channel
        .on('broadcast', { event: 'client_message' }, async (payload) => {
            if (payload.payload.token !== authToken) {
                console.warn('Unauthorized Supabase message received');
                return;
            }
            
            const message = payload.payload.data;
            try {
                if (message.type === 'REQUEST_FS_TREE') {
                    const tree = await workspaceManager.getWorkspaceTree();
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'FS_TREE_RESPONSE', payload: tree } } });
                } 
                else if (message.type === 'REQUEST_DIR_CHILDREN') {
                    const children = await workspaceManager.getDirectoryChildren(message.path);
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'DIR_CHILDREN_RESPONSE', path: message.path, payload: children } } });
                }
                else if (message.type === 'REQUEST_FILE_READ') {
                    const content = await workspaceManager.readFileContents(message.path);
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'FILE_READ_RESPONSE', path: message.path, content } } });
                }
            } catch (err: any) {
                console.error('Error handling Supabase message:', err);
                channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'ERROR', message: err.message } } });
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Supabase Fallback channel subscribed');
            }
        });
}
