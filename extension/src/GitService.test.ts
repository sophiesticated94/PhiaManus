import { GitService } from './GitService';
import { simpleGit } from 'simple-git';

jest.mock('simple-git');

describe('GitService', () => {
    let gitService: GitService;
    let mockGitInstance: any;

    beforeEach(() => {
        mockGitInstance = {
            status: jest.fn().mockResolvedValue({ current: 'main' }),
            branchLocal: jest.fn().mockResolvedValue({ all: ['main'] }),
            log: jest.fn().mockResolvedValue({ latest: { hash: '123' } }),
            add: jest.fn().mockResolvedValue(true),
            reset: jest.fn().mockResolvedValue(true),
            commit: jest.fn().mockResolvedValue({ commit: '123' }),
            push: jest.fn().mockResolvedValue(true),
            pull: jest.fn().mockResolvedValue(true),
            diff: jest.fn().mockResolvedValue('diff'),
        };

        (simpleGit as jest.Mock).mockReturnValue(mockGitInstance);
        gitService = new GitService('/mock/workspace');
    });

    it('getStatus calls simple-git status', async () => {
        const result = await gitService.getStatus();
        expect(mockGitInstance.status).toHaveBeenCalled();
        expect(result).toEqual({ current: 'main' });
    });

    it('getBranches calls simple-git branchLocal', async () => {
        await gitService.getBranches();
        expect(mockGitInstance.branchLocal).toHaveBeenCalled();
    });

    it('stageFile calls simple-git add', async () => {
        await gitService.stageFile('test.ts');
        expect(mockGitInstance.add).toHaveBeenCalledWith('test.ts');
    });

    it('commit calls simple-git commit', async () => {
        await gitService.commit('test message');
        expect(mockGitInstance.commit).toHaveBeenCalledWith('test message');
    });
});
