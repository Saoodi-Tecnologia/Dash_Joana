import { supabase } from '@/integrations/supabase/client';
import type { QueryIntent } from './intentService';

// ============================================================
// queryBuilder — monta e executa queries cirúrgicas no
// Supabase baseadas na intenção detectada. Nunca retorna
// mais de ~200 linhas para a IA processar.
// ============================================================

export interface QueryResult {
    rows: Record<string, unknown>[];
    description: string;
}

// Campos da nova tabela dash_mensagens_realtime
// message_type: 'incoming' (humano) | 'outgoing' (IA/agente)
// is_ia: true quando a mensagem veio da Joana (IA)

async function runSQL(sql: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase.rpc('exec_query', { query: sql }).maybeSingle();
    if (error || !data) {
        // Fallback direto se RPC não existir — usa query builder
        return [];
    }
    return data as Record<string, unknown>[];
}

// Busca mensagens da nova tabela com campos planos
async function fetchMessages(filters: {
    type?: 'human' | 'ai';
    keywordInContent?: string[];
    excludeKeywordsInContent?: string[];
    limit?: number;
    orderByRecent?: boolean;
}): Promise<{ session_id: string; content: string; created_at: string }[]> {
    let query = supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('session_id, content, received_at')
        .eq('event_type', 'message_created')
        .not('received_at', 'is', null);

    if (filters.type === 'human') {
        query = (query as any).eq('message_type', 'incoming');
    } else if (filters.type === 'ai') {
        query = (query as any).eq('is_ia', true);
    }

    if (filters.orderByRecent) {
        query = (query as any).order('received_at', { ascending: false });
    }

    query = (query as any).limit(filters.limit || 300);

    const { data, error } = await query;
    if (error || !data) return [];

    let rows = (data as Record<string, unknown>[]).map(r => ({
        session_id: r.session_id as string,
        content: (r.content as string) || '',
        created_at: r.received_at as string,
    }));

    if (filters.keywordInContent && filters.keywordInContent.length > 0) {
        rows = rows.filter(r =>
            filters.keywordInContent!.some(kw =>
                r.content.toLowerCase().includes(kw.toLowerCase())
            )
        );
    }

    if (filters.excludeKeywordsInContent && filters.excludeKeywordsInContent.length > 0) {
        rows = rows.filter(r =>
            !filters.excludeKeywordsInContent!.some(kw =>
                r.content.toLowerCase().includes(kw.toLowerCase())
            )
        );
    }

    return rows;
}

async function fetchSessionsWithClosing(): Promise<Set<string>> {
    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('session_id, content, message_type')
        .eq('event_type', 'message_created')
        .not('received_at', 'is', null)
        .limit(4000);

    const closedSessions = new Set<string>();
    const sessions: Record<string, { ai: string, human: string }> = {};

    data?.forEach((r: Record<string, unknown>) => {
        const sid = r.session_id as string;
        if (!sessions[sid]) sessions[sid] = { ai: '', human: '' };
        const content = ((r.content as string) || '').toLowerCase();

        if (r.message_type === 'incoming') sessions[sid].human += ' ' + content;
        else sessions[sid].ai += ' ' + content;
    });

    const intenClienteFechar = /(fechado|vou querer|quero contratar|vamos fechar|pode seguir|pode fazer|pagar agora)/;
    const aiSugestao = /(seguir com a contratação|continuar com a contratação|deseja contratar|se quiser contratar|vamos iniciar a contratação|posso gerar o link)/;
    const humanAfirmativa = /\b(sim|isso mesmo|pode ser|quero|exato|bora|vamos|pode sim|com certeza|ok|manda)\b/;

    for (const [sessionId, texts] of Object.entries(sessions)) {
        if (intenClienteFechar.test(texts.human) || (aiSugestao.test(texts.ai) && humanAfirmativa.test(texts.human))) {
            closedSessions.add(sessionId);
        }
    }

    return closedSessions;
}

// ============================================================
// Handlers por intenção
// ============================================================

async function handleObjecoes(): Promise<QueryResult> {
    const closedSessions = await fetchSessionsWithClosing();

    // Pega mensagens humanas de sessões que NÃO fecharam
    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('session_id, content, received_at')
        .eq('event_type', 'message_created')
        .eq('message_type', 'incoming')
        .not('received_at', 'is', null)
        .order('received_at', { ascending: false })
        .limit(1000);

    const objectionKeywords = [
        'caro', 'preço', 'valor', 'coparticipação', 'copart', 'tabela', 'não consigo',
        'não vou', 'desistir', 'cancelar', 'pensando', 'não tenho', 'espera',
        'ambulatorial', 'hospitalar', 'carência', 'não fechar', 'vai ficar pra depois',
        'não tenho dinheiro', 'mês que vem', 'depois', 'não posso', 'obrigado nao'
    ];

    const rows = (data || [])
        .map((r: Record<string, unknown>) => ({
            session_id: r.session_id as string,
            content: (r.content as string) || '',
            created_at: r.received_at as string,
        }))
        .filter(r =>
            !closedSessions.has(r.session_id) &&
            objectionKeywords.some(kw => r.content.toLowerCase().includes(kw))
        )
        .slice(0, 150);

    return {
        rows,
        description: `${rows.length} mensagens de clientes que não fecharam e mencionaram objeções`
    };
}

async function handlePlanosVidas(): Promise<QueryResult> {
    const planKeywords = ['familiar', 'empresarial', 'plano', 'vidas', 'beneficiário', 'dependente', 'titular', 'filhos', 'cônjuge'];

    const rows = await fetchMessages({
        type: 'human',
        keywordInContent: planKeywords,
        limit: 600,
        orderByRecent: true,
    });

    const closedSessions = await fetchSessionsWithClosing();
    const converted = rows.filter(r => closedSessions.has(r.session_id)).slice(0, 100);

    return {
        rows: converted.length > 0 ? converted : rows.slice(0, 100),
        description: `${converted.length} mensagens de clientes que discutiram planos e converteram`
    };
}

async function handleFunilAbandono(): Promise<QueryResult> {
    const funnelStages = [
        { label: 'Interesse inicial', keywords: ['oi', 'olá', 'quero saber', 'informação', 'me fala'] },
        { label: 'Solicitou cotação', keywords: ['quanto', 'valor', 'preço', 'cotação', 'tabela'] },
        { label: 'Analisando plano', keywords: ['carência', 'cobertura', 'hospitalar', 'ambulatorial', 'copart'] },
        { label: 'Objeção de preço', keywords: ['caro', 'não tenho', 'depois', 'mês que vem', 'pode esperar'] },
    ];

    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('session_id, content, received_at')
        .eq('event_type', 'message_created')
        .eq('message_type', 'incoming')
        .not('received_at', 'is', null)
        .limit(1000);

    const stageCounts = funnelStages.map(stage => {
        const count = (data || []).filter((r: Record<string, unknown>) => {
            const content = ((r.content as string) || '').toLowerCase();
            return stage.keywords.some(kw => content.includes(kw));
        }).length;
        return { etapa: stage.label, mencoes: count };
    });

    return {
        rows: stageCounts,
        description: 'Contagem de menções por etapa do funil com base nas mensagens dos clientes'
    };
}

async function handleHorarioPico(): Promise<QueryResult> {
    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('received_at')
        .eq('event_type', 'message_created')
        .eq('message_type', 'incoming')
        .not('received_at', 'is', null)
        .limit(3000);

    const hourCounts: Record<number, number> = {};
    (data || []).forEach((r: Record<string, unknown>) => {
        // Converter UTC para horario de Brasilia (UTC-3)
        const utcDate = new Date(r.received_at as string);
        const brtDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
        const hour = brtDate.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const rows = Object.entries(hourCounts)
        .map(([hour, count]) => ({ horario: `${hour.padStart(2, '0')}:00`, mensagens: count }))
        .sort((a, b) => b.mensagens - a.mensagens);

    return {
        rows,
        description: 'Volume de mensagens por hora do dia'
    };
}

async function handlePerguntasFrequentes(): Promise<QueryResult> {
    const topicKeywords = [
        { topic: 'Carência', keywords: ['carência', 'carencia', 'prazo', 'esperar para usar'] },
        { topic: 'Coparticipação', keywords: ['copart', 'coparticipação', 'pagar consulta'] },
        { topic: 'Valor/Preço', keywords: ['valor', 'quanto', 'preço', 'mensalidade', 'parcela'] },
        { topic: 'Cobertura hospitalar', keywords: ['internação', 'hospital', 'cirurgia', 'uti'] },
        { topic: 'Cobertura ambulatorial', keywords: ['consulta', 'ambulatorial', 'clínica', 'exame'] },
        { topic: 'Dependentes', keywords: ['filho', 'filhos', 'esposa', 'marido', 'cônjuge', 'dependente'] },
        { topic: 'Plano empresarial', keywords: ['empresa', 'funcionário', 'pj', 'cnpj', 'empresarial'] },
        { topic: 'Cancelamento', keywords: ['cancelar', 'desistir', 'não quero mais', 'sair do plano'] },
    ];

    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('content')
        .eq('event_type', 'message_created')
        .eq('message_type', 'incoming')
        .not('received_at', 'is', null)
        .limit(2000);

    const counts = topicKeywords.map(t => {
        const count = (data || []).filter((r: Record<string, unknown>) => {
            const content = ((r.content as string) || '').toLowerCase();
            return t.keywords.some(kw => content.includes(kw));
        }).length;
        return { tema: t.topic, mencoes: count };
    }).sort((a, b) => b.mencoes - a.mencoes);

    return {
        rows: counts,
        description: 'Frequência de tópicos nas perguntas dos clientes'
    };
}

async function handleClientesConvertidos(): Promise<QueryResult> {
    const closedSessions = await fetchSessionsWithClosing();
    const sessionList = [...closedSessions].slice(0, 50);

    const rows = sessionList.map(s => ({ session_id: s, status: 'Fechado' }));

    return {
        rows,
        description: `${rows.length} clientes identificados como convertidos (fecharam contrato)`
    };
}

async function handleConversasRecentes(): Promise<QueryResult> {
    const { data } = await supabase
        .schema('dashboard')
        .from('dash_mensagens_realtime')
        .select('session_id, content, received_at, contact_name, contact_phone, conversation_id')
        .eq('event_type', 'message_created')
        .eq('message_type', 'incoming')
        .not('received_at', 'is', null)
        .order('received_at', { ascending: false })
        .limit(50);

    const rows = (data || []).map((r: Record<string, unknown>) => ({
        session_id: r.session_id,
        conversation_id: r.conversation_id,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        mensagem: ((r.content as string) || '').slice(0, 200),
        created_at: r.received_at,
    }));

    return {
        rows,
        description: '50 mensagens mais recentes dos clientes'
    };
}

// ============================================================
// Entry point principal
// ============================================================

export async function executeQuery(intent: QueryIntent): Promise<QueryResult | null> {
    switch (intent) {
        case 'QUERY_OBJECOES': return handleObjecoes();
        case 'QUERY_PLANOS_VIDAS': return handlePlanosVidas();
        case 'QUERY_FUNIL_ABANDONO': return handleFunilAbandono();
        case 'QUERY_HORARIO_PICO': return handleHorarioPico();
        case 'QUERY_PERGUNTAS_FREQUENTES': return handlePerguntasFrequentes();
        case 'QUERY_CLIENTES_CONVERTIDOS': return handleClientesConvertidos();
        case 'QUERY_CONVERSAS_RECENTES': return handleConversasRecentes();
        default: return null;
    }
}
