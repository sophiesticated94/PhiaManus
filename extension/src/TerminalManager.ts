import * as vscode from 'vscode';
import * as cp from 'child_process';
import { randomUUID } from 'crypto';

export interface PhiaTerminal {
    id: string;
    name: string;
    process: cp.ChildProcess;
    outputBuffer: string[];
}

export class TerminalManager {
    private terminals: Map<string, PhiaTerminal> = new Map();
    private onDataCallback: (id: string, data: string) => void;

    constructor(onData: (id: string, data: string) => void) {
        this.onDataCallback = onData;
    }

    spawnTerminal(cwd?: string): PhiaTerminal {
        const id = randomUUID();
        const name = `PhiaTerminal-${id.substring(0, 4)}`;
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

        const child = cp.spawn(shell, [], { cwd, env: process.env, shell: true });
        
        const terminal: PhiaTerminal = {
            id,
            name,
            process: child,
            outputBuffer: []
        };

        const handleData = (data: Buffer) => {
            const str = data.toString();
            terminal.outputBuffer.push(str);
            // keep buffer bounded
            if (terminal.outputBuffer.length > 500) {
                terminal.outputBuffer.shift();
            }
            this.onDataCallback(id, str);
        };

        child.stdout?.on('data', handleData);
        child.stderr?.on('data', handleData);

        child.on('close', () => {
            this.terminals.delete(id);
            this.onDataCallback(id, '\r\n[Process exited]\r\n');
        });

        this.terminals.set(id, terminal);
        return terminal;
    }

    getTerminals() {
        return Array.from(this.terminals.values()).map(t => ({ id: t.id, name: t.name }));
    }

    getTerminalOutput(id: string) {
        const t = this.terminals.get(id);
        return t ? t.outputBuffer.join('') : '';
    }

    writeToTerminal(id: string, data: string) {
        const t = this.terminals.get(id);
        if (t && t.process.stdin) {
            t.process.stdin.write(data);
        }
    }

    dispose() {
        for (const t of this.terminals.values()) {
            t.process.kill();
        }
        this.terminals.clear();
    }
}
