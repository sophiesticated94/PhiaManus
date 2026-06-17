import { GeminiService } from './GeminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');
jest.mock('vscode', () => ({
    window: { showInputBox: jest.fn() },
}), { virtual: true });

describe('GeminiService', () => {
    let geminiService: GeminiService;
    let mockContext: any;
    let mockGenAI: any;
    let mockModel: any;

    beforeEach(() => {
        mockContext = {
            secrets: {
                get: jest.fn().mockResolvedValue('test-api-key'),
                store: jest.fn().mockResolvedValue(true)
            }
        };

        mockModel = {
            generateContent: jest.fn(),
            generateContentStream: jest.fn()
        };

        mockGenAI = {
            getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        };

        (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI);

        geminiService = new GeminiService(mockContext);
    });

    it('generateCommitMessage returns parsed JSON when LLM returns pure JSON', async () => {
        const mockJsonResponse = { title: 'Fix bug', description: 'Fixed a major bug' };
        mockModel.generateContent.mockResolvedValue({
            response: { text: () => JSON.stringify(mockJsonResponse) }
        });

        const result = await geminiService.generateCommitMessage('mock diff');
        expect(result).toEqual(mockJsonResponse);
    });

    it('generateCommitMessage falls back to default when JSON is completely invalid', async () => {
        mockModel.generateContent.mockResolvedValue({
            response: { text: () => "I am an AI, here is the commit message but I forgot JSON format" }
        });

        const result = await geminiService.generateCommitMessage('mock diff');
        expect(result.title).toEqual('Update code');
        expect(result.description).toContain('I am an AI');
    });
});
