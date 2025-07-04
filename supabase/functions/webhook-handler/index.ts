import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook source (you should implement proper verification)
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      console.warn('Webhook received without signature');
    }

    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload received:', payload);

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

    // Update message status
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .update({
        status: payload.status,
        delivered_at: payload.status === 'delivered' ? new Date().toISOString() : null,
        read_at: payload.status === 'read' ? new Date().toISOString() : null,
        error_message: payload.error_message || null,
        whatsapp_message_id: payload.message_id
      })
      .eq('whatsapp_message_id', payload.message_id)
      .select('campaign_id')
      .maybeSingle();

    if (messageError) {
      console.error('Error updating message:', messageError);
      return new Response(
        JSON.stringify({ error: 'Failed to update message' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update campaign metrics if message belongs to a campaign
    if (message?.campaign_id) {
      await updateCampaignMetrics(supabase, message.campaign_id, payload.status);
    }

    // Log the webhook event
    await supabase
      .from('mensagens_enviadas')
      .insert({
        contato: payload.phone,
        status_mensagem: payload.status as any,
        content: `Webhook: ${payload.status}`,
        campanha: payload.campaign_id || null,
        evento: 'webhook_received'
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