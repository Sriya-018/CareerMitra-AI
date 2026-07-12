/**
 * speechToText.js — IBM Watson Speech to Text service
 *
 * POST /api/speech/transcribe
 * Accepts a multipart audio buffer and returns the transcript.
 *
 * Env vars:
 *   WATSON_STT_API_KEY   — Watson STT IAM API key
 *   WATSON_STT_URL       — Service instance URL, e.g.
 *                          https://api.us-south.speech-to-text.watson.cloud.ibm.com
 */

'use strict';

const axios = require('axios');

/**
 * Transcribe an audio Buffer using IBM Watson Speech to Text.
 *
 * @param {Buffer} audioBuffer  — raw audio bytes (webm/ogg/wav)
 * @param {string} [contentType='audio/webm'] — MIME type of the audio
 * @param {string} [model='en-US_Multimedia'] — Watson STT model id
 * @returns {Promise<string>}   — transcript text
 */
async function transcribeAudio(audioBuffer, contentType = 'audio/webm', model = 'en-US_Multimedia') {
  const apiKey     = process.env.WATSON_STT_API_KEY;
  const serviceUrl = process.env.WATSON_STT_URL;

  if (!apiKey || !serviceUrl) {
    throw new Error('Watson STT env vars WATSON_STT_API_KEY / WATSON_STT_URL not configured');
  }

  const url = `${serviceUrl.replace(/\/$/, '')}/v1/recognize?model=${model}&smart_formatting=true`;

  try {
    const response = await axios.post(url, audioBuffer, {
      auth:    { username: 'apikey', password: apiKey },
      headers: { 'Content-Type': contentType },
      timeout: 30_000,
    });

    const results = response.data?.results;
    if (!Array.isArray(results) || results.length === 0) {
      return '';
    }

    return results
      .map((r) => r.alternatives?.[0]?.transcript ?? '')
      .join(' ')
      .trim();
  } catch (err) {
    // Surface the Watson error body so the server log is actionable
    const watsonMsg = err.response?.data?.error ?? err.response?.data ?? err.message;
    const status    = err.response?.status ?? 'no-response';
    throw new Error(`Watson STT ${status}: ${typeof watsonMsg === 'object' ? JSON.stringify(watsonMsg) : watsonMsg}`);
  }
}

/**
 * Validate that required STT env vars exist.
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateSttEnv() {
  const required = ['WATSON_STT_API_KEY', 'WATSON_STT_URL'];
  const missing  = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

module.exports = { transcribeAudio, validateSttEnv };
