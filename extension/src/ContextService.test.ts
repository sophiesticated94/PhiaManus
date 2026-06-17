import * as fs from 'fs';
import * as path from 'path';
import { ContextService } from './ContextService';

describe('ContextService', () => {
    let contextService: ContextService;
    const testWorkspaceRoot = path.join(__dirname, '__test_workspace__');
    const contextDir = path.join(testWorkspaceRoot, '.phiamanus', 'context');

    beforeAll(() => {
        if (!fs.existsSync(testWorkspaceRoot)) {
            fs.mkdirSync(testWorkspaceRoot);
        }
        contextService = new ContextService(testWorkspaceRoot);
    });

    afterAll(() => {
        if (fs.existsSync(testWorkspaceRoot)) {
            fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        // Clean up context dir between tests
        if (fs.existsSync(contextDir)) {
            fs.readdirSync(contextDir).forEach(file => {
                fs.unlinkSync(path.join(contextDir, file));
            });
        }
    });

    it('should save a context snippet and read it back', async () => {
        await contextService.saveContext('prompt1', 'Test Title', 'Test Body');
        const list = await contextService.listContext();
        expect(list.length).toBe(1);
        expect(list[0]).toEqual({
            promptId: 'prompt1',
            title: 'Test Title'
        });
    });

    it('should list all contexts from disk', async () => {
        await contextService.saveContext('p1', 'T1', 'B1');
        await contextService.saveContext('p2', 'T2', 'B2');
        const list = await contextService.listContext();
        expect(list.length).toBe(2);
        const titles = list.map(l => l.title);
        expect(titles).toContain('T1');
        expect(titles).toContain('T2');
    });

    it('should remove a context snippet', async () => {
        await contextService.saveContext('p1', 'T1', 'B1');
        await contextService.saveContext('p2', 'T2', 'B2');
        await contextService.removeContext('p1');
        const list = await contextService.listContext();
        expect(list.length).toBe(1);
        expect(list[0].promptId).toBe('p2');
    });

    it('should concatenate context bodies', async () => {
        await contextService.saveContext('p1', 'T1', 'Body 1');
        await contextService.saveContext('p2', 'T2', 'Body 2');
        const allContext = await contextService.readAllBodies();
        const joined = allContext.join('\n---\n');
        expect(joined).toContain('Body 1');
        expect(joined).toContain('Body 2');
        expect(joined).toContain('---');
    });
});
