import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DashboardMetrics, KPITrends, PerformanceTrends } from "./types.ts";
import { getGranularidade, calcTrend } from "./utils.ts";
import { getRawMessages } from "./fetcher.ts";
import { processMessages } from "./processor.ts";
import { generateWeeklyInsights as runInsights } from "./insights.ts";

export class AnalyticsEngine {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async generateWeeklyInsights(
        forceRefetch: boolean = false,
        targetStartDate?: Date,
        targetEndDate?: Date
    ): Promise<any[]> {
        return runInsights(
            this.supabase,
            forceRefetch,
            targetStartDate,
            targetEndDate
        );
    }

    async fetchAndAnalyze(
        forceRefetch: boolean = false,
        startDate?: Date,
        endDate?: Date
    ): Promise<DashboardMetrics & { _lastUpdated?: string }> {
        const hasPeriodFilter = !!(startDate && endDate);

        if (!forceRefetch) {
            const { data: cacheData } = await this.supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .select('updated_at, metrics_data')
                .eq('id', 1)
                .single();

            if (cacheData && Object.keys(cacheData.metrics_data || {}).length > 0) {
                const updated = new Date(cacheData.updated_at).getTime();
                const diffHours = (Date.now() - updated) / (1000 * 60 * 60);

                if (diffHours < 24) {
                    if (!hasPeriodFilter) {
                        return { ...cacheData.metrics_data as any, _lastUpdated: cacheData.updated_at };
                    }

                    const cached = cacheData.metrics_data as any;
                    if (cached.volumeData && cached.funnelStages) {
                        const allDataStart = new Date('2026-01-01').getTime();
                        const filterStart = startDate!.getTime();

                        if (filterStart <= allDataStart) {
                            return { ...cached, _lastUpdated: cacheData.updated_at };
                        }
                    }
                }
            }
        }

        let periodStart: Date;
        let periodEnd: Date;

        if (hasPeriodFilter) {
            periodStart = startDate!;
            periodEnd = endDate!;
        } else {
            periodStart = new Date('2026-01-01T00:00:00.000Z');
            periodEnd = new Date();
            periodEnd.setHours(23, 59, 59, 999);
        }

        const periodLengthMs = periodEnd.getTime() - periodStart.getTime();
        const prevPeriodEnd = new Date(periodStart.getTime() - 1);
        const prevPeriodStart = new Date(periodStart.getTime() - periodLengthMs);

        const fetchStart = hasPeriodFilter ? prevPeriodStart : periodStart;
        const fetchEnd = hasPeriodFilter ? periodEnd : periodEnd;

        const allMessages = await getRawMessages(this.supabase, fetchStart, fetchEnd);

        const currentMessages = allMessages.filter(row => {
            const ts = new Date(row.received_at || row.chatwoot_created_at);
            return ts >= periodStart && ts <= periodEnd;
        });

        const prevMessages = allMessages.filter(row => {
            const ts = new Date(row.received_at || row.chatwoot_created_at);
            return ts >= prevPeriodStart && ts <= prevPeriodEnd;
        });

        const currentMetrics = await processMessages(currentMessages, hasPeriodFilter ? periodStart : undefined, hasPeriodFilter ? periodEnd : undefined, true);
        const prevMetrics = await processMessages(prevMessages, prevPeriodStart, prevPeriodEnd, true);

        const hasPrev = prevMessages.length > 0;
        const kpiTrends: KPITrends = {
            totalConversas: hasPrev ? calcTrend(currentMetrics.kpis.totalConversas, prevMetrics.kpis.totalConversas) : null,
            taxaConversao: hasPrev ? calcTrend(currentMetrics.kpis.taxaConversao, prevMetrics.kpis.taxaConversao) : null,
            ticketMedio: hasPrev ? calcTrend(currentMetrics.kpis.ticketMedio, prevMetrics.kpis.ticketMedio) : null,
            tempoMedio: hasPrev ? calcTrend(currentMetrics.kpis.tempoMedio, prevMetrics.kpis.tempoMedio) : null,
        };

        const performanceTrends: PerformanceTrends = {
            taxaAbandono: hasPrev ? calcTrend(currentMetrics.performance.kpis.taxaAbandono, prevMetrics.performance.kpis.taxaAbandono) : null,
            tempoFechamento: hasPrev ? calcTrend(currentMetrics.performance.kpis.tempoFechamento, prevMetrics.performance.kpis.tempoFechamento) : null,
            abandonoConversas: hasPrev ? calcTrend(currentMetrics.performance.kpis.abandonoConversas, prevMetrics.performance.kpis.abandonoConversas) : null,
        };

        const totalDiasAtual = currentMetrics.periodoAnalise?.totalDias ?? 1;
        const granularidadeAtual = getGranularidade(totalDiasAtual);
        const granularidadeLabel = granularidadeAtual === 'dia' ? 'dia' : granularidadeAtual === 'semana' ? 'semana' : 'mes';

        const result = { ...currentMetrics, kpiTrends, performanceTrends, granularidadeLabel };

        if (!hasPeriodFilter) {
            const nowStr = new Date().toISOString();
            await this.supabase
                .schema('dashboard')
                .from('dash_metrics_cache')
                .upsert({ id: 1, updated_at: nowStr, metrics_data: result as any });
            return { ...result, _lastUpdated: nowStr };
        }

        return { ...result, _lastUpdated: new Date().toISOString() };
    }
}