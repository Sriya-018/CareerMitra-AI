/**
 * rag.js — Node.js client for the RAG microservice
 *
 * Responsibilities:
 *   1. Build a search query from the student's profile
 *   2. POST to the Python RAG sidecar at RAG_SERVICE_URL/retrieve
 *   3. Return formatted context string + citation list to the caller
 *   4. Degrade gracefully when the RAG service is unreachable or returns no results
 *
 * Environment variables:
 *   RAG_SERVICE_URL  — default http://localhost:5001
 *   RAG_TOP_K        — how many chunks to retrieve (default 5)
 *   RAG_SCORE_THRESH — minimum similarity score 0–1 (default 0.30)
 */

'use strict';

const axios = require('axios');

const RAG_URL          = process.env.RAG_SERVICE_URL  || 'http://localhost:5001';
const RAG_TOP_K        = parseInt(process.env.RAG_TOP_K || '5', 10);
const RAG_SCORE_THRESH = parseFloat(process.env.RAG_SCORE_THRESH || '0.30');
const RAG_TIMEOUT_MS   = 8_000;  // 8 s — fast enough to not block UX

// ── Query builder ─────────────────────────────────────────────────────────────

/**
 * Construct a rich search query from form data.
 * The query deliberately combines the most discriminating fields so FAISS
 * retrieves relevant chunks from multiple documents in one pass.
 *
 * @param {object} formData
 * @returns {string}
 */
function buildRagQuery(formData) {
  const {
    education = '',
    state = '',
    interests = [],
    favoriteSubjects = [],
    familyIncome = '',
    careerGoal = '',
    skills = '',
  } = formData;

  const parts = [];

  if (interests.length > 0) {
    parts.push(`career paths in ${interests.join(', ')}`);
  }
  if (education) {
    parts.push(`education level ${education}`);
  }
  if (state) {
    parts.push(`government schemes in ${state}`);
  }
  if (familyIncome && familyIncome.toLowerCase().includes('below')) {
    parts.push('scholarships for low income families India');
  }
  if (careerGoal) {
    parts.push(careerGoal.slice(0, 120));
  }
  if (favoriteSubjects.length > 0) {
    parts.push(`skills in ${favoriteSubjects.join(', ')}`);
  }
  if (skills) {
    parts.push(skills.slice(0, 80));
  }

  // Always include a universal anchor so we always pull scheme/resource docs
  parts.push('free skill development courses India rural youth PMKVY SWAYAM NSDC');

  return parts.join('. ');
}

// ── Formatter ─────────────────────────────────────────────────────────────────

/**
 * Format retrieved chunks into a clean context block for the Granite prompt.
 * Each chunk is preceded by a [SOURCE N] marker so the model can reference it.
 *
 * @param {Array<{content: string, source_file: string, score: number}>} chunks
 * @returns {{ contextBlock: string, citations: string[] }}
 */
function formatContext(chunks) {
  if (!chunks || chunks.length === 0) {
    return { contextBlock: '', citations: [] };
  }

  const lines = [];
  const citations = [];

  chunks.forEach((chunk, i) => {
    const label = `[SOURCE ${i + 1}]`;
    const source = chunk.source_file.replace(/\.(md|txt|pdf)$/i, '').replace(/_/g, ' ');
    lines.push(`${label} (from: ${source}, relevance: ${(chunk.score * 100).toFixed(0)}%)`);
    lines.push(chunk.content.trim());
    lines.push('');
    citations.push(`${label} ${chunk.source_file}`);
  });

  return {
    contextBlock: lines.join('\n'),
    citations,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Retrieve relevant context for a student profile.
 *
 * @param {object} formData — validated form from POST /api/career
 * @returns {Promise<{
 *   contextBlock: string,  — formatted text to inject into Granite prompt
 *   citations: string[],   — list of source references for logging
 *   ragUsed: boolean,      — true if real chunks were retrieved
 *   chunkCount: number,    — number of chunks used
 * }>}
 */
async function retrieveContext(formData) {
  const empty = { contextBlock: '', citations: [], ragUsed: false, chunkCount: 0 };

  try {
    const query = buildRagQuery(formData);

    const response = await axios.post(
      `${RAG_URL}/retrieve`,
      {
        query,
        top_k: RAG_TOP_K,
        score_threshold: RAG_SCORE_THRESH,
      },
      {
        timeout: RAG_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const { chunks = [], total_found = 0 } = response.data;

    if (total_found === 0 || chunks.length === 0) {
      return { ...empty, ragUsed: false };
    }

    const { contextBlock, citations } = formatContext(chunks);

    return {
      contextBlock,
      citations,
      ragUsed: true,
      chunkCount: chunks.length,
    };
  } catch (err) {
    // Surface the reason for silence at debug level — never crash the main request
    const reason = err.code === 'ECONNREFUSED'
      ? 'RAG service not running'
      : err.code === 'ECONNABORTED'
      ? 'RAG service timed out'
      : err.message;

    console.warn(`[rag] Retrieval skipped: ${reason}`);
    return empty;
  }
}

/**
 * Health check — tells server.js whether the RAG sidecar is up.
 * Used at startup for a friendly log line; not a hard dependency.
 *
 * @returns {Promise<{ ok: boolean, indexSize: number }>}
 */
async function checkRagHealth() {
  try {
    const res = await axios.get(`${RAG_URL}/health`, { timeout: 3_000 });
    return {
      ok: res.data?.index_ready === true,
      indexSize: res.data?.index_size ?? 0,
    };
  } catch {
    return { ok: false, indexSize: 0 };
  }
}

module.exports = { retrieveContext, checkRagHealth, buildRagQuery };
