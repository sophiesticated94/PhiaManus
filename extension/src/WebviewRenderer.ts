import * as vscode from 'vscode';
import * as qrcode from 'qrcode';

export async function showConnectionWebview(context: vscode.ExtensionContext, payload: string) {
    const panel = vscode.window.createWebviewPanel(
        'phiamanusConnection',
        'PhiaManus Connection',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    try {
        const qrCodeDataUrl = await qrcode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 4,
            width: 300
        });

        panel.webview.html = getWebviewContent(qrCodeDataUrl, payload);
    } catch (err) {
        vscode.window.showErrorMessage('Failed to generate QR Code');
    }
}

function getWebviewContent(qrCodeDataUrl: string, payload: string): string {
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
        }
        img {
            border-radius: 8px;
            margin-bottom: 1rem;
            background: white;
            padding: 10px;
        }
        .instructions {
            margin-top: 1rem;
            font-size: 1.1rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Scan to Connect</h2>
        <img src="${qrCodeDataUrl}" alt="QR Code" />
        <div class="instructions">Use the PhiaManus iOS App to scan this QR code.</div>
    </div>
</body>
</html>`;
}
