import Anthropic from '@anthropic-ai/sdk';

/**
 * Service to interact with the Anthropic Claude model.
 */
export class GeminiService {
    private client: Anthropic;
    private modelName: string;

    constructor() {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
        this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
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
            // Converte formato Gemini (parts) para formato Anthropic (content string)
            const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = history.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.parts.map(p => p.text).join('\n'),
            }));

            // Adiciona a mensagem atual do usuario
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
            const errMsg = error.message || '';
            if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
                return `Atingimos o limite de requisicoes por minuto da IA.||Por favor, aguarde alguns segundos antes de fazer uma nova pergunta.`;
            }
            return `Desculpe, erro ao consultar: ${errMsg}`;
        }
    }
}

export const geminiService = new GeminiService();
