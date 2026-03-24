import { useDashboardContext } from '@/context/DashboardContext';

// ============================================================
// useDashboard — acesso tipado e seguro ao contexto do dashboard
// ============================================================

export function useDashboard() {
    const { data, isProcessing, error, reload, lastUpdated, selectedPeriod, setSelectedPeriod, weeklyInsights, weeklyInsightsPeriodo, isLoadingInsights, reloadInsights } = useDashboardContext();

    const kpis = data?.kpis ?? { totalConversas: 0, taxaConversao: 0, ticketMedio: 0, tempoMedio: 0 };
    const kpiTrends = data?.kpiTrends ?? { totalConversas: null, taxaConversao: null, ticketMedio: null, tempoMedio: null };
    const performanceTrends = data?.performanceTrends ?? { taxaAbandono: null, tempoFechamento: null, abandonoConversas: null };
    const granularidadeLabel = data?.granularidadeLabel ?? 'dia';
    const volumeData = data?.volumeData ?? [];
    const funnelStages = data?.funnelStages ?? [];

    const performance = data?.performance ?? {
        kpis: { taxaAbandono: 0, tempoFechamento: 0, abandonoConversas: 0 },
        conversaoAbandono: [],
        abandonoEtapa: []
    };

    const produtosData = data?.produtosData ?? {
        kpis: { ticketEmpresarial: 0, mediaVidasEmp: 0, ticketFamiliar: 0, mediaVidasFam: 0 },
        planosCotacoes: [],
        faixasEtarias: [],
        dependentes: [],
        comparativoLabels: { label1: 'Periodo Anterior', label2: 'Periodo Recente' }
    };

    const engajamentoData = data?.engajamentoData ?? {
        kpis: { mensagensConversa: 0, taxaRetorno: 0, clientesRetorno: 0, sessoesLongasPct: 0, sessoesLongasCount: 0, duracaoMedia: 0 },
        horarioPico: [],
        volumeHorario: []
    };

    const qualidadeData = data?.qualidadeData ?? {
        kpis: { taxaCompreensao: 0, msgsRepetidasPct: 0, msgsRepetidasCount: 0 },
        score: 0,
        perguntasFrequentes: []
    };

    const resumosIA = data?.resumosIA ?? {};
    const periodoAnalise = data?.periodoAnalise ?? { inicio: '--', fim: '--', totalDias: 0 };
    const origemTrafego = data?.origemTrafego ?? { instagram: 0, facebook: 0, organico: 0, total: 0 };

    const totalPlanos = {
        empresarial: produtosData.planosCotacoes.reduce((acc, curr) => acc + curr.empresarial, 0),
        familiar: produtosData.planosCotacoes.reduce((acc, curr) => acc + curr.familiar, 0),
    };

    return {
        isProcessing,
        error,
        lastUpdated,
        reload,
        kpis,
        kpiTrends,
        performanceTrends,
        granularidadeLabel,
        volumeData,
        funnelStages,
        performance,
        produtosData,
        engajamentoData,
        qualidadeData,
        resumosIA,
        totalPlanos,
        periodoAnalise,
        selectedPeriod,
        setSelectedPeriod,
        weeklyInsights,
        weeklyInsightsPeriodo,
        isLoadingInsights,
        reloadInsights,
        origemTrafego,
    };
}
