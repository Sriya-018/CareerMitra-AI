/**
 * adminStats.js — In-memory admin metrics store
 *
 * Provides a lightweight counters module that:
 *   - Tracks per-endpoint request counts
 *   - Records state distribution of users
 *   - Records interest distribution
 *   - Keeps a rolling log of the last 50 requests (timestamp + endpoint)
 *
 * All data is in-memory and resets on server restart.
 * A production system would persist to a database.
 */

'use strict';

/** @type {{ endpoint: string; ts: string; ms: number }[]} */
const recentRequests = [];

const counters = {
  totalRequests:     0,
  careerAssessments: 0,
  speechTranscribed: 0,
  textSynthesized:   0,
  translationsDone:  0,
  resumesGenerated:  0,
  interviewPreps:    0,
};

/** @type {Record<string, number>} */
const stateDistribution = {};

/** @type {Record<string, number>} */
const interestDistribution = {};

/** @type {Record<string, number>} */
const languageDistribution = {};

/** @type {Record<string, number>} */
const educationDistribution = {};

const startTime = Date.now();

// ── Mutators ─────────────────────────────────────────────────────────────────

/**
 * Record a single HTTP request hit.
 * @param {string} endpoint  — e.g. 'POST /api/career'
 * @param {number} durationMs
 */
function recordRequest(endpoint, durationMs = 0) {
  counters.totalRequests++;
  recentRequests.push({ endpoint, ts: new Date().toISOString(), ms: durationMs });
  if (recentRequests.length > 50) recentRequests.shift();
}

/**
 * Record a completed career assessment with demographic data.
 * @param {object} formData — AssessmentFormData
 */
function recordAssessment(formData) {
  counters.careerAssessments++;

  if (formData.state) {
    stateDistribution[formData.state] = (stateDistribution[formData.state] || 0) + 1;
  }
  if (formData.preferredLanguage) {
    languageDistribution[formData.preferredLanguage] = (languageDistribution[formData.preferredLanguage] || 0) + 1;
  }
  if (formData.education) {
    educationDistribution[formData.education] = (educationDistribution[formData.education] || 0) + 1;
  }
  (formData.interests || []).forEach((interest) => {
    interestDistribution[interest] = (interestDistribution[interest] || 0) + 1;
  });
}

function recordSpeechTranscription()  { counters.speechTranscribed++; }
function recordTextSynthesis()        { counters.textSynthesized++;   }
function recordTranslation()          { counters.translationsDone++;  }
function recordResumeGeneration()     { counters.resumesGenerated++;  }
function recordInterviewPrep()        { counters.interviewPreps++;    }

// ── Readers ──────────────────────────────────────────────────────────────────

/**
 * Return the full admin dashboard payload.
 * @returns {object}
 */
function getStats() {
  const uptimeMs = Date.now() - startTime;

  const topStates = Object.entries(stateDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([state, count]) => ({ state, count }));

  const topInterests = Object.entries(interestDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([interest, count]) => ({ interest, count }));

  const topLanguages = Object.entries(languageDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count }));

  const topEducation = Object.entries(educationDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => ({ level, count }));

  return {
    uptime: {
      ms:      uptimeMs,
      seconds: Math.floor(uptimeMs / 1000),
      human:   formatUptime(uptimeMs),
    },
    counters,
    topStates,
    topInterests,
    topLanguages,
    topEducation,
    recentRequests: recentRequests.slice().reverse(), // most recent first
    generatedAt: new Date().toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}d ${h % 24}h`;
  if (h > 0)  return `${h}h ${m % 60}m`;
  if (m > 0)  return `${m}m ${s % 60}s`;
  return `${s}s`;
}

module.exports = {
  recordRequest,
  recordAssessment,
  recordSpeechTranscription,
  recordTextSynthesis,
  recordTranslation,
  recordResumeGeneration,
  recordInterviewPrep,
  getStats,
};
