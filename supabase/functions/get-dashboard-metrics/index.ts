import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AnalyticsEngine } from "./analytics.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { forceRefetch, startDate, endDate, generateInsights, targetStartDate, targetEndDate } = await req.json().catch(() => ({}));
        
        const engine = new AnalyticsEngine(supabase);

        if (generateInsights) {
            const targetStart = targetStartDate ? new Date(targetStartDate) : undefined;
            const targetEnd = targetEndDate ? new Date(targetEndDate) : undefined;
            const insights = await engine.generateWeeklyInsights(forceRefetch, targetStart, targetEnd);
            return new Response(JSON.stringify(insights), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        
        const metrics = await engine.fetchAndAnalyze(forceRefetch, start, end);

        return new Response(JSON.stringify(metrics), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
