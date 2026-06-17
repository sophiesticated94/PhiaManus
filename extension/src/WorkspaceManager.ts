import * as vscode from 'vscode';
import * as path from 'path';

export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: FileNode[];
    isLarge?: boolean;
}

export interface WorkspaceManagerOptions {
    largeDirectoryItemCount?: number;
}

export class WorkspaceManager {
    private workspaceRoot: string | undefined;
    private options: WorkspaceManagerOptions;

    constructor(options: WorkspaceManagerOptions = {}) {
        this.options = {
            largeDirectoryItemCount: 1000,
            ...options
        };
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    public getRoot(): string | undefined {
        return this.workspaceRoot;
    }

    public async getWorkspaceTree(): Promise<FileNode | null> {
        if (!this.workspaceRoot) return null;
        const rootUri = vscode.Uri.file(this.workspaceRoot);
        return await this.walkDirectory(rootUri, this.workspaceRoot);
    }

    public async getDirectoryChildren(relativeDirPath: string): Promise<FileNode[]> {
        if (!this.workspaceRoot) throw new Error('No active workspace');

        const normalizedRequested = path.normalize(relativeDirPath);
        const absolutePath = path.resolve(this.workspaceRoot, normalizedRequested);

        if (!absolutePath.startsWith(this.workspaceRoot)) {
            throw new Error('Security Error: Path traversal attempt detected.');
        }

        const dirUri = vscode.Uri.file(absolutePath);
        const entries = await vscode.workspace.fs.readDirectory(dirUri);
        return await this.fetchChildren(dirUri, entries, this.workspaceRoot, false);
    }

    private async walkDirectory(dirUri: vscode.Uri, rootPath: string): Promise<FileNode> {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);
        
        let children: FileNode[] = [];
        let isLarge = false;

        if (this.options.largeDirectoryItemCount && entries.length > this.options.largeDirectoryItemCount) {
            isLarge = true;
        } else {
            children = await this.fetchChildren(dirUri, entries, rootPath, true);
        }

        return {
            name: path.basename(dirUri.fsPath) || 'root',
            type: 'directory',
            path: path.relative(rootPath, dirUri.fsPath).replace(/\\/g, '/') || '/',
            children,
            isLarge
        };
    }

    private async fetchChildren(dirUri: vscode.Uri, entries: [string, vscode.FileType][], rootPath: string, recurse: boolean): Promise<FileNode[]> {
        const children: FileNode[] = [];

        for (const [name, type] of entries) {
            if (name === 'node_modules' || name === '.git') continue;

            const childUri = vscode.Uri.joinPath(dirUri, name);
            const relativePath = path.relative(rootPath, childUri.fsPath).replace(/\\/g, '/');

            if (type === vscode.FileType.Directory) {
                if (recurse) {
                    const childNode = await this.walkDirectory(childUri, rootPath);
                    childNode.name = name;
                    childNode.path = relativePath;
                    children.push(childNode);
                } else {
                    // For a shallow fetch, we just return the node with no children (which signifies an unexpanded dir)
                    children.push({
                        name,
                        type: 'directory',
                        path: relativePath,
                        children: undefined
                    });
                }
            } else if (type === vscode.FileType.File) {
                children.push({ name, type: 'file', path: relativePath });
            }
        }

        // Sort directories first
        return children.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });
    }

    public async readFileContents(requestedRelativePath: string): Promise<string> {
        if (!this.workspaceRoot) throw new Error('No active workspace');

        const normalizedRequested = path.normalize(requestedRelativePath);
        const absolutePath = path.resolve(this.workspaceRoot, normalizedRequested);

        if (!absolutePath.startsWith(this.workspaceRoot)) {
            throw new Error('Security Error: Path traversal attempt detected.');
        }

        const fileUri = vscode.Uri.file(absolutePath);
        const data = await vscode.workspace.fs.readFile(fileUri);
        return Buffer.from(data).toString('utf8');
    }
}
