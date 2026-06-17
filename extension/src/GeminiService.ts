import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    private async getApiKey(): Promise<string> {
        let key = await this.secretStorage.get('gemini_api_key');
        if (!key) {
            key = await vscode.window.showInputBox({
                prompt: 'Enter your Gemini API Key',
                password: true,
                ignoreFocusOut: true,
            });

            if (!key) {
                throw new Error('Gemini API Key is required to execute prompts.');
            }

            await this.secretStorage.store('gemini_api_key', key);
        }
        return key;
    }

    public async generateStream(prompt: string, contextString: string, onChunk: (text: string) => void): Promise<string> {
        const apiKey = await this.getApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const fullPrompt = `You are PhiaManus, an expert AI pair programmer.
The user has requested the following change: "${prompt}"

Here is the current content of the file:
\`\`\`
${contextString}
\`\`\`

IMPORTANT: You MUST return ONLY the completely rewritten file. Do not use markdown blocks like \`\`\`typescript unless you are formatting the whole file. Do not add any conversational text. Return exactly what the file should look like after your changes.`;

        const result = await model.generateContentStream(fullPrompt);
        let fullResponse = '';

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            onChunk(chunkText);
        }

        // Clean up any markdown blocks if the LLM adds them despite instructions
        return fullResponse.replace(/^```[\w]*\n/, '').replace(/\n```$/, '').trim();
    }
}
