import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useDashboard } from '@/hooks/useDashboard';

const planosConfig = {
    empresarial: {
        label: "Empresarial",
        color: "#38B3AB",
    },
    familiar: {
        label: "Ind./Familiar",
        color: "#FB923C",
    },
} satisfies ChartConfig;

const faixasEtariasConfig = {
    quantidade: {
        label: "Pessoas",
        color: "#155DFC",
    },
} satisfies ChartConfig;

const dependentesConfig = {
    mesPassado: {
        label: "Periodo Anterior",
        color: "#9CA3AF",
    },
    mesAtual: {
        label: "Periodo Recente",
        color: "#FB923C",
    },
} satisfies ChartConfig;

export function ProdutosTab() {
    const { produtosData, totalPlanos } = useDashboard();
    const [activePlan, setActivePlan] = useState<"empresarial" | "familiar">("empresarial");

    const totalPassado = produtosData.dependentes.reduce((acc, curr) => acc + curr.mesPassado, 0);
    const totalAtual = produtosData.dependentes.reduce((acc, curr) => acc + curr.mesAtual, 0);
    const totalComDependentesPassado = produtosData.dependentes.slice(1).reduce((acc, curr) => acc + curr.mesPassado, 0);
    const totalComDependentesAtual = produtosData.dependentes.slice(1).reduce((acc, curr) => acc + curr.mesAtual, 0);

    // Fallback division by zero prevention
    const valPassado = totalPassado > 0 ? totalComDependentesPassado / totalPassado : 0;
    const valAtual = totalAtual > 0 ? totalComDependentesAtual / totalAtual : 0;

    const variacaoPercentual = valPassado > 0 ? Number(
        (((valAtual - valPassado) / valPassado) * 100).toFixed(1)
    ) : 0;

    // Highest group find
    let topFaixa = { faixa: "Sem Dados", quantidade: 0 };
    if (produtosData.faixasEtarias.length > 0) {
        topFaixa = produtosData.faixasEtarias.reduce((prev, current) => (prev.quantidade > current.quantidade) ? prev : current);
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">
                        Ticket
                        <br />
                        Empresarial
                    </div>
                    <div className="text-2xl font-bold" style={{ color: "#38B3AB" }}>
                        R$ {produtosData.kpis.ticketEmpresarial}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Média: {produtosData.kpis.mediaVidasEmp} vidas</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Ticket Ind./Familiar</div>
                    <div className="text-2xl font-bold text-orange-600">R$ {produtosData.kpis.ticketFamiliar}</div>
                    <div className="text-xs text-gray-500 mt-1">Média: {produtosData.kpis.mediaVidasFam} vidas</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col sm:flex-row border-b">
                        <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 sm:px-6">
                            <h3 className="text-sm font-semibold text-gray-700">Planos mais cotados</h3>
                            <p className="text-xs text-gray-500">Empresarial vs. Ind./Familiar - Últimas 4 semanas</p>
                        </div>
                        <div className="flex">
                            <button
                                onClick={() => setActivePlan("empresarial")}
                                className={`flex flex-1 flex-col justify-center gap-1 border-t sm:border-t-0 sm:border-l px-6 py-3 text-left transition-colors ${activePlan === "empresarial" ? "bg-teal-50" : "hover:bg-gray-50"}`}
                            >
                                <span className="text-xs text-gray-600">Empresarial</span>
                                <span className="text-2xl font-bold" style={{ color: "#38B3AB" }}>
                                    {totalPlanos.empresarial}
                                </span>
                            </button>
                            <button
                                onClick={() => setActivePlan("familiar")}
                                className={`flex flex-1 flex-col justify-center gap-1 border-t border-l sm:border-t-0 px-6 py-3 text-left transition-colors ${activePlan === "familiar" ? "bg-orange-50" : "hover:bg-gray-50"}`}
                            >
                                <span className="text-xs text-gray-600">Ind./Familiar</span>
                                <span className="text-2xl font-bold" style={{ color: "#FB923C" }}>
                                    {totalPlanos.familiar}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <ChartContainer config={planosConfig} className="h-[200px] w-full">
                            <BarChart
                                data={produtosData.planosCotacoes}
                                margin={{ left: 0, right: 0, top: 5, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} interval={0} style={{ fontSize: "12px" }} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Bar
                                    dataKey={activePlan}
                                    fill={activePlan === "empresarial" ? "var(--color-empresarial)" : "var(--color-familiar)"}
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4" style={{ color: activePlan === "empresarial" ? "#38B3AB" : "#FB923C" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-700">
                                    {activePlan === "empresarial" ? `Planos empresariais lideram com ${totalPlanos.empresarial} cotações` : `Planos ind./familiares totalizaram ${totalPlanos.familiar} cotações`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Faixas etárias mais comuns nas cotações</h3>
                        <p className="text-xs text-gray-500 mt-1">Distribuição por idade dos interessados</p>
                    </div>
                    <ChartContainer config={faixasEtariasConfig} className="h-[200px] w-full">
                        <BarChart
                            data={produtosData.faixasEtarias}
                            layout="vertical"
                            margin={{ left: 0, right: 16, top: 5, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="faixa" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4}>
                                <LabelList dataKey="faixa" position="insideLeft" offset={8} fill="white" fontSize={12} fontWeight={500} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-700">Faixa {topFaixa.faixa} lidera com {topFaixa.quantidade} cotações</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Clientes com Dependentes</h3>
                        <p className="text-xs text-gray-500 mt-1">{produtosData.comparativoLabels.label1} vs {produtosData.comparativoLabels.label2}</p>
                    </div>
                    <ChartContainer config={dependentesConfig} className="h-[250px] w-full">
                        <RadarChart data={produtosData.dependentes}>
                            <PolarGrid stroke="#f0f0f0" />
                            <PolarAngleAxis dataKey="dependentes" tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }} />
                            <Radar name={produtosData.comparativoLabels.label1} dataKey="mesPassado" stroke="var(--color-mesPassado)" fill="var(--color-mesPassado)" fillOpacity={0.4} />
                            <Radar name={produtosData.comparativoLabels.label2} dataKey="mesAtual" stroke="var(--color-mesAtual)" fill="var(--color-mesAtual)" fillOpacity={0.5} />
                            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        </RadarChart>
                    </ChartContainer>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#9CA3AF" }}></div>
                                <span className="text-xs text-gray-600">{produtosData.comparativoLabels.label1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FB923C" }}></div>
                                <span className="text-xs text-gray-600">{produtosData.comparativoLabels.label2}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={variacaoPercentual > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                            </svg>
                            <span className="text-xs font-medium text-gray-700">
                                {variacaoPercentual > 0 ? "Aumento" : variacaoPercentual < 0 ? "Reducao" : "Sem variacao"} de {Math.abs(variacaoPercentual)}% em clientes com dependentes ({produtosData.comparativoLabels.label1} vs {produtosData.comparativoLabels.label2})
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
