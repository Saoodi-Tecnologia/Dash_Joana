import React, { createContext, useContext, useEffect, useState } from 'react';
import { analyticsEngine } from '@/services/analyticsEngine';
import type { DashboardMetrics, SelectedPeriod } from '@/types/dashboard';

// ============================================================
// Dashboard Context — provider global de dados e estado da UI
// ============================================================

function getDefaultPeriod(): SelectedPeriod {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { preset: '7d', startDate: start, endDate: end };
}

interface DashboardContextValue {
    data: DashboardMetrics | null;
    isProcessing: boolean;
    error: string | null;
    lastUpdated: string | null;
    reload: (force?: boolean) => void;
    selectedPeriod: SelectedPeriod;
    setSelectedPeriod: (period: SelectedPeriod) => void;
    weeklyInsights: Record<string, string>;
    weeklyInsightsPeriodo: string | null;
    isLoadingInsights: boolean;
    reloadInsights: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<DashboardMetrics | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriodState] = useState<SelectedPeriod>(getDefaultPeriod());
    const [weeklyInsights, setWeeklyInsights] = useState<Record<string, string>>({});
    const [weeklyInsightsPeriodo, setWeeklyInsightsPeriodo] = useState<string | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);

    const load = async (force: boolean = false, period?: SelectedPeriod) => {
        const activePeriod = period ?? selectedPeriod;
        setIsProcessing(true);
        setError(null);
        try {
            const metrics = await analyticsEngine.fetchAndAnalyze(
                force,
                activePeriod.startDate,
                activePeriod.endDate
            );
            const { _lastUpdated, ...cleanMetrics } = metrics as any;
            setData(cleanMetrics);
            if (_lastUpdated) setLastUpdated(_lastUpdated);
        } catch (err) {
            console.error('DashboardContext error:', err);
            setError('Falha ao carregar os dados. Verifique a conexão.');
        } finally {
            setIsProcessing(false);
        }
    };

    const loadWeeklyInsights = async (force: boolean = false) => {
        setIsLoadingInsights(true);
        try {
            const insights = await analyticsEngine.generateWeeklyInsights(force);
            
            const hasContent = insights?.principalInsight || 
                               insights?.padroesIdentificados || 
                               insights?.recomendacoesEstrategicas;

            if (hasContent) {
                setWeeklyInsights(insights);
                setWeeklyInsightsPeriodo(insights.periodoStr ?? null);
            } else {
                setWeeklyInsights({});
                setWeeklyInsightsPeriodo(null);
            }
        } catch (e) {
            console.error('Erro ao carregar insights semanais:', e);
            setWeeklyInsights({});
            setWeeklyInsightsPeriodo(null);
        } finally {
            setIsLoadingInsights(false);
        }
    };

    const reloadInsights = async () => {
        await loadWeeklyInsights(true); // Força um novo insight do backend
    };

    const setSelectedPeriod = (period: SelectedPeriod) => {
        setSelectedPeriodState(period);
        load(false, period);
    };

    useEffect(() => {
        load();
        loadWeeklyInsights();
    }, []);

    return (
        <DashboardContext.Provider value={{ data, isProcessing, error, lastUpdated, reload: load, selectedPeriod, setSelectedPeriod, weeklyInsights, weeklyInsightsPeriodo, isLoadingInsights, reloadInsights }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboardContext(): DashboardContextValue {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboardContext must be used inside <DashboardProvider>');
    return ctx;
}
