import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { COMMUNICATIONS_ENABLED, getCorrelationId, getCorsHeaders, logStructured } from "../shared-utils.ts";

interface SystemCheckResult {
  service: string;
  status: string;
  details: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function parseRecipients(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function checkEdgeEndpoint(
  name: string,
  url: string,
  expectedStatuses: number[],
  body: Record<string, unknown> = {},
): Promise<SystemCheckResult> {
  const startedAt = performance.now();

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const latency = (performance.now() - startedAt).toFixed(2);
    const isExpected = expectedStatuses.includes(resp.status);

    return {
      service: name,
      status: isExpected ? 'ONLINE' : 'DEGRADED',
      details: `Latency: ${latency}ms | Status: ${resp.status} | Expected: ${expectedStatuses.join('/')}`,
    };
  } catch (error) {
    return {
      service: name,
      status: 'ERROR',
      details: getErrorMessage(error),
    };
  }
}

serve(async (req) => {
  const correlationId = getCorrelationId(req);
  const corsHeaders = {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        correlation_id: correlationId,
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      }),
      { status: 500, headers: corsHeaders },
    );
  }

  const ELEVENLABS_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const BREVO_KEY = Deno.env.get('BREVO_API_KEY');
  const TWILIO_SID = Deno.env.get('SMS_TWILIO_ACCOUNT_SID') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID');
  const TWILIO_TOKEN = Deno.env.get('SMS_TWILIO_AUTH_TOKEN') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN');
  const recipients = parseRecipients(Deno.env.get('SYSTEM_INTEGRITY_REPORT_RECIPIENTS'));

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: SystemCheckResult[] = [];
  let allSystemsGo = true;

  logStructured('info', 'system_integrity', 'start', { correlation_id: correlationId });

  try {
    const startedAt = performance.now();
    const { count, error } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    const latency = (performance.now() - startedAt).toFixed(2);

    if (error) throw error;

    results.push({
      service: 'Supabase Database',
      status: 'ONLINE',
      details: `Latency: ${latency}ms | Leads: ${count ?? 0}`,
    });
  } catch (error) {
    allSystemsGo = false;
    results.push({
      service: 'Supabase Database',
      status: 'CRITICAL',
      details: getErrorMessage(error),
    });
  }

  if (!COMMUNICATIONS_ENABLED) {
    results.push({
      service: 'ElevenLabs API',
      status: 'SKIPPED',
      details: 'Communications integration disabled by ENABLE_TWILIO_ELEVENLABS=false',
    });
  } else if (ELEVENLABS_KEY) {
    try {
      const startedAt = performance.now();
      const resp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': ELEVENLABS_KEY },
      });
      const latency = (performance.now() - startedAt).toFixed(2);

      if (!resp.ok) throw new Error(`API Error ${resp.status}`);
      const data = await resp.json();

      const lowCredits = data.character_count > (data.character_limit - 1000);
      results.push({
        service: 'ElevenLabs API',
        status: lowCredits ? 'LOW_CREDITS' : 'ONLINE',
        details: `Latency: ${latency}ms | Usage: ${data.character_count}/${data.character_limit}`,
      });
    } catch (error) {
      results.push({
        service: 'ElevenLabs API',
        status: 'ERROR',
        details: getErrorMessage(error),
      });
    }
  } else {
    results.push({
      service: 'ElevenLabs API',
      status: 'SKIPPED',
      details: 'ELEVENLABS_API_KEY not configured',
    });
  }

  if (BREVO_KEY) {
    try {
      const startedAt = performance.now();
      const resp = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': BREVO_KEY },
      });
      const latency = (performance.now() - startedAt).toFixed(2);

      if (!resp.ok) throw new Error(`API Error ${resp.status}`);
      const data = await resp.json();

      results.push({
        service: 'Brevo API',
        status: 'ONLINE',
        details: `Latency: ${latency}ms | Plan: ${data.plan?.[0]?.type || 'unknown'}`,
      });
    } catch (error) {
      allSystemsGo = false;
      results.push({
        service: 'Brevo API',
        status: 'ERROR',
        details: getErrorMessage(error),
      });
    }
  } else {
    results.push({
      service: 'Brevo API',
      status: 'SKIPPED',
      details: 'BREVO_API_KEY not configured',
    });
  }

  if (!COMMUNICATIONS_ENABLED) {
    results.push({
      service: 'Twilio API',
      status: 'SKIPPED',
      details: 'Communications integration disabled by ENABLE_TWILIO_ELEVENLABS=false',
    });
  } else if (TWILIO_SID && TWILIO_TOKEN) {
    try {
      const startedAt = performance.now();
      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}.json`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`) },
      });
      const latency = (performance.now() - startedAt).toFixed(2);

      if (!resp.ok) throw new Error(`API Error ${resp.status}`);
      const data = await resp.json();

      results.push({
        service: 'Twilio API',
        status: data.status === 'active' ? 'ONLINE' : 'SUSPENDED',
        details: `Latency: ${latency}ms | Account status: ${data.status}`,
      });
    } catch (error) {
      results.push({
        service: 'Twilio API',
        status: 'ERROR',
        details: getErrorMessage(error),
      });
    }
  } else {
    results.push({
      service: 'Twilio API',
      status: 'SKIPPED',
      details: 'Twilio credentials not configured',
    });
  }

  const endpointChecks = await Promise.all([
    checkEdgeEndpoint(
      'Edge orchestrate_lead',
      `${SUPABASE_URL}/functions/v1/orchestrate_lead`,
      [400, 401, 403],
      { type: 'health_ping' },
    ),
    checkEdgeEndpoint(
      'Edge call_webhook',
      `${SUPABASE_URL}/functions/v1/call_webhook`,
      [401, 403, 400],
      { type: 'health_ping' },
    ),
    checkEdgeEndpoint(
      'Edge sms_webhook',
      `${SUPABASE_URL}/functions/v1/sms_webhook`,
      [401, 403, 400],
      { type: 'health_ping' },
    ),
    ...(COMMUNICATIONS_ENABLED
      ? [
          checkEdgeEndpoint(
            'Edge elevenlabs_webhook',
            `${SUPABASE_URL}/functions/v1/elevenlabs_webhook`,
            [401, 400],
            { type: 'health_ping' },
          ),
        ]
      : [
          Promise.resolve({
            service: 'Edge elevenlabs_webhook',
            status: 'SKIPPED',
            details: 'Communications integration disabled by ENABLE_TWILIO_ELEVENLABS=false',
          } as SystemCheckResult),
        ]),
    checkEdgeEndpoint(
      'Edge call_dispatcher',
      `${SUPABASE_URL}/functions/v1/call_dispatcher`,
      [200, 401, 403],
      { type: 'health_ping' },
    ),
  ]);

  for (const check of endpointChecks) {
    if (check.status === 'ERROR' || check.status === 'DEGRADED') {
      allSystemsGo = false;
    }
    results.push(check);
  }

  if (BREVO_KEY && recipients.length > 0) {
    const subjectPrefix = allSystemsGo ? 'OK' : 'ALERT';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto;">
        <h2>System Integrity Report (${subjectPrefix})</h2>
        <p>Correlation ID: <code>${correlationId}</code></p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Service</th>
              <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Status</th>
              <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((r) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.service}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${r.status}</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Financie CRM Monitor', email: 'system@financiegroup.com' },
        to: recipients.map((email) => ({ email })),
        subject: `[${subjectPrefix}] System Integrity - ${new Date().toISOString().slice(0, 10)}`,
        htmlContent: html,
      }),
    });
  }

  try {
    const logsToInsert = results.map((row) => ({
      service: row.service,
      status: row.status,
      details: `${row.details} | correlation_id=${correlationId}`,
    }));
    await supabase.from('integrity_logs').insert(logsToInsert);
  } catch (error) {
    logStructured('warn', 'system_integrity', 'integrity_log_insert_failed', {
      correlation_id: correlationId,
      error: getErrorMessage(error),
    });
  }

  return new Response(
    JSON.stringify({ success: true, correlation_id: correlationId, results }),
    { headers: corsHeaders },
  );
})
