import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import type { WeeklyInsight, InsightNegocio, InsightMarketing } from '@/types/dashboard';

type SubAba = 'negocio' | 'marketing';

// ============================================================
// InsightsTab — Feed historico de relatorios semanais com dois agentes
// ============================================================

function CardNegocio({ data }: { data: InsightNegocio }) {
    return (
        <div className="space-y-4">

            {/* Impacto Financeiro — destaque topo */}
            {data.impactoFinanceiro && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Impacto Financeiro da Semana</p>
                    <p className="text-sm text-emerald-900 leading-relaxed font-medium">{data.impactoFinanceiro}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Perfil do Lead</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{data.perfilDoLead}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Objecao Predominante</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{data.objecaoPredominante}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Comportamento de Abandono</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{data.comportamentoDeAbandono}</p>
                </div>
            </div>

            {/* Acoes com gradacao de urgencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.acaoImediata && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Acao Imediata — Hoje</p>
                        <p className="text-sm text-red-900 leading-relaxed">{data.acaoImediata}</p>
                    </div>
                )}
                {data.ajusteDeProcesso && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Ajuste de Processo — Esta Semana</p>
                        <p className="text-sm text-blue-900 leading-relaxed">{data.ajusteDeProcesso}</p>
                    </div>
                )}
            </div>

            {/* Multiplas evidencias ou fallback para unica string legado */}
            {(data.evidenciasReais && data.evidenciasReais.length > 0) ? (
                <div className="border-l-2 border-slate-300 pl-4 py-1 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Evidencias Reais ({data.evidenciasReais.length})
                    </p>
                    {data.evidenciasReais.map((evidencia, idx) => (
                        <p key={idx} className="text-sm text-slate-600 italic leading-relaxed">
                            {evidencia}
                        </p>
                    ))}
                </div>
            ) : data.evidenciaReal ? (
                <div className="border-l-2 border-slate-300 pl-4 py-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Evidencia Real</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">{data.evidenciaReal}</p>
                </div>
            ) : null}
        </div>
    );
}

function CardMarketing({ data }: { data: InsightMarketing }) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const CopyButton = ({ text, id }: { text: string, id: string }) => {
        const isCopied = copiedKey === id;
        return (
            <button
                onClick={() => handleCopy(text, id)}
                className="absolute top-3 right-3 p-1.5 rounded-md transition-colors bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800"
                title="Copiar texto"
            >
                {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
        );
    };

    return (
        <div className="space-y-5">

            {/* Tom de Voz */}
            {data.tomDeVoz && (
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tom de Voz Sugerido</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.tomDeVoz}</p>
                </div>
            )}

            {/* Ganchos A/B/C */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Headlines para Teste</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative group">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 pr-6">Gancho A</p>
                        <p className="text-sm font-semibold text-amber-900 leading-relaxed">{data.gancho1}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={data.gancho1} id="gancho1" />
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative group">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 pr-6">Gancho B</p>
                        <p className="text-sm font-semibold text-amber-900 leading-relaxed">{data.gancho2}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={data.gancho2} id="gancho2" />
                        </div>
                    </div>
                    {data.gancho3 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative group">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 pr-6">Gancho C</p>
                            <p className="text-sm font-semibold text-amber-900 leading-relaxed">{data.gancho3}</p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={data.gancho3} id="gancho3" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Copies por Canal */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Copies por Canal</p>
                <div className="space-y-3">
                    {data.copyFeed && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 relative group">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 pr-6">Feed / Carrossel</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.copyFeed}</p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={data.copyFeed} id="copyFeed" />
                            </div>
                        </div>
                    )}
                    {data.copyStories && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 relative group">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 pr-6">Stories / Reels</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.copyStories}</p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={data.copyStories} id="copyStories" />
                            </div>
                        </div>
                    )}
                    {data.copyWhatsapp && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 relative group">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 pr-6">WhatsApp (primeiro contato)</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.copyWhatsapp}</p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={data.copyWhatsapp} id="copyWhatsapp" />
                            </div>
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 relative group">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 pr-6">Copy Principal (Geral)</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.copyPrincipal}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={data.copyPrincipal} id="copyPrincipal" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Estrategia */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estrategia e Audiencia</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Angulo de Posicionamento</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.anguloDePositionamento}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Segmento Sugerido</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.segmentoSugerido}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Antecipacao de Objecao</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{data.antecipacaoDeObjecao}</p>
                    </div>
                </div>
            </div>

            {/* Palavras-chave negativas */}
            {data.palavrasChaveNegativas && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Negativar no Google / Meta Ads</p>
                    <p className="text-sm text-red-800 leading-relaxed">{data.palavrasChaveNegativas}</p>
                </div>
            )}
        </div>
    );
}

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function InsightAccordionItem({ insight, subAba }: { insight: WeeklyInsight; subAba: SubAba }) {
    const hasNegocio = !!insight.negocio;
    const hasMarketing = !!insight.marketing;
    const itemId = `item-${insight.timestamp}`;

    const renderLegado = () => (
        <div className="space-y-3">
            {insight.principalInsight && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Principal Insight</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{insight.principalInsight}</p>
                </div>
            )}
            {insight.padroesIdentificados && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Padroes Identificados</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{insight.padroesIdentificados}</p>
                </div>
            )}
            {insight.recomendacoesEstrategicas && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recomendacoes Estrategicas</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{insight.recomendacoesEstrategicas}</p>
                </div>
            )}
        </div>
    );

    return (
        <AccordionItem 
            value={itemId} 
            className="bg-white border text-left border-gray-200 rounded-lg shadow-sm overflow-hidden mb-3 data-[state=open]:border-slate-400 [&[data-state=open]>div>button]:bg-slate-50"
        >
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-1">
                    <span className="text-sm font-semibold text-gray-700">
                        Período: <span className="text-gray-900 ml-1">{insight.periodoStr}</span>
                    </span>
                    <span className="text-xs text-gray-400 font-normal">
                        Gerado em: {new Date(insight.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-5 pt-4 border-t border-gray-100">
                {!hasNegocio && !hasMarketing ? (
                    renderLegado()
                ) : subAba === 'negocio' ? (
                    hasNegocio ? (
                        <CardNegocio data={insight.negocio!} />
                    ) : (
                        <p className="text-sm text-gray-400 italic">Analise de negocio nao disponivel para este periodo.</p>
                    )
                ) : (
                    hasMarketing ? (
                        <CardMarketing data={insight.marketing!} />
                    ) : (
                        <p className="text-sm text-gray-400 italic">Analise de marketing nao disponivel para este periodo.</p>
                    )
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

// Agrupa um array de WeeklyInsight por mes/ano da data do timestamp
function groupByMonth(insights: WeeklyInsight[]): { mesLabel: string; items: WeeklyInsight[] }[] {
    const map: Record<string, WeeklyInsight[]> = {};
    const order: string[] = [];

    insights.forEach(insight => {
        const d = new Date(insight.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (!map[key]) {
            map[key] = [];
            order.push(key);
        }
        map[key].push(insight);
        // Garante que a label fica associada
        (map[key] as any)._label = label;
    });

    return order.map(key => ({
        mesLabel: ((map[key] as any)._label as string),
        items: map[key]
    }));
}

function MonthGroupedFeed({ insights, subAba }: { insights: WeeklyInsight[]; subAba: SubAba }) {
    // So agrupa se houver insights de mais de um mes diferente
    const groups = groupByMonth(insights);
    const multiMes = groups.length > 1;

    // Queremos que apenas o primeiro insight venha aberto por padrao
    const firstInsightId = insights.length > 0 ? `item-${insights[0].timestamp}` : undefined;

    return (
        <Accordion type="single" collapsible defaultValue={firstInsightId} className="w-full space-y-6">
            {groups.map((group) => (
                <div key={group.mesLabel} className="space-y-3">
                    {multiMes && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize">
                                {group.mesLabel}
                            </span>
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">{group.items.length} {group.items.length === 1 ? 'relatório' : 'relatórios'}</span>
                        </div>
                    )}
                    <div className="space-y-0">
                        {group.items.map((insight, idx) => (
                            <InsightAccordionItem key={insight.timestamp ?? idx} insight={insight} subAba={subAba} />
                        ))}
                    </div>
                </div>
            ))}
        </Accordion>
    );
}

export function InsightsTab() {
    const { weeklyInsights, isLoadingInsights, origemTrafego } = useDashboard();
    const [subAba, setSubAba] = useState<SubAba>('negocio');

    const hasInsights = weeklyInsights.length > 0;

    const LoadingBlock = () => (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Cabecalho com subnavegacao */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setSubAba('negocio')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        subAba === 'negocio'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Negocio
                </button>
                <button
                    onClick={() => setSubAba('marketing')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        subAba === 'marketing'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Marketing
                </button>
            </div>

            {/* Descricao da subaba ativa */}
            <p className="text-xs text-gray-400">
                {subAba === 'negocio'
                    ? 'Analise operacional da semana: gargalos no funil, perfil do lead, objecoes e recomendacoes taticas para a equipe de vendas.'
                    : 'Inteligencia de conteudo: ganchos, copies e direcionamentos prontos para campanhas e criativos.'
                }
            </p>

            {/* Cards de Origem de Trafego — so no marketing */}
            {subAba === 'marketing' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 flex-shrink-0 rounded-full bg-pink-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instagram Ads</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{origemTrafego.instagram}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {origemTrafego.total > 0
                                ? `${Math.round((origemTrafego.instagram / origemTrafego.total) * 100)}% dos leads`
                                : 'Sem dados'
                            }
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 flex-shrink-0 rounded-full bg-blue-600" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facebook Ads</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{origemTrafego.facebook}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {origemTrafego.total > 0
                                ? `${Math.round((origemTrafego.facebook / origemTrafego.total) * 100)}% dos leads`
                                : 'Sem dados'
                            }
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 flex-shrink-0 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organico / Site</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{origemTrafego.organico}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {origemTrafego.total > 0
                                ? `${Math.round((origemTrafego.organico / origemTrafego.total) * 100)}% dos leads`
                                : 'Sem dados'
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Conteudo */}
            {isLoadingInsights ? (
                <div className="space-y-3">
                    <LoadingBlock />
                    <LoadingBlock />
                </div>
            ) : !hasInsights ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">
                        Nenhum relatorio disponivel para o periodo selecionado.
                    </p>
                </div>
            ) : (
                <MonthGroupedFeed insights={weeklyInsights} subAba={subAba} />
            )}
        </div>
    );
}
