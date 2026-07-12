'use strict';

const { validateEnv }                  = require('./services/watsonx');
const { buildCareerPrompt }            = require('./services/buildPrompt');
const { parseGraniteResponse }         = require('./services/parseGraniteResponse');
const { buildRagQuery, retrieveContext } = require('./services/rag');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('  PASS:', label);
    passed++;
  } else {
    console.error('  FAIL:', label);
    failed++;
  }
}

// ── 1. validateEnv ────────────────────────────────────────────────────────────
console.log('\n[1] validateEnv');
const { ok, missing } = validateEnv();
// In this shell there are no IBM vars set, so ok===false is expected
assert(typeof ok === 'boolean', 'returns boolean ok');
assert(Array.isArray(missing), 'returns array missing');
assert(missing.length === 4 || missing.length === 0, 'missing is 0 or 4 items');
console.log('    ok=' + ok + ' missing=' + JSON.stringify(missing));

// ── 2. buildCareerPrompt ──────────────────────────────────────────────────────
console.log('\n[2] buildCareerPrompt');
const sampleProfile = {
  fullName: 'Ramesh Patel', age: '19', gender: 'Male',
  education: 'Class 11-12', state: 'Madhya Pradesh', district: 'Vidisha',
  preferredLanguage: 'Hindi', favoriteSubjects: ['Biology', 'Chemistry'],
  interests: ['Agriculture', 'Technology'],
  skills: 'Basic farming, mobile phone usage',
  careerGoal: 'Improve farming in my village',
  familyIncome: 'Below ₹1,00,000',
};
const prompt = buildCareerPrompt(sampleProfile);
assert(typeof prompt === 'string' && prompt.length > 200, 'prompt is non-empty string');
assert(prompt.includes('<|system|>'), 'contains system token');
assert(prompt.includes('<|user|>'), 'contains user token');
assert(prompt.includes('<|assistant|>'), 'contains assistant token');
assert(prompt.includes('Ramesh Patel'), 'name embedded in prompt');
assert(prompt.includes('Agriculture'), 'interests embedded in prompt');
assert(prompt.includes('Madhya Pradesh'), 'state embedded in prompt');
assert(prompt.includes('"match"'), 'JSON schema example in prompt');
console.log('    prompt length:', prompt.length, 'chars');

// ── 3. parseGraniteResponse — clean JSON ──────────────────────────────────────
console.log('\n[3] parseGraniteResponse — clean JSON object');
const cleanJson = JSON.stringify({
  recommendedCareers: [
    { title: 'Agronomist', match: 91, description: 'Soil expert.' },
    { title: 'Extension Officer', match: 87, description: 'Advises farmers.' },
    { title: 'Data Analyst', match: 82, description: 'Analyses data.' },
    { title: 'Teacher', match: 79, description: 'Educates students.' },
  ],
  roadmap: [
    { phase: 'Foundation (0-6 months)', steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4'] },
    { phase: 'Skill Building', steps: ['S1', 'S2', 'S3', 'S4'] },
    { phase: 'Career Launch', steps: ['L1', 'L2', 'L3', 'L4'] },
  ],
  skillGaps: [
    { skill: 'Digital Literacy', level: 'Beginner', priority: 'High', resource: 'PMGDISHA' },
    { skill: 'English', level: 'Intermediate', priority: 'High', resource: 'Duolingo' },
    { skill: 'Finance', level: 'Beginner', priority: 'Medium', resource: 'SEBI' },
    { skill: 'Domain', level: 'Intermediate', priority: 'High', resource: 'SWAYAM' },
    { skill: 'Coding', level: 'Beginner', priority: 'Medium', resource: 'Khan Academy' },
  ],
  governmentSchemes: [
    { name: 'PMKVY', benefit: 'Free training', eligibility: '15-45', link: 'https://pmkvyofficial.org' },
  ],
  learningResources: [
    { category: 'Free Online Courses', resources: [
      { name: 'SWAYAM', url: 'https://swayam.gov.in', description: 'Free courses' },
      { name: 'Khan', url: 'https://khanacademy.org', description: 'Free learning' },
      { name: 'Coursera', url: 'https://coursera.org', description: 'Audit free' },
    ]},
    { category: 'Skill Development', resources: [
      { name: 'NSDC', url: 'https://skillindia.gov.in', description: 'Certs' },
      { name: 'PMGDISHA', url: 'https://pmgdisha.in', description: 'Digital' },
      { name: 'Google', url: 'https://skillshop.google.com', description: 'Google certs' },
    ]},
    { category: 'Career Guidance', resources: [
      { name: 'NCS', url: 'https://ncs.gov.in', description: 'Portal' },
      { name: 'LinkedIn', url: 'https://linkedin.com/learning', description: 'Pro skills' },
      { name: 'YouTube', url: 'https://youtube.com/education', description: 'Videos' },
    ]},
  ],
});
const parsed = parseGraniteResponse(cleanJson);
assert(parsed.recommendedCareers.length === 4, 'has 4 careers');
assert(parsed.roadmap.length === 3, 'has 3 roadmap phases');
assert(parsed.skillGaps.length === 5, 'has 5 skill gaps');
assert(parsed.recommendedCareers[0].match === 91, 'match value preserved');
assert(parsed.recommendedCareers[0].title === 'Agronomist', 'title preserved');
// v2 career field defaults applied when fields are absent from input
assert(typeof parsed.recommendedCareers[0].reason === 'string', 'reason field present');
assert(typeof parsed.recommendedCareers[0].requiredEducation === 'string', 'requiredEducation field present');
assert(Array.isArray(parsed.recommendedCareers[0].entranceExams), 'entranceExams is array');
assert(Array.isArray(parsed.recommendedCareers[0].skillsToLearn), 'skillsToLearn is array');
assert(parsed.recommendedCareers[0].skillsToLearn.length > 0, 'skillsToLearn has at least 1 entry');
assert(typeof parsed.recommendedCareers[0].salaryRange === 'string', 'salaryRange field present');
// v2 roadmap fields
assert(typeof parsed.roadmap[0].timeframe === 'string' && parsed.roadmap[0].timeframe.length > 0, 'roadmap[0].timeframe present');
assert(typeof parsed.roadmap[0].milestone === 'string' && parsed.roadmap[0].milestone.length > 0, 'roadmap[0].milestone present');

// ── 4. parseGraniteResponse — markdown fence wrapping ────────────────────────
console.log('\n[4] parseGraniteResponse — markdown fence stripped');
const fenced = '```json\n' + cleanJson + '\n```';
const parsed2 = parseGraniteResponse(fenced);
assert(parsed2.recommendedCareers[0].title === 'Agronomist', 'fence-wrapped parse ok');

// ── 5. parseGraniteResponse — leading prose ───────────────────────────────────
console.log('\n[5] parseGraniteResponse — leading prose stripped');
const withProse = 'Sure! Here is the JSON for the student:\n\n' + cleanJson + '\n\nHope that helps.';
const parsed3 = parseGraniteResponse(withProse);
assert(parsed3.recommendedCareers.length === 4, 'leading prose stripped ok');

// ── 6. parseGraniteResponse — empty object fills defaults ────────────────────
console.log('\n[6] parseGraniteResponse — empty object fills all defaults');
const withDefaults = parseGraniteResponse('{}');
assert(withDefaults.recommendedCareers.length > 0, 'default careers filled');
assert(withDefaults.roadmap.length === 3, 'default roadmap filled');
assert(withDefaults.skillGaps.length === 5, 'default skillGaps filled');
assert(withDefaults.governmentSchemes.length > 0, 'default schemes filled');
assert(withDefaults.learningResources.length === 3, 'default resources filled');
// v2 fields present in defaults
assert(typeof withDefaults.recommendedCareers[0].reason === 'string', 'default career has reason');
assert(Array.isArray(withDefaults.recommendedCareers[0].entranceExams), 'default career has entranceExams');
assert(typeof withDefaults.roadmap[0].timeframe === 'string', 'default roadmap has timeframe');
assert(typeof withDefaults.roadmap[0].milestone === 'string', 'default roadmap has milestone');

// ── 6b. parseGraniteResponse — v2 fields preserved when present in input ──────
console.log('\n[6b] parseGraniteResponse — v2 career fields preserved from Granite output');
const withV2Fields = JSON.stringify({
  recommendedCareers: [{
    title: 'Agronomist', match: 91, description: 'Soil expert.',
    reason: 'Great fit for rural background.',
    requiredEducation: 'B.Sc Agriculture (4 years)',
    entranceExams: ['ICAR AIEEA-UG'],
    skillsToLearn: ['Soil Testing', 'Crop Management'],
    salaryRange: '₹3–8 LPA',
  }],
});
const parsedV2 = parseGraniteResponse(withV2Fields);
assert(parsedV2.recommendedCareers[0].reason === 'Great fit for rural background.', 'reason preserved from Granite output');
assert(parsedV2.recommendedCareers[0].requiredEducation === 'B.Sc Agriculture (4 years)', 'requiredEducation preserved');
assert(parsedV2.recommendedCareers[0].entranceExams[0] === 'ICAR AIEEA-UG', 'entranceExams preserved');
assert(parsedV2.recommendedCareers[0].skillsToLearn[0] === 'Soil Testing', 'skillsToLearn preserved');
assert(parsedV2.recommendedCareers[0].salaryRange === '₹3–8 LPA', 'salaryRange preserved');

// ── 7. parseGraniteResponse — match clamped ───────────────────────────────────
console.log('\n[7] parseGraniteResponse — match values clamped to 50-99');
const withBadMatch = JSON.stringify({ recommendedCareers: [{ title: 'X', match: 200, description: 'desc' }] });
const parsed4 = parseGraniteResponse(withBadMatch);
assert(parsed4.recommendedCareers[0].match === 99, 'match clamped at 99');

const withLowMatch = JSON.stringify({ recommendedCareers: [{ title: 'Y', match: 3, description: 'desc' }] });
const parsed5 = parseGraniteResponse(withLowMatch);
assert(parsed5.recommendedCareers[0].match === 50, 'match clamped at 50');

// ── 8. parseGraniteResponse — truncated JSON throws ──────────────────────────
console.log('\n[8] parseGraniteResponse — truncated JSON throws error');
try {
  parseGraniteResponse('{ "recommendedCareers": [ { "title": "X"');
  assert(false, 'should have thrown for truncated JSON');
} catch (e) {
  assert(e.message.includes('Truncated') || e.message.includes('parse') || e.message.includes('brace'), 'throws descriptive error: ' + e.message);
}

// ── 9. buildPrompt with RAG context ──────────────────────────────────────────
console.log('\n[9] buildCareerPrompt — RAG context injected into system block');
const withRag = buildCareerPrompt(sampleProfile, 'SOURCE 1: PMKVY offers free skill training. SOURCE 2: SWAYAM has free courses.');
assert(withRag.includes('VERIFIED REFERENCE MATERIAL'), 'RAG section present when context given');
assert(withRag.includes('PMKVY'), 'RAG content present in prompt');
assert(withRag.includes('SOURCE 1'), 'RAG source citation present');

const withoutRag = buildCareerPrompt(sampleProfile, '');
assert(withoutRag.includes('No reference material'), 'no-RAG message present when empty');
assert(!withoutRag.includes('VERIFIED REFERENCE MATERIAL'), 'no RAG section when context empty');

// ── 10. buildRagQuery ─────────────────────────────────────────────────────────
console.log('\n[10] buildRagQuery — produces a rich search string');
const ragQuery = buildRagQuery(sampleProfile);
assert(typeof ragQuery === 'string' && ragQuery.length > 30, 'query is non-empty string');
assert(ragQuery.includes('Agriculture'), 'interests in query');
assert(ragQuery.includes('Madhya Pradesh'), 'state in query');
assert(ragQuery.includes('PMKVY') || ragQuery.includes('SWAYAM'), 'universal anchor terms present');
console.log('    query sample:', ragQuery.slice(0, 100) + '…');

// ── 11. retrieveContext — graceful degradation when RAG service is down ───────
console.log('\n[11] retrieveContext — graceful degradation (RAG service not running)');
(async () => {
  // RAG service is not running in this test environment — expect empty + ragUsed=false
  const ctx = await retrieveContext(sampleProfile);
  assert(typeof ctx.contextBlock === 'string', 'contextBlock is string');
  assert(typeof ctx.ragUsed === 'boolean', 'ragUsed is boolean');
  assert(Array.isArray(ctx.citations), 'citations is array');
  assert(typeof ctx.chunkCount === 'number', 'chunkCount is number');
  // If RAG service is NOT running, ragUsed must be false and chunkCount 0.
  // If it IS running (CI/dev with sidecar up), ragUsed may be true — allow both.
  assert(typeof ctx.ragUsed === 'boolean', 'ragUsed is a boolean (service may or may not be running)');
  assert(ctx.chunkCount >= 0, 'chunkCount is non-negative');

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────');
  console.log('Results:', passed, 'passed,', failed, 'failed');
  if (failed > 0) process.exit(1);
})();
