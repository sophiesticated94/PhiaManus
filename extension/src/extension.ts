import * as vscode from 'vscode';
import { PhiaWebSocketServer } from './WebSocketServer';
import { showConnectionWebview } from './WebviewRenderer';
import { randomUUID, randomBytes } from 'crypto';
import * as os from 'os';

export async function activate(context: vscode.ExtensionContext) {
    const pairId = randomUUID();
    const authToken = randomBytes(32).toString('hex');
    
    await context.globalState.update('PairId', pairId);
    await context.globalState.update('AuthToken', authToken);

    const wsServer = new PhiaWebSocketServer(context, authToken, pairId);
    await wsServer.start(38475);

    const localIp = getLocalIpAddress();
    const port = wsServer.getPort();
    
    const payload = `phiamanus://pair?ip=${localIp}&port=${port}&pairId=${pairId}&token=${authToken}`;

    context.subscriptions.push(
        vscode.commands.registerCommand('phiamanus.showConnection', () => {
            showConnectionWebview(context, payload);
        })
    );

    showConnectionWebview(context, payload);
}

export function deactivate() {}

function getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (!iface) continue;
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}
