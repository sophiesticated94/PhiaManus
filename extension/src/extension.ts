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
    let bestIp = '0.0.0.0';
    let bestScore = -1;

    for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (!iface) continue;

        const isVirtual = /vEthernet|WSL|Virtual|VMware|docker|Tailscale|ZeroTier/i.test(devName);
        const isPhysical = /Wi-Fi|Ethernet|en0|eth0|wlan0/i.test(devName);

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                let score = 0;
                if (isPhysical && !isVirtual) score = 100;
                else if (!isVirtual) score = 50;
                else score = 10;

                // Prefer common local subnets
                if (alias.address.startsWith('192.168.')) score += 5;
                if (alias.address.startsWith('10.0.')) score += 5;

                if (score > bestScore) {
                    bestScore = score;
                    bestIp = alias.address;
                }
            }
        }
    }
    return bestIp;
}
