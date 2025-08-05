import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

interface WebhookPayload {
  message_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  phone: string;
  timestamp: string;
  error_message?: string;
  campaign_id?: string;
  contact_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    
    // Verify webhook signature if configured
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    if (webhookSecret && signature) {
      const expectedSignature = hmac("sha256", webhookSecret, body, "utf8", "hex")
      const providedSignature = signature.replace('sha256=', '')
      
      if (expectedSignature !== providedSignature) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized', { 
          status: 401, 
          headers: corsHeaders 
        })
      }
    } else if (webhookSecret) {
      console.error('Webhook secret configured but no signature provided')
      return new Response('Signature required', { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    const payload: WebhookPayload = JSON.parse(body)
    console.log('Webhook received:', payload)

    // Validate required fields
    if (!payload.message_id || !payload.status || !payload.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update message status in event_messages
    const { data: eventMessage, error: eventMessageError } = await supabase
      .from('event_messages')
      .update({
        status: payload.status,
        delivered_at: payload.status === 'delivered' ? new Date().toISOString() : null,
        read_at: payload.status === 'read' ? new Date().toISOString() : null,
        error_message: payload.error_message || null,
        id_wpp_msg: payload.message_id
      })
      .eq('id_wpp_msg', payload.message_id)
      .select('event_id')
      .maybeSingle();

    // Also try to update in mensagens_enviadas
    await supabase
      .from('mensagens_enviadas')
      .update({
        status: payload.status,
        data_leitura: payload.status === 'read' ? new Date().toISOString() : null,
        id_mensagem_wpp: payload.message_id
      })
      .eq('id_mensagem_wpp', payload.message_id);

    // Update campaign metrics if message belongs to a campaign
    if (payload.campaign_id) {
      await updateCampaignMetrics(supabase, payload.campaign_id, payload.status);
    }

    // Log the webhook event
    await supabase
      .from('mensagens_enviadas')
      .insert({
        celular: payload.phone,
        status: payload.status,
        tipo_fluxo: 'webhook',
        id_mensagem_wpp: payload.message_id,
        data_envio: new Date().toISOString()
      });

    console.log('Webhook processed successfully');
    
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

async function updateCampaignMetrics(supabase: any, campaignId: string, status: string) {
  try {
    // Get current campaign data
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('metrics')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      console.error('Error fetching campaign for metrics update:', fetchError);
      return;
    }

    const currentMetrics = campaign.metrics || { sent: 0, delivered: 0, read: 0, failed: 0 };
    
    // Update the appropriate metric
    switch (status) {
      case 'sent':
        currentMetrics.sent = (currentMetrics.sent || 0) + 1;
        break;
      case 'delivered':
        currentMetrics.delivered = (currentMetrics.delivered || 0) + 1;
        break;
      case 'read':
        currentMetrics.read = (currentMetrics.read || 0) + 1;
        break;
      case 'failed':
        currentMetrics.failed = (currentMetrics.failed || 0) + 1;
        break;
    }

    // Update campaign metrics
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ metrics: currentMetrics })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign metrics:', updateError);
    } else {
      console.log('Campaign metrics updated successfully');
    }

  } catch (error) {
    console.error('Error in updateCampaignMetrics:', error);
  }
}