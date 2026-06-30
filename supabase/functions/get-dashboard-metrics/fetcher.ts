import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getRawMessages(
    supabase: SupabaseClient,
    minDate?: Date,
    maxDate?: Date
): Promise<any[]> {
    let allMessages: any[] = [];
    let from = 0;
    const jump = 1000;

    while (true) {
        let query = supabase
            .schema('dashboard')
            .from('dash_mensagens_realtime')
            .select('session_id, conversation_id, contact_phone, content, message_type, is_ia, sender_type, received_at, chatwoot_created_at, atendimento_tipo, conversation_status, raw_payload')
            .eq('event_type', 'message_created')
            .not('received_at', 'is', null)
            .order('received_at', { ascending: true })
            .range(from, from + jump - 1);

        if (minDate) query = query.gte('received_at', minDate.toISOString());
        if (maxDate) query = query.lte('received_at', maxDate.toISOString());

        const { data, error } = await query;

        if (error) {
            console.error('getRawMessages error:', JSON.stringify(error));
            break;
        }
        if (!data || data.length === 0) break;

        allMessages = allMessages.concat(data);
        if (data.length < jump) break;
        from += jump;
    }

    return allMessages;
}
