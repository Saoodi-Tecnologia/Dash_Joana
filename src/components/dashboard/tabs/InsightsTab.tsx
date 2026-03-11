import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { RefreshCcw } from 'lucide-react';

export function InsightsTab() {
    const { weeklyInsights, weeklyInsightsPeriodo, isLoadingInsights, reloadInsights } = useDashboard();

    const hasInsights = weeklyInsights &&
        (weeklyInsights.principalInsight || weeklyInsights.padroesIdentificados || weeklyInsights.recomendacoesEstrategicas);

    const LoadingCard = ({ color }: { color: string }) => (
        <div className={`bg-white rounded-lg p-5 shadow-sm border border-gray-200`}>
            <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-lg border animate-pulse`} style={{ background: color === 'blue' ? '#EFF6FF' : color === 'green' ? '#F0FDF4' : '#FFF7ED', borderColor: color === 'blue' ? '#BFDBFE' : color === 'green' ? '#BBF7D0' : '#FED7AA' }} />
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    {isLoadingInsights
                        ? 'Gerando insights com IA para os ultimos 7 dias de dados reais...'
                        : weeklyInsightsPeriodo
                            ? <>Insights de: <span className="font-medium text-gray-600">{weeklyInsightsPeriodo}</span> &bull; Atualiza automaticamente toda segunda-feira</>
                            : 'Aguardando geracao dos insights semanais'}
                </p>
            </div>

            {isLoadingInsights ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LoadingCard color="blue" />
                    <LoadingCard color="green" />
                    <LoadingCard color="orange" />
                </div>
            ) : !hasInsights ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500 mb-4">
                        A IA não obteve um insight válido para o período analisado. Pode ser devido à falta de dados ou limite da API.
                    </p>
                    <button
                        onClick={() => reloadInsights()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Gerar Novo Insight Agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-base text-blue-600">Principal Insight</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{weeklyInsights.principalInsight}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-base text-green-700">Padroes Identificados</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{weeklyInsights.padroesIdentificados}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-base text-orange-700">Recomendacoes Estrategicas</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{weeklyInsights.recomendacoesEstrategicas}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
