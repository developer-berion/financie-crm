
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    const ELEVENLABS_PHONE_ID = Deno.env.get('ELEVENLABS_PHONE_ID')

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_PHONE_ID) {
      throw new Error('Missing ElevenLabs secrets')
    }

    // Test connectivity by fetching the phone number details
    // This is a safe read-only operation
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${ELEVENLABS_PHONE_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
         return new Response(JSON.stringify({ 
            success: false, 
            message: 'Failed to connect to ElevenLabs',
            error: data 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }

    return new Response(JSON.stringify({ 
        success: true, 
        message: 'Successfully connected to ElevenLabs',
        phone_details: data 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
