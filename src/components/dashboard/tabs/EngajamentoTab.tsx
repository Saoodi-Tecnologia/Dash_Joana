import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, CartesianGrid, Rectangle, RadialBarChart, RadialBar, PolarRadiusAxis, Label } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useDashboard } from '@/hooks/useDashboard';

const horarioPicoConfig = {
    mensagens: {
        label: "Mensagens",
        color: "#155DFC",
    },
} satisfies ChartConfig;

const roscaConfig = {
    ia: {
        label: "IA (Joana)",
        color: "#fb923c",
    },
    humano: {
        label: "Clientes",
        color: "#38bdf8",
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

    const topVolumeHorario = engajamentoData.volumeHorario.length > 0
        ? engajamentoData.volumeHorario[0]
        : { horario: '--', mensagens: 0 };

    // Melhoria para mobile: reduz quantidade de labels se houver muitos pontos
    const muitosPontosPico = engajamentoData.horarioPico.length > 12;
    const xAxisPicoProps = muitosPontosPico 
        ? { interval: Math.floor(engajamentoData.horarioPico.length / 6) } 
        : { interval: 0 };

    const muitosPontosVolume = engajamentoData.volumeHorario.length > 12;
    const xAxisVolumeProps = muitosPontosVolume
        ? { interval: Math.floor(engajamentoData.volumeHorario.length / 6) }
        : { interval: 0 };

    // Dados para o grafico Humano vs IA
    const totalIa = engajamentoData.kpis.mensagensIA || 0;
    const totalHumano = engajamentoData.kpis.mensagensHumanas || 0;
    const totalGeral = totalIa + totalHumano;

    const roscaData = [{
        name: "Mensagens",
        ia: totalIa,
        humano: totalHumano
    }];

    const percentualJoana = totalGeral > 0 ? ((totalIa / totalGeral) * 100).toFixed(1) : 0;

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Grafico de area: Horario de Pico (todas as horas com atividade) */}
                <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Horario de Pico</h3>
                        <p className="text-xs text-gray-500 mt-1">Distribuicao de mensagens ao longo do dia</p>
                    </div>
                    <ChartContainer config={horarioPicoConfig} className="h-[250px] w-full">
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
                            <XAxis 
                                dataKey="horario" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8} 
                                style={{ fontSize: "11px" }}
                                {...xAxisPicoProps}
                            />
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

                {/* Grafico Rosca Stacked: Desempenho Humano vs Joana */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col h-full lg:col-span-1">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Desempenho Humano vs Joana</h3>
                        <p className="text-xs text-gray-500 mt-1">Quem fala mais nas conversões?</p>
                    </div>
                    <div className="flex-grow flex flex-col justify-center items-center pb-0">
                        <ChartContainer
                            config={roscaConfig}
                            className="mx-auto aspect-square w-full max-w-[200px]"
                        >
                            <RadialBarChart
                                data={roscaData}
                                endAngle={180}
                                innerRadius={80}
                                outerRadius={110}
                            >
                                <RadialBar
                                    dataKey="ia"
                                    fill="var(--color-ia)"
                                    stackId="a"
                                    cornerRadius={5}
                                    className="stroke-transparent stroke-2"
                                />
                                <RadialBar
                                    dataKey="humano"
                                    stackId="a"
                                    cornerRadius={5}
                                    fill="var(--color-humano)"
                                    className="stroke-transparent stroke-2"
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) - 16}
                                                            className="fill-foreground text-2xl font-bold"
                                                        >
                                                            {totalGeral.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 4}
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            Msgs Totais
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </PolarRadiusAxis>
                            </RadialBarChart>
                        </ChartContainer>
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-700">
                                A IA enviou {percentualJoana}% das msgs nesses atendimentos
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
