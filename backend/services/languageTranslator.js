/**
 * languageTranslator.js — IBM Watson Language Translator service
 *
 * POST /api/translate
 * Translates a JSON payload (career result) into a target language.
 *
 * Env vars:
 *   WATSON_LT_API_KEY — Watson Language Translator IAM API key
 *   WATSON_LT_URL     — Service instance URL, e.g.
 *                       https://api.us-south.language-translator.watson.cloud.ibm.com
 */

'use strict';

const axios = require('axios');

/**
 * Supported target languages with their Watson model IDs and display names.
 */
const SUPPORTED_LANGUAGES = {
  hi: { name: 'Hindi',     model: 'en-hi' },
  ta: { name: 'Tamil',     model: 'en-ta' },
  te: { name: 'Telugu',    model: 'en-te' },
  bn: { name: 'Bengali',   model: 'en-bn' },
  mr: { name: 'Marathi',   model: 'en-mr' },
  gu: { name: 'Gujarati',  model: 'en-gu' },
  kn: { name: 'Kannada',   model: 'en-kn' },
  ml: { name: 'Malayalam', model: 'en-ml' },
  pa: { name: 'Punjabi',   model: 'en-pa' },
  or: { name: 'Odia',      model: 'en-or' },
};

/**
 * Translate an array of strings from English to the target language.
 *
 * @param {string[]} texts     — array of source strings
 * @param {string}   targetLang — ISO 639-1 code e.g. 'hi', 'ta'
 * @returns {Promise<string[]>} — translated strings in same order
 */
async function translateTexts(texts, targetLang) {
  const apiKey     = process.env.WATSON_LT_API_KEY;
  const serviceUrl = process.env.WATSON_LT_URL;

  if (!apiKey || !serviceUrl) {
    throw new Error('Watson LT env vars WATSON_LT_API_KEY / WATSON_LT_URL not configured');
  }

  const lang = SUPPORTED_LANGUAGES[targetLang];
  if (!lang) {
    throw new Error(`Language "${targetLang}" is not supported`);
  }

  const url = `${serviceUrl.replace(/\/$/, '')}/v3/translate?version=2018-05-01`;

  const response = await axios.post(
    url,
    { text: texts, model_id: lang.model },
    {
      auth:    { username: 'apikey', password: apiKey },
      headers: { 'Content-Type': 'application/json' },
      timeout: 20_000,
    }
  );

  return (response.data?.translations ?? []).map((t) => t.translation ?? '');
}

/**
 * Translate an entire CareerResultData object's user-visible strings.
 * Returns a shallow-cloned object with translated text fields.
 *
 * @param {object} data        — CareerResultData object
 * @param {string} targetLang  — ISO 639-1 code
 * @returns {Promise<object>}  — translated data object
 */
async function translateCareerData(data, targetLang) {
  if (targetLang === 'en') return data; // no-op

  // Collect all translatable strings in a flat list
  const strings = [];
  const indices = {};

  function collect(key, text) {
    if (typeof text === 'string' && text.trim()) {
      indices[key] = strings.length;
      strings.push(text);
    }
  }

  // Careers
  (data.recommendedCareers || []).forEach((c, i) => {
    collect(`career.${i}.title`,       c.title);
    collect(`career.${i}.description`, c.description);
    collect(`career.${i}.reason`,      c.reason);
    collect(`career.${i}.salaryRange`, c.salaryRange);
  });

  // Roadmap phases
  (data.roadmap || []).forEach((phase, i) => {
    collect(`roadmap.${i}.phase`,     phase.phase);
    collect(`roadmap.${i}.milestone`, phase.milestone);
    (phase.steps || []).forEach((s, j) => collect(`roadmap.${i}.step.${j}`, s));
  });

  // Skill gaps
  (data.skillGaps || []).forEach((g, i) => {
    collect(`skillgap.${i}.skill`,    g.skill);
    collect(`skillgap.${i}.resource`, g.resource);
  });

  // Government schemes
  (data.governmentSchemes || []).forEach((s, i) => {
    collect(`scheme.${i}.name`,        s.name);
    collect(`scheme.${i}.benefit`,     s.benefit);
    collect(`scheme.${i}.eligibility`, s.eligibility);
  });

  if (strings.length === 0) return data;

  const translated = await translateTexts(strings, targetLang);

  function t(key) {
    const idx = indices[key];
    return idx !== undefined ? (translated[idx] ?? strings[idx]) : undefined;
  }

  // Rebuild translated data (deep clone for arrays)
  return {
    ...data,
    recommendedCareers: (data.recommendedCareers || []).map((c, i) => ({
      ...c,
      title:       t(`career.${i}.title`)       ?? c.title,
      description: t(`career.${i}.description`) ?? c.description,
      reason:      t(`career.${i}.reason`)      ?? c.reason,
      salaryRange: t(`career.${i}.salaryRange`) ?? c.salaryRange,
    })),
    roadmap: (data.roadmap || []).map((phase, i) => ({
      ...phase,
      phase:     t(`roadmap.${i}.phase`)     ?? phase.phase,
      milestone: t(`roadmap.${i}.milestone`) ?? phase.milestone,
      steps: (phase.steps || []).map((s, j) => t(`roadmap.${i}.step.${j}`) ?? s),
    })),
    skillGaps: (data.skillGaps || []).map((g, i) => ({
      ...g,
      skill:    t(`skillgap.${i}.skill`)    ?? g.skill,
      resource: t(`skillgap.${i}.resource`) ?? g.resource,
    })),
    governmentSchemes: (data.governmentSchemes || []).map((s, i) => ({
      ...s,
      name:        t(`scheme.${i}.name`)        ?? s.name,
      benefit:     t(`scheme.${i}.benefit`)     ?? s.benefit,
      eligibility: t(`scheme.${i}.eligibility`) ?? s.eligibility,
    })),
  };
}

/**
 * Validate that required LT env vars exist.
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateLtEnv() {
  const required = ['WATSON_LT_API_KEY', 'WATSON_LT_URL'];
  const missing  = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

module.exports = { translateCareerData, translateTexts, SUPPORTED_LANGUAGES, validateLtEnv };
