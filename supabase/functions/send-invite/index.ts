import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "saas_admin" | "client" | "viewer" | "guest" | "manager" | "agent";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing email or role" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Client with the requester's JWT to read current user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      }
    );

    const { data: userResult } = await anonClient.auth.getUser();
    const requester = userResult?.user;
    if (!requester) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Service role client for privileged DB writes
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get requester's profile to find organization
    const { data: profiles, error: profileErr } = await serviceClient
      .from("profiles")
      .select("id, full_name, organization_id, email")
      .eq("id", requester.id)
      .limit(1);

    if (profileErr) throw profileErr;
    const inviterProfile = profiles?.[0];
    if (!inviterProfile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "Requester has no organization" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique token via DB function
    const { data: tokenData, error: tokenErr } = await serviceClient.rpc(
      "generate_invite_token"
    );
    if (tokenErr) throw tokenErr;
    const token = tokenData as string;

    // Insert invitation
    const { error: insertErr } = await serviceClient.from("invitations").insert({
      email: email.toLowerCase(),
      role,
      organization_id: inviterProfile.organization_id,
      invited_by: inviterProfile.id,
      token,
    });
    if (insertErr) throw insertErr;

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ warning: "Invitation created but RESEND_API_KEY is missing. Email not sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    const siteUrl = req.headers.get("origin") || "";
    const acceptUrl = `${siteUrl}/auth?invite_token=${encodeURIComponent(token)}`;

    const html = `
      <h2>Você foi convidado para a organização</h2>
      <p>${inviterProfile.full_name || inviterProfile.email} convidou você para participar da organização.</p>
      <p>Para aceitar, clique no link abaixo:</p>
      <p><a href="${acceptUrl}">Aceitar convite</a></p>
      <p>Ou use este código: <strong>${token}</strong></p>
    `;

    await resend.emails.send({
      from: "Convites <onboarding@resend.dev>",
      to: [email],
      subject: "Você foi convidado(a)!",
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-invite error", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
