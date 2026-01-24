import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        ["sign"] // We sign to compare
    );

    const signed = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(dataToSign)
    );
    
    const computedSignature = encodeHex(signed);
    return computedSignature === signature;
}

export async function sendSms(to: string, body: string) {
    const accountSid = Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID') || Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials missing. SMS simulated:', { to, body });
        return { success: true, simulated: true };
    }

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Body', body);

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
        
        return { success: true, sid: data.sid };
    } catch (error) {
        console.error('SMS Send Failed:', error);
        // We log but maybe don't block the whole flow?
        return { success: false, error: error.message };
    }
}

export async function triggerCall(leadId: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
        
        const data = await response.json();
        
        if (!response.ok) {
            return { success: false, error: data.error || 'Trigger failed' };
        }
        
        return { success: true, call_id: data.call_id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
