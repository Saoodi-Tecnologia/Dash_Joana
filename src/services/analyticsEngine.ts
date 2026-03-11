import { supabase } from '../integrations/supabase/client';
import type { DashboardMetrics } from '@/types/dashboard';

// ============================================================
// Analytics Engine (Proxy to Edge Function)
// ============================================================
export class AnalyticsEngine {
    
    async generateWeeklyInsights(): Promise<Record<string, string>> {
        try {
            console.log('Solicitando insights semanais via Edge Function...');
            const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
                body: { generateInsights: true }
            });
            
            if (error) {
                console.error('Edge Function error:', error);
                return {};
            }

            return data;
        } catch (e) {
            console.error('Insights semanais: erro na requisição:', e);
            return {};
        }
    }

    async fetchAndAnalyze(
        forceRefetch: boolean = false,
        startDate?: Date,
        endDate?: Date
    ): Promise<DashboardMetrics & { _lastUpdated?: string }> {
        
        console.log('Fetching metrics via Edge Function proxy...');
        
        const payload: any = { forceRefetch };
        if (startDate && endDate) {
            payload.startDate = startDate.toISOString();
            payload.endDate = endDate.toISOString();
        }

        const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
            body: payload
        });

        if (error) {
            console.error('Edge Function error:', error);
            throw new Error('Falha ao processar métricas no servidor (Edge). A função get-dashboard-metrics pode não estar online.');
        }

        return data as DashboardMetrics & { _lastUpdated?: string };
    }
}

export const analyticsEngine = new AnalyticsEngine();
