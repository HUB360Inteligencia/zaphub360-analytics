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
// ----------- POR ISSO -----------
async function countMessages(filter: any) {
  const { count, error } = await supabase
    .from('mensagens_enviadas')
    .select('id', { count: 'exact', head: true })
    .eq('id_campanha', campaignId)
    .match(filter); // aplica filtro
  if (error) throw error;
  return count ?? 0;
}

const totalMessages   = await countMessages({});
const sentMessages    = await countMessages({ status: 'enviado' });
const errorMessages   = await countMessages({ status: 'erro' });
const queuedMessages  = await countMessages({ status: 'fila' }); // ajuste se quiser incluir pendente/processando
const deliveredMessages = await supabase
  .from('mensagens_enviadas')
  .select('id', { count: 'exact', head: true })
  .eq('id_campanha', campaignId)
  .not('data_leitura', 'is', null);
const responseMessages = await supabase
  .from('mensagens_enviadas')
  .select('id', { count: 'exact', head: true })
  .eq('id_campanha', campaignId)
  .not('data_resposta', 'is', null);

const analytics = {
  totalMessages,
  sentMessages,
  deliveredMessages: deliveredMessages.count ?? 0,
  responseMessages: responseMessages.count ?? 0,
  errorMessages,
  queuedMessages,
  progressRate: totalMessages > 0 ? ((totalMessages - queuedMessages) / totalMessages) * 100 : 0,
  responseRate: (deliveredMessages.count ?? 0) > 0 ? ((responseMessages.count ?? 0) / (deliveredMessages.count ?? 0)) * 100 : 0,
};

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