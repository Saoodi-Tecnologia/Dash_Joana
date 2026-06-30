import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useDashboard } from '@/hooks/useDashboard';

const volumeConversasConfig = {
    conversas: {
        label: "Conversas",
        color: "#FB923C",
    },
} satisfies ChartConfig;

const jorneyChartConfig = {
    cotacao: {
        label: "Cotação",
        color: "#38B3AB",
    },
    interesse: {
        label: "Interesse",
        color: "#FB923C",
    },
    fechamento: {
        label: "Fechamento",
        color: "#155DFC",
    },
} satisfies ChartConfig;

// KPICard local com suporte a trend dinamico
const KPICard = ({
    title,
    value,
    subtitle,
    trend,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number | null;
}) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                <span>{trend >= 0 ? '▲' : '▼'}</span>
                <span>{Math.abs(trend)}% vs período anterior</span>
            </div>
        )}
        {trend === null && (
            <div className="text-xs mt-2 text-gray-400 italic">
                Sem dados do período anterior
            </div>
        )}
    </div>
);

export function GeralTab() {
    const { kpis, kpiTrends, volumeData, funnelStages, periodoAnalise } = useDashboard();

    const periodoLabel = periodoAnalise.inicio !== '--'
        ? `${periodoAnalise.inicio} a ${periodoAnalise.fim} (${periodoAnalise.totalDias} ${periodoAnalise.totalDias === 1 ? 'dia' : 'dias'})`
        : 'Carregando periodo...';

    // Insight dinamico do grafico de volume
    const totalConversas = volumeData.reduce((acc, d) => acc + d.conversas, 0);
    const diaComMaisConversas = volumeData.length > 0
        ? volumeData.reduce((a, b) => a.conversas > b.conversas ? a : b)
        : null;

    const volumeInsight = diaComMaisConversas
        ? `Pico em ${diaComMaisConversas.semana} com ${diaComMaisConversas.conversas} conversas de um total de ${totalConversas}`
        : 'Sem dados suficientes para calcular pico';

    // Insight dinamico do funil
    const totalFechamentos = funnelStages.reduce((acc, d) => acc + d.fechamento, 0);
    const totalFunil = funnelStages.reduce((acc, d) => acc + d.cotacao + d.interesse + d.fechamento, 0);
    const diaComMaisFechamento = funnelStages.length > 0
        ? funnelStages.reduce((a, b) => a.fechamento > b.fechamento ? a : b)
        : null;

    const funnelInsight = diaComMaisFechamento && totalFunil > 0
        ? `${totalFechamentos} fechamentos no periodo. Melhor dia: ${diaComMaisFechamento.semana} com ${diaComMaisFechamento.fechamento} conversoes`
        : 'Sem conversoes no periodo analisado';

    // Determina se o eixo X precisa de rotacao (muitos pontos)
    const muitosPontos = volumeData.length > 20;
    const xAxisProps = muitosPontos
        ? { angle: -45, textAnchor: 'end' as const, interval: Math.floor(volumeData.length / 10) }
        : { interval: 0 };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                    title="Total Conversas"
                    value={kpis.totalConversas}
                    trend={kpiTrends.totalConversas}
                />
                <KPICard
                    title="Taxa Conversão"
                    value={`${kpis.taxaConversao}%`}
                    trend={kpiTrends.taxaConversao}
                />
                <KPICard
                    title="Ticket Médio"
                    value={kpis.ticketMedio > 0 ? `R$ ${kpis.ticketMedio}` : 'N/D'}
                    trend={kpis.ticketMedio > 0 ? kpiTrends.ticketMedio : null}
                />
                <KPICard
                    title="Tempo Médio"
                    value={`${kpis.tempoMedio}min`}
                    trend={kpiTrends.tempoMedio}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Volume de Conversas</h3>
                        <p className="text-xs text-gray-500 mt-1">{periodoLabel}</p>
                    </div>
                    <ChartContainer config={volumeConversasConfig} className={`w-full ${muitosPontos ? 'h-[240px]' : 'h-[200px]'}`}>
                        <AreaChart
                            data={volumeData}
                            margin={{ left: 0, right: 0, top: 5, bottom: muitosPontos ? 40 : 5 }}
                        >
                            <defs>
                                <linearGradient id="colorConversas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-conversas)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-conversas)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
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
                            <Area
                                dataKey="conversas"
                                type="monotone"
                                stroke="var(--color-conversas)"
                                strokeWidth={2}
                                fill="url(#colorConversas)"
                                fillOpacity={0.4}
                            />
                        </AreaChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-600">{volumeInsight}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Funil de Conversão</h3>
                            <p className="text-gray-500 mt-1 text-xs">{periodoLabel}</p>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            <div className="absolute right-0 top-7 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Como as etapas são identificadas</h4>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: "#38B3AB" }}></div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">Cotação</p>
                                            <p className="text-xs text-gray-500">Cliente pergunta sobre valores, mensalidade ou planos disponíveis</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: "#FB923C" }}></div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">Interesse</p>
                                            <p className="text-xs text-gray-500">Cliente pergunta sobre rede credenciada, carência, cobertura, internação, cirurgia, coparticipação ou emergência</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: "#155DFC" }}></div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">Fechamento</p>
                                            <p className="text-xs text-gray-500">Joana faz a solicitação ativa do CPF para contratação E gera o resumo formal de venda (=Cliente) com dados de pagamento coletados</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 italic mt-3 pt-2 border-t border-gray-100">Cada conversa é classificada na etapa mais avançada atingida</p>
                            </div>
                        </div>
                    </div>
                    <ChartContainer config={jorneyChartConfig} className={`w-full ${muitosPontos ? 'h-[260px]' : 'h-[220px]'}`}>
                        <BarChart
                            data={funnelStages}
                            margin={{ left: 0, right: 0, top: 5, bottom: muitosPontos ? 40 : 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="semana"
                                tickLine={false}
                                axisLine={false}
                                style={{ fontSize: "11px" }}
                                {...xAxisProps}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                            <Bar dataKey="cotacao" stackId="a" fill="var(--color-cotacao)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="interesse" stackId="a" fill="var(--color-interesse)" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="fechamento" stackId="a" fill="var(--color-fechamento)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-600">{funnelInsight}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
