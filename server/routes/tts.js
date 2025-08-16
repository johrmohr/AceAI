/* server/routes/tts.js */
const express = require('express');
const router = express.Router();

// Use global fetch if available (Node 18+), otherwise lazy-load node-fetch (ESM)
const fetchFn = (global && global.fetch) ? global.fetch : ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const pickKey = () => {
  const raw = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || process.env.ELEVEN_API_KEY;
  if (!raw) return undefined;
  // Trim and strip surrounding quotes to avoid common .env formatting mistakes
  return String(raw).trim().replace(/^['"]|['"]$/g, '');
};
const ELEVEN_API_KEY = pickKey();
const ELEVEN_BASE_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_RACHEL_VOICE_ID = process.env.ELEVENLABS_DEFAULT_RACHEL_ID || '21m00Tcm4TlvDq8ikWAM';
const DEFAULT_ALICE_VOICE_ID = process.env.ELEVENLABS_DEFAULT_ALICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';

if (!ELEVEN_API_KEY) {
  console.warn('ElevenLabs API key not set. Set ELEVENLABS_API_KEY (or XI_API_KEY) in server/.env');
}

let cachedVoices = null;
let cachedVoiceIdByName = {};

async function ensureVoices() {
  if (cachedVoices) return cachedVoices;
  if (!ELEVEN_API_KEY) return [];
  try {
    const res = await fetchFn(`${ELEVEN_BASE_URL}/voices`, {
      headers: { 'xi-api-key': ELEVEN_API_KEY, 'x-api-key': ELEVEN_API_KEY },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error(`Failed to fetch ElevenLabs voices: ${res.status}. Check ELEVENLABS_API_KEY.`);
        cachedVoices = [];
        return cachedVoices;
      }
      throw new Error(`Failed to fetch ElevenLabs voices: ${res.status}`);
    }
    const data = await res.json();
    cachedVoices = Array.isArray(data.voices) ? data.voices : [];
    cachedVoiceIdByName = {};
    cachedVoices.forEach(v => { if (v && v.name) cachedVoiceIdByName[v.name.toLowerCase()] = v.voice_id; });
  } catch (err) {
    console.error('Error fetching ElevenLabs voices:', err);
    cachedVoices = [];
  }
  return cachedVoices;
}

async function resolveVoiceId(preferredName) {
  // Priority: explicit env, then try preferred name (Alice), then Rachel default, else first voice, else Alice default
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const name = (preferredName || 'Alice').toLowerCase();
  if (name === 'alice') return DEFAULT_ALICE_VOICE_ID;
  if (name === 'rachel') return DEFAULT_RACHEL_VOICE_ID;
  try {
    await ensureVoices();
    if (cachedVoiceIdByName[name]) return cachedVoiceIdByName[name];
    if (cachedVoices && cachedVoices[0]) return cachedVoices[0].voice_id;
  } catch (_) {}
  return DEFAULT_ALICE_VOICE_ID;
}

router.post('/', async (req, res) => {
  try {
    if (!ELEVEN_API_KEY) {
      return res.status(500).json({ message: 'Text-to-speech is not configured on the server.' });
    }

    const { text, voiceName, withTimestamps, output_format, model_id } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Missing text to synthesize.' });
    }

    const voiceId = await resolveVoiceId(voiceName || 'Alice');
    if (!voiceId) return res.status(500).json({ message: 'No ElevenLabs voice available.' });

    // Align with ElevenLabs quickstart recommended model
    const chosenModel = model_id || 'eleven_multilingual_v2';
    const ttsUrl = withTimestamps
      ? `${ELEVEN_BASE_URL}/text-to-speech/${voiceId}/with-timestamps`
      : `${ELEVEN_BASE_URL}/text-to-speech/${voiceId}`;
    const payload = {
      text,
      model_id: chosenModel,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      ...(output_format ? { output_format } : {}),
    };

    const headers = {
      'xi-api-key': ELEVEN_API_KEY,
      'x-api-key': ELEVEN_API_KEY,
      'Content-Type': 'application/json',
      ...(withTimestamps ? { 'Accept': 'application/json' } : { 'Accept': 'audio/mpeg' }),
    };

    const ttsRes = await fetchFn(ttsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text().catch(() => '');
      const status = ttsRes.status || 500;
      // Fallback: if timestamps request fails due to permissions, try plain TTS once
      if (withTimestamps && (status === 401 || status === 403)) {
        try {
          const plainUrl = `${ELEVEN_BASE_URL}/text-to-speech/${voiceId}`;
          const plainRes = await fetchFn(plainUrl, {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
              'x-api-key': ELEVEN_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({ text, model_id: chosenModel, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
          });
          if (plainRes.ok) {
            const audioBuffer = Buffer.from(await plainRes.arrayBuffer());
            const audio_base64 = audioBuffer.toString('base64');
            return res.status(200).json({ audio_base64, alignment: null });
          }
        } catch (_) {}
      }
      if (status === 401 || status === 403) {
        return res.status(401).json({ message: 'ElevenLabs authentication failed. Verify ELEVENLABS_API_KEY and that the voice_id is accessible.' , details: errText });
      }
      return res.status(500).json({ message: 'Failed to synthesize speech', details: errText });
    }

    if (withTimestamps) {
      const contentType = (ttsRes.headers.get('content-type') || '').toLowerCase();
      try {
        if (contentType.includes('application/json')) {
          const data = await ttsRes.json();
          return res.status(200).json(data);
        }
      } catch (_) {}
      // Fallback: if provider returned audio instead of JSON, convert to base64 JSON so client can still play
      const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
      const audio_base64 = audioBuffer.toString('base64');
      return res.status(200).json({ audio_base64, alignment: null });
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.status(200).send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err);
    return res.status(500).json({ message: 'Internal server error generating TTS.' });
  }
});

module.exports = router;


