import { WorkspaceManager, FileNode } from './WorkspaceManager';

// Mock vscode API
jest.mock('vscode', () => ({
    workspace: {
        workspaceFolders: [{ uri: { fsPath: require('path').resolve('/mock/workspace') } }],
        fs: {
            readDirectory: jest.fn(),
            readFile: jest.fn()
        }
    },
    Uri: {
        file: (p: string) => ({ fsPath: p }),
        joinPath: (base: any, child: string) => ({ fsPath: `${base.fsPath}/${child}` })
    },
    FileType: {
        File: 1,
        Directory: 2
    }
}), { virtual: true });

import * as vscode from 'vscode';

describe('WorkspaceManager', () => {
    let manager: WorkspaceManager;

    beforeEach(() => {
        jest.clearAllMocks();
        manager = new WorkspaceManager();
    });

    test('getWorkspaceTree ignores node_modules and .git', async () => {
        (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValueOnce([
            ['src', 2],
            ['node_modules', 2],
            ['.git', 2],
            ['package.json', 1]
        ]).mockResolvedValueOnce([
            ['index.ts', 1]
        ]);

        const tree = await manager.getWorkspaceTree();
        expect(tree).not.toBeNull();
        expect(tree?.children?.length).toBe(2);
        
        const childNames = tree?.children?.map(c => c.name);
        expect(childNames).not.toContain('node_modules');
        expect(childNames).not.toContain('.git');
        expect(childNames).toContain('src');
        expect(childNames).toContain('package.json');
    });

    test('getWorkspaceTree handles large directories by lazy loading', async () => {
        const largeDirEntries = Array.from({ length: 1001 }).map((_, i) => [`file${i}.txt`, 1]);
        (vscode.workspace.fs.readDirectory as jest.Mock).mockResolvedValueOnce([
            ['large_folder', 2]
        ]).mockResolvedValueOnce(largeDirEntries);

        const tree = await manager.getWorkspaceTree();
        const largeFolder = tree?.children?.[0];
        
        expect(largeFolder?.name).toBe('large_folder');
        expect(largeFolder?.isLarge).toBe(true);
        expect(largeFolder?.children).toEqual([]);
    });

    test('readFileContents prevents path traversal', async () => {
        await expect(manager.readFileContents('../../outside.txt')).rejects.toThrow('Security Error: Path traversal attempt detected.');
    });

    test('readFileContents reads safe paths', async () => {
        (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('hello world'));
        
        const content = await manager.readFileContents('src/index.ts');
        expect(content).toBe('hello world');
        expect(vscode.workspace.fs.readFile).toHaveBeenCalledWith(expect.objectContaining({ fsPath: expect.stringContaining(require('path').normalize('src/index.ts')) }));
    });
});
