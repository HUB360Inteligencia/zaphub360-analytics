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
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch campaign messages for analytics
    const { data: messages, error: messagesError } = await supabase
      .from('mensagens_enviadas')
      .select('*')
      .eq('id_campanha', campaignId);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Calculate analytics
    const analytics = messages ? {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => m.status === 'enviado').length,
      deliveredMessages: messages.filter(m => m.data_leitura).length,
      responseMessages: messages.filter(m => m.data_resposta).length,
      errorMessages: messages.filter(m => m.status === 'erro').length,
      queuedMessages: messages.filter(m => ['fila', 'pendente', 'processando'].includes(m.status)).length,
      progressRate: messages.length > 0 ? 
        ((messages.length - messages.filter(m => ['fila', 'pendente', 'processando'].includes(m.status)).length) / messages.length) * 100 : 0,
      responseRate: messages.filter(m => m.data_leitura).length > 0 ?
        (messages.filter(m => m.data_resposta).length / messages.filter(m => m.data_leitura).length) * 100 : 0,
    } : null;

    const responseData = {
      ...campaign,
      analytics
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in public-campaign-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
