import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExtensionMetadata {
    id: string; // The repo identifier (e.g., 'obra/superpowers')
    name: string;
    author: string;
    repo: string;
    description: string;
    avatarUrl?: string;
    tags: string[];
    stars: number;
    status: 'enabled' | 'disabled';
}

export class ExtensionService {
    private extensionsDir: string;
    private metadataPath: string;

    constructor(private workspaceRoot: string) {
        this.extensionsDir = path.join(this.workspaceRoot, 'extensions');
        this.metadataPath = path.join(this.extensionsDir, 'metadata.json');
        
        if (!fs.existsSync(this.extensionsDir)) {
            fs.mkdirSync(this.extensionsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.metadataPath)) {
            fs.writeFileSync(this.metadataPath, JSON.stringify([]));
        }
    }

    private async readMetadata(): Promise<ExtensionMetadata[]> {
        try {
            const data = await fs.promises.readFile(this.metadataPath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    private async saveMetadata(metadata: ExtensionMetadata[]) {
        await fs.promises.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    }

    public async getInstalledExtensions(): Promise<ExtensionMetadata[]> {
        return await this.readMetadata();
    }

    public async installExtension(extension: Omit<ExtensionMetadata, 'status' | 'id'>): Promise<void> {
        const id = extension.repo;
        
        // Repo format is usually "author/repoName"
        const parts = extension.repo.split('/');
        const author = parts[0] || 'unknown';
        const repoName = parts.length > 1 ? parts[1] : extension.repo;
        
        const targetDir = path.join(this.extensionsDir, author, repoName);

        if (!fs.existsSync(path.dirname(targetDir))) {
            fs.mkdirSync(path.dirname(targetDir), { recursive: true });
        }

        // Git clone
        try {
            if (fs.existsSync(targetDir)) {
                await execAsync(`cd "${targetDir}" && git pull`);
            } else {
                await execAsync(`git clone https://github.com/${extension.repo}.git "${targetDir}"`);
            }
        } catch (error: any) {
            throw new Error(`Failed to clone extension: ${error.message}`);
        }

        // Update metadata
        let meta = await this.readMetadata();
        const existingIdx = meta.findIndex(m => m.id === id);
        
        const newEntry: ExtensionMetadata = {
            ...extension,
            id,
            status: 'enabled'
        };

        if (existingIdx >= 0) {
            meta[existingIdx] = newEntry;
        } else {
            meta.push(newEntry);
        }
        
        await this.saveMetadata(meta);
    }

    public async uninstallExtension(id: string): Promise<void> {
        const meta = await this.readMetadata();
        const ext = meta.find(m => m.id === id);
        if (ext) {
            const parts = ext.repo.split('/');
            const author = parts[0] || 'unknown';
            const repoName = parts.length > 1 ? parts[1] : ext.repo;
            const targetDir = path.join(this.extensionsDir, author, repoName);
            
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
            const updated = meta.filter(m => m.id !== id);
            await this.saveMetadata(updated);
        }
    }

    public async toggleExtension(id: string): Promise<ExtensionMetadata | null> {
        const meta = await this.readMetadata();
        const ext = meta.find(m => m.id === id);
        if (ext) {
            ext.status = ext.status === 'enabled' ? 'disabled' : 'enabled';
            await this.saveMetadata(meta);
            return ext;
        }
        return null;
    }
}
