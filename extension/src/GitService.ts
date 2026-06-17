import { simpleGit, SimpleGit } from 'simple-git';
import * as path from 'path';

export class GitService {
    private git: SimpleGit;

    constructor(workspaceRoot: string) {
        this.git = simpleGit(workspaceRoot);
    }

    async getStatus() {
        return await this.git.status();
    }

    async getBranches() {
        return await this.git.branchLocal();
    }

    async getLog() {
        return await this.git.log({ maxCount: 50 });
    }

    async stageFile(file: string) {
        return await this.git.add(file);
    }

    async unstageFile(file: string) {
        return await this.git.reset(['--', file]);
    }

    async commit(message: string) {
        return await this.git.commit(message);
    }

    async push() {
        return await this.git.push();
    }

    async pull() {
        return await this.git.pull();
    }

    async getDiff() {
        return await this.git.diff(['--staged']);
    }
}
