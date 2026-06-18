import * as vscode from 'vscode';
import * as qrcode from 'qrcode';

export async function showConnectionWebview(context: vscode.ExtensionContext, payload: string, onUpdateIp?: (newIp: string) => Promise<string>) {
    const panel = vscode.window.createWebviewPanel(
        'phiamanusConnection',
        'PhiaManus Connection',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const updateQr = async (p: string) => {
        const url = await qrcode.toDataURL(p, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 4,
            width: 300
        });
        panel.webview.postMessage({ command: 'updateQr', url });
    };

    if (onUpdateIp) {
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'requestNewIp') {
                const newPayload = await onUpdateIp(msg.ip);
                await updateQr(newPayload);
            }
        });
    }

    try {
        const qrCodeDataUrl = await qrcode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 4,
            width: 300
        });

        // Extract current IP from payload
        const ipMatch = payload.match(/[?&]ip=([^&]+)/);
        const currentIp = ipMatch ? ipMatch[1] : '';

        panel.webview.html = getWebviewContent(qrCodeDataUrl, payload, currentIp);
    } catch (err) {
        vscode.window.showErrorMessage('Failed to generate QR Code');
    }
}

function getWebviewContent(qrCodeDataUrl: string, payload: string, currentIp: string): string {
    const base64Payload = Buffer.from(payload).toString('base64');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhiaManus Connection</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
        }
        .container {
            text-align: center;
            padding: 2rem;
            border-radius: 12px;
            background-color: var(--vscode-editorWidget-background);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
        }
        img {
            border-radius: 8px;
            margin-bottom: 1rem;
            background: white;
            padding: 10px;
            transition: opacity 0.2s;
        }
        .ip-config {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--vscode-widget-border);
            text-align: left;
        }
        .ip-config label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        .ip-input-group {
            display: flex;
            gap: 8px;
        }
        input {
            flex: 1;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        button {
            padding: 6px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .instructions {
            margin-top: 1rem;
            font-size: 1.1rem;
            opacity: 0.8;
            margin-bottom: 1.5rem;
        }
        .manual-entry {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--vscode-panel-border);
            text-align: left;
        }
        .manual-entry label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .input-group {
            display: flex;
            gap: 0.5rem;
        }
        input {
            flex: 1;
            padding: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: monospace;
        }
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Scan to Connect</h2>
        <img src="${qrCodeDataUrl}" alt="QR Code" />
        <div class="instructions">Use the PhiaManus iOS App to scan this QR code.</div>
        
        <div class="ip-config">
            <label>If your local network fails, you can specify a custom IP (e.g. your Public IP if using Port Forwarding):</label>
            <div class="ip-input-group">
                <input type="text" id="customIp" value="${currentIp}" placeholder="192.168.x.x" />
                <button id="updateBtn" onclick="requestNewIp()">Update QR</button>
            </div>
        </div>

        <div class="manual-entry">
            <label>No camera? Use this manual connection code:</label>
            <div class="input-group">
                <input type="text" id="code" value="${base64Payload}" readonly />
                <button onclick="copyCode()">Copy</button>
            </div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();

        function requestNewIp() {
            const newIp = document.getElementById('customIp').value;
            vscode.postMessage({ command: 'requestNewIp', ip: newIp });
            
            const btn = document.getElementById('updateBtn');
            btn.innerText = 'Updating...';
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateQr') {
                const img = document.querySelector('img');
                img.style.opacity = '0.5';
                setTimeout(() => {
                    img.src = message.url;
                    img.style.opacity = '1';
                }, 100);
                
                const btn = document.getElementById('updateBtn');
                btn.innerText = 'Updated!';
                setTimeout(() => btn.innerText = 'Update QR', 2000);
            }
        });

        function copyCode() {
            const input = document.getElementById('code');
            input.select();
            document.execCommand('copy');
            const btn = document.querySelector('.manual-entry button');
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = 'Copy', 2000);
        }
    </script>
</body>
</html>`;
}
