import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, CartesianGrid, Rectangle } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useDashboard } from '@/hooks/useDashboard';

const horarioPicoConfig = {
    mensagens: {
        label: "Mensagens",
        color: "#155DFC",
    },
} satisfies ChartConfig;

const volumeHorarioConfig = {
    mensagens: {
        label: "Mensagens",
        color: "#155DFC",
    },
} satisfies ChartConfig;

export function EngajamentoTab() {
    const { engajamentoData } = useDashboard();

    // Horario de pico calculado dinamicamente
    const maxMessagesPeak = engajamentoData.horarioPico.length > 0
        ? engajamentoData.horarioPico.reduce((prev, curr) => prev.mensagens > curr.mensagens ? prev : curr)
        : { horario: '--', mensagens: 0 };

    // Top horario do ranking (barra em destaque)
    const topVolumeHorario = engajamentoData.volumeHorario.length > 0
        ? engajamentoData.volumeHorario[0]
        : { horario: '--', mensagens: 0 };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Mensagens por conversa */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Mensagens/Conversa</div>
                    <div className="text-2xl font-bold text-blue-600">{engajamentoData.kpis.mensagensConversa}</div>
                    <div className="text-xs text-gray-500 mt-1">Media por sessao</div>
                </div>

                {/* KPI 2: Taxa de Retorno real por telefone */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Taxa de Retorno</div>
                    <div className="text-2xl font-bold text-blue-600">{engajamentoData.kpis.taxaRetorno.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {engajamentoData.kpis.clientesRetorno > 0
                            ? `${engajamentoData.kpis.clientesRetorno} tel. voltou mais de 1x`
                            : 'Nenhum retorno ainda'}
                    </div>
                </div>

                {/* KPI 3: Sessoes Longas — substitui "Tempo de Resposta" hardcoded */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Sessoes Longas</div>
                    <div className="text-2xl font-bold text-blue-600">{engajamentoData.kpis.sessoesLongasPct}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {engajamentoData.kpis.sessoesLongasCount} conversas &gt;20 msgs
                    </div>
                </div>

                {/* KPI 4: Duracao Media */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Duracao Media</div>
                    <div className="text-2xl font-bold text-blue-600">{engajamentoData.kpis.duracaoMedia}min</div>
                    <div className="text-xs text-gray-500 mt-1">Por conversa</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Grafico de area: Horario de Pico (todas as horas com atividade) */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Horario de Pico</h3>
                        <p className="text-xs text-gray-500 mt-1">Distribuicao de mensagens ao longo do dia</p>
                    </div>
                    <ChartContainer config={horarioPicoConfig} className="h-[200px] w-full">
                        <AreaChart
                            data={engajamentoData.horarioPico}
                            margin={{ left: 0, right: 0, top: 5, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="colorMensagensPico" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-mensagens)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-mensagens)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="horario" tickLine={false} axisLine={false} tickMargin={8} interval={0} style={{ fontSize: "12px" }} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Area
                                dataKey="mensagens"
                                type="linear"
                                fill="url(#colorMensagensPico)"
                                fillOpacity={0.4}
                                stroke="var(--color-mensagens)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {/* Insight dinamico calculado dos dados reais */}
                            <span className="text-xs font-medium text-gray-700">
                                {maxMessagesPeak.mensagens > 0
                                    ? `Pico historico detectado as ${maxMessagesPeak.horario} com ${maxMessagesPeak.mensagens} msgs`
                                    : 'Sem dados de horario no periodo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Grafico de barras: Top 4 horarios mais ativos */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Volume por Horario</h3>
                        <p className="text-xs text-gray-500 mt-1">Horarios mais ativos do dia</p>
                    </div>
                    <ChartContainer config={volumeHorarioConfig} className="h-[200px] w-full">
                        <BarChart
                            data={engajamentoData.volumeHorario}
                            margin={{ left: 0, right: 0, top: 5, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="horario" tickLine={false} axisLine={false} tickMargin={10} interval={0} style={{ fontSize: "12px" }} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Bar
                                dataKey="mensagens"
                                radius={8}
                                shape={(props: any) => {
                                    const { fill, x, y, width, height, index } = props;
                                    const isActive = index === 0;
                                    if (isActive) {
                                        return (
                                            <Rectangle
                                                x={x}
                                                y={y}
                                                width={width}
                                                height={height}
                                                fill={fill}
                                                fillOpacity={0.8}
                                                stroke={fill}
                                                strokeWidth={2}
                                                strokeDasharray="4"
                                                strokeDashoffset="4"
                                                radius={8}
                                            />
                                        );
                                    }
                                    return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={8} />;
                                }}
                            />
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {/* Insight dinamico: top horario real calculado do banco */}
                            <span className="text-xs font-medium text-gray-700">
                                {topVolumeHorario.mensagens > 0
                                    ? `Horario de pico as ${topVolumeHorario.horario} com ${topVolumeHorario.mensagens} mensagens`
                                    : 'Sem dados de volume no periodo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
