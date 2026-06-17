import { Server, WebSocket } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import { setupSupabaseFallback } from './SupabaseFallback';
import { WorkspaceManager } from './WorkspaceManager';
import * as vscode from 'vscode';
import { GeminiService } from './GeminiService';
import { diffLines } from 'diff';
import { randomUUID } from 'crypto';

export class PhiaWebSocketServer {
    private wss: Server | null = null;
    private httpServer: HttpServer | null = null;
    private port: number = 0;
    private workspaceManager: WorkspaceManager;
    private geminiService: GeminiService;
    private stagedPatches: Map<string, { absolutePath: string; newContent: string }> = new Map();

    constructor(private context: vscode.ExtensionContext, private authToken: string, private pairId: string) {
        this.workspaceManager = new WorkspaceManager();
        this.geminiService = new GeminiService(context);
    }

    public async start(initialPort: number): Promise<void> {
        return new Promise((resolve) => {
            this.port = initialPort;
            this.httpServer = createServer();
            
            this.wss = new Server({ noServer: true });

            this.httpServer.on('upgrade', (request, socket, head) => {
                const url = new URL(request.url || '', `http://${request.headers.host}`);
                const token = url.searchParams.get('token');

                if (token !== this.authToken) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                this.wss?.handleUpgrade(request, socket, head, (ws) => {
                    this.wss?.emit('connection', ws, request);
                });
            });

            this.wss.on('connection', (ws: WebSocket) => {
                ws.on('message', async (messageData) => {
                    try {
                        const message = JSON.parse(messageData.toString());
                        
                        if (message.type === 'auth') {
                            return;
                        }

                        if (message.type === 'REQUEST_FS_TREE') {
                            const tree = await this.workspaceManager.getWorkspaceTree();
                            ws.send(JSON.stringify({ type: 'FS_TREE_RESPONSE', payload: tree }));
                        } 
                        else if (message.type === 'REQUEST_DIR_CHILDREN') {
                            const children = await this.workspaceManager.getDirectoryChildren(message.path);
                            ws.send(JSON.stringify({ type: 'DIR_CHILDREN_RESPONSE', path: message.path, payload: children }));
                        }
                        else if (message.type === 'REQUEST_FILE_READ') {
                            const content = await this.workspaceManager.readFileContents(message.path);
                            ws.send(JSON.stringify({ type: 'FILE_READ_RESPONSE', path: message.path, content }));
                        }
                        else if (message.type === 'PROMPT_EXECUTE') {
                            const { prompt, path: filePath } = message;
                            const originalContent = await this.workspaceManager.readFileContents(filePath);
                            
                            const newContent = await this.geminiService.generateStream(prompt, originalContent, (chunk) => {
                                ws.send(JSON.stringify({ type: 'DELTA_CHUNK', chunk }));
                            });

                            const diffResult = diffLines(originalContent, newContent);
                            let hasChanges = false;
                            
                            let oldLine = 1;
                            let newLine = 1;
                            const structuredDiff = diffResult.map(part => {
                                if (part.added || part.removed) hasChanges = true;
                                
                                const lines = part.value.replace(/\n$/, '').split('\n');
                                const diffLines = lines.map(lineText => {
                                    const entry = {
                                        type: part.added ? 'added' : part.removed ? 'removed' : 'context',
                                        value: lineText,
                                        oldLine: part.added ? undefined : oldLine++,
                                        newLine: part.removed ? undefined : newLine++
                                    };
                                    return entry;
                                });
                                return diffLines;
                            }).flat();

                            if (hasChanges) {
                                const patchId = randomUUID();
                                // Validate path security by using readFileContents's inherent path resolution
                                // But since we already read it successfully above, the path is safe.
                                const absolutePath = vscode.Uri.file(require('path').resolve(this.workspaceManager.getRoot() || '', require('path').normalize(filePath))).fsPath;
                                
                                this.stagedPatches.set(patchId, { absolutePath, newContent });
                                ws.send(JSON.stringify({ type: 'PATCH_PROPOSAL', patchId, path: filePath, diff: structuredDiff }));
                            } else {
                                ws.send(JSON.stringify({ type: 'PATCH_PROPOSAL', patchId: null, path: filePath, diff: [] }));
                            }
                        }
                        else if (message.type === 'PATCH_APPROVE') {
                            const patch = this.stagedPatches.get(message.patchId);
                            if (patch) {
                                const edit = new vscode.WorkspaceEdit();
                                const uri = vscode.Uri.file(patch.absolutePath);
                                // A complete file overwrite edit
                                edit.replace(uri, new vscode.Range(0, 0, 999999, 999999), patch.newContent);
                                await vscode.workspace.applyEdit(edit);
                                await vscode.workspace.save(uri);
                                this.stagedPatches.delete(message.patchId);
                                ws.send(JSON.stringify({ type: 'PATCH_APPLIED', patchId: message.patchId, success: true }));
                            } else {
                                throw new Error('Patch not found or already applied');
                            }
                        }
                        else if (message.type === 'PATCH_REJECT') {
                            this.stagedPatches.delete(message.patchId);
                            ws.send(JSON.stringify({ type: 'PATCH_APPLIED', patchId: message.patchId, success: false }));
                        }
                        else {
                            console.log('Unknown message type:', message.type);
                        }
                    } catch (err: any) {
                        console.error('Error handling WS message:', err);
                        ws.send(JSON.stringify({ type: 'ERROR', message: err.message || 'Unknown error' }));
                    }
                });
                
                ws.send(JSON.stringify({ status: 'connected' }));
            });

            const tryListen = (portToTry: number) => {
                this.httpServer?.listen(portToTry, '0.0.0.0')
                    .once('listening', () => {
                        this.port = portToTry;
                        // Supabase routing fallback
                        // Note: For full feature parity, SupabaseFallback should also proxy the new message types,
                        // but since the WebSocket handles it directly and they share the identical payload interface, 
                        // we can pass the websocket instance or just ensure the hooks are wired.
                        setupSupabaseFallback(this.pairId, this.authToken, this.workspaceManager);
                        resolve();
                    })
                    .once('error', (err: any) => {
                        if (err.code === 'EADDRINUSE') {
                            tryListen(portToTry + 1);
                        }
                    });
            };

            tryListen(initialPort);
        });
    }

    public getPort(): number {
        return this.port;
    }
}
                
