import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor() {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
        // As per user rules, using gemini-2.5-flash-lite.
        this.modelName = 'gemini-2.5-flash-lite';
    }

    async generateSummary(prompt: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Error generating summary with Gemini:', error);
            throw new Error(`Gemini API Error: ${error.message || error}`);
        }
    }

    async chat(history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Error in Gemini chat:', error);
            const errMsg = error.message || '';
            if (errMsg.includes('429') && errMsg.includes('Quota exceeded')) {
                const timeMatch = errMsg.match(/retry in ([\d\.]+)s/);
                const seconds = timeMatch ? Math.ceil(parseFloat(timeMatch[1])) : 30;
                return `Atingimos nosso limite diário gratuito da inteligência artificial por conta de muitos testes recentes.||Por favor, guarde alguns segundinhos e aguarde ${seconds}s antes de fazer uma nova pergunta.`;
            }

            return `Desculpe, erro ao consultar: ${errMsg}`;
        }
    }
}

export const geminiService = new GeminiService();
