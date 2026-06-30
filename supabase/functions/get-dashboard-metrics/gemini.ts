import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

export class GeminiService {
    private client: Anthropic;
    private modelName: string;

    constructor() {
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
        this.client = new Anthropic({ apiKey });
        this.modelName = 'claude-sonnet-4-5';
    }

    async generateSummary(prompt: string): Promise<string> {
        try {
            const message = await this.client.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            });
            const block = message.content[0];
            return block.type === 'text' ? block.text : '';
        } catch (error: any) {
            console.error('Error generating summary with Anthropic:', error);
            throw new Error(`Anthropic API Error: ${error.message || error}`);
        }
    }

    async chat(history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> {
        try {
            const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = history.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.parts.map((p: any) => p.text).join('\n'),
            }));
            anthropicMessages.push({ role: 'user', content: message });

            const response = await this.client.messages.create({
                model: this.modelName,
                max_tokens: 4096,
                messages: anthropicMessages,
            });

            const block = response.content[0];
            return block.type === 'text' ? block.text : '';
        } catch (error: any) {
            console.error('Error in Anthropic chat:', error);
            return `Desculpe, erro ao consultar: ${error.message || error}`;
        }
    }
}

export const geminiService = new GeminiService();
