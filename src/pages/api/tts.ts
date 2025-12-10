// src/api/tts.ts
import { serve } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Google Cloud TTS API
    const auth = new GoogleAuth({
      credentials: {
        client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'uz-UZ',
            name: 'uz-UZ-Standard-A', // O'zbek ovozi
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'TTS API error');
    }

    // Base64 audio ni binary ga o'girish
    const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});