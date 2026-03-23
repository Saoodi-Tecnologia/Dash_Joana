import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retorna o intervalo seg 00:00 UTC a dom 23:59 UTC da SEMANA ANTERIOR
function getPreviousCalendarWeek(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;

    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - daysFromMonday);
    thisMonday.setUTCHours(0, 0, 0, 0);

    const prevMonday = new Date(thisMonday);
    prevMonday.setUTCDate(thisMonday.getUTCDate() - 7);

    const prevSunday = new Date(thisMonday.getTime() - 1);

    return { startDate: prevMonday, endDate: prevSunday };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        const { startDate, endDate } = getPreviousCalendarWeek();

        // Delega para get-dashboard-metrics com targetStartDate/targetEndDate
        const { data, error } = await supabase.functions.invoke('get-dashboard-metrics', {
            body: {
                generateInsights: true,
                forceRefetch: false,
                targetStartDate: startDate.toISOString(),
                targetEndDate: endDate.toISOString(),
            }
        });

        if (error) {
            throw new Error(`Erro ao invocar get-dashboard-metrics: ${error.message}`);
        }

        const total = Array.isArray(data) ? data.length : 0;
        console.log(`Insights gerados/atualizados. Total no historico: ${total}`);

        return new Response(JSON.stringify({ ok: true, total }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Erro ao gerar insights:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
