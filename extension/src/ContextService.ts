import * as fs from 'fs';
import * as path from 'path';

export interface ContextItem {
    promptId: string;
    title: string;
}

export class ContextService {
    private contextDir: string;
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.contextDir = path.join(workspaceRoot, '.phiamanus', 'context');
    }

    async ensureDir(): Promise<void> {
        if (!fs.existsSync(this.contextDir)) {
            fs.mkdirSync(this.contextDir, { recursive: true });
        }
        await this.ensureGitignore();
    }

    async ensureGitignore(): Promise<void> {
        const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
        const entry = '.phiamanus/';
        try {
            if (fs.existsSync(gitignorePath)) {
                const content = fs.readFileSync(gitignorePath, 'utf8');
                if (!content.includes(entry)) {
                    fs.appendFileSync(gitignorePath, `\n# PhiaManus local context\n${entry}\n`);
                }
            } else {
                fs.writeFileSync(gitignorePath, `# PhiaManus local context\n${entry}\n`);
            }
        } catch {
            // Non-fatal: gitignore update is best-effort
        }
    }

    private filePath(promptId: string): string {
        // Sanitize promptId to be a safe filename
        const safe = promptId.replace(/[^a-zA-Z0-9\-_]/g, '-');
        return path.join(this.contextDir, `${safe}.md`);
    }

    private parseTitleFromFile(content: string): string {
        const match = content.match(/<!-- PhiaManus Context: (.+?) -->/);
        return match ? match[1] : 'Unknown';
    }

    private parseIdFromFilename(filename: string): string {
        return filename.replace(/\.md$/, '');
    }

    async saveContext(promptId: string, title: string, body: string): Promise<void> {
        await this.ensureDir();
        const content = `<!-- PhiaManus Context: ${title} -->\n${body}`;
        fs.writeFileSync(this.filePath(promptId), content, 'utf8');
    }

    async removeContext(promptId: string): Promise<void> {
        const fp = this.filePath(promptId);
        if (fs.existsSync(fp)) {
            fs.unlinkSync(fp);
        }
    }

    async listContext(): Promise<ContextItem[]> {
        if (!fs.existsSync(this.contextDir)) {
            return [];
        }
        const files = fs.readdirSync(this.contextDir).filter(f => f.endsWith('.md'));
        return files.map(filename => {
            const content = fs.readFileSync(path.join(this.contextDir, filename), 'utf8');
            return {
                promptId: this.parseIdFromFilename(filename),
                title: this.parseTitleFromFile(content),
            };
        });
    }

    async readAllBodies(): Promise<string[]> {
        if (!fs.existsSync(this.contextDir)) {
            return [];
        }
        const files = fs.readdirSync(this.contextDir).filter(f => f.endsWith('.md'));
        return files.map(filename =>
            fs.readFileSync(path.join(this.contextDir, filename), 'utf8')
        );
    }
}
