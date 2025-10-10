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

    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      console.error("Token de autenticação não fornecido");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Client with the requester's JWT to read current user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    console.log("Tentando autenticar usuário...");
    const { data: userResult, error: userError } = await anonClient.auth.getUser(token);
    
    if (userError) {
      console.error("Erro ao obter usuário:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: " + userError.message }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const requester = userResult?.user;
    if (!requester) {
      console.error("Usuário não encontrado no token");
      return new Response(
        JSON.stringify({ error: "Unauthorized: No user found in token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Usuário autenticado:", requester.email);

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

    // Send email via Resend (best-effort)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("INVITES_FROM_EMAIL") || "Convites <onboarding@resend.dev>";
    
    let emailStatus = "sent";
    let emailError = null;
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY não configurada, e-mail não será enviado");
      emailStatus = "not_configured";
    } else {
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

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject: "Você foi convidado(a)!",
          html,
        });
        console.log("E-mail enviado com sucesso para:", email);
      } catch (error: any) {
        console.error("Erro ao enviar e-mail via Resend:", error);
        emailStatus = "failed";
        emailError = error.message;
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      email_status: emailStatus,
      ...(emailError && { email_error: emailError })
    }), {
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
