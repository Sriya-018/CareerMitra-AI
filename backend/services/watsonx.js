/**
 * watsonx.js
 *
 * Service layer for IBM watsonx.ai.
 *
 * Responsibilities:
 *   1. Exchange IBM_API_KEY for a short-lived IAM Bearer token (cached until expiry).
 *   2. Call the watsonx.ai /text/generation endpoint with the Granite model.
 *   3. Return the raw generated text for the caller to parse.
 *
 * Environment variables (all required):
 *   IBM_API_KEY      — IBM Cloud IAM API key
 *   IBM_PROJECT_ID   — watsonx.ai project ID (guid)
 *   WATSONX_URL      — e.g. https://us-south.ml.cloud.ibm.com
 *   WATSONX_MODEL_ID — e.g. ibm/granite-13b-instruct-v2
 */

'use strict';

const axios = require('axios');

// ── Constants ────────────────────────────────────────────────────────────────

const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';

/** Watsonx.ai text generation API version */
const API_VERSION = '2023-05-29';

/**
 * Buffer in milliseconds subtracted from the IAM token expiry to avoid
 * using a token that expires mid-request.
 */
const TOKEN_EXPIRY_BUFFER_MS = 60_000; // 60 s

// ── Token cache (module-scoped singleton) ────────────────────────────────────

/** @type {{ token: string, expiresAt: number } | null} */
let _tokenCache = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch a fresh IAM Bearer token using the IBM_API_KEY.
 * Caches the token and reuses it until 60 s before expiry.
 *
 * @returns {Promise<string>} Bearer token string
 */
async function getIamToken() {
  const now = Date.now();

  if (_tokenCache && now < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const apiKey = process.env.IBM_API_KEY;
  if (!apiKey) {
    throw new Error('IBM_API_KEY environment variable is not set');
  }

  const params = new URLSearchParams({
    grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
    apikey: apiKey,
  });

  const response = await axios.post(IAM_TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15_000,
  });

  const { access_token, expires_in } = response.data;

  if (!access_token) {
    throw new Error('IAM token exchange returned no access_token');
  }

  _tokenCache = {
    token: access_token,
    // expires_in is in seconds
    expiresAt: now + (expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS,
  };

  return _tokenCache.token;
}

/**
 * Call the watsonx.ai text-generation endpoint.
 *
 * @param {string} prompt         — fully-formed prompt string
 * @param {object} [overrides={}] — optional parameter overrides
 * @returns {Promise<string>}     — generated text from Granite
 */
async function generateText(prompt, overrides = {}) {
  const projectId = process.env.IBM_PROJECT_ID;
  const baseUrl   = process.env.WATSONX_URL;
  const modelId   = process.env.WATSONX_MODEL_ID;

  if (!projectId) throw new Error('IBM_PROJECT_ID environment variable is not set');
  if (!baseUrl)   throw new Error('WATSONX_URL environment variable is not set');
  if (!modelId)   throw new Error('WATSONX_MODEL_ID environment variable is not set');

  const token = await getIamToken();

  const url = `${baseUrl}/ml/v1/text/generation?version=${API_VERSION}`;

  /**
   * Generation parameters tuned for structured JSON output:
   *  - max_new_tokens: 2048 — generous ceiling for the full JSON schema
   *  - decoding_method: greedy — deterministic; avoids creative deviations from the JSON schema
   *  - repetition_penalty: 1.05 — mild penalty to stop Granite repeating array items
   *  - stop_sequences: stop at closing brace + newline so we never get trailing prose
   */
  const defaultParams = {
    decoding_method: 'greedy',
    max_new_tokens: 2048,
    min_new_tokens: 50,
    repetition_penalty: 1.05,
    stop_sequences: ['\n}\n', '\n}\n\n'],
  };

  const body = {
    model_id: modelId,
    project_id: projectId,
    input: prompt,
    parameters: { ...defaultParams, ...overrides },
  };

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 90_000, // LLM inference can be slow; 90 s is generous but safe
  });

  const results = response.data?.results;
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('watsonx.ai returned no results in the response body');
  }

  const generated = results[0]?.generated_text;
  if (typeof generated !== 'string' || generated.trim() === '') {
    throw new Error('watsonx.ai result[0].generated_text is empty');
  }

  return generated;
}

/**
 * Expose a single high-level function used by the route handler.
 *
 * @param {string} prompt
 * @param {object} [overrides={}]
 * @returns {Promise<string>}
 */
async function callGranite(prompt, overrides = {}) {
  return generateText(prompt, overrides);
}

/**
 * Validate that all required env vars are present.
 * Called once at startup so the server fails fast with a clear message.
 *
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateEnv() {
  const required = ['IBM_API_KEY', 'IBM_PROJECT_ID', 'WATSONX_URL', 'WATSONX_MODEL_ID'];
  const missing = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

module.exports = { callGranite, validateEnv };
