import * as vscode from 'vscode';

class Logger {
    private channel: vscode.OutputChannel | null = null;

    initialize() {
        if (!this.channel) {
            this.channel = vscode.window.createOutputChannel('PhiaManus');
        }
    }

    log(message: string, ...args: any[]) {
        if (!this.channel) return;
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length ? ' ' + JSON.stringify(args) : '';
        this.channel.appendLine(`[${timestamp}] INFO: ${message}${formattedArgs}`);
        console.log(message, ...args);
    }

    error(message: string, ...args: any[]) {
        if (!this.channel) return;
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length ? ' ' + JSON.stringify(args) : '';
        this.channel.appendLine(`[${timestamp}] ERROR: ${message}${formattedArgs}`);
        console.error(message, ...args);
    }

    show() {
        this.channel?.show();
    }
}

export const logChannel = new Logger();
