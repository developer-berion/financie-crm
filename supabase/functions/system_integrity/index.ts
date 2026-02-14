
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
  const ELEVENLABS_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const BREVO_KEY = Deno.env.get('BREVO_API_KEY');
  const TWILIO_SID = Deno.env.get('SMS_TWILIO_ACCOUNT_SID') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID');
  const TWILIO_TOKEN = Deno.env.get('SMS_TWILIO_AUTH_TOKEN') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN');
  
  const TARGET_EMAIL = "victorstudent2411@gmail.com"; // Default recipient

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: any[] = [];
  let allSystemsGo = true;

  console.log("--- Starting System Integrity Check ---");

  // 1. Supabase (Database Read/Write Capability)
  // We check if we can read settings or leads.
  try {
    const start = performance.now();
    const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    const latency = (performance.now() - start).toFixed(2);
    
    if (error) throw error;
    
    results.push({ 
        service: 'Base de Datos (Supabase)', 
        status: '✅ ONLINE', 
        details: `Latency: ${latency}ms | Leads: ${data}` 
    });
  } catch (e) {
    console.error("Supabase Check Failed:", e);
    results.push({ service: 'Base de Datos (Supabase)', status: '❌ CRITICAL', details: e.message || 'Connection Failed' });
    allSystemsGo = false;
  }

  // 2. ElevenLabs (AI Voice API)
  if (ELEVENLABS_KEY) {
      try {
        const start = performance.now();
        const resp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
            headers: { 'xi-api-key': ELEVENLABS_KEY }
        });
        const latency = (performance.now() - start).toFixed(2);
        
        if (!resp.ok) throw new Error(`API Error ${resp.status}`);
        
        const data = await resp.json();
        // Warn if fewer than 1000 characters left, but don't fail the system
        const lowCredits = data.character_count > (data.character_limit - 1000);
        const status = lowCredits ? '⚠️ LOW CREDITS' : '✅ ONLINE';

        results.push({ 
            service: 'ElevenLabs AI', 
            status: status, 
            details: `Latency: ${latency}ms | Usage: ${data.character_count}/${data.character_limit}` 
        });
      } catch (e) {
        results.push({ service: 'ElevenLabs AI', status: '❌ ERROR', details: e.message });
        // Non-critical for CRM uptime, but critical for AI calls
        // allSystemsGo = false; // Decided to keep it non-blocking for CRM access
      }
  } else {
      results.push({ service: 'ElevenLabs AI', status: '⚠️ SKIPPED', details: 'No API Key configured' });
  }

  // 3. Brevo (Email System)
  if (BREVO_KEY) {
      try {
        const start = performance.now();
        const resp = await fetch('https://api.brevo.com/v3/account', {
            headers: { 'api-key': BREVO_KEY }
        });
        const latency = (performance.now() - start).toFixed(2);
        
        if (!resp.ok) throw new Error(`API Error ${resp.status}`);
        
        const data = await resp.json();
        results.push({ 
            service: 'Brevo (Email)', 
            status: '✅ ONLINE', 
            details: `Latency: ${latency}ms | Plan: ${data.plan[0]?.type || 'Free'}` 
        });
      } catch (e) {
        results.push({ service: 'Brevo (Email)', status: '❌ ERROR', details: e.message });
        allSystemsGo = false;
      }
  }

  // 4. Twilio (SMS System)
  if (TWILIO_SID && TWILIO_TOKEN) {
      try {
        const start = performance.now();
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}.json`, {
            headers: { 'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`) }
        });
        const latency = (performance.now() - start).toFixed(2);

        if (!resp.ok) throw new Error(`API Error ${resp.status}`);
        
        const data = await resp.json();
        results.push({ 
            service: 'Twilio (SMS)', 
            status: data.status === 'active' ? '✅ ONLINE' : '⚠️ SUSPENDED', 
            details: `Latency: ${latency}ms | Status: ${data.status}` 
        });
      } catch (e) {
        results.push({ service: 'Twilio (SMS)', status: '❌ ERROR', details: e.message });
      }
  }

  // 5. Make.com (Ingestion Readiness)
  // Since we don't control Make, we verify that our "Ingestion Endpoints" are reachable.
  // We already checked DB, so we just confirm the Webhook edge function is deployed.
  // Here we do a self-ping to 'meta_webhook' as a proxy for "Ingestion System".
  try {
       const start = performance.now();
       const whResp = await fetch(`${SUPABASE_URL}/functions/v1/meta_webhook`, {
            method: 'POST',
            body: JSON.stringify({ type: 'health_ping' }) // Invalid payload, should return 400 or specific error, but proves connectivity
       });
       const latency = (performance.now() - start).toFixed(2);
       
       // trace: true logs to Supabase
       results.push({
           service: 'Ingestion Webhooks',
           status: whResp.status < 500 ? '✅ READY' : '❌ ERROR',
           details: `Latency: ${latency}ms | Response: ${whResp.status}`
       });

  } catch (e) {
      results.push({ service: 'Ingestion Webhooks', status: '❌ UNREACHABLE', details: e.message });
  }


  // --- GENERATE REPORT HTML ---
  const statusColor = allSystemsGo ? '#28a745' : '#dc3545';
  const statusText = allSystemsGo ? 'SYSTEM OPERATIONAL' : 'SYSTEM ISSUES DETECTED';

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">${statusText}</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">${new Date().toLocaleString()}</p>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <p style="color: #666; margin-bottom: 20px;">
          This is a real-time integrity check of the Financie CRM infrastructure. 
          Each service below was actively pinged and verified.
        </p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <th style="padding: 12px; text-align: left; color: #495057;">Service</th>
              <th style="padding: 12px; text-align: center; color: #495057;">Status</th>
              <th style="padding: 12px; text-align: right; color: #495057;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr style="border-bottom: 1px solid #e9ecef;">
                <td style="padding: 12px; font-weight: 500;">${r.service}</td>
                <td style="padding: 12px; text-align: center;">${r.status}</td>
                <td style="padding: 12px; text-align: right; font-family: monospace; font-size: 0.85em; color: #666;">${r.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Generated by <strong>system_integrity</strong> Edge Function.</p>
          <p>If you see '❌ CRITICAL', immediate action is required.</p>
        </div>
      </div>
    </div>
  `;

  // --- SEND REPORT ---
  if (BREVO_KEY) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
              'api-key': BREVO_KEY,
              'content-type': 'application/json'
          },
          body: JSON.stringify({
              sender: { name: "Financie CRM Monitor", email: "system@financiegroup.com" },
              to: [{ email: TARGET_EMAIL }],
              subject: `[${allSystemsGo ? 'OK' : 'ALERT'}] System Integrity Report - ${new Date().toLocaleDateString()}`,
              htmlContent: htmlContent
          })
      });
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
})
