import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";


// ── CORS Configuration (CRM-005) ──────────────────────────────────────
// Allowed origins for browser-based requests.
// Server-to-server calls (Meta, Twilio, Calendly, Brevo webhooks) don't send Origin headers.
const ALLOWED_ORIGINS = [
  'https://crm.financiegroup.com',
  'https://financiegroup.com',
  'https://www.financiegroup.com',
  'https://portal-staging.financiegroup.com',
  'http://localhost:5173',   // Vite dev
  'http://localhost:5174',   // Vite preview
  'http://localhost:3000',   // Alt dev
];

// ── Feature Flags (CRM-009) ───────────────────────────────────────────
// Master switch for Twilio and ElevenLabs integrations.
// Defaults to FALSE to ensure features are hidden/disabled in production.
export const COMMUNICATIONS_ENABLED = Deno.env.get('ENABLE_TWILIO_ELEVENLABS') === 'true';


export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}

// Legacy export for backward compatibility — defaults to production origin.
// Edge functions that handle ONLY server-to-server webhooks can use this safely.
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://crm.financiegroup.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// ── Safe Logging Utility (CRM-003) ────────────────────────────────────
// Masks PII (emails, phones, names) before logging to prevent data leaks.
const PII_KEYS = ['phone', 'email', 'full_name', 'name', 'to', 'from', 'From', 'To', 'Body', 'phone_number'];

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('email')) return value.replace(/(.{2}).*(@.*)/, '$1***$2');
  if (lowerKey.includes('phone') || lowerKey === 'to' || lowerKey === 'from' || lowerKey === 'sms')
    return value.replace(/(\+?\d{1,3})\d{4,}(\d{2})/, '$1****$2');
  if (lowerKey.includes('name') || lowerKey === 'full_name')
    return value.length > 2 ? value.substring(0, 2) + '***' : '***';
  return value;
}

function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.some(piiKey => key.toLowerCase().includes(piiKey.toLowerCase()))) {
      sanitized[key] = maskValue(key, value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Safe logger that masks PII fields before writing to console.
 * Use instead of console.log when logging objects that may contain user data.
 */
export function safeLog(message: string, data?: unknown): void {
  if (data === undefined) {
    console.log(message);
    return;
  }
  if (typeof data === 'object' && data !== null) {
    console.log(message, JSON.stringify(sanitizeObject(data)));
  } else {
    console.log(message, data);
  }
}

/** Masks a phone number for safe logging: +1786****63 */
export function maskPhone(phone: string): string {
  if (!phone) return '[no-phone]';
  return phone.replace(/(\+?\d{1,3})\d{4,}(\d{2})/, '$1****$2');
}

/** Masks an email for safe logging: bi***@gmail.com */
export function maskEmail(email: string): string {
  if (!email) return '[no-email]';
  return email.replace(/(.{2}).*(@.*)/, '$1***$2');
}

export const US_STATE_TIMEZONES: Record<string, string> = {
  'AL': 'America/Chicago', 'AK': 'America/Anchorage', 'AZ': 'America/Phoenix', 'AR': 'America/Chicago',
  'CA': 'America/Los_Angeles', 'CO': 'America/Denver', 'CT': 'America/New_York', 'DE': 'America/New_York',
  'FL': 'America/New_York', 'GA': 'America/New_York', 'HI': 'America/Honolulu', 'ID': 'America/Denver',
  'IL': 'America/Chicago', 'IN': 'America/Indiana/Indianapolis', 'IA': 'America/Chicago', 'KS': 'America/Chicago',
  'KY': 'America/New_York', 'LA': 'America/Chicago', 'ME': 'America/New_York', 'MD': 'America/New_York',
  'MA': 'America/New_York', 'MI': 'America/Detroit', 'MN': 'America/Chicago', 'MS': 'America/Chicago',
  'MO': 'America/Chicago', 'MT': 'America/Denver', 'NE': 'America/Chicago', 'NV': 'America/Los_Angeles',
  'NH': 'America/New_York', 'NJ': 'America/New_York', 'NM': 'America/Denver', 'NY': 'America/New_York',
  'NC': 'America/New_York', 'ND': 'America/Chicago', 'OH': 'America/New_York', 'OK': 'America/Chicago',
  'OR': 'America/Los_Angeles', 'PA': 'America/New_York', 'RI': 'America/New_York', 'SC': 'America/New_York',
  'SD': 'America/Chicago', 'TN': 'America/Chicago', 'TX': 'America/Chicago', 'UT': 'America/Denver',
  'VT': 'America/New_York', 'VA': 'America/New_York', 'WA': 'America/Los_Angeles', 'WV': 'America/New_York',
  'WI': 'America/Chicago', 'WY': 'America/Denver'
};

export const FULL_STATE_TO_ABBR: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

export function getSafeCallTime(stateStr?: string): Date {
    const now = new Date();
    const fallback = new Date(now.getTime() + 1 * 60 * 1000); // 1 min delay
    
    if (!stateStr) return fallback;
    
    const normalized = stateStr.trim().toLowerCase();
    const abbr = FULL_STATE_TO_ABBR[normalized] || normalized.toUpperCase();
    const timezone = US_STATE_TIMEZONES[abbr];
    
    if (!timezone) {
        console.log(`Unverifiable state: ${stateStr}, calling immediately.`);
        return fallback; 
    }

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const localHour = parseInt(map.hour);

        // Safe window: 9 AM - 8 PM
        if (localHour >= 9 && localHour < 20) {
            return fallback;
        }

        // Calculate target UTC for 9 AM local
        const targetLocal = new Date(formatter.format(now));
        if (localHour >= 20) {
            targetLocal.setDate(targetLocal.getDate() + 1);
        }
        targetLocal.setHours(9, 0, 0, 0);

        const wallStr = targetLocal.toLocaleString('en-US', { timeZone: timezone, hour12: false });
        const wallDate = new Date(wallStr);
        const offset = wallDate.getTime() - targetLocal.getTime();
        
        return new Date(targetLocal.getTime() - offset);
    } catch (e) {
        console.error('Error calculating TZ:', e);
        return fallback;
    }
}

export function getLeadTimeZone(stateStr?: string): string {
    if (!stateStr) return 'America/New_York';
    const normalized = stateStr.trim().toLowerCase();
    const abbr = FULL_STATE_TO_ABBR[normalized] || normalized.toUpperCase();
    return US_STATE_TIMEZONES[abbr] || 'America/New_York';
}

export function getLeadContext(stateStr: string | null, createdAt: string) {
    const timeZone = getLeadTimeZone(stateStr || undefined);
    const date = new Date(createdAt);

    // Format Date: "25 de enero"
    const dateStr = new Intl.DateTimeFormat('es-US', { day: 'numeric', month: 'long', timeZone }).format(date);
    // Format Time: "11:21 PM"
    const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone }).format(date);

    return {
        signup_date: dateStr,
        signup_time: timeStr,
        lead_state: stateStr || 'Estados Unidos'
    };
}

export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export async function verifyMetaSignature(payload: string, signature: string, secret: string): Promise<boolean> {
   if (!signature) return false;
   const encoder = new TextEncoder();
   const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  // Meta sends "sha256=..."
  const hashPart = signature.split('=')[1];
  if(!hashPart) return false;

  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(hashPart.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))),
    encoder.encode(payload)
  );

  return verified;
}

export async function verifyCalendlySignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
    if (!signatureHeader) return false;
    const parts = signatureHeader.split(',');
    const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    
    if (!t || !signature) return false;

    // Calendly expects signature on `${t}.${payload}`
    const dataToSign = `${t}.${payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const verified = await crypto.subtle.verify(
        "HMAC",
        key,
        new Uint8Array(signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))),
        encoder.encode(dataToSign)
    );
    
    return verified;
}

export async function verifyElevenLabsSignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
    if (!signatureHeader) return false;
    
    // Header format: t=timestamp,v0=hash
    const parts = signatureHeader.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v0Part = parts.find(p => p.startsWith('v0='));
    
    if (!tPart || !v0Part) return false;
    
    const timestamp = tPart.split('=')[1];
    const signature = v0Part.split('=')[1];
    
    if (!timestamp || !signature) return false;

    // Computed input: timestamp.request_body
    const dataToSign = `${timestamp}.${payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const verified = await crypto.subtle.verify(
        "HMAC",
        key,
        new Uint8Array(signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))),
        encoder.encode(dataToSign)
    );
    
    return verified;
}

/**
 * Validates Twilio Request Signature.
 * Twilio signature is complex (requires alphabetical key sorting, full URL).
 * Implementing a simplified check or using standard Twilio logic if possible.
 */
export async function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): Promise<boolean> {
    if (!signature || !authToken) return false;
    
    // Twilio's algorithm:
    // 1. Sort params alphabetically
    // 2. Append key-value pairs to URL
    // 3. HMAC-SHA1 the whole thing with authToken
    
    let signatureBase = url;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
        signatureBase += key + (params[key] || '');
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(authToken),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );

    const signed = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(signatureBase)
    );
    
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signed)));
    return computedSignature === signature;
}

export async function sendSms(to: string, body: string) {
    if (!COMMUNICATIONS_ENABLED) {
        console.warn('Twilio/ElevenLabs disabled via ENABLE_TWILIO_ELEVENLABS=false. SMS skipped:', { to, body });
        return { success: true, simulated: true, sid: 'DISABLED_BY_CONFIG' };
    }

    const accountSid = Deno.env.get('SMS_TWILIO_ACCOUNT_SID') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('SMS_TWILIO_AUTH_TOKEN') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID');

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials missing. SMS simulated:', { to, body });
        return { success: true, simulated: true, sid: 'SIMULATED_' + Date.now() };
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    // Construct the status callback URL dynamically
    const statusCallback = supabaseUrl ? `${supabaseUrl}/functions/v1/sms_webhook` : undefined;

    safeLog(`[SMS] Sending to ${maskPhone(to)}. StatusCallback: ${statusCallback}`);

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Body', body);
    
    if (statusCallback) {
        formData.append('StatusCallback', statusCallback);
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Twilio Error:', data);
            throw new Error(data.message || 'Twilio failed');
        }
        
        safeLog('[SMS] Twilio Success Response', { sid: data.sid, status: data.status });
        // Twilio v2010 returns 'sid' (lowercase) usually, but we fallback just in case
        const sid = data.sid || data.Sid;

        return { success: true, sid: sid };
    } catch (error) {
        console.error('SMS Send Failed:', error);
        // We log but maybe don't block the whole flow?
        return { success: false, error: error.message };
    }
}




/**
 * Safe fetch wrapper with exponential backoff retry logic.
 * Retries on network errors and 5xx status codes.
 * Default: 3 attempts.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 300): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        if (retries > 0 && response.status >= 500) {
            safeLog(`[Fetch] Retrying ${url} (${response.status}). Attempts left: ${retries}`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            safeLog(`[Fetch] Network error requesting ${url}. Retrying...`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

interface LeadContext {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    state?: string;
    status?: string;
    source?: string;
    [key: string]: unknown;
}

export async function sendEmail(lead: LeadContext) {
    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) {
        console.error('BREVO_API_KEY not set. Skipping email notification.');
        return { success: false, error: 'Missing API Key' };
    }

    // CRM-007: Recipients loaded from env var instead of hardcoded.
    // Format: "Name1:email1@example.com,Name2:email2@example.com"
    const recipientsRaw = Deno.env.get('NOTIFICATION_RECIPIENTS') || '';
    let recipients: { email: string; name: string }[] = [];
    if (recipientsRaw) {
      recipients = recipientsRaw.split(',').map(entry => {
        const [name, email] = entry.trim().split(':');
        return { email: email?.trim() || name?.trim(), name: name?.trim() || '' };
      }).filter(r => r.email);
    }
    if (recipients.length === 0) {
      console.warn('[Email] NOTIFICATION_RECIPIENTS env var is empty or not set. No recipients to send to.');
      return { success: false, error: 'No recipients configured' };
    }

    const subject = `New Lead: ${lead.full_name} - ${lead.status || 'Nuevo'}`;
    
    // Simple HTML Template
    const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
          .header { background-color: #007bff; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; }
          .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Lead Recieved</h2>
          </div>
          <div class="content">
            <p>You have received a new lead from <strong>${lead.source || 'Unknown Source'}</strong>.</p>
            
            <div class="field"><span class="label">Name:</span> ${lead.full_name}</div>
            <div class="field"><span class="label">Phone:</span> ${lead.phone}</div>
            <div class="field"><span class="label">Email:</span> ${lead.email || 'N/A'}</div>
            <div class="field"><span class="label">State:</span> ${lead.state || 'N/A'}</div>
            <div class="field"><span class="label">Status:</span> ${lead.status}</div>
            <div class="field"><span class="label">ID:</span> ${lead.id}</div>
            
            <p style="margin-top: 20px;">
              <a href="${Deno.env.get('APP_URL') || 'https://crm.financiegroup.com'}/leads/${lead.id}" style="background-color: #28a745; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Lead in CRM</a>
            </p>
          </div>
          <div class="footer">
            <p>Financie Group Notification System</p>
          </div>
        </div>
      </body>
    </html>
    `;

    safeLog(`[Email] Sending notification to ${recipients.length} recipients`);
    try {
        const response = await fetchWithRetry('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Financie CRM System", email: "contactus@financiegroup.com" },
                to: recipients,
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Brevo Email Error (${response.status}):`, errorText);
            return { success: false, error: errorText };
        }

        const data = await response.json();
        safeLog('[Email] Sent successfully', { messageId: data.messageId });
        return { success: true, messageId: data.messageId };

    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error: error.message };
    }
}

export async function syncContactToBrevo(lead: LeadContext) {
    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) {
        console.warn('BREVO_API_KEY not set. Skipping Brevo CRM sync.');
        return { success: false, error: 'Missing API Key' };
    }

    // Prepare attributes (UPPERCASE keys as required by Brevo)
    const attributes: Record<string, string> = {
        'NOMBRE': lead.full_name || '',
    };

    if (lead.phone) {
        // Ensure + prefix for international format
        attributes['SMS'] = lead.phone.startsWith('+') ? lead.phone : `+${lead.phone.replace(/\D/g, '')}`;
    }

    safeLog(`[Brevo] Syncing contact ${maskEmail(lead.email)}`);
    try {
        const response = await fetchWithRetry('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                email: lead.email,
                attributes: attributes,
                updateEnabled: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Brevo Sync Error (${response.status}):`, errorText);
            return { success: false, error: errorText };
        }

        const data = await response.json();
        safeLog('[Brevo] Contact synced successfully', { id: data.id });
        return { success: true, id: data.id };

    } catch (error) {
        console.error('Exception syncing contact to Brevo:', error);
        return { success: false, error: error.message };
    }
}

export async function triggerCall(leadId: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!COMMUNICATIONS_ENABLED) {
        console.warn('Twilio/ElevenLabs disabled via ENABLE_TWILIO_ELEVENLABS=false. Call skipped for lead:', leadId);
        return { success: true, call_id: 'DISABLED_BY_CONFIG' };
    }

    if (!supabaseUrl || !serviceRoleKey) {
        return { success: false, error: 'Internal environment variables missing' };
    }

    try {
        const response = await fetch(
            `${supabaseUrl}/functions/v1/make_outbound_call`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lead_id: leadId })
            }
        );
        
        let data;
        let textBody = '';
        try {
            textBody = await response.text();
            data = JSON.parse(textBody);
        } catch {
            data = { raw: textBody };
        }
        
        if (!response.ok) {
            const errorMsg = data.error || data.message || (`Status ${response.status}: ${textBody.substring(0, 100)}`) || 'Trigger failed';
            console.error('Trigger Call Failed:', errorMsg);
            return { success: false, error: errorMsg };
        }
        
        return { success: true, call_id: data.call_id };
    } catch (error) {
        console.error('Trigger Call Exception:', error);
        return { success: false, error: `Exception: ${error.message}` };
    }
}

/**
 * Core orchestration logic for a lead.
 * Can be called from a Webhook, UI, or DB Trigger.
 */
export async function orchestrateLead(supabase: SupabaseClient, lead: LeadContext) {
    const leadId = lead.id;
    const phone = lead.phone;

    if (!phone) return { success: false, error: 'No phone number' };

    // CRM-008: Agent number loaded from env var instead of hardcoded.
    const agentNumber = Deno.env.get('AGENT_PHONE_NUMBER') || '';
    if (!agentNumber) {
        console.warn('[Orchestrate] AGENT_PHONE_NUMBER env var not set. Self-call check disabled.');
    }
    const cleanedPhone = phone.replace(/\D/g, '');
    const cleanedAgent = agentNumber.replace(/\D/g, '');
    
    if (cleanedAgent && (cleanedPhone === cleanedAgent || (cleanedPhone.length === 10 && '1' + cleanedPhone === cleanedAgent))) {
        console.warn(`[Orchestrate] Skipping lead ${leadId} — matches agent number`);
        await supabase.from('lead_events').insert({
            lead_id: leadId,
            event_type: 'orchestration.skipped_self_call',
            payload: { lead_id: leadId, reason: 'matches_agent_number' }
        });
        return { success: true, skipped: 'self_call' };
    }


    // 0. Send Email Notification (Check Result)
    safeLog(`[Orchestrate] Sending email notification for lead ${leadId}`);
    // We await this to ensure the runtime doesn't kill the process before the request completes.
    const emailRes = await sendEmail(lead);
    
    if (!emailRes.success) {
        await supabase.from('integration_logs').insert({
            provider: 'brevo',
            status: 'failure',
            message_safe: 'Failed to send email notification',
            payload_ref: { error: emailRes.error, lead_id: leadId }
        });
    } else {
            await supabase.from('integration_logs').insert({
            provider: 'brevo',
            status: 'success',
            message_safe: 'Email notification sent',
            payload_ref: { messageId: emailRes.messageId, lead_id: leadId }
        });
    }

    // 0.1 Sync Lead to Brevo CRM Contacts
    if (lead.email) {
        safeLog(`[Orchestrate] Initiating Brevo CRM sync for lead ${leadId}`);
        const syncRes = await syncContactToBrevo(lead);
        
        await supabase.from('integration_logs').insert({
            provider: 'brevo_crm',
            status: syncRes.success ? 'success' : 'failure',
            message_safe: syncRes.success ? 'Lead synced to Brevo CRM' : 'Failed to sync lead to Brevo CRM',
            payload_ref: { error: syncRes.error, brevo_id: syncRes.id, lead_id: leadId }
        });

        await supabase.from('lead_events').insert({
            lead_id: leadId,
            event_type: syncRes.success ? 'brevo.synced' : 'brevo.sync_failed',
            payload: { success: syncRes.success, error: syncRes.error, brevo_id: syncRes.id }
        });
    }


    // 1. Immediate SMS (DISABLED TEMPORARILY)
    // const smsBody = `Hola ${fullName} hemos recibido tus datos. Un agente se pondrá en contacto contigo en los próximos minutos.`;
    // const smsResult = await sendSms(phone, smsBody);
    
    // Mock success to continue flow without sending SMS
    const smsResult = { success: true, sid: 'SKIPPED_VERIFICATION', error: null };

    // 2. Log to integration_logs (SKIP or log skipped)
    await supabase.from('integration_logs').insert({
        provider: 'twilio',
        status: 'skipped',
        message_safe: `Immediate SMS (DISABLED)`,
        payload_ref: { sms_sid: 'SKIPPED', reason: 'verification_process' }
    });

    // 3. Log to specific sms_events table (SKIP)
    // await supabase.from('sms_events').insert({
    //     lead_id: leadId,
    //     message_sid: smsResult.sid,
    //     status_raw: smsResult.success ? 'accepted' : 'failed',
    //     status_crm: smsResult.success ? null : 'NO_ENVIADO'
    // });

    // 4. Log to lead_events (Timeline)
    await supabase.from('lead_events').insert({
        lead_id: leadId,
        event_type: 'sms.skipped_verification',
        payload: { reason: 'verification_disable' }
    });

    // 5. Schedule Call if SMS success (Always true now since we mock success)
    if (smsResult.success) {
        // DISABLED TEMPORARILY: Automatic call scheduling
        /*
        const nextAttempt = getSafeCallTime(lead.state);
        console.log(`Scheduling call for lead ${leadId} in state ${lead.state} for ${nextAttempt.toISOString()}`);
        
        await supabase.from('call_schedules').insert({
            lead_id: leadId,
            next_attempt_at: nextAttempt.toISOString(),
            attempts_today: 0,
            retry_count_block: 0,
            active: true
        });

        const jobInsert = await supabase.from('jobs').insert({
            lead_id: leadId,
            type: 'INITIAL_CALL',
            scheduled_at: nextAttempt.toISOString(),
            status: 'PENDING'
        }).select().single();
        
        await supabase.from('lead_events').insert({
           lead_id: leadId,
           event_type: 'call.scheduled',
           payload: { reason: 'orchestration_triggered', scheduled_to: nextAttempt.toISOString() }
        });

        console.log(`[Orchestrate] Call scheduled for ${nextAttempt.toISOString()}. Job PENDING.`);
        */
        
        // Log that we skipped scheduling per user request
        await supabase.from('lead_events').insert({
            lead_id: leadId,
            event_type: 'call.scheduling_skipped',
            payload: { reason: 'automatic_call_disabled_by_user' }
        });
        console.log(`[Orchestrate] Automatic call scheduling is DISABLED.`);
    } else {
        await supabase.from('lead_events').insert({
            lead_id: leadId,
            event_type: 'call.scheduling_skipped',
            payload: { reason: 'sms_failure', error: smsResult.error }
        });
    }

    return { success: true };
}
