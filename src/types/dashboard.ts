// ============================================================
// Dashboard Joana — Tipos centralizados
// ============================================================

export interface KPI {
    totalConversas: number;
    taxaConversao: number;
    ticketMedio: number;
    tempoMedio: number;
}

export interface PerformanceTrends {
    taxaAbandono: number | null;
    tempoFechamento: number | null;
    abandonoConversas: number | null;
}

export interface KPITrends {
    totalConversas: number | null;
    taxaConversao: number | null;
    ticketMedio: number | null;
    tempoMedio: number | null;
}

export interface FunnelStage {
    semana: string;
    cotacao: number;
    interesse: number;
    fechamento: number;
}

export interface VolumeEntry {
    semana: string;
    conversas: number;
}

export interface ConversaoAbandono {
    semana: string;
    conversoes: number;
    abandono: number;
}

export interface AbandonoEtapa {
    etapa: string;
    abandonos: number;
    fill: string;
    [key: string]: any;
}

export interface PerformanceKpis {
    taxaAbandono: number;
    tempoFechamento: number;
    abandonoConversas: number;
}

export interface Performance {
    kpis: PerformanceKpis;
    conversaoAbandono: ConversaoAbandono[];
    abandonoEtapa: AbandonoEtapa[];
}

export interface ProdutoKpis {
    ticketEmpresarial: number;
    mediaVidasEmp: number;
    ticketFamiliar: number;
    mediaVidasFam: number;
}

export interface PlanoSemana {
    semana: string;
    empresarial: number;
    familiar: number;
}

export interface FaixaEtaria {
    faixa: string;
    quantidade: number;
}

export interface DependenteDistribuicao {
    dependentes: string;
    mesPassado: number;
    mesAtual: number;
    label: string;
}

export interface ProdutosData {
    kpis: ProdutoKpis;
    planosCotacoes: PlanoSemana[];
    faixasEtarias: FaixaEtaria[];
    dependentes: DependenteDistribuicao[];
    comparativoLabels: { label1: string; label2: string };
    idadesCotadasReal?: number[];
}

export interface EngajamentoKpis {
    mensagensConversa: number;
    taxaRetorno: number;
    clientesRetorno: number;
    sessoesLongasPct: number;
    sessoesLongasCount: number;
    duracaoMedia: number;
    mensagensIA: number;
    mensagensHumanas: number;
}

export interface EngajamentoData {
    kpis: EngajamentoKpis;
    horarioPico: { horario: string, mensagens: number }[];
    volumeHorario: { horario: string, mensagens: number, fill: string }[];
    duracaoHistograma: { categoria: string, quantidade: number, fill: string }[];
}

export interface QualidadeKpis {
    taxaCompreensao: number;
    msgsRepetidasPct: number;
    msgsRepetidasCount: number;
}

export interface PerguntaFrequente {
    pergunta: string;
    frequencia: number;
    exemplos: string[];
}

export interface QualidadeData {
    kpis: QualidadeKpis;
    score: number;
    perguntasFrequentes: PerguntaFrequente[];
}

export interface ResumosIA {
    principalInsight?: string;
    padroesIdentificados?: string;
    recomendacoesEstrategicas?: string;
    [key: string]: string | undefined;
}

export interface OrigemTrafego {
    instagram: number;
    facebook: number;
    organico: number;
    total: number;
}

// ============================================================
// Insights Semanais — Agentes Especializados
// ============================================================

export interface InsightNegocio {
    impactoFinanceiro: string;
    perfilDoLead: string;
    objecaoPredominante: string;
    comportamentoDeAbandono: string;
    acaoImediata: string;
    ajusteDeProcesso: string;
    evidenciasReais?: string[]; // Suporte a múltiplas frases reais
    evidenciaReal?: string; // Legado
}

export interface InsightMarketing {
    gancho1: string;
    gancho2: string;
    gancho3?: string;
    copyFeed: string;
    copyStories: string;
    copyWhatsapp?: string;
    copyPrincipal: string;
    anguloDePositionamento: string;
    segmentoSugerido: string;
    antecipacaoDeObjecao: string;
    palavrasChaveNegativas?: string;
    tomDeVoz?: string;
}

export interface WeeklyInsight {
    timestamp: number;
    periodoStr: string;
    periodoInicio?: number;
    periodoFim?: number;
    negocio?: InsightNegocio;
    marketing?: InsightMarketing;
    // Fallback para formato legado (antes dos agentes)
    principalInsight?: string;
    padroesIdentificados?: string;
    recomendacoesEstrategicas?: string;
    exemploReal?: string;
}

export interface PeriodoAnalise {
    inicio: string;
    fim: string;
    totalDias: number;
}

export interface DashboardMetrics {
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
    origemTrafego?: OrigemTrafego;
}

export type TabId = 'geral' | 'insights' | 'performance' | 'engajamento' | 'produtos' | 'qualidade';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Periodo selecionado pelo usuario
export interface SelectedPeriod {
    preset: '7d' | '30d' | '90d' | 'month' | 'custom';
    startDate: Date;
    endDate: Date;
}
