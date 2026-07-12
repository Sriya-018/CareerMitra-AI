/**
 * parseGraniteResponse.js
 *
 * Extracts, validates, and normalises the JSON Granite returns.
 *
 * Handles every known LLM failure mode:
 *   ① JSON wrapped in markdown fences (```json … ```)
 *   ② Leading/trailing prose around the object
 *   ③ Truncated output — throws so caller falls back to mock
 *   ④ Missing fields — filled with safe, schema-conformant defaults
 *   ⑤ Wrong types — coerced to the expected type
 *   ⑥ Out-of-range numbers — clamped
 *   ⑦ Invalid enum values — replaced with safe defaults
 *   ⑧ New v2 fields absent from older model outputs — gracefully defaulted
 */

'use strict';

// ── Valid enum sets ───────────────────────────────────────────────────────────

const VALID_LEVELS   = new Set(['Beginner', 'Intermediate', 'Advanced']);
const VALID_PRIORITY = new Set(['High', 'Medium', 'Low']);

// ── JSON extraction ───────────────────────────────────────────────────────────

/**
 * Find and return the first complete balanced {...} block in raw LLM output.
 * @param {string} text
 * @returns {string}
 */
function extractJsonSubstring(text) {
  // Strip markdown code fences first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in Granite response');

  let depth    = 0;
  let inString = false;
  let escape   = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape)              { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true;  continue; }
    if (ch === '"')          { inString = !inString; continue; }
    if (inString)            continue;
    if (ch === '{')          depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  throw new Error('Truncated JSON in Granite response — brace depth never reached 0');
}

// ── Per-field normalisation helpers ──────────────────────────────────────────

/** Ensure value is a non-empty string, else return fallback */
function str(v, fallback = '') {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

/** Ensure value is an array of strings, trimmed and non-empty */
function strArray(v, fallback = []) {
  if (!Array.isArray(v)) return fallback;
  const cleaned = v.map((x) => String(x).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Clamp a number to [min, max]; return def if not a valid number */
function clamp(v, min, max, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

// ── Default values (schema-conformant) ───────────────────────────────────────

const DEFAULT_CAREERS = [
  {
    title: 'Government Officer', match: 80,
    description: 'Serve the public through central or state government departments.',
    reason: 'Government careers offer stability and are accessible from all educational backgrounds across India.',
    requiredEducation: 'Graduation in any stream',
    entranceExams: ['UPSC Civil Services', 'State PSC Exam', 'SSC CGL'],
    skillsToLearn: ['General Knowledge', 'English Communication', 'Quantitative Aptitude', 'Reasoning'],
    salaryRange: '₹35,000–65,000/month (entry) · ₹80,000–1,50,000/month (senior)',
  },
  {
    title: 'Banking Professional', match: 77,
    description: 'Work in financial services, loan processing, and customer banking.',
    reason: 'Banking exams are accessible with graduation and offer good career growth even from rural areas.',
    requiredEducation: 'Graduation in any stream',
    entranceExams: ['IBPS PO', 'IBPS Clerk', 'SBI PO', 'SBI Clerk'],
    skillsToLearn: ['Numerical Ability', 'Computer Knowledge', 'Banking Awareness', 'English'],
    salaryRange: '₹20,000–40,000/month (clerk) · ₹40,000–65,000/month (PO)',
  },
  {
    title: 'School Teacher', match: 75,
    description: 'Educate students at primary or secondary level in government or private schools.',
    reason: 'Teaching is a respected and stable career with strong demand in rural areas across India.',
    requiredEducation: 'D.El.Ed (Primary) or B.Ed + graduation (Secondary)',
    entranceExams: ['CTET', 'State TET'],
    skillsToLearn: ['Subject Expertise', 'Communication', 'Classroom Management', 'Digital Tools'],
    salaryRange: '₹15,000–35,000/month (private) · ₹35,000–70,000/month (government)',
  },
  {
    title: 'Community Health Worker', match: 72,
    description: 'Provide basic healthcare and awareness services in rural communities.',
    reason: 'Healthcare workers are in high demand in rural India; low entry barrier through NHM programs.',
    requiredEducation: 'Class 10 minimum; ANM/GNM for nursing roles',
    entranceExams: ['State NHM Recruitment', 'AIIMS Paramedical'],
    skillsToLearn: ['Basic First Aid', 'Patient Communication', 'Health Record Keeping', 'Digital Literacy'],
    salaryRange: '₹8,000–18,000/month (ASHA/AWW) · ₹25,000–50,000/month (ANM/GNM)',
  },
];

const DEFAULT_ROADMAP = [
  {
    phase: 'Phase 1: Foundation',
    timeframe: '0–6 months',
    milestone: 'Identify your top career choice and understand its entry requirements.',
    steps: [
      'Research the top 2 career options from your results and note their entrance exams',
      'Enrol in a free course on SWAYAM (swayam.gov.in) relevant to your chosen field',
      'Complete PMGDISHA digital literacy training at your nearest CSC',
      'Open a bank account and register on the National Scholarship Portal (scholarships.gov.in)',
    ],
  },
  {
    phase: 'Phase 2: Skill Building',
    timeframe: '6–18 months',
    milestone: 'Complete a formal qualification or certification and build practical experience.',
    steps: [
      'Enrol in a diploma, ITI, or degree program relevant to your career goal',
      'Appear for the entrance exam of your target institution or government post',
      'Complete an apprenticeship or internship through NAPS (apprenticeshipindia.org)',
      'Develop English communication skills using BBC Learning English or Duolingo',
    ],
  },
  {
    phase: 'Phase 3: Career Launch',
    timeframe: '18–36 months',
    milestone: 'Secure your first paid position or pass a competitive government examination.',
    steps: [
      'Apply for entry-level positions on the National Career Service portal (ncs.gov.in)',
      'Obtain an NSDC sector skill certification relevant to your field',
      'Apply for government schemes like PMKVY or MUDRA loan if starting a business',
      'Build a professional network through LinkedIn and local industry associations',
    ],
  },
];

const DEFAULT_SKILL_GAPS = [
  { skill: 'Digital Literacy',       level: 'Beginner',     priority: 'High',   resource: 'PMGDISHA — Free at nearest CSC (pmgdisha.in)' },
  { skill: 'English Communication',  level: 'Intermediate', priority: 'High',   resource: 'BBC Learning English — Free (bbc.co.uk/learningenglish)' },
  { skill: 'Problem Solving',        level: 'Beginner',     priority: 'Medium', resource: 'Khan Academy — Free (khanacademy.org)' },
  { skill: 'Financial Literacy',     level: 'Beginner',     priority: 'Medium', resource: 'SEBI Investor Education — Free (investor.sebi.gov.in)' },
  { skill: 'Domain Knowledge',       level: 'Intermediate', priority: 'High',   resource: 'SWAYAM NPTEL Courses — Free (swayam.gov.in)' },
];

const DEFAULT_SCHEMES = [
  { name: 'PM Kaushal Vikas Yojana (PMKVY)', benefit: 'Free skill training with industry certification across 300+ job roles', eligibility: 'Youth aged 15–45 years, no income limit', link: 'https://pmkvyofficial.org' },
  { name: 'National Scholarship Portal',      benefit: 'Scholarships covering tuition + maintenance for SC/ST/OBC/Minority students', eligibility: 'Students with family income below ₹2.5 lakh/year', link: 'https://scholarships.gov.in' },
  { name: 'Pradhan Mantri Mudra Yojana',      benefit: 'Collateral-free business loans: Shishu ₹50K, Kishore ₹5L, Tarun ₹10L', eligibility: 'Any Indian citizen starting a micro or small enterprise', link: 'https://mudra.org.in' },
  { name: 'SWAYAM Free Online Education',     benefit: 'Credit-transferable courses from IITs, IIMs, and central universities', eligibility: 'Open to all; free access, paid certificate exams (₹1,000–1,500)', link: 'https://swayam.gov.in' },
];

const DEFAULT_LEARNING = [
  {
    category: 'Free Online Courses',
    resources: [
      { name: 'SWAYAM (NPTEL)',      url: 'https://swayam.gov.in',          description: 'Government platform with 1,000+ certificate courses from IITs and IIMs' },
      { name: 'Khan Academy',        url: 'https://khanacademy.org',         description: 'Free maths, science, computing and economics courses in Hindi and English' },
      { name: 'Coursera (Audit)',    url: 'https://coursera.org',            description: 'Audit top global courses for free; pay only for the certificate' },
    ],
  },
  {
    category: 'Skill Development',
    resources: [
      { name: 'Skill India Digital', url: 'https://skillindiadigital.gov.in', description: 'NSDC platform linking PMKVY training centres and sector skill courses' },
      { name: 'PMGDISHA',            url: 'https://pmgdisha.in',              description: 'Free 20-hour digital literacy program delivered at CSCs across rural India' },
      { name: 'Google Skillshop',    url: 'https://skillshop.google.com',    description: 'Free certifications in Google Ads, Analytics, and digital marketing' },
    ],
  },
  {
    category: 'Career Guidance',
    resources: [
      { name: 'National Career Service', url: 'https://ncs.gov.in',          description: 'Government job portal with career counselling, aptitude tests, and job matching' },
      { name: 'LinkedIn Learning',        url: 'https://linkedin.com/learning', description: 'Professional development courses with 1-month free trial' },
      { name: 'YouTube EDU',              url: 'https://youtube.com/education',  description: 'Free video courses on every subject including competitive exam preparation' },
    ],
  },
];

// ── Career normaliser ─────────────────────────────────────────────────────────

function normaliseCareer(c) {
  return {
    title:             str(c.title, 'Career'),
    match:             clamp(c.match, 50, 99, 75),
    description:       str(c.description, 'A rewarding career path in India.'),
    reason:            str(c.reason, 'This career aligns well with your stated interests and education level.'),
    requiredEducation: str(c.requiredEducation, 'As per the career requirements'),
    entranceExams:     strArray(c.entranceExams, []),
    skillsToLearn:     strArray(c.skillsToLearn, ['Domain Knowledge', 'Communication', 'Digital Skills']),
    salaryRange:       str(c.salaryRange, 'Varies by location and experience'),
  };
}

// ── Roadmap normaliser ────────────────────────────────────────────────────────

function normalisePhase(p, i) {
  const fallback = DEFAULT_ROADMAP[i] || DEFAULT_ROADMAP[0];
  return {
    phase:     str(p.phase,     fallback.phase),
    timeframe: str(p.timeframe, fallback.timeframe),
    milestone: str(p.milestone, fallback.milestone),
    steps:     strArray(p.steps, fallback.steps).slice(0, 4),
  };
}

// ── Main applyDefaults ────────────────────────────────────────────────────────

function applyDefaults(obj) {
  // ── recommendedCareers ──
  if (!Array.isArray(obj.recommendedCareers) || obj.recommendedCareers.length === 0) {
    obj.recommendedCareers = DEFAULT_CAREERS;
  } else {
    obj.recommendedCareers = obj.recommendedCareers.slice(0, 4).map(normaliseCareer);
    // Pad to 4 if Granite returned fewer
    while (obj.recommendedCareers.length < 4) {
      obj.recommendedCareers.push(
        normaliseCareer(DEFAULT_CAREERS[obj.recommendedCareers.length])
      );
    }
  }

  // ── roadmap ──
  if (!Array.isArray(obj.roadmap) || obj.roadmap.length === 0) {
    obj.roadmap = DEFAULT_ROADMAP;
  } else {
    obj.roadmap = obj.roadmap.slice(0, 3).map((p, i) => normalisePhase(p, i));
    while (obj.roadmap.length < 3) {
      obj.roadmap.push(DEFAULT_ROADMAP[obj.roadmap.length]);
    }
  }

  // ── skillGaps ──
  if (!Array.isArray(obj.skillGaps) || obj.skillGaps.length === 0) {
    obj.skillGaps = DEFAULT_SKILL_GAPS;
  } else {
    obj.skillGaps = obj.skillGaps.slice(0, 5).map((g) => ({
      skill:    str(g.skill, 'Skill'),
      level:    VALID_LEVELS.has(g.level)   ? g.level    : 'Beginner',
      priority: VALID_PRIORITY.has(g.priority) ? g.priority : 'Medium',
      resource: str(g.resource, 'SWAYAM Free Online Courses'),
    }));
    while (obj.skillGaps.length < 5) {
      obj.skillGaps.push(DEFAULT_SKILL_GAPS[obj.skillGaps.length]);
    }
  }

  // ── governmentSchemes ──
  if (!Array.isArray(obj.governmentSchemes) || obj.governmentSchemes.length === 0) {
    obj.governmentSchemes = DEFAULT_SCHEMES;
  } else {
    obj.governmentSchemes = obj.governmentSchemes.slice(0, 6).map((s) => ({
      name:        str(s.name, 'Government Scheme'),
      benefit:     str(s.benefit, 'Financial or skill development support'),
      eligibility: str(s.eligibility, 'As per scheme guidelines'),
      link:        str(s.link, 'https://india.gov.in'),
    }));
  }

  // ── learningResources ──
  if (!Array.isArray(obj.learningResources) || obj.learningResources.length === 0) {
    obj.learningResources = DEFAULT_LEARNING;
  } else {
    obj.learningResources = obj.learningResources.slice(0, 3).map((cat, ci) => ({
      category:  str(cat.category, DEFAULT_LEARNING[ci]?.category || 'Resources'),
      resources: Array.isArray(cat.resources)
        ? cat.resources.slice(0, 3).map((r) => ({
            name:        str(r.name, 'Resource'),
            url:         str(r.url,  'https://india.gov.in'),
            description: str(r.description, ''),
          }))
        : DEFAULT_LEARNING[ci]?.resources || [],
    }));
    // Ensure all 3 categories are present
    while (obj.learningResources.length < 3) {
      obj.learningResources.push(DEFAULT_LEARNING[obj.learningResources.length]);
    }
  }

  return obj;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {string} rawText — raw text from Granite's generated_text field
 * @returns {object}       — validated, schema-conformant career advice object
 */
function parseGraniteResponse(rawText) {
  const jsonStr = extractJsonSubstring(rawText);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`JSON.parse failed on extracted substring: ${err.message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Granite returned a non-object JSON value');
  }
  return applyDefaults(parsed);
}

module.exports = { parseGraniteResponse };
