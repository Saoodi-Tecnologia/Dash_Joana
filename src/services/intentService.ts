import { geminiService } from './geminiService';

// ============================================================
// intentService — classifica a intenção do usuário com
// uma chamada leve ao Gemini (sem dados, só texto da pergunta)
// ============================================================

export type QueryIntent =
    | 'QUERY_OBJECOES'
    | 'QUERY_PLANOS_VIDAS'
    | 'QUERY_FUNIL_ABANDONO'
    | 'QUERY_HORARIO_PICO'
    | 'QUERY_PERGUNTAS_FREQUENTES'
    | 'QUERY_CLIENTES_CONVERTIDOS'
    | 'QUERY_CONVERSAS_RECENTES'
    | 'GENERAL_KPI'
    | 'UNKNOWN';

const INTENT_PROMPT = `
Você é um classificador de intenções para um assistente de dashboard de vendas de plano de saúde.
Sua ÚNICA função é retornar um dos códigos abaixo em resposta à pergunta do usuário.
Não explique nada. Retorne APENAS o código, sem aspas, sem pontuação.

Códigos disponíveis e quando usar cada um:
- QUERY_OBJECOES → usuário quer saber por que pessoas desistiram, objeções, motivos de abandono, coparticipação, reclamações, tabela cara, rejeições
- QUERY_PLANOS_VIDAS → usuário quer saber sobre planos contratados, vidas, quantidade de beneficiários, plano familiar, empresarial
- QUERY_FUNIL_ABANDONO → usuário quer saber onde no funil as pessoas saíram, etapas de abandono, conversão por etapa
- QUERY_HORARIO_PICO → usuário quer saber horários de mais mensagens, pico de atendimento, quando mais conversam
- QUERY_PERGUNTAS_FREQUENTES → usuário quer saber quais dúvidas são mais comuns, perguntas repetidas, temas recorrentes
- QUERY_CLIENTES_CONVERTIDOS → usuário quer ver quem fechou, compradores, conversões, vendas concluídas
- QUERY_CONVERSAS_RECENTES → usuário quer ver as últimas conversas, conversas recentes, histórico recente
- GENERAL_KPI → usuário pergunta sobre métricas gerais do dashboard (taxa, total, ticket, média)
- UNKNOWN → nenhum dos acima se aplica

Pergunta do usuário:
`;

export async function detectIntent(userMessage: string): Promise<QueryIntent> {
    try {
        const result = await geminiService.generateSummary(`${INTENT_PROMPT} "${userMessage}"`);
        const intent = result.trim().toUpperCase() as QueryIntent;

        const validIntents: QueryIntent[] = [
            'QUERY_OBJECOES',
            'QUERY_PLANOS_VIDAS',
            'QUERY_FUNIL_ABANDONO',
            'QUERY_HORARIO_PICO',
            'QUERY_PERGUNTAS_FREQUENTES',
            'QUERY_CLIENTES_CONVERTIDOS',
            'QUERY_CONVERSAS_RECENTES',
            'GENERAL_KPI',
        ];

        return validIntents.includes(intent) ? intent : 'UNKNOWN';
    } catch {
        return 'UNKNOWN';
    }
}
