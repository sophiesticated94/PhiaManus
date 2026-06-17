import * as vscode from 'vscode';
import { PhiaWebSocketServer } from './WebSocketServer';
import { showConnectionWebview } from './WebviewRenderer';
import { randomUUID, randomBytes } from 'crypto';
import { getLocalIpAddress } from './IpScoreCalculator';

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

