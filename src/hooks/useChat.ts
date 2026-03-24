import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, DashboardMetrics } from '@/types/dashboard';
import { geminiService } from '@/services/geminiService';
import { detectIntent } from '@/services/intentService';
import { executeQuery, searchConversasByKeywords } from '@/services/queryBuilder';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// useChat — orquestra pipeline RAG:
//   1. Detecta intenção (chamada leve ao Gemini)
//   2. Executa query cirúrgica no Supabase (se necessário)
//   3. Envia apenas o resultado relevante ao Gemini para análise
// ============================================================

// Removida mensagem inicial hardcoded para evitar problemas no histórico do Gemini
// e garantir que a primeira interação seja puramente baseada na pergunta do usuário.
const INITIAL_MESSAGE_TEXT = 'Olá! Sou a Joana, sua assistente de análise. Posso analisar dados das conversas em tempo real. O que deseja saber sobre sua operação?';

const BASE_SYSTEM_CONTEXT = (dashboardData: DashboardMetrics | null, insightsHistorico: string) => `
Você é a Joana, Consultora Estratégica em Vendas de Planos de Saúde.
Seu tom é cordial, direto, analítico e de negócio. Proibido usar emojis.

REGRAS CRÍTICAS DE COMUNICAÇÃO:
1. RESPONDA DIRETAMENTE À PERGUNTA DO USUÁRIO. Não faça análise genérica se a pergunta for específica.
2. NUNCA liste números de volta com pontos. O usuário JÁ ESTÁ VENDO OS GRÁFICOS na tela dele.
3. Seu papel é LER os dados invisíveis a olho nu e traduzir em INSIGHTS DE NEGÓCIO reais.
4. É ESTRITAMENTE PROIBIDO USAR MARKDOWN. Não use *asteriscos* para negrito nem caracteres especiais para formatar texto e títulos. Escreva de forma absolutamente limpa e como humano num chat.
5. Para parecer mais natural, separe seus blocos de raciocínio. Sempre que for mudar o raciocínio ou pauta, digite EXATAMENTE o símbolo "||" para darmos quebra de balão na fala. Ex: "Notei isso aqui. || Isso significa X. || Recomendo fazer Y."
6. Identifique o gargalo principal e termine sempre com UMA recomendação tática da operação.

DADOS DO DASHBOARD ATUAL (métricas processadas do período selecionado):
${dashboardData ? JSON.stringify(dashboardData, null, 2) : 'Nenhum dado carregado ainda.'}

${insightsHistorico ? `HISTÓRICO DE INSIGHTS GERADOS (todos os períodos disponíveis):
${insightsHistorico}` : ''}
`;


export function useChat(dashboardData: DashboardMetrics | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    const pendingMessagesRef = useRef<string[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Carrega insights historicos do Supabase para enriquecer o contexto da IA
    const loadInsightsHistorico = async (): Promise<string> => {
        try {
            const { data } = await supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .select('metrics_data')
                .eq('id', 2)
                .single();
            if (!data?.metrics_data) return '';
            const history = (data.metrics_data as any).history || [];
            return history.map((h: any) => {
                const linhas = [
                    `Periodo: ${h.periodoStr || ''}`,
                    h.negocio?.diagnostico ? `Diagnostico: ${h.negocio.diagnostico}` : '',
                    h.negocio?.gargalo ? `Gargalo: ${h.negocio.gargalo}` : '',
                    h.negocio?.recomendacao ? `Recomendacao: ${h.negocio.recomendacao}` : '',
                    h.marketing?.gancho1 ? `Gancho marketing: ${h.marketing.gancho1}` : '',
                    h.marketing?.copyFeed ? `Copy feed: ${h.marketing.copyFeed}` : '',
                ];
                return linhas.filter(Boolean).join('\n');
            }).join('\n\n---\n\n');
        } catch {
            return '';
        }
    };

    const sendMessage = async () => {
        const text = inputValue.trim();
        if (!text) return;

        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        
        pendingMessagesRef.current.push(text);
        
        if (timerRef.current) clearTimeout(timerRef.current);
        
        // Aguarda 8s antes de chamar a IA, possibilitando multiplas mensagens do user
        timerRef.current = setTimeout(() => {
            processPendingMessages();
        }, 8000);
    };

    const processPendingMessages = async () => {
        const combinedText = pendingMessagesRef.current.join('. ');
        const currentMessagesCount = pendingMessagesRef.current.length;
        pendingMessagesRef.current = [];

        if (!combinedText) return;

        setIsLoading(true);

        try {
            // Pega as mensagens anteriores (ignorando o lote de mensagens atual do user que já está na UI)
            const pastMessages = messagesRef.current.slice(0, messagesRef.current.length - currentMessagesCount);
            
            const history: { role: string; parts: { text: string }[] }[] = [];
            let lastRole = '';
            
            // Agrupa as mensagens para enviar formato estrito \`user -> model -> user -> model\` ao Gemini
            for (const m of pastMessages) {
                const role = m.role === 'user' ? 'user' : 'model';
                if (role === lastRole) {
                    history[history.length - 1].parts[0].text += `\\n${m.content}`;
                } else {
                    history.push({ role, parts: [{ text: m.content }] });
                    lastRole = role;
                }
            }

            // Garante que o histórico não termina em 'user' para não quebrar a API sendMessage
            if (history.length > 0 && history[history.length - 1].role === 'user') {
                 history.pop();
            }

            // ── PASSO 1: Carrega contexto historico de insights ──
            const insightsHistorico = await loadInsightsHistorico();
            const systemCtx = BASE_SYSTEM_CONTEXT(dashboardData, insightsHistorico);

            // ── PASSO 2: Detectar intencao ──
            const intent = await detectIntent(combinedText);

            let finalPrompt = '';

            if (intent === 'QUERY_EXEMPLO') {
                // ── Busca exemplos reais de conversas por palavras-chave da pergunta ──
                const exemplos = await searchConversasByKeywords(combinedText);
                finalPrompt = `
                    ${systemCtx}

                    O usuario pediu: "${combinedText}"

                    Abaixo estao mensagens REAIS extraidas das conversas do WhatsApp que sao relevantes para o que ele pediu.
                    Use esses exemplos para responder de forma precisa e concreta.
                    Cite o conteudo das mensagens de forma natural, sem expor dados pessoais (nome, telefone, CPF).

                    MENSAGENS ENCONTRADAS (${exemplos.length} registros):
                    ${JSON.stringify(exemplos.slice(0, 20), null, 2)}
                `;
            } else if (intent === 'UNKNOWN' || intent === 'GENERAL_KPI') {
                // ── Pergunta geral/livre → responde diretamente com base no contexto completo ──
                finalPrompt = `
                    ${systemCtx}

                    O usuario perguntou: "${combinedText}"

                    INSTRUCAO: Responda DIRETAMENTE a essa pergunta especifica usando os dados do dashboard e os insights historicos fornecidos no contexto acima.
                    Nao faça analise generica do dashboard se a pergunta for especifica. Se perguntou sobre marketing, responda sobre marketing. Se perguntou sobre um periodo, use os dados daquele periodo.
                `;
            } else {
                // ── PASSO 2b: Pergunta analitica → busca dados cirurgicos no Supabase ──
                const queryResult = await executeQuery(intent);

                if (!queryResult || queryResult.rows.length === 0) {
                    finalPrompt = `
                        ${BASE_SYSTEM_CONTEXT(dashboardData)}
                        
                        O usuario perguntou: "${combinedText}"
                        A consulta ao banco retornou dados insuficientes para esta analise.
                        Explique que os dados podem estar em processamento ou nao ha registros suficientes ainda.
                        Sugira o que o usuario poderia analisar com os KPIs disponiveis no dashboard.
                    `;
                } else {
                    // ── PASSO 3: Envia apenas o recorte relevante ao Gemini ──
                    const dataJson = JSON.stringify(queryResult.rows, null, 2);

                    finalPrompt = `
                        ${BASE_SYSTEM_CONTEXT(dashboardData)}
                        
                        O usuario perguntou: "${combinedText}"
                        
                        Para responder, consultei o banco de dados e obtive o seguinte resultado:
                        Descricao do dado: ${queryResult.description}
                        
                        Dados brutos (${queryResult.rows.length} registros):
                        ${dataJson.slice(0, 12000)}
                        
                        Missão: Use os dados abaixo APENAS como base mental para responder à pergunta. 
                        
                        - É PROIBIDO cuspir os números em formato de lista (bullet points).
                        - Traduza a informação: "Houve um pico no dia 9 pois..." em vez de relatar "Dia 09/03 teve 23 conversas".
                        - Aponte a dor do cliente ou o gargalo financeiro de forma inteligente.
                        - Feche com um conselho estratégico de vendas.
                    `;
                }
            }

            // ── PASSO 4: Gera resposta final ──
            const response = await geminiService.chat(history, finalPrompt);

            // Limpa caracteres indevidos caso a IA teime, quebra no caractere demarcado || (e double enters just in case)
            const cleanedResponse = response.replace(/\*/g, ''); 
            const baloes = cleanedResponse.split(/\|\|/).map(b => b.trim()).filter(b => b.length > 0);

            setIsLoading(false); // remove the parsing loader

            for (let i = 0; i < baloes.length; i++) {
                // Ativa o indicador visual de que a IA está "digitando" este balão
                setIsAiTyping(true);
                
                // Tempo de leitura/digitação dinâmico: min 1.5s, max 4s, baseado no tamanho do texto
                const typingTime = Math.min(Math.max((baloes[i].length / 100) * 1200, 1500), 4000);
                await new Promise(resolve => setTimeout(resolve, typingTime));
                
                setIsAiTyping(false);

                // Coloca o balão na tela
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: baloes[i] } as ChatMessage
                ]);

                // Pausa rápida depois que uma mensagem enviada antes de "digitar" a próxima
                if (i < baloes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
            }
        } catch (error) {
            console.error('Erro no chat RAG:', error);
            setIsLoading(false);
            setIsAiTyping(false);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Tive um problema ao consultar os dados. Pode repetir a pergunta?' },
            ]);
        }
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isLoading,
        isAiTyping,
        isOpen,
        setIsOpen,
        sendMessage,
        chatEndRef,
    };
}
