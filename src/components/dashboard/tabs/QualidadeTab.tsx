import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';

export function QualidadeTab() {
    const { qualidadeData } = useDashboard();

    const maxFreq = qualidadeData.perguntasFrequentes.length > 0 ?
        Math.max(...qualidadeData.perguntasFrequentes.map(p => p.frequencia)) : 1;

    const scoreLabel =
        qualidadeData.score >= 85 ? 'Excelente performance da Joana' :
            qualidadeData.score >= 70 ? 'Boa performance da Joana' :
                qualidadeData.score >= 50 ? 'Performance moderada da Joana' :
                    'Performance abaixo do esperado';

    const compreensaoLabel =
        qualidadeData.kpis.taxaCompreensao >= 90 ? 'Baixas repetições' :
            qualidadeData.kpis.taxaCompreensao >= 75 ? 'Repetições moderadas' :
                'Alto índice de repetições';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Taxa Compreensão</div>
                    <div className="text-2xl font-bold text-green-600">{qualidadeData.kpis.taxaCompreensao.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 mt-1">{compreensaoLabel}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Msgs Repetidas</div>
                    <div className="text-2xl font-bold text-yellow-600">{qualidadeData.kpis.msgsRepetidasPct.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 mt-1">{qualidadeData.kpis.msgsRepetidasCount} ocorrências</div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="relative flex justify-center items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Score de Qualidade</h3>
                    <div className="absolute right-0 top-0 group">
                        <button className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <div className="absolute right-0 top-8 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Como o Score é calculado?</h4>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 mt-0.5"><span className="text-green-600 font-bold text-sm">↑</span></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">Taxa de Conversão (+)</p>
                                        <p className="text-xs text-gray-500">O score sobe quando leads concluem a venda e a Joana gera o cliente oficial.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 mt-0.5"><span className="text-red-500 font-bold text-sm">↓</span></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">Taxa de Abandono (-)</p>
                                        <p className="text-xs text-gray-500">O score é penalizado por clientes que param de interagir.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 mt-0.5"><span className="text-orange-500 font-bold text-sm">↓↓</span></div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">Frustração do Cliente (- -)</p>
                                        <p className="text-xs text-gray-500">Forte penalidade quando o cliente demonstra irritação (ex: "atendente", "não entendi").</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center py-4">
                    <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#38B3AB"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56 * (qualidadeData.score / 100)} ${2 * Math.PI * 56}`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-gray-900">{qualidadeData.score}</span>
                        </div>
                    </div>
                </div>
                <div className="text-center text-sm text-gray-600">{scoreLabel}</div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Perguntas Frequentes</h3>
                <div className="space-y-3">
                    {qualidadeData.perguntasFrequentes.map((item, index) => (
                        <div key={index} className="mb-4">
                            <div className="flex items-center mb-1">
                                <div className="flex-1">
                                    <div className="text-sm text-gray-700">{item.pergunta}</div>
                                </div>
                                <div className="ml-3 text-sm font-semibold text-gray-600">{item.frequencia}</div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                                <div
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${maxFreq > 0 ? (item.frequencia / maxFreq) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {item.exemplos.map((exemplo, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200"
                                    >
                                        "{exemplo}"
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
