
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ELEVENLABS_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
  const BREVO_KEY = Deno.env.get('BREVO_API_KEY')!;
  const TARGET_EMAIL = "victorstudent2411@gmail.com";

  // TEMPORARY DEBUG: Log the key to retrieve it
  // console.log("REVEAL_SERVICE_KEY:", SERVICE_KEY);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: any[] = [];
  let hasCriticalFailure = false;

  console.log("--- Starting Health Check ---");
// ...
// (I will do this in two chunks or just remove the lines I added)

  console.log("--- Starting Health Check ---");

  // 1. Supabase Check
  try {
    const { error } = await supabase.from('leads').select('id', { head: true, count: 'exact' });
    results.push({ service: 'Base de Datos', status: error ? '❌ FAIL' : '✅ OK', details: error ? error.message : 'Conexión estable' });
    if (error) hasCriticalFailure = true;
  } catch (e) {
    results.push({ service: 'Base de Datos', status: '❌ FAIL', details: e.message });
    hasCriticalFailure = true;
  }

  // 2. ElevenLabs Check
  try {
    const elResp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': ELEVENLABS_KEY }
    });
    const elData = await elResp.json();
    if (elResp.ok) {
        results.push({ service: 'ElevenLabs API', status: '✅ OK', details: `Créditos: ${elData.character_count}/${elData.character_limit}` });
    } else {
        results.push({ service: 'ElevenLabs API', status: '❌ FAIL', details: elData.detail?.message || 'Error de API' });
        hasCriticalFailure = true;
    }
  } catch (e) {
    results.push({ service: 'ElevenLabs API', status: '❌ FAIL', details: e.message });
    hasCriticalFailure = true;
  }

  // 3. Webhook Accessibility
  try {
    const whResp = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs_webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'health_monitor_ping' })
    });
    results.push({ service: 'Webhooks (Público)', status: whResp.ok ? '✅ OK' : '⚠️ ISSUE', details: whResp.ok ? 'Endpoint accesible' : `Status ${whResp.status}` });
  } catch (e) {
    results.push({ service: 'Webhooks (Público)', status: '❌ FAIL', details: e.message });
    hasCriticalFailure = true;
  }

  // 4. Compose Email
  const statusEmoji = hasCriticalFailure ? '🚨 ALERT' : '✅ SALUDABLE';
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: ${hasCriticalFailure ? '#d9534f' : '#33b37a'}">
        REPORTE DE SALUD: ${statusEmoji}
      </h2>
      <p>Reporte automático del sistema Financie CRM.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Servicio</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Estado</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Detalles</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${r.service}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.status}</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${r.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 11px; color: #777;">
        Este correo fue enviado automáticamente por la Edge Function health_monitor.
      </p>
    </div>
  `;

  // 5. Send Email via Brevo
  let emailSent = false;
  try {
      const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
              'api-key': BREVO_KEY,
              'content-type': 'application/json'
          },
          body: JSON.stringify({
              sender: { name: "Financie System Monitor", email: "system@financiegroup.com" },
              to: [{ email: TARGET_EMAIL }],
              subject: `${statusEmoji}: Estado de Integraciones - ${new Date().toLocaleDateString()}`,
              htmlContent: htmlContent
          })
      });
      emailSent = emailResp.ok;
  } catch (e) {
      console.error("Failed to send email:", e);
  }

  return new Response(
    JSON.stringify({ success: true, hasCriticalFailure, emailSent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
})
