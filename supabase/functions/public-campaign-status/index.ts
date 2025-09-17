import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== 1) Campanha (igual ao seu original) =====
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== 2) Analytics sem limite de 1000 (apenas contagens) =====
    // Tipagem como "any" evita problema de tipo no Deno com o builder retornado por supabase.from(...)
    const countExact = async (qb: any) => {
      const { count, error } = await qb.select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    };

    // Execute em paralelo; se alguma falhar, o catch abaixo retorna o erro detalhado
    const [
      totalMessages,
      queuedMessages,
      sentMessages,
      deliveredMessages,
      responseMessages,
      errorMessages,
    ] = await Promise.all([
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
      ),
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
          .in('status', ['fila', 'pendente', 'processando'])
      ),
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
          .eq('status', 'enviado')
      ),
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
          .not('data_leitura', 'is', null)
      ),
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
          .not('data_resposta', 'is', null)
      ),
      countExact(
        supabase.from('mensagens_enviadas')
          .eq('id_campanha', campaignId)
          .eq('status', 'erro')
      ),
    ]);

    const analytics = {
      totalMessages,
      sentMessages,
      deliveredMessages,
      responseMessages,
      errorMessages,
      queuedMessages,
      progressRate: totalMessages > 0 ? ((totalMessages - queuedMessages) / totalMessages) * 100 : 0,
      responseRate: deliveredMessages > 0 ? (responseMessages / deliveredMessages) * 100 : 0,
    };

    // ===== 3) Resposta final =====
    const responseData = { ...campaign, analytics };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    // Retorna o erro no body para você ver no DevTools → Network → Response
    console.error('Error in public-campaign-status function:', error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
