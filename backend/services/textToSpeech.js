/**
 * textToSpeech.js — IBM Watson Text to Speech service
 *
 * POST /api/speech/synthesize
 * Accepts a text string and returns an MP3 audio Buffer.
 *
 * Env vars:
 *   WATSON_TTS_API_KEY — Watson TTS IAM API key
 *   WATSON_TTS_URL     — Service instance URL, e.g.
 *                        https://api.us-south.text-to-speech.watson.cloud.ibm.com
 */

'use strict';

const axios = require('axios');

/**
 * Synthesize text to speech using IBM Watson TTS.
 *
 * @param {string} text        — text to convert (max ~5000 chars)
 * @param {string} [voice]     — Watson TTS voice name
 * @returns {Promise<Buffer>}  — MP3 audio buffer
 */
async function synthesizeSpeech(text, voice = 'en-US_AllisonV3Voice') {
  const apiKey     = process.env.WATSON_TTS_API_KEY;
  const serviceUrl = process.env.WATSON_TTS_URL;

  if (!apiKey || !serviceUrl) {
    throw new Error('Watson TTS env vars WATSON_TTS_API_KEY / WATSON_TTS_URL not configured');
  }

  const url = `${serviceUrl.replace(/\/$/, '')}/v1/synthesize?voice=${voice}`;

  const response = await axios.post(
    url,
    { text },
    {
      auth:         { username: 'apikey', password: apiKey },
      headers:      { 'Content-Type': 'application/json', Accept: 'audio/mp3' },
      responseType: 'arraybuffer',
      timeout:      30_000,
    }
  );

  return Buffer.from(response.data);
}

/**
 * Map an ISO language code to the best available Watson TTS voice.
 * Falls back to English (US) if the language is not mapped.
 *
 * @param {string} langCode — e.g. 'hi', 'ta', 'en'
 * @returns {string}        — Watson TTS voice id
 */
function voiceForLanguage(langCode) {
  const map = {
    en: 'en-US_AllisonV3Voice',
    hi: 'en-US_AllisonV3Voice', // Watson Hindi TTS requires premium plan — fallback to EN
    ta: 'en-US_AllisonV3Voice',
    te: 'en-US_AllisonV3Voice',
    bn: 'en-US_AllisonV3Voice',
    mr: 'en-US_AllisonV3Voice',
    gu: 'en-US_AllisonV3Voice',
    kn: 'en-US_AllisonV3Voice',
    ml: 'en-US_AllisonV3Voice',
  };
  return map[langCode] || 'en-US_AllisonV3Voice';
}

/**
 * Validate that required TTS env vars exist.
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateTtsEnv() {
  const required = ['WATSON_TTS_API_KEY', 'WATSON_TTS_URL'];
  const missing  = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

module.exports = { synthesizeSpeech, voiceForLanguage, validateTtsEnv };
