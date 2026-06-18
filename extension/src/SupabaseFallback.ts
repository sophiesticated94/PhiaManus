import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkspaceManager } from './WorkspaceManager';
import { logChannel } from './Logger';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uqwujyypeipltllxzzri.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TubIQPd8ha_SINmRjP-YbQ_Oal9X15b';

let supabase: SupabaseClient | null = null;

export async function setupSupabaseFallback(pairId: string, authToken: string, workspaceManager: WorkspaceManager) {
    if (!supabase) {
        logChannel.log('Initializing Supabase client...');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    logChannel.log(`Subscribing to channel phiamanus_${pairId}`);

    const channel = supabase.channel(`phiamanus_${pairId}`, {
        config: {
            presence: {
                key: 'host',
            },
        },
    });

    channel
        .on('broadcast', { event: 'client_message' }, async (payload) => {
            if (payload.payload?.token !== authToken) {
                logChannel.error('Unauthorized Supabase message received');
                return;
            }
            
            const message = payload.payload.data;
            logChannel.log(`Received client message: ${message.type}`);

            try {
                if (message.type === 'REQUEST_FS_TREE') {
                    logChannel.log('Processing REQUEST_FS_TREE...');
                    const tree = await workspaceManager.getWorkspaceTree();
                    logChannel.log(`FS_TREE response generated. Root found: ${tree !== null}`);
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'FS_TREE_RESPONSE', payload: tree } } });
                } 
                else if (message.type === 'REQUEST_DIR_CHILDREN') {
                    const path = message.path;
                    logChannel.log(`Processing REQUEST_DIR_CHILDREN for path: ${path}`);
                    const children = await workspaceManager.getDirectoryChildren(path);
                    logChannel.log(`Found ${children.length} children for path: ${path}`);
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'DIR_CHILDREN_RESPONSE', path, payload: children } } });
                }
                else if (message.type === 'REQUEST_FILE_READ') {
                    const content = await workspaceManager.readFileContents(message.path);
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'FILE_READ_RESPONSE', path: message.path, content } } });
                } else if (message.type === 'REQUEST_RECENT_WORKSPACES') {
                    const recents = workspaceManager.getRecentWorkspaces();
                    channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'RECENT_WORKSPACES_RESPONSE', payload: recents } } });
                } else if (message.type === 'SWITCH_WORKSPACE') {
                    const targetPath = message.payload;
                    if (targetPath) {
                        import('vscode').then(vscode => {
                            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetPath));
                        });
                    }
                }
            } catch (err: any) {
                logChannel.error('Error handling Supabase message:', err);
                channel.send({ type: 'broadcast', event: 'host_message', payload: { token: authToken, data: { type: 'ERROR', message: err.message } } });
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Supabase Fallback channel subscribed');
            }
        });
}
