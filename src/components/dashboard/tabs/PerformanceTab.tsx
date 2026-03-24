import React from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useDashboard } from '@/hooks/useDashboard';

const conversaoConfig = {
    conversoes: {
        label: "Conversoes",
        color: "#155DFC",
    },
    abandono: {
        label: "Abandonos",
        color: "#ef4444",
    },
} satisfies ChartConfig;

const abandonoEtapaConfig = {
    abandonos: {
        label: "Abandonos",
        color: "#155DFC",
    },
} satisfies ChartConfig;

// Card de KPI com suporte a trend
function PerfKPICard({
    title,
    value,
    subtitle,
    trend,
    colorClass = 'text-gray-900',
    trendInvert = false,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number | null;
    colorClass?: string;
    trendInvert?: boolean; // para taxaAbandono: queda é boa (verde), alta é ruim (vermelho)
}) {
    const isPositive = trend !== null && trend !== undefined && (trendInvert ? trend <= 0 : trend >= 0);
    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">{title}</div>
            <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
            {trend !== undefined && trend !== null && (
                <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{isPositive ? '▲' : '▼'}</span>
                    <span>{Math.abs(trend)}% vs periodo anterior</span>
                </div>
            )}
            {(trend === null || trend === undefined) && (
                <div className="text-xs mt-2 text-gray-400 italic">Sem dados do periodo anterior</div>
            )}
        </div>
    );
}

export function PerformanceTab() {
    const { performance, performanceTrends, periodoAnalise, granularidadeLabel } = useDashboard();

    const periodoLabel = periodoAnalise.inicio !== '--'
        ? `${periodoAnalise.inicio} a ${periodoAnalise.fim} · por ${granularidadeLabel}`
        : 'Carregando periodo...';

    // Totaliza conversoes e abandonos do periodo para o insight dinamico
    const totalConversoes = performance.conversaoAbandono.reduce((acc, d) => acc + d.conversoes, 0);
    const totalAbandonos = performance.conversaoAbandono.reduce((acc, d) => acc + d.abandono, 0);

    // Abandono por etapa — calcula insight dinamico
    const totalAbandonoPorEtapa = performance.abandonoEtapa.reduce((acc, d) => acc + d.abandonos, 0);
    const etapaMaiorAbandono = totalAbandonoPorEtapa > 0
        ? performance.abandonoEtapa.reduce((a, b) => a.abandonos > b.abandonos ? a : b)
        : null;
    const pctMaiorAbandono = etapaMaiorAbandono && totalAbandonoPorEtapa > 0
        ? Math.round((etapaMaiorAbandono.abandonos / totalAbandonoPorEtapa) * 100)
        : 0;

    const funnelInsightText = etapaMaiorAbandono && totalAbandonoPorEtapa > 0
        ? `${pctMaiorAbandono}% dos abandonos ocorrem na etapa "${etapaMaiorAbandono.etapa}" (${etapaMaiorAbandono.abandonos} de ${totalAbandonoPorEtapa})`
        : 'Sem abandonos registrados no periodo.';

    // Adapta XAxis conforme numero de pontos
    const muitosPontos = performance.conversaoAbandono.length > 20;
    const xAxisProps = muitosPontos
        ? { angle: -45, textAnchor: 'end' as const, interval: Math.floor(performance.conversaoAbandono.length / 10) }
        : { interval: 0 };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <PerfKPICard
                    title="Taxa de Abandono"
                    value={`${performance.kpis.taxaAbandono}%`}
                    subtitle={`${performance.kpis.abandonoConversas} conversas`}
                    trend={performanceTrends.taxaAbandono}
                    colorClass="text-red-600"
                    trendInvert={true}
                />
                <PerfKPICard
                    title="Tempo ate Fechamento"
                    value={performance.kpis.tempoFechamento > 0 ? `${performance.kpis.tempoFechamento.toFixed(0)}min` : '--'}
                    subtitle={performance.kpis.tempoFechamento > 0 ? 'Media das conversas convertidas' : 'Sem conversas convertidas no periodo'}
                    trend={performance.kpis.tempoFechamento > 0 ? performanceTrends.tempoFechamento : undefined}
                    colorClass={performance.kpis.tempoFechamento > 0 ? 'text-blue-600' : 'text-gray-400'}
                    trendInvert={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Grafico Conversao vs Abandono */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Conversao vs Abandono</h3>
                        <p className="text-xs text-gray-500 mt-1">{periodoLabel}</p>
                    </div>
                    <ChartContainer config={conversaoConfig} className={`w-full ${muitosPontos ? 'h-[240px]' : 'h-[200px]'}`}>
                        <BarChart
                            data={performance.conversaoAbandono}
                            margin={{ left: 0, right: 0, top: 5, bottom: muitosPontos ? 40 : 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="semana"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                style={{ fontSize: "11px" }}
                                {...xAxisProps}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Legend
                                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                                iconType="circle"
                                formatter={(value) => value === 'conversoes' ? 'Conversoes' : 'Abandonos'}
                            />
                            <Bar dataKey="conversoes" fill="var(--color-conversoes)" radius={4} name="conversoes" />
                            <Bar dataKey="abandono" fill="var(--color-abandono)" radius={4} name="abandono" />
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-xs text-gray-600">
                                {totalConversoes} conversoes e {totalAbandonos} abandonos no periodo
                            </span>
                        </div>
                    </div>
                </div>

                {/* Grafico Abandono por Etapa */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Taxa de Abandono por Etapa</h3>
                        <p className="text-xs text-gray-500 mt-1">Em que momento os clientes desistem</p>
                    </div>
                    <ChartContainer config={abandonoEtapaConfig} className="h-[220px] w-full">
                        <PieChart>
                            <Pie
                                data={performance.abandonoEtapa}
                                dataKey="abandonos"
                                nameKey="etapa"
                                cx="50%"
                                cy="50%"
                                outerRadius={75}
                                label={({ name, value, percent }) =>
                                    value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                }
                                labelLine={true}
                            >
                                {performance.abandonoEtapa.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartTooltip
                                content={<ChartTooltipContent indicator="line" />}
                            />

                        </PieChart>
                    </ChartContainer>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-xs text-gray-600">{funnelInsightText}</span>
                        </div>
                        {totalAbandonoPorEtapa === 0 && (
                            <p className="text-xs text-gray-400 mt-1 italic">Nenhum abandono detectado no periodo selecionado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
