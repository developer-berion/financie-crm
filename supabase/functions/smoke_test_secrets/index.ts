import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const secrets = [
    'ELEVENLABS_AGENT_ID',
    'NOTIFICATION_RECIPIENTS',
    'AGENT_PHONE_NUMBER',
    'ELEVENLABS_WEBHOOK_SECRET'
  ];

  const results = secrets.map(s => ({
    name: s,
    exists: !!Deno.env.get(s),
    length: Deno.env.get(s)?.length || 0
  }));

  const allExist = results.every(r => r.exists);

  return new Response(
    JSON.stringify({ 
      success: allExist, 
      verification: results,
      timestamp: new Date().toISOString()
    }),
    { headers: { "Content-Type": "application/json" } }
  );
})
