import * as vscode from 'vscode';
import { PhiaWebSocketServer } from './WebSocketServer';
import { showConnectionWebview } from './WebviewRenderer';
import { randomUUID, randomBytes } from 'crypto';
import { getAddressScores } from './IpScoreCalculator';
import { logChannel } from './Logger';

function getBestLocalIpAddress(): string {
    const scores = getAddressScores();
    let bestIp = '0.0.0.0';
    let bestScore = -1;

    for (const [ip, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestIp = ip;
        }
    }
    
    return bestIp;
}

export async function activate(context: vscode.ExtensionContext) {
    logChannel.initialize();
    logChannel.log('Activating PhiaManus extension...');
    logChannel.show();

    let pairId = context.globalState.get<string>('PairId');
    let authToken = context.globalState.get<string>('AuthToken');

    if (!pairId || !authToken) {
        pairId = randomUUID();
        authToken = randomBytes(32).toString('hex');
        await context.globalState.update('PairId', pairId);
        await context.globalState.update('AuthToken', authToken);
    }

    const wsServer = new PhiaWebSocketServer(context, authToken, pairId);
    await wsServer.start(38475);

    const localIp = getBestLocalIpAddress();
    const port = wsServer.getPort();
    
    const generatePayload = (ip: string) => `phiamanus://pair?ip=${ip}&port=${port}&pairId=${pairId}&token=${authToken}`;
    let currentPayload = generatePayload(localIp);

    context.subscriptions.push(
        vscode.commands.registerCommand('phiamanus.showConnection', () => {
            showConnectionWebview(context, currentPayload, async (newIp) => {
                currentPayload = generatePayload(newIp);
                return currentPayload;
            });
        })
    );

    showConnectionWebview(context, currentPayload, async (newIp) => {
        currentPayload = generatePayload(newIp);
        return currentPayload;
    });
}

export function deactivate() {}

