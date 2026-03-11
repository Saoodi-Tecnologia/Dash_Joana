
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- TYPES ---
// ============================================================
// Dashboard Joana — Tipos centralizados
// ============================================================

interface KPI {
    totalConversas: number;
    taxaConversao: number;
    ticketMedio: number;
    tempoMedio: number;
}

interface PerformanceTrends {
    taxaAbandono: number | null;
    tempoFechamento: number | null;
    abandonoConversas: number | null;
}

interface KPITrends {
    totalConversas: number | null;
    taxaConversao: number | null;
    ticketMedio: number | null;
    tempoMedio: number | null;
}

interface FunnelStage {
    semana: string;
    cotacao: number;
    interesse: number;
    fechamento: number;
}

interface VolumeEntry {
    semana: string;
    conversas: number;
}

interface ConversaoAbandono {
    semana: string;
    conversoes: number;
    abandono: number;
}

interface AbandonoEtapa {
    etapa: string;
    abandonos: number;
    fill: string;
    [key: string]: any;
}

interface PerformanceKpis {
    taxaAbandono: number;
    tempoFechamento: number;
    abandonoConversas: number;
}

interface Performance {
    kpis: PerformanceKpis;
    conversaoAbandono: ConversaoAbandono[];
    abandonoEtapa: AbandonoEtapa[];
}

interface ProdutoKpis {
    ticketEmpresarial: number;
    mediaVidasEmp: number;
    ticketFamiliar: number;
    mediaVidasFam: number;
}

interface PlanoSemana {
    semana: string;
    empresarial: number;
    familiar: number;
}

interface FaixaEtaria {
    faixa: string;
    quantidade: number;
}

interface DependenteDistribuicao {
    dependentes: string;
    mesPassado: number;
    mesAtual: number;
    label: string;
}

interface ProdutosData {
    kpis: ProdutoKpis;
    planosCotacoes: PlanoSemana[];
    faixasEtarias: FaixaEtaria[];
    dependentes: DependenteDistribuicao[];
    comparativoLabels: { label1: string; label2: string };
}

interface EngajamentoKpis {
    mensagensConversa: number;
    taxaRetorno: number;
    clientesRetorno: number;
    sessoesLongasPct: number;
    sessoesLongasCount: number;
    duracaoMedia: number;
}

interface EngajamentoData {
    kpis: EngajamentoKpis;
    horarioPico: { horario: string, mensagens: number }[];
    volumeHorario: { horario: string, mensagens: number, fill: string }[];
}

interface QualidadeKpis {
    taxaCompreensao: number;
    msgsRepetidasPct: number;
    msgsRepetidasCount: number;
}

interface PerguntaFrequente {
    pergunta: string;
    frequencia: number;
    exemplos: string[];
}

interface QualidadeData {
    kpis: QualidadeKpis;
    score: number;
    perguntasFrequentes: PerguntaFrequente[];
}

interface ResumosIA {
    principalInsight?: string;
    padroesIdentificados?: string;
    recomendacoesEstrategicas?: string;
    [key: string]: string | undefined;
}

interface PeriodoAnalise {
    inicio: string;
    fim: string;
    totalDias: number;
}

interface DashboardMetrics {
    kpis: KPI;
    kpiTrends?: KPITrends;
    performanceTrends?: PerformanceTrends;
    volumeData: VolumeEntry[];
    funnelStages: FunnelStage[];
    periodoAnalise?: PeriodoAnalise;
    granularidadeLabel?: string;
    performance: Performance;
    produtosData: ProdutosData;
    engajamentoData: EngajamentoData;
    qualidadeData: QualidadeData;
    resumosIA: ResumosIA;
}

type TabId = 'geral' | 'insights' | 'performance' | 'engajamento' | 'produtos' | 'qualidade';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Periodo selecionado pelo usuario
interface SelectedPeriod {
    preset: '7d' | '30d' | '90d' | 'month' | 'custom';
    startDate: Date;
    endDate: Date;
}


// --- GEMINI SERVICE ---


/**
 * Service to interact with the Gemini AI model.
 */
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
                // Tenta extrair o tempo do erro (retry in X.Xs)
                const timeMatch = errMsg.match(/retry in ([\d\.]+)s/);
                const seconds = timeMatch ? Math.ceil(parseFloat(timeMatch[1])) : 30;
                return `Atingimos nosso limite diário gratuito da inteligência artificial por conta de muitos testes recentes.||Por favor, guarde alguns segundinhos e aguarde ${seconds}s antes de fazer uma nova pergunta.`;
            }

            return `Desculpe, erro ao consultar: ${errMsg}`;
        }
    }
}

const geminiService = new GeminiService();


// --- SUPABASE CLIENT INSTANCE FOR THIS REQUEST ---
let supabase: any;

// --- ANALYTICS ENGINE ---




// ============================================================
// Agrupamento adaptativo conforme o numero de dias do periodo
// ============================================================
type GranularidadeGrupo = 'dia' | 'semana' | 'mes';

function getGranularidade(totalDias: number): GranularidadeGrupo {
    if (totalDias <= 14) return 'dia';
    if (totalDias <= 60) return 'semana';
    return 'mes';
}

function getDayKey(date: Date, granularidade: GranularidadeGrupo): string {
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();

    if (granularidade === 'dia') {
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    }
    if (granularidade === 'semana') {
        // Semana do mes (1-5)
        const semNr = Math.ceil(dia / 7);
        const mesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mes - 1];
        return `S${semNr} ${mesAbrev}`;
    }
    // mes
    const mesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mes - 1];
    return `${mesAbrev}/${String(ano).slice(2)}`;
}

function sortDayKeys(a: string, b: string, granularidade: GranularidadeGrupo): number {
    if (granularidade === 'dia') {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        return (ma * 100 + da) - (mb * 100 + db);
    }
    if (granularidade === 'semana') {
        // "S1 Mar" → ordem por mes depois semana
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const parseWeek = (s: string) => {
            const [sw, sm] = s.split(' ');
            return meses.indexOf(sm) * 10 + parseInt(sw.replace('S', ''));
        };
        return parseWeek(a) - parseWeek(b);
    }
    // mes: "Mar/25"
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const parseMes = (s: string) => {
        const [sm, sy] = s.split('/');
        return parseInt(sy) * 12 + meses.indexOf(sm);
    };
    return parseMes(a) - parseMes(b);
}

// ============================================================
// Calculo de trend: retorna variacao percentual (positiva ou negativa)
// null se nao ha dados suficientes no periodo anterior
// ============================================================
function calcTrend(atual: number, anterior: number): number | null {
    if (anterior === 0) return null;
    return Number((((atual - anterior) / anterior) * 100).toFixed(1));
}

// ============================================================
// Analytics Engine
// ============================================================
class AnalyticsEngine {
    // Busca todas as mensagens brutas do banco (sem filtro de periodo)
    // O filtro sera aplicado em memoria para que a comparacao com o periodo anterior funcione
    private rawMessages: any[] | null = null;
    private rawMessagesFetchedAt: number | null = null;

    private async getRawMessages(): Promise<any[]> {
        // Cache de 10 minutos para as mensagens brutas
        const now = Date.now();
        if (this.rawMessages && this.rawMessagesFetchedAt && (now - this.rawMessagesFetchedAt) < 10 * 60 * 1000) {
            return this.rawMessages;
        }

        const { data: messages, error } = await supabase
            .schema('dashboard')
            .from('dash_mensagens_realtime')
            .select('session_id, conversation_id, contact_phone, content, message_type, is_ia, sender_type, received_at, chatwoot_created_at, atendimento_tipo, conversation_status')
            .eq('event_type', 'message_created')
            .not('received_at', 'is', null)
            .order('received_at', { ascending: true });

        if (error || !messages) {
            throw new Error('Falha ao buscar dados do historico.');
        }

        this.rawMessages = messages;
        this.rawMessagesFetchedAt = now;
        return messages;
    }

    // ============================================================
    // Geração automatica de insights semanais via IA
    // Armazena resultado no localStorage com timestamp
    // Roda automaticamente toda segunda-feira
    // ============================================================
    private static readonly INSIGHTS_CACHE_KEY = 'joana_weekly_insights';
    private static readonly INSIGHTS_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

    private getMostRecentMonday(): number {
        const d = new Date();
        const day = d.getDay();
        // getDay: 0 = Domingo, 1 = Segunda, 2 = Terça...
        // Se domingo (0), volta 6 dias. Se os outros dias, volta (day - 1) dias.
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    async generateWeeklyInsights(forceRefetch: boolean = false): Promise<Record<string, string>> {
        try {
            if (!forceRefetch) {
                // Verifica cache no banco de dados
                const { data: cacheData } = await supabase
                    .schema('dashboard')
                    .from('dash_metrics_cache')
                    .select('updated_at, metrics_data')
                    .eq('id', 2)
                    .single();

                if (cacheData && Object.keys(cacheData.metrics_data || {}).length > 0) {
                    const parsed = cacheData.metrics_data;
                    const isFromThisWeek = parsed.timestamp >= this.getMostRecentMonday();

                    const hasContent = parsed.insights?.principalInsight &&
                        parsed.insights?.padroesIdentificados &&
                        parsed.insights?.recomendacoesEstrategicas;

                    if (isFromThisWeek && hasContent) {
                        console.log('Insights semanais: usando cache do banco');
                        return { ...parsed.insights, periodoStr: parsed.periodoStr };
                    }
                }
            }

            console.log('Insights semanais: gerando novo insight via Gemini...');

            // Busca todas as mensagens e encontra a data mais recente disponivel no banco
            const allMessages = await this.getRawMessages();

            if (allMessages.length === 0) {
                console.warn('Insights semanais: banco sem mensagens.');
                return {};
            }

            // Usa a data mais recente dos dados como referencia, nao o horario real
            // Isso garante que funciona mesmo quando os dados sao historicos
            const maxTs = allMessages.reduce((max, row) => {
                const ts = new Date(row.received_at || row.chatwoot_created_at).getTime();
                return ts > max ? ts : max;
            }, 0);

            const endDate = new Date(maxTs);
            endDate.setHours(23, 59, 59, 999);
            const startDate = new Date(endDate.getTime() - AnalyticsEngine.INSIGHTS_INTERVAL_MS);
            startDate.setHours(0, 0, 0, 0);

            const weekMessages = allMessages.filter(row => {
                const ts = new Date(row.received_at || row.chatwoot_created_at);
                return ts >= startDate && ts <= endDate;
            });

            if (weekMessages.length === 0) {
                console.warn('Insights semanais: sem mensagens no periodo calculado.');
                return {};
            }

            // Processa os dados dos 7 dias (sem AI recursiva)
            const weekMetrics = await this.processMessages(weekMessages, startDate, endDate, true);

            // Agrupa mensagens reais por sessao para montar transcricoes de exemplo
            const sessionTranscripts: Record<string, { lines: string[], isAbandono: boolean }> = {};
            weekMessages.forEach(msg => {
                const sid = msg.session_id;
                if (!sessionTranscripts[sid]) {
                    sessionTranscripts[sid] = { 
                        lines: [], 
                        isAbandono: msg.conversation_status === 'resolved' || msg.atendimento_tipo === 'venda_confirmada' ? false : true 
                    };
                }
                const quem = msg.is_ia ? 'Joana' : 'Cliente';
                const texto = msg.content || '';
                if (texto.length > 0) {
                    sessionTranscripts[sid].lines.push(`[${quem}]: ${texto}`);
                }
            });

            // Pega ate 3 sessoes com abandono que tem pelo menos 4 mensagens
            const amostrasTexto = Object.values(sessionTranscripts)
                .filter(s => s.lines.length >= 4)
                .sort((a, b) => (b.isAbandono ? 1 : 0) - (a.isAbandono ? 1 : 0)) // Prioriza abandonos
                .slice(0, 4)
                .map((s, i) => `--- DIÁLOGO (${s.isAbandono ? 'Abandonado' : 'Sucesso'}) ---\n${s.lines.join('\n')}`)
                .join('\n\n');
            // Monta o prompt com dados reais dos 7 dias
            const topFaqs = weekMetrics.qualidadeData.perguntasFrequentes
                .sort((a, b) => b.frequencia - a.frequencia)
                .slice(0, 4)
                .map(f => `${f.pergunta}: ${f.frequencia} conversas`)
                .join('; ');

            const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            const periodoStr = `${fmtDate(startDate)} a ${fmtDate(endDate)}`;

            const prompt = `Você é um consultor sênior de vendas analisando o desempenho da IA de atendimento "Joana" no WhatsApp de um plano de saúde.

ADVERTÊNCIA CRÍTICA: Baseie seus insights ESTRITAMENTE nas conversas transcritas abaixo e nos dados. O usuário já vê os gráficos, você precisa extrair a dor REAL do cliente observando os diálogos. Evite banalidades como "o cliente quer rapidez". Diga EXATAMENTE o que a Joana disse que espantou o cliente ou o que o cliente perguntou que não foi bem resolvido.

Período: ${periodoStr} | Abandono total: ${weekMetrics.performance.kpis.abandonoConversas} (${weekMetrics.performance.kpis.taxaAbandono}%)
Dúvidas frequentes: ${topFaqs}

EXEMPLOS DE CONVERSAS REAIS DESTA SEMANA (Analise-as com lupa):
${amostrasTexto}

Gere exatamente este JSON com 3 chaves:

"principalInsight": Um insight específico baseado nas conversas transcritas. Por que os clientes pararam de interagir? Cite a fala ou situação exata. É TERMINANTEMENTE PROIBIDO usar as palavras "Sessão", "Exemplo", "Diálogo", "Caso" ou "Conversa X". Aja como um humano apontando o erro da vendedora. Máximo 40 palavras.

"padroesIdentificados": O que os clientes perguntam ou pedem estruturalmente nas conversas acima que gera atrito? Cite o exemplo exato da dúvida do cliente. Jamais referencie o texto original explicitamente. Máximo 45 palavras.

"recomendacoesEstrategicas": Mudança específica no script da Joana para sanar o erro visto na transcrição. Formato: "Quando o cliente disser [X], a Joana deve [Y]". Máximo 45 palavras.

Retorne APENAS o JSON válido.`;

            const summariesText = await geminiService.generateSummary(prompt);
            const jsonMatch = summariesText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) return {};

            const insights = JSON.parse(jsonMatch[0]);

            // Salva no banco de dados para que todos os acessos no dashboard em qualquer lugar
            // peguem esse mesmo dado ate a proxima segunda
            const nowStr = new Date().toISOString();
            const cachePayload = {
                timestamp: Date.now(),
                insights: insights,
                periodoStr: periodoStr
            };

            await supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .upsert({ id: 2, updated_at: nowStr, metrics_data: cachePayload as any });

            console.log('Insights semanais: gerados e cacheados no banco para o periodo', periodoStr);
            return { ...insights, periodoStr };
        } catch (e) {
            console.error('Insights semanais: erro na geração:', e);
            return {};
        }
    }

    async fetchAndAnalyze(
        forceRefetch: boolean = false,
        startDate?: Date,
        endDate?: Date
    ): Promise<DashboardMetrics & { _lastUpdated?: string }> {
        // Se nao ha filtro de periodo, tentar cache
        const hasPeriodFilter = !!(startDate && endDate);

        if (!forceRefetch && !hasPeriodFilter) {
            const { data: cacheData } = await supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .select('updated_at, metrics_data')
                .eq('id', 1)
                .single();

            if (cacheData && Object.keys(cacheData.metrics_data || {}).length > 0) {
                const updated = new Date(cacheData.updated_at).getTime();
                const diffHours = (Date.now() - updated) / (1000 * 60 * 60);
                if (diffHours < 24) {
                    console.log('Using cached metrics from', cacheData.updated_at);
                    return { ...cacheData.metrics_data as any, _lastUpdated: cacheData.updated_at };
                }
            }
        }

        if (forceRefetch) {
            this.rawMessages = null;
            this.rawMessagesFetchedAt = null;
        }

        console.log('Calculating fresh metrics...');
        const allMessages = await this.getRawMessages();

        // Determina o periodo atual
        let periodStart: Date;
        let periodEnd: Date;

        if (hasPeriodFilter) {
            periodStart = startDate!;
            periodEnd = endDate!;
        } else {
            // Periodo padrao: todos os dados disponíveis
            periodStart = new Date(0);
            periodEnd = new Date();
        }

        // Filtra mensagens do periodo atual
        const currentMessages = allMessages.filter(row => {
            const ts = new Date(row.received_at || row.chatwoot_created_at);
            return ts >= periodStart && ts <= periodEnd;
        });

        // Calcula o periodo anterior de mesmo tamanho para trends
        const periodLengthMs = periodEnd.getTime() - periodStart.getTime();
        const prevPeriodEnd = new Date(periodStart.getTime() - 1);
        const prevPeriodStart = new Date(periodStart.getTime() - periodLengthMs);

        const prevMessages = allMessages.filter(row => {
            const ts = new Date(row.received_at || row.chatwoot_created_at);
            return ts >= prevPeriodStart && ts <= prevPeriodEnd;
        });

        // Calcula metricas do periodo atual
        const currentMetrics = await this.processMessages(currentMessages, hasPeriodFilter ? periodStart : undefined, hasPeriodFilter ? periodEnd : undefined);

        // Calcula metricas basicas do periodo anterior (sem IA para nao gastar)
        const prevMetrics = await this.processMessages(prevMessages, prevPeriodStart, prevPeriodEnd, true);

        // Calcula trends dos KPIs principais
        const hasPrev = prevMessages.length > 0;
        const kpiTrends: KPITrends = {
            totalConversas: hasPrev ? calcTrend(currentMetrics.kpis.totalConversas, prevMetrics.kpis.totalConversas) : null,
            taxaConversao: hasPrev ? calcTrend(currentMetrics.kpis.taxaConversao, prevMetrics.kpis.taxaConversao) : null,
            ticketMedio: hasPrev ? calcTrend(currentMetrics.kpis.ticketMedio, prevMetrics.kpis.ticketMedio) : null,
            tempoMedio: hasPrev ? calcTrend(currentMetrics.kpis.tempoMedio, prevMetrics.kpis.tempoMedio) : null,
        };

        // Calcula trends dos KPIs de performance
        const performanceTrends: PerformanceTrends = {
            taxaAbandono: hasPrev ? calcTrend(currentMetrics.performance.kpis.taxaAbandono, prevMetrics.performance.kpis.taxaAbandono) : null,
            tempoFechamento: hasPrev ? calcTrend(currentMetrics.performance.kpis.tempoFechamento, prevMetrics.performance.kpis.tempoFechamento) : null,
            abandonoConversas: hasPrev ? calcTrend(currentMetrics.performance.kpis.abandonoConversas, prevMetrics.performance.kpis.abandonoConversas) : null,
        };

        // Determina label legivel da granularidade usada
        const totalDiasAtual = currentMetrics.periodoAnalise?.totalDias ?? 1;
        const granularidadeAtual = getGranularidade(totalDiasAtual);
        const granularidadeLabel = granularidadeAtual === 'dia' ? 'dia'
            : granularidadeAtual === 'semana' ? 'semana'
            : 'mês';

        const result = { ...currentMetrics, kpiTrends, performanceTrends, granularidadeLabel };

        // Salva no cache apenas quando nao ha filtro de periodo
        if (!hasPeriodFilter) {
            const nowStr = new Date().toISOString();
            await supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .upsert({ id: 1, updated_at: nowStr, metrics_data: result as any });
            return { ...result, _lastUpdated: nowStr };
        }

        return { ...result, _lastUpdated: new Date().toISOString() };
    }

    private async processMessages(
        rows: any[],
        periodStart?: Date,
        periodEnd?: Date,
        skipAI: boolean = false
    ): Promise<DashboardMetrics> {
        const sessions: Record<string, any> = {};
        const returnUsers = new Set<string>();
        // Mapa de telefone -> conjunto de session_ids
        const phoneToConversations: Record<string, Set<string>> = {};

        rows.forEach(row => {
            const sessionId = row.session_id;
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    sessionId,
                    messages: [],
                    timestamps: [],
                    humanMessages: [],
                    aiMessages: [],
                    content: '',
                    contactPhone: row.contact_phone || null,
                };
            }
            const content = (row.content as string) || '';
            const isHuman = row.message_type === 'incoming';
            const ts = new Date((row.received_at || row.chatwoot_created_at) as string);

            sessions[sessionId].messages.push({ type: isHuman ? 'human' : 'ai', content });
            sessions[sessionId].timestamps.push(ts);
            sessions[sessionId].content += ' ' + content;

            if (isHuman) sessions[sessionId].humanMessages.push(content);
            else sessions[sessionId].aiMessages.push(content);
        });

        const activeSessions = Object.values(sessions).filter(s => s.humanMessages.length > 0);

        // -------------------------------------------------------
        // AGRUPA POR TELEFONE: contact_phone como identidade unica do cliente.
        // Todas as sessoes do mesmo numero sao consolidadas em um unico
        // registro antes de calcular ticket, plano, faixas, dependentes e
        // retorno. Fallback para session_id quando o telefone nao existe.
        // -------------------------------------------------------
        const clienteMap: Record<string, {
            clienteKey: string;
            contactPhone: string | null;
            sessionIds: string[];
            messages: { type: string; content: string }[];
            timestamps: Date[];
            humanMessages: string[];
            aiMessages: string[];
            content: string;
        }> = {};

        activeSessions.forEach(session => {
            const clienteKey = session.contactPhone || `anon_${session.sessionId}`;
            if (!clienteMap[clienteKey]) {
                clienteMap[clienteKey] = {
                    clienteKey,
                    contactPhone: session.contactPhone,
                    sessionIds: [],
                    messages: [],
                    timestamps: [],
                    humanMessages: [],
                    aiMessages: [],
                    content: '',
                };
            }
            const c = clienteMap[clienteKey];
            c.sessionIds.push(session.sessionId);
            c.messages.push(...session.messages);
            c.timestamps.push(...session.timestamps);
            c.humanMessages.push(...session.humanMessages);
            c.aiMessages.push(...session.aiMessages);
            c.content += ' ' + session.content;
        });

        const clientes = Object.values(clienteMap);

        // Retorno: cliente que voltou em mais de 1 dia ou tem mais de 1 sessao
        clientes.forEach(cliente => {
            const phone = cliente.contactPhone;
            const uniqueDays = new Set(cliente.timestamps.map((t: Date) => t.toDateString()));
            if (uniqueDays.size > 1 || cliente.sessionIds.length > 1) {
                returnUsers.add(phone ?? cliente.clienteKey);
            }
            if (phone) {
                if (!phoneToConversations[phone]) phoneToConversations[phone] = new Set<string>();
                cliente.sessionIds.forEach(sid => phoneToConversations[phone].add(sid));
            }
        });

        const totalClientesUnicos = clientes.length;


        let totalConversas = clientes.length;
        let counts = { cotacao: 0, interesse: 0, fechamento: 0 };
        let totalTicketsEmp: number[] = [];
        let totalTicketsFam: number[] = [];
        let duracoes: number[] = [];
        let duracoesFechamento: number[] = [];
        let abandonos = 0;
        let mensagensRetidas = 0;
        let abandonoPorEtapa = { cotacao: 0, interesse: 0 };
        let sessoesComIntervencaoHumana = 0;
        let sessoesLongas = 0;
        let abandonoInteresseComCopart = 0;
        let abandonoInteresseComInternacao = 0;

        // Determina granularidade com base no periodo
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        if (periodStart && periodEnd) {
            minDate = periodStart;
            maxDate = periodEnd;
        } else {
            clientes.forEach(cliente => {
                const date = cliente.timestamps[0] as Date;
                if (!minDate || date < minDate) minDate = date;
                if (!maxDate || date > maxDate) maxDate = date;
            });
        }

        const totalDias = (minDate && maxDate)
            ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
            : 1;

        const granularidade = getGranularidade(totalDias);

        const volumeByDay: Record<string, number> = {};
        const perfByDay: Record<string, { con: number, ab: number }> = {};
        const funnelByDay: Record<string, { cotacao: number, interesse: number, fechamento: number }> = {};
        const planosByDay: Record<string, { empresarial: number, familiar: number }> = {};

        let faixas: Record<string, number> = {};
        let dependentes: Record<string, { mesPassado: number, mesAtual: number }> = {
            "0": { mesPassado: 0, mesAtual: 0 },
            "1": { mesPassado: 0, mesAtual: 0 },
            "2": { mesPassado: 0, mesAtual: 0 },
            "3": { mesPassado: 0, mesAtual: 0 },
            "4": { mesPassado: 0, mesAtual: 0 },
            "5+": { mesPassado: 0, mesAtual: 0 },
        };

        const volumeByHour: Record<string, number> = {};
        for (let i = 0; i < 24; i++) volumeByHour[`${i}h`] = 0;

        let totalMensagensH = 0;
        let totalVidasEmp = 0;
        let countEmp = 0;
        let totalVidasFam = 0;
        let countFam = 0;

        const perfFreq = { "Valores e cotação": 0, "Rede credenciada": 0, "Carência": 0, "Inclusão de dependentes": 0, "Internação e cobertura": 0, "Coparticipação": 0 };

        const nowDate = new Date();

        clientes.forEach(session => {
            const text = session.content.toLowerCase();
            const date = session.timestamps[0] as Date;
            // Split para comparacao dependentes: relativo ao periodo analisado
            // Com filtro: metade do periodo = divisor | Sem filtro: inicio do mes atual
            let splitDate: Date;
            if (periodStart && periodEnd) {
                splitDate = new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
            } else {
                splitDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
            }
            const isSegundaParte = date >= splitDate;

            // Rastreamento real da data min/max (quando nao ha filtro externo)
            if (!periodStart) {
                if (!minDate || date < minDate) minDate = date;
                if (!maxDate || date > maxDate) maxDate = date;
            }

            totalMensagensH += session.messages.length;

            // Retorno ja calculado no agrupamento por telefone (nao duplicar aqui)

            session.timestamps.forEach((t: Date) => {
                const hourStr = `${t.getHours()}h`;
                if (volumeByHour[hourStr] !== undefined) volumeByHour[hourStr]++;
            });

            // Frustracao detectada nas mensagens do CLIENTE (incoming) — conta 1 por sessao no max
            const humanTextFrust = session.humanMessages.join(' ');
            const regexFrustracao = /(não entendi|não é isso|mas eu falei|atendente|humano|errado|você não entendeu|não ajuda|repetir)/i;
            if (regexFrustracao.test(humanTextFrust)) mensagensRetidas += 1;

            const dayKey = getDayKey(date, granularidade);
            volumeByDay[dayKey] = (volumeByDay[dayKey] || 0) + 1;
            if (!funnelByDay[dayKey]) funnelByDay[dayKey] = { cotacao: 0, interesse: 0, fechamento: 0 };
            if (!planosByDay[dayKey]) planosByDay[dayKey] = { empresarial: 0, familiar: 0 };

            // Conta sessoes unicas por topico (text = conteudo completo da sessao)
            // Usa humanMessages para refletir intencao do cliente, nao volume de mensagens da IA
            const humanConcat = session.humanMessages.join(' ').toLowerCase();
            if (/(valor|custo|preço|mensalidade)/.test(humanConcat)) perfFreq["Valores e cotação"]++;
            if (/(hospital|rede|credenciad|médico)/.test(humanConcat)) perfFreq["Rede credenciada"]++;
            if (/(carência|prazo)/.test(humanConcat)) perfFreq["Carência"]++;
            if (/(dependentes?|filhos?|espos[oa]|família)/.test(humanConcat)) perfFreq["Inclusão de dependentes"]++;
            if (/(internação|cirurgia|cobertura)/.test(humanConcat)) perfFreq["Internação e cobertura"]++;
            if (/(co.?participação|coparticipação|comparticipação)/.test(humanConcat)) perfFreq["Coparticipação"]++;

            let stage = 'Cotação';
            const humanText = session.humanMessages.join(' ').toLowerCase();
            const aiText = session.aiMessages.join(' ').toLowerCase();

            if (/(rede credenciada|carência|hospitais|clínicas|cobertura|mais informações|internação|cirurgia|emergência|co.?participação|coparticipação|comparticipação)/.test(humanText)) {
                stage = 'Interesse';
            }

            const intenClienteFechar = /(fechado|vou querer|quero contratar|vamos fechar|pode seguir|pode fazer|pagar agora)/.test(humanText);
            const repostaAfirmativaAposSugestaoIA = /(seguir com a contratação|continuar com a contratação|deseja contratar|se quiser contratar|vamos iniciar a contratação|posso gerar o link)/.test(aiText) && /\b(sim|isso mesmo|pode ser|quero|exato|bora|vamos|pode sim|com certeza|ok|manda)\b/.test(humanText);

            if (intenClienteFechar || repostaAfirmativaAposSugestaoIA) stage = 'Fechamento';

            if (stage === 'Cotação') counts.cotacao++;
            if (stage === 'Interesse') counts.interesse++;
            if (stage === 'Fechamento') counts.fechamento++;

            funnelByDay[dayKey].cotacao += (stage === 'Cotação' ? 1 : 0);
            funnelByDay[dayKey].interesse += (stage === 'Interesse' ? 1 : 0);
            funnelByDay[dayKey].fechamento += (stage === 'Fechamento' ? 1 : 0);

            const lastMsg = session.messages[session.messages.length - 1];
            const lastTs = session.timestamps[session.timestamps.length - 1] as Date;
            const horasDesdeUltimaMsg = (nowDate.getTime() - lastTs.getTime()) / (1000 * 60 * 60);
            const isAbandono = lastMsg.type === 'ai' && stage !== 'Fechamento' && horasDesdeUltimaMsg > 2;

            if (!perfByDay[dayKey]) perfByDay[dayKey] = { con: 0, ab: 0 };
            if (stage === 'Fechamento') perfByDay[dayKey].con++;
            else if (isAbandono) perfByDay[dayKey].ab++;

            // -------------------------------------------------------
            // CLASSIFICACAO DO PLANO — via aiMessages (mais certeiro)
            // Empresarial: precisa que a Joana tenha mencionado "plano empresarial"
            // E cotado (citou R$) na mesma sessao — mere mencao sem valor nao conta.
            // Excecao: cliente mencionou MEI/CNPJ e a IA cotou qualquer valor.
            // Sessoes sem classificacao explicita ficam como nao_classificado
            // e NAO inflam o pool de ticket.
            // -------------------------------------------------------
            const aiTextRaw = session.aiMessages.join(' ');
            const humanTextRaw = session.humanMessages.join(' ');

            const iaCitouValor = /R\$/.test(aiTextRaw);
            const iaDissePlanoEmp = /(plano empresarial)/i.test(aiTextRaw);
            const humanDisseCnpjMei = /\b(mei|cnpj)\b/i.test(humanTextRaw);

            // Empresarial confirmado = Joana falou "plano empresarial" + cotou OU cliente disse MEI/CNPJ + IA cotou
            const isEmp = (iaDissePlanoEmp && iaCitouValor) || (humanDisseCnpjMei && iaCitouValor);

            // Familiar se a IA confirmou, OU se o cliente mencionou contexto familiar no texto dele
            const isFamAI = /(plano familiar|plano individual|familiar\/individual|individual\/familiar)/i.test(aiTextRaw);
            const isFamHuman = /(familiar|família|familia|esposa|esposo|marido|mulher|filho[sa]?|filha|dependente[s]?|somos\s+\d|pra\s+mim\s+e|para\s+mim\s+e|pra\s+n[oó]s|para\s+n[oó]s|minha\s+esposa|meu\s+marido|meu\s+filho|minha\s+filha|minha\s+m[aã]e|meu\s+pai|irm[aã][o]?)/i.test(humanTextRaw);
            const isFam = !isEmp && (isFamAI || isFamHuman);

            // Detecta numero real de vidas cotadas pela Joana na sessao
            // Prioridade 1: "X pessoas" explicito no texto da IA
            // Prioridade 2: palavras ordinais/numericas (dois, tres, duas)
            // Prioridade 3: contagem de ocorrencias de "X anos" na cotacao (cada idade = 1 vida)
            let vidasDetectadas = 0;
            const pessoasMatch = aiTextRaw.match(/\b(\d+)\s*pessoas?\b/i);
            if (pessoasMatch) {
                vidasDetectadas = parseInt(pessoasMatch[1]);
            } else {
                const ordinaisMap: Record<string, number> = {
                    'dois': 2, 'duas': 2, 'tres': 3, 'tr\u00eas': 3, 'quatro': 4,
                    'cinco': 5, 'seis': 6, 'para os dois': 2, 'para as duas': 2,
                    'para os tr\u00eas': 3, 'para as tr\u00eas': 3, 'para os 2': 2, 'para os 3': 3, 'para os 4': 4
                };
                for (const [palavra, qtd] of Object.entries(ordinaisMap)) {
                    if (new RegExp('\\b' + palavra + '\\b', 'i').test(aiTextRaw)) {
                        vidasDetectadas = qtd;
                        break;
                    }
                }
                if (vidasDetectadas === 0) {
                    // Conta ocorrencias de "para X anos" ou "de X anos" nas mensagens de cotacao
                    const idadesMatch = aiTextRaw.match(/(?:para\s+\d+\s+anos|de\s+\d+\s+anos|com\s+\d+\s+anos|\d+\s+anos)/gi);
                    const uniqueIdades = new Set(idadesMatch?.map(m => m.trim().toLowerCase()) || []);
                    vidasDetectadas = uniqueIdades.size > 0 ? uniqueIdades.size : 1;
                }
            }
            // Limita a valores razoaveis
            if (vidasDetectadas < 1) vidasDetectadas = 1;
            if (isEmp && vidasDetectadas < 2) vidasDetectadas = 2; // empresarial minimo 2
            if (vidasDetectadas > 20) vidasDetectadas = 20;

            if (isEmp) { planosByDay[dayKey].empresarial++; countEmp++; totalVidasEmp += vidasDetectadas; }
            if (isFam) { planosByDay[dayKey].familiar++; countFam++; totalVidasFam += vidasDetectadas; }
            // Sessoes nao classificadas contam no grafico como familiar (fallback visual)
            // mas NAO entram no calculo de ticket
            if (!isEmp && !isFam) { planosByDay[dayKey].familiar++; }

            // -------------------------------------------------------
            // TICKET — padroes reais da Joana mapeados nos dados:
            // "Total mensal: R$ 1.430,97"
            // "totalizando R$ 356,26 mensais"
            // "o total mensal pro plano (...) sai a R$ 306,06"
            // "valor total fica R$ 436,92"
            // "- Total: R$ 662,46"
            // Apenas sessoes com plano classificado (emp ou fam) entram no ticket
            // -------------------------------------------------------
            const podeCaptTicket = isEmp || isFam;
            let ticketCapturado = false;

            if (podeCaptTicket) {
                // Remove sentencas de simulacao de coparticipacao antes de buscar o ticket
                // Evita capturar "o valor total ficaria R$ 796" como mensalidade real
                const regexCopartCtx = /coparticipa[cç][aã]o|simula[cç][aã]o|estimad[ao]|estimativa|por sess[aã]o|por uso|por procedimento|al[eé]m da mensalidade/i;
                const aiTextParaTicket = aiTextRaw
                    .split(/(?<=[.!?])\s+/)
                    .filter((sent: string) => !regexCopartCtx.test(sent))
                    .join(' ');

                // Padroes primarios: expressoes que a Joana usa para o valor total
                const totalPatterns = [
                    /total\s*mensal[^R]{0,40}R\$\s*([0-9][0-9.,]+)/gi,
                    /total\s*mensal\s*(?:pro\s*plano\b)?[^R]{0,60}R\$\s*([0-9][0-9.,]+)/gi,
                    /totalizando\s*R\$\s*([0-9][0-9.,]+)/gi,
                    /(?:valor\s*total|total\s*(?:da|do)\s*(?:plano|mensalidade))\s*(?:fica|é)?\s*R\$\s*([0-9][0-9.,]+)/gi,
                    /(?:-\s*)?[Tt]otal\s*:\s*R\$\s*([0-9][0-9.,]+)/gi,
                    /sai\s*a\s*R\$\s*([0-9][0-9.,]+)/gi,
                    /é\s*R\$\s*([0-9][0-9.,]+)\s*(?:mensais|por\s*m[eê]s|ao\s*m[eê]s)/gi,
                    /fica\s*R\$\s*([0-9][0-9.,]+)\s*(?:mensais|por\s*m[eê]s|ao\s*m[eê]s)/gi,
                ];

                // Coleta todos os valores encontrados pelos padroes primarios
                const valoresEncontrados: number[] = [];
                for (const pattern of totalPatterns) {
                    const patternCopy = new RegExp(pattern.source, 'gi');
                    let mVal;
                    while ((mVal = patternCopy.exec(aiTextParaTicket)) !== null) {
                        const raw = mVal[1].replace(/\./g, '').replace(',', '.');
                        const val = parseFloat(raw);
                        // Plano individual: 50-2000 | Empresarial pode chegar a 50000
                        const maxValido = isEmp ? 50000 : 5000;
                        if (val >= 50 && val <= maxValido) {
                            valoresEncontrados.push(val);
                        }
                    }
                }

                if (valoresEncontrados.length > 0) {
                    // Pega o MAIOR valor encontrado (total da familia/empresa, nao parcela individual)
                    const ticketFinal = Math.max(...valoresEncontrados);
                    if (isEmp) totalTicketsEmp.push(ticketFinal);
                    else totalTicketsFam.push(ticketFinal);
                    ticketCapturado = true;
                }

                // Fallback: mensagens de cotacao com idade mencionada
                // Exclui mensagens que sejam simulacao de coparticipacao (nao refletem mensalidade real)
                if (!ticketCapturado) {
                    const regexCopartSimulacao = /coparticipa[cç][aã]o|simula[cç][aã]o|estimado|estimativa|por sess[aã]o|por uso|por procedimento/i;
                    const msgsComIdade = session.aiMessages.filter((m: string) =>
                        /R\$/.test(m) && /\d{1,3}\s*anos/i.test(m) && !regexCopartSimulacao.test(m)
                    );
                    const msgsComValor = session.aiMessages.filter((m: string) =>
                        /R\$/.test(m) && !regexCopartSimulacao.test(m)
                    );
                    const msgsParaAnalisar = msgsComIdade.length > 0 ? msgsComIdade : msgsComValor;

                    if (msgsParaAnalisar.length > 0) {
                        const textoCompleto = msgsParaAnalisar.join(' ');
                        const allMatches = [...textoCompleto.matchAll(/R\$\s*([0-9][0-9.,]+)/gi)];
                        const todosValores = allMatches
                            .map(m => parseFloat(m[1].replace(/\./g, '').replace(',', '.')))
                            .filter(v => v >= 80 && v <= (isEmp ? 50000 : 5000));

                        if (todosValores.length > 0) {
                            const ticketFinal = Math.max(...todosValores);
                            if (isEmp) totalTicketsEmp.push(ticketFinal);
                            else totalTicketsFam.push(ticketFinal);
                        }
                    }
                }
            }

            // -------------------------------------------------------
            // FAIXAS ETARIAS — 6 faixas simplificadas para melhor visualizacao
            // Ate 18 | 18-29 | 30-39 | 40-49 | 50-59 | 60+
            // Prioridade: aiMessages (a IA cita as idades ao fazer cotacao)
            // -------------------------------------------------------
            const ageSourceText = aiTextRaw + ' ' + humanTextRaw;
            const ageRegex = /(?:para\s+|de\s+|com\s+)?(\d{1,3})\s*anos/gi;
            let match;
            const sessionAges = new Set<string>();
            while ((match = ageRegex.exec(ageSourceText)) !== null) {
                const age = parseInt(match[1]);
                if (age < 1 || age > 100) continue;
                if (age <= 17)      sessionAges.add('Ate 18');
                else if (age <= 29) sessionAges.add('18-29');
                else if (age <= 39) sessionAges.add('30-39');
                else if (age <= 49) sessionAges.add('40-49');
                else if (age <= 59) sessionAges.add('50-59');
                else                sessionAges.add('60+');
            }
            // Sem fallback: se nao detectou idade, nao inventa faixa
            sessionAges.forEach(f => { faixas[f] = (faixas[f] || 0) + 1; });

            // -------------------------------------------------------
            // DEPENDENTES — usa aiMessages pois a IA confirma a contagem
            // Ex: "voce de 29 anos, um bebe de 1 mes e outro de 2 anos" = 2 dependentes
            // Conta quantas pessoas alem do titular a IA incluiu na cotacao
            // -------------------------------------------------------
            // Abordagem: conta ocorrencias de faixas etarias no aiText da cotacao
            // Cada "para X anos" ou "filho de X" = uma pessoa
            const pessoasCotadas = (aiTextRaw.match(/(?:para\s+\d+\s+anos|filho[a]?\s+de\s+\d+|beb[eê]\s+de\s+\d+|m[eê]s|criança)/gi) || []).length;
            // pessoasCotadas inclui o titular. dependentes = pessoasCotadas - 1
            let dCount = "0";
            if (pessoasCotadas >= 6) dCount = "5+";
            else if (pessoasCotadas === 5) dCount = "4";
            else if (pessoasCotadas === 4) dCount = "3";
            else if (pessoasCotadas === 3) dCount = "2";
            else if (pessoasCotadas === 2) dCount = "1";
            // Reforca com padroes diretos do texto humano/IA
            if (/\b5\+?\s*(filhos?|dependentes?)/i.test(text) || /[6-9]\s*(filhos?|dependentes?)/i.test(text)) dCount = "5+";
            else if (/\b4\s*(filhos?|dependentes?)/i.test(text)) dCount = "4";
            else if (/\b3\s*(filhos?|dependentes?)/i.test(text)) dCount = "3";
            else if (/\b2\s*(filhos?|dependentes?)/i.test(text)) dCount = "2";

            // Respeita o periodo selecionado: segunda metade do periodo = "recente"
            if (isSegundaParte) dependentes[dCount].mesAtual++;
            else dependentes[dCount].mesPassado++;

            const start = session.timestamps[0];
            const end = session.timestamps[session.timestamps.length - 1];
            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
            if (diff > 0 && diff < 120) {
                duracoes.push(diff);
                if (stage === 'Fechamento') duracoesFechamento.push(diff);
            }

            if (isAbandono) {
                abandonos++;
                if (stage === 'Cotação') abandonoPorEtapa.cotacao++;
                else if (stage === 'Interesse') {
                    abandonoPorEtapa.interesse++;
                    if (/(co.?participação|coparticipação)/.test(humanText)) abandonoInteresseComCopart++;
                    if (/(internação|cirurgia)/.test(humanText)) abandonoInteresseComInternacao++;
                }
            }

            // Intervencao humana: verifica em qualquer session_id do cliente
            const rowsCliente = rows.filter((r: any) =>
                session.sessionIds.includes(r.session_id) && r.message_type === 'outgoing' && r.is_ia === false
            );
            if (rowsCliente.length > 0) sessoesComIntervencaoHumana++;
            if (session.messages.length > 20) sessoesLongas++;
        });

        // KPIs
        const ticketEmp = totalTicketsEmp.length > 0 ? totalTicketsEmp.reduce((a, b) => a + b, 0) / totalTicketsEmp.length : 485;
        const ticketFam = totalTicketsFam.length > 0 ? totalTicketsFam.reduce((a, b) => a + b, 0) / totalTicketsFam.length : 314;
        const allTickets = [...totalTicketsEmp, ...totalTicketsFam];
        const ticketMedio = allTickets.length > 0 ? allTickets.reduce((a, b) => a + b, 0) / allTickets.length : 0;
        const tempoMedio = duracoes.length > 0 ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length : 0;
        const tempoMedioFechamento = duracoesFechamento.length > 0 ? duracoesFechamento.reduce((a, b) => a + b, 0) / duracoesFechamento.length : 0;
        const taxaConversao = totalConversas > 0 ? (counts.fechamento / totalConversas) * 100 : 0;
        const taxaAbandono = totalConversas > 0 ? (abandonos / totalConversas) * 100 : 0;

        const mensagensTotalReal = totalMensagensH > 0 ? totalMensagensH : 1;
        let taxaCompreensao = 100 - ((mensagensRetidas / mensagensTotalReal) * 100);
        taxaCompreensao = Math.max(0, Math.min(100, taxaCompreensao));

        let scoreGeral = 100 - (taxaAbandono * 0.4) + (taxaConversao * 1.5) - (mensagensRetidas * 1.2);
        scoreGeral = Math.max(0, Math.min(100, scoreGeral));

        const horarioPico = Object.entries(volumeByHour)
            .filter(([_, v]) => v > 0)
            .map(([horario, mensagens]) => ({ horario, mensagens }))
            .sort((a, b) => parseInt(a.horario) - parseInt(b.horario));

        const volumeHorario = [...horarioPico]
            .sort((a, b) => b.mensagens - a.mensagens)
            .slice(0, 4)
            .map((h, i) => ({ ...h, fill: ['#155DFC', '#3B82F6', '#60A5FA', '#93C5FD'][i] || '#60A5FA' }));

        const periodoInicio = minDate ? `${String(minDate.getDate()).padStart(2, '0')}/${String(minDate.getMonth() + 1).padStart(2, '0')}` : '--';
        const periodoFim = maxDate ? `${String(maxDate.getDate()).padStart(2, '0')}/${String(maxDate.getMonth() + 1).padStart(2, '0')}` : '--';

        // Labels dinamicas para o grafico de Dependentes
        const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        let comparativoLabel1: string;
        let comparativoLabel2: string;
        if (periodStart && periodEnd) {
            const mid = new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
            comparativoLabel1 = `${fmtDate(periodStart)} - ${fmtDate(new Date(mid.getTime() - 1))}`;
            comparativoLabel2 = `${fmtDate(mid)} - ${fmtDate(periodEnd)}`;
        } else {
            const primeiroDiaMes = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
            const mesAnterior = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
            const ultimoDiaMesAnterior = new Date(primeiroDiaMes.getTime() - 1);
            comparativoLabel1 = `${fmtDate(mesAnterior)} - ${fmtDate(ultimoDiaMesAnterior)}`;
            comparativoLabel2 = `${fmtDate(primeiroDiaMes)} - ${fmtDate(nowDate)}`;
        }

        // Coleta amostras reais de frases do cliente por topico (antes de montar result)
        const frasesReais: Record<string, string[]> = {
            "Valores e cotação": [],
            "Internação e cobertura": [],
            "Coparticipação": [],
            "Carência": [],
            "Rede credenciada": [],
            "Inclusão de dependentes": [],
        };
        const regexPorTopico: Record<string, RegExp> = {
            "Valores e cotação": /(valor|custo|pre[çc]o|mensalidade|quanto [Éé]|quanto fica|quanto custa|quanto sai)/i,
            "Internação e cobertura": /(interna[çc][ãa]o|cirurgia|cobertura|cobre|coberto)/i,
            "Coparticipação": /(co.?participa[çc][ãa]o|coparticipa|pago por|pago a parte|paga por|taxa por)/i,
            "Carência": /(car[êè]ncia|quando posso|quando come[çc]a|prazo)/i,
            "Rede credenciada": /(hospital|cl[íì]nica|m[éè]dico|rede|credenciad|atende|cobert[ao] em)/i,
            "Inclusão de dependentes": /(dependente|filho|esposa|esposo|marido|mulher|familiar|adicionar|incluir|família)/i,
        };
        clientes.forEach(cliente => {
            cliente.humanMessages.forEach((msg: string) => {
                const msgClean = msg.trim();
                if (msgClean.length < 5 || msgClean.length > 200) return;
                for (const [topico, regex] of Object.entries(regexPorTopico)) {
                    if (regex.test(msgClean) && frasesReais[topico].length < 3) {
                        const frase = msgClean.charAt(0).toLowerCase() + msgClean.slice(1).replace(/[.!?]+$/, '');
                        if (!frasesReais[topico].includes(frase)) frasesReais[topico].push(frase);
                    }
                }
            });
        });
        const faqFallbacks: Record<string, string[]> = {
            "Valores e cotação": ["quanto custa o plano", "qual o valor mensal"],
            "Internação e cobertura": ["cobre internação", "cobertura do plano"],
            "Coparticipação": ["o que é coparticipação", "quanto pago por consulta"],
            "Carência": ["prazo de carência", "quando posso usar"],
            "Rede credenciada": ["quais hospitais atendem", "atende na minha região"],
            "Inclusão de dependentes": ["adicionar dependente", "incluir família"],
        };

        const result: DashboardMetrics = {
            kpis: {
                totalConversas,
                taxaConversao: Number(taxaConversao.toFixed(1)),
                ticketMedio: Number(ticketMedio.toFixed(2)),
                tempoMedio: Number(tempoMedio.toFixed(1))
            },
            volumeData: Object.entries(volumeByDay)
                .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                .map(([semana, conversas]) => ({ semana, conversas: conversas as number })),
            funnelStages: Object.entries(funnelByDay)
                .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                .map(([semana, data]) => ({ semana, ...data })),
            periodoAnalise: { inicio: periodoInicio, fim: periodoFim, totalDias },
            performance: {
                kpis: {
                    taxaAbandono: Number(taxaAbandono.toFixed(1)),
                    tempoFechamento: Number(tempoMedioFechamento.toFixed(1)),
                    abandonoConversas: abandonos
                },
                conversaoAbandono: Object.entries(perfByDay)
                    .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                    .map(([semana, data]) => ({
                        semana, conversoes: (data as { con: number, ab: number }).con, abandono: (data as { con: number, ab: number }).ab
                    })),
                abandonoEtapa: [
                    { etapa: 'Cotação', abandonos: abandonoPorEtapa.cotacao, fill: '#38B3AB' },
                    { etapa: 'Interesse', abandonos: abandonoPorEtapa.interesse, fill: '#FB923C' },
                ]
            },
            produtosData: {
                kpis: {
                    ticketEmpresarial: Number(ticketEmp.toFixed(2)),
                    mediaVidasEmp: Math.round(totalVidasEmp / (countEmp || 1)),
                    ticketFamiliar: Number(ticketFam.toFixed(2)),
                    mediaVidasFam: Math.round(totalVidasFam / (countFam || 1))
                },
                planosCotacoes: Object.entries(planosByDay)
                    .sort(([a], [b]) => sortDayKeys(a, b, granularidade))
                    .map(([semana, data]) => ({
                        semana, ...(data as { empresarial: number, familiar: number })
                    })),
                faixasEtarias: (() => {
                    const ordem = ['Ate 18', '18-29', '30-39', '40-49', '50-59', '60+'];
                    return Object.entries(faixas)
                        .map(([faixa, quantidade]) => ({ faixa, quantidade }))
                        .sort((a, b) => ordem.indexOf(a.faixa) - ordem.indexOf(b.faixa));
                })(),
                dependentes: [
                    { dependentes: "0", mesPassado: dependentes["0"].mesPassado, mesAtual: dependentes["0"].mesAtual, label: "Sem dependentes" },
                    { dependentes: "1", mesPassado: dependentes["1"].mesPassado, mesAtual: dependentes["1"].mesAtual, label: "1 dependente" },
                    { dependentes: "2", mesPassado: dependentes["2"].mesPassado, mesAtual: dependentes["2"].mesAtual, label: "2 dependentes" },
                    { dependentes: "3", mesPassado: dependentes["3"].mesPassado, mesAtual: dependentes["3"].mesAtual, label: "3 dependentes" },
                    { dependentes: "4", mesPassado: dependentes["4"].mesPassado, mesAtual: dependentes["4"].mesAtual, label: "4 dependentes" },
                    { dependentes: "5+", mesPassado: dependentes["5+"].mesPassado, mesAtual: dependentes["5+"].mesAtual, label: "5 ou mais" }
                ],
                comparativoLabels: { label1: comparativoLabel1, label2: comparativoLabel2 }
            },
            engajamentoData: {
                kpis: {
                    mensagensConversa: Number((totalMensagensH / (totalConversas || 1)).toFixed(1)),
                    taxaRetorno: totalClientesUnicos > 0 ? Number((returnUsers.size / totalClientesUnicos * 100).toFixed(1)) : 0,
                    clientesRetorno: returnUsers.size,
                    sessoesLongasPct: totalConversas > 0 ? Number((sessoesLongas / totalConversas * 100).toFixed(1)) : 0,
                    sessoesLongasCount: sessoesLongas,
                    duracaoMedia: Number(tempoMedio.toFixed(1))
                },
                horarioPico: horarioPico.length > 0 ? horarioPico : [],
                volumeHorario: volumeHorario.length > 0 ? volumeHorario : []
            },
            qualidadeData: {
                kpis: {
                    taxaCompreensao: Number(taxaCompreensao.toFixed(1)),
                    msgsRepetidasPct: Number((100 - taxaCompreensao).toFixed(1)),
                    msgsRepetidasCount: mensagensRetidas
                },
                score: Number(scoreGeral.toFixed(0)),
                perguntasFrequentes: [
                    { pergunta: "Valores e cotação", frequencia: perfFreq["Valores e cotação"], exemplos: frasesReais["Valores e cotação"].length > 0 ? frasesReais["Valores e cotação"] : faqFallbacks["Valores e cotação"] },
                    { pergunta: "Internação e cobertura", frequencia: perfFreq["Internação e cobertura"], exemplos: frasesReais["Internação e cobertura"].length > 0 ? frasesReais["Internação e cobertura"] : faqFallbacks["Internação e cobertura"] },
                    { pergunta: "Coparticipação", frequencia: perfFreq["Coparticipação"], exemplos: frasesReais["Coparticipação"].length > 0 ? frasesReais["Coparticipação"] : faqFallbacks["Coparticipação"] },
                    { pergunta: "Carência", frequencia: perfFreq["Carência"], exemplos: frasesReais["Carência"].length > 0 ? frasesReais["Carência"] : faqFallbacks["Carência"] },
                    { pergunta: "Rede credenciada", frequencia: perfFreq["Rede credenciada"], exemplos: frasesReais["Rede credenciada"].length > 0 ? frasesReais["Rede credenciada"] : faqFallbacks["Rede credenciada"] },
                    { pergunta: "Inclusão de dependentes", frequencia: perfFreq["Inclusão de dependentes"], exemplos: frasesReais["Inclusão de dependentes"].length > 0 ? frasesReais["Inclusão de dependentes"] : faqFallbacks["Inclusão de dependentes"] },
                ]
            },
            resumosIA: {}
        };

        if (!skipAI) {
            try {
                const topFaqs = result.qualidadeData.perguntasFrequentes
                    .sort((a, b) => b.frequencia - a.frequencia)
                    .slice(0, 4)
                    .map(f => `${f.pergunta}: ${f.frequencia} conversas`)
                    .join('; ');

                const horarioPicoStr = result.engajamentoData.volumeHorario
                    .map(h => `${h.horario}: ${h.mensagens} mensagens`)
                    .join(', ');

                const funnelTotais = `Cotação=${counts.cotacao}, Interesse=${counts.interesse}, Fechamento=${counts.fechamento}`;

                const prompt = `Você é um consultor sênior de vendas analisando o desempenho da IA de atendimento "Joana" no WhatsApp de um plano de saúde.

ADVERTÊNCIA CRÍTICA: Os cards abaixo NÃO são para resumir os dados. O usuário já vê esses números em gráficos. Seu trabalho é encontrar o que NÃO está visível nos gráficos.

Dados do período analisado:
- Conversas totais: ${result.kpis.totalConversas} | Fechamentos: ${counts.fechamento} | Taxa: ${result.kpis.taxaConversao}%
- Abandono total: ${abandonos} conversas (${result.performance.kpis.taxaAbandono}%)
- Funil: ${funnelTotais}
- Abandono por etapa: Cotação=${abandonoPorEtapa.cotacao}, Interesse=${abandonoPorEtapa.interesse}
- Dentro dos abandonos em "Interesse": ${abandonoInteresseComCopart} haviam perguntado sobre coparticipação, ${abandonoInteresseComInternacao} sobre internação
- Sessões que precisaram de intervenção de atendente humano: ${sessoesComIntervencaoHumana}
- Sessões longas (mais de 20 mensagens): ${sessoesLongas} de ${result.kpis.totalConversas} (indicam dificuldade de progressão)
- Clientes que retornaram em dias diferentes: ${result.engajamentoData.kpis.clientesRetorno}
- Ticket médio: R$ ${result.kpis.ticketMedio} | Tempo médio de conversa: ${result.kpis.tempoMedio}min
- Dúvidas mais frequentes: ${topFaqs}
- Horários com maior volume: ${horarioPicoStr}
- Taxa de compreensão da Joana: ${result.qualidadeData.kpis.taxaCompreensao}% | Score: ${result.qualidadeData.score}/100

Gere exatamente este JSON com 3 chaves. Cada chave tem um propósito diferente e específico:

"principalInsight": Identifique UMA causa ou correlação não óbvia que explica o resultado atual. Deve responder "por que" algo acontece. Use os dados dos abandonos por dúvida, sessões longas ou intervenções humanas. Cite números concretos. Máximo 40 palavras.

"padroesIdentificados": Descreva um padrão de comportamento do CLIENTE que a Joana poderia explorar. Não cite o que é visível nos gráficos. Foque em: qual dúvida aparece antes do abandono, qual horário tem um perfil diferente, ou o que os clientes que retornam fazem de diferente. Máximo 45 palavras.

"recomendacoesEstrategicas": Escreva UMA mudança específica no script da Joana. Formato: "Quando [situação concreta], a Joana deve [ação específica] antes de [etapa seguinte]". Use os dados reais de abandono por dúvida para embasar. Máximo 45 palavras.

Retorne APENAS o JSON válido, sem markdown, sem texto fora do JSON.`;

                const summariesText = await geminiService.generateSummary(prompt);
                const jsonMatch = summariesText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result.resumosIA = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                result.resumosIA = {};
            }
        }

        return result;
    }
}




serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    // Alternatively, to bypass RLS and read all hidden messages, we USE SERVICE_ROLE_KEY!
    // As per user requirement: "Puxa os telefones com Chave Super Secreta Oculta"
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { forceRefetch, startDate, endDate, generateInsights } = await req.json().catch(() => ({}));
    
    const engine = new AnalyticsEngine();
    
    if (generateInsights) {
        const insights = await engine.generateWeeklyInsights(forceRefetch);
        return new Response(JSON.stringify(insights), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Calculate metrics securely on the server
    const metrics = await engine.fetchAndAnalyze(forceRefetch, start, end);

    // Filter raw messages to ensure no phones/data leaks? They are not returned anyway!
    // Result only contains 'metrics' which are aggregated!

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
