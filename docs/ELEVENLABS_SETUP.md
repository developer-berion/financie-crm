# Configuración de Telefonía en ElevenLabs

Para que tu agente pueda realizar llamadas, necesitas configurar un número de teléfono.

1.  **Accede a ElevenLabs:**
    *   Ve a la sección **Conversational AI** > **Phone Numbers** (o Infrastructure).
2.  **Obtener un Número:**
    *   Haz clic en "Buy a Number" (o "Add Number" si ya tienes Twilio).
    *   Sigue los pasos para adquirir un número (pueden costar aprox. $3-5 USD/mes).
3.  **Asignar el Agente:**
    *   Una vez tengas el número, entra a su configuración.
    *   Busca la opción "Agent" o "Inbound Agent" / "Outbound Configuration".
    *   Selecciona tu agente: `agent_4101kf6gqfgpfrganck3s1m0ap3v`.
4.  **Copiar el Phone ID:**
    *   Necesitarás el **Phone Number ID** (a veces llamado `phone_id`).
    *   Una vez lo tengas, ejecutas este comando en tu terminal para guardarlo:
        `npx supabase secrets set ELEVENLABS_PHONE_ID=tu_phone_id_aqui`
