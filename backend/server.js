/**
 * server.js — CareerMitra AI Backend
 *
 * Startup order:
 *   1. Load .env via dotenv
 *   2. Warn (not crash) if IBM env vars are absent — mock fallback will be used
 *   3. Expose REST endpoints
 *
 * Endpoints:
 *   GET  /api/health              — liveness probe
 *   POST /api/career              — career assessment (Granite + RAG with mock fallback)
 *   POST /api/speech/transcribe   — Watson STT (audio → text)
 *   POST /api/speech/synthesize   — Watson TTS (text → MP3)
 *   POST /api/translate           — Watson Language Translator
 *   POST /api/resume              — Resume data builder
 *   POST /api/interview-prep      — Interview Q&A generator
 *   GET  /api/admin/stats         — Admin dashboard metrics
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { callGranite, validateEnv }        = require('./services/watsonx');
const { buildCareerPrompt }               = require('./services/buildPrompt');
const { parseGraniteResponse }            = require('./services/parseGraniteResponse');
const { retrieveContext, checkRagHealth } = require('./services/rag');
const { transcribeAudio, validateSttEnv } = require('./services/speechToText');
const { synthesizeSpeech, voiceForLanguage, validateTtsEnv } = require('./services/textToSpeech');
const { translateCareerData, SUPPORTED_LANGUAGES, validateLtEnv } = require('./services/languageTranslator');
const { buildResumeData }                 = require('./services/resumeGenerator');
const { generateInterviewPrep }           = require('./services/interviewPrep');
const adminStats                          = require('./services/adminStats');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Accept raw audio buffers for the STT endpoint
app.use('/api/speech/transcribe', express.raw({ type: '*/*', limit: '10mb' }));

// ── Request logger (feeds admin stats) ───────────────────────────────────────

app.use((req, _res, next) => {
  req._startMs = Date.now();
  next();
});

// ── Startup env check ────────────────────────────────────────────────────────

const { ok: envOk,    missing: missingMain } = validateEnv();
const { ok: sttOk,   missing: missingStt  } = validateSttEnv();
const { ok: ttsOk,   missing: missingTts  } = validateTtsEnv();
const { ok: ltOk,    missing: missingLt   } = validateLtEnv();

if (envOk) {
  console.log('[watsonx]    All IBM env vars present — Granite integration ACTIVE');
} else {
  console.warn(`[watsonx]    Missing: ${missingMain.join(', ')} — using mock career data`);
}

if (sttOk) {
  console.log('[stt]        Watson Speech to Text ACTIVE');
} else {
  console.warn(`[stt]        Missing: ${missingStt.join(', ')} — STT will return error if called`);
}

if (ttsOk) {
  console.log('[tts]        Watson Text to Speech ACTIVE');
} else {
  console.warn(`[tts]        Missing: ${missingTts.join(', ')} — TTS will return error if called`);
}

if (ltOk) {
  console.log('[translator] Watson Language Translator ACTIVE');
} else {
  console.warn(`[translator] Missing: ${missingLt.join(', ')} — Translation will return error if called`);
}

// RAG health check (non-blocking)
checkRagHealth().then(({ ok: ragOk, indexSize }) => {
  if (ragOk) {
    console.log(`[rag]        RAG service ACTIVE — index size: ${indexSize} vectors`);
  } else {
    console.warn('[rag]        RAG service not reachable — Granite knowledge only');
  }
});

// ── Mock fallback ─────────────────────────────────────────────────────────────
// Used when IBM env vars are absent OR when a Granite call fails at runtime.

function mockCareerAdvice(formData) {
  const { interests = [] } = formData;

  // Full v2 career pool — every entry includes all enriched schema fields
  const pool = {
    Technology: [
      {
        title: 'Software Developer', match: 92,
        description: 'Design and build web, mobile, and enterprise software applications.',
        reason: 'Your interest in Technology and analytical thinking make software development an excellent fit. India has 5M+ developer jobs with strong remote-work options even from smaller towns.',
        requiredEducation: 'B.Tech / BCA / BSc Computer Science (3–4 years after Class 12 PCM)',
        entranceExams: ['JEE Main', 'State Engineering CET', 'CUET'],
        skillsToLearn: ['Python or JavaScript', 'Data Structures & Algorithms', 'SQL Databases', 'Git Version Control'],
        salaryRange: '₹3.5–8 LPA (entry) · ₹15–40 LPA (senior)',
      },
      {
        title: 'Data Analyst', match: 88,
        description: 'Process and interpret organisational data to support evidence-based decisions.',
        reason: 'Data analytics combines quantitative skill with technology. India adds 97,000+ analyst roles annually across agriculture, banking, and e-commerce sectors.',
        requiredEducation: 'Any graduation + Google Data Analytics Certificate or BSc Statistics',
        entranceExams: ['CUET'],
        skillsToLearn: ['Microsoft Excel', 'SQL', 'Python (Pandas)', 'Power BI / Tableau'],
        salaryRange: '₹4–10 LPA (entry) · ₹12–25 LPA (senior)',
      },
    ],
    Agriculture: [
      {
        title: 'Agronomist', match: 91,
        description: 'Study soil science and crop management to improve farm yield and sustainability.',
        reason: 'A rural background gives you a natural foundation. ICAR-linked government positions offer excellent security and local field postings.',
        requiredEducation: 'B.Sc Agriculture (4 years) — via ICAR AIEEA or State Ag University CET',
        entranceExams: ['ICAR AIEEA-UG', 'State Ag University CET'],
        skillsToLearn: ['Soil Testing & Analysis', 'Integrated Pest Management', 'Irrigation Techniques', 'Farm Record Keeping'],
        salaryRange: '₹3–8 LPA (entry) · ₹10–20 LPA (government/NABARD)',
      },
      {
        title: 'Agricultural Extension Officer', match: 87,
        description: 'Bridge agricultural research and farmers by delivering training at village level.',
        reason: 'Your rural roots make you an ideal communicator with farming communities. State PSCs recruit extension officers regularly with strong job security.',
        requiredEducation: 'B.Sc Agriculture (4 years)',
        entranceExams: ['State Ag Services PSC Exam', 'NABARD Development Assistant'],
        skillsToLearn: ['Rural Communication', 'Crop Advisory', 'Govt Scheme Knowledge', 'Field Report Writing'],
        salaryRange: '₹4–8 LPA (state govt) · ₹6–12 LPA (NABARD/central)',
      },
    ],
    Healthcare: [
      {
        title: 'Community Health Worker', match: 90,
        description: 'Deliver primary healthcare and immunisation services to rural communities through NHM.',
        reason: 'NHM actively recruits from the communities it serves. Healthcare workers are critically needed in rural India with permanent local postings.',
        requiredEducation: 'Class 10 (ASHA) or ANM 2-year diploma after Class 12 PCB',
        entranceExams: ['State NHM ASHA Recruitment', 'ANM Nursing Entrance (state)'],
        skillsToLearn: ['Basic Life Support', 'Maternal & Child Health', 'Health Record Keeping', 'Community Mobilisation'],
        salaryRange: '₹8,000–18,000/month (ASHA) · ₹20,000–40,000/month (ANM govt)',
      },
      {
        title: 'Pharmacist', match: 86,
        description: 'Dispense medications and counsel patients on safe drug use.',
        reason: 'D.Pharma takes just 2 years after Class 12 PCB. Jan Aushadhi Kendras and rural PHCs offer steady employment near home.',
        requiredEducation: 'D.Pharma (2 years) or B.Pharma (4 years) after Class 12 PCB',
        entranceExams: ['State Pharmacy CET'],
        skillsToLearn: ['Pharmacology Basics', 'Dispensing Protocols', 'Inventory Management', 'Patient Counselling'],
        salaryRange: '₹2–5 LPA (retail) · ₹4–9 LPA (hospital/govt)',
      },
    ],
    Education: [
      {
        title: 'Government School Teacher', match: 93,
        description: 'Teach primary or secondary students in government schools with pension and job security.',
        reason: 'Government teacher posts are in high demand in rural India with guaranteed security, community respect, and strong salary — the most valued career in most rural communities.',
        requiredEducation: 'D.El.Ed (2 years) for primary; B.Ed + graduation (4 years) for secondary',
        entranceExams: ['CTET', 'State TET', 'State Teacher Recruitment Board Exam'],
        skillsToLearn: ['Pedagogical Methods', 'Classroom Management', 'Subject Mastery', 'DIKSHA Digital Teaching Tools'],
        salaryRange: '₹15,000–35,000/month (private) · ₹35,000–80,000/month (govt + pension)',
      },
      {
        title: 'Education Counselor', match: 88,
        description: 'Guide students in academic choices and career planning at schools or NGOs.',
        reason: "India's massive student population and low counselor-to-student ratio creates strong demand. Your empathy and understanding of rural challenges is a major professional asset.",
        requiredEducation: 'MSc Psychology or M.Ed (post-graduation)',
        entranceExams: ['State University Entrance', 'CUET PG'],
        skillsToLearn: ['Career Assessment Tools', 'Counselling Techniques', 'Indian Education System Knowledge', 'Report Writing'],
        salaryRange: '₹3–8 LPA (NGO/private) · ₹5–12 LPA (govt/district level)',
      },
    ],
    'Arts & Design': [
      {
        title: 'Graphic Designer', match: 89,
        description: 'Create logos, marketing materials, and visual brand identities for businesses.',
        reason: 'Design skills can be built through free tools (Canva, Adobe Express) and applied remotely. Low startup cost with high freelancing potential from any location in India.',
        requiredEducation: 'Diploma in Graphic Design or BDes (3–4 years) — or self-taught with portfolio',
        entranceExams: ['NID DAT', 'CEED'],
        skillsToLearn: ['Adobe Photoshop / Illustrator', 'Canva Pro', 'Typography & Colour Theory', 'UI/UX Basics'],
        salaryRange: '₹2–6 LPA (salaried) · ₹3–15+ LPA (freelance)',
      },
    ],
    Business: [
      {
        title: 'Entrepreneur / Small Business Owner', match: 90,
        description: 'Build and run your own business using government support schemes and local market insight.',
        reason: "Your rural context gives you first-hand insight into genuine local needs. MUDRA, PMEGP, and Startup India provide capital and support to start a business with low initial risk.",
        requiredEducation: 'No mandatory degree — PMKVY entrepreneurship module recommended',
        entranceExams: [],
        skillsToLearn: ['Business Planning', 'Digital Payments & GST', 'WhatsApp/Instagram Marketing', 'Govt Scheme Navigation'],
        salaryRange: '₹1.5–5 LPA (small business) · Unlimited potential',
      },
      {
        title: 'Banking / Finance Professional', match: 86,
        description: 'Work in financial services, insurance, or microfinance at a nationalised bank.',
        reason: 'IBPS and SBI recruit thousands of officers every year from graduation-level candidates. Stable career with transfer to home state possible.',
        requiredEducation: 'Graduation in any stream',
        entranceExams: ['IBPS PO', 'IBPS Clerk', 'SBI PO', 'LIC AAO'],
        skillsToLearn: ['Numerical Ability', 'Banking Regulations', 'Customer Service', 'Computer Proficiency'],
        salaryRange: '₹20,000–40,000/month (clerk) · ₹40,000–80,000/month (PO/manager)',
      },
    ],
    'Social Work': [
      {
        title: 'Social Worker', match: 88,
        description: 'Support marginalised communities through welfare programs, livelihood projects, and development work.',
        reason: 'Your rural background and empathy make you uniquely suited to development work. NGOs, government welfare departments, and UN agencies actively hire from underrepresented communities.',
        requiredEducation: 'BSW (3 years) or MSW (2 years post-graduation)',
        entranceExams: ['TISS National Entrance Test', 'CUET PG'],
        skillsToLearn: ['Community Assessment', 'Grant Writing', 'Welfare Scheme Knowledge', 'Data Collection & Reporting'],
        salaryRange: '₹2–6 LPA (NGO) · ₹5–12 LPA (govt/UN agencies)',
      },
    ],
    'Government Services': [
      {
        title: 'IAS / State PCS Officer', match: 88,
        description: 'Lead government administration at district, state, or national level.',
        reason: 'Civil services are the most impactful career available to rural youth. Systematic preparation using free NCERT books is all that is needed.',
        requiredEducation: 'Any graduation from a recognised university',
        entranceExams: ['UPSC Civil Services Examination', 'State PCS Exam'],
        skillsToLearn: ['Indian Polity & Constitution', 'Indian Economy', 'Essay & Answer Writing', 'Current Affairs'],
        salaryRange: '₹56,100–2,50,000+/month (IAS) + housing, vehicle & perks',
      },
    ],
    Finance: [
      {
        title: 'Banking / Finance Professional', match: 87,
        description: 'Work in banking, insurance, microfinance, or investment advisory.',
        reason: 'IBPS and SBI recruit thousands of officers every year across India. Predictable career growth with transfer options.',
        requiredEducation: 'Graduation in any stream',
        entranceExams: ['IBPS PO', 'IBPS Clerk', 'SBI PO', 'RBI Grade B'],
        skillsToLearn: ['Numerical Ability', 'Banking Awareness', 'Customer Service', 'Computer Proficiency'],
        salaryRange: '₹20,000–40,000/month (clerk) · ₹40,000–80,000/month (PO/manager)',
      },
    ],
  };

  // Build deduplicated career list from student interests
  const seen    = new Set();
  const matched = [];
  interests.forEach((interest) => {
    (pool[interest] || []).forEach((c) => {
      if (!seen.has(c.title)) { seen.add(c.title); matched.push(c); }
    });
  });

  const defaultCareers = [
    {
      title: 'Government Officer', match: 88,
      description: 'Serve the public through central or state government departments.',
      reason: 'Government careers offer stability and respect accessible from all educational backgrounds across India.',
      requiredEducation: 'Graduation in any stream',
      entranceExams: ['UPSC CSE', 'State PSC', 'SSC CGL'],
      skillsToLearn: ['General Knowledge', 'Quantitative Aptitude', 'English Communication', 'Reasoning'],
      salaryRange: '₹35,000–65,000/month (entry) · ₹80,000–1,50,000/month (senior)',
    },
    {
      title: 'Banking Professional', match: 85,
      description: 'Work in retail banking, loan processing, and customer financial services.',
      reason: 'Banking exams are accessible with graduation and offer predictable career growth even from Tier-3 towns.',
      requiredEducation: 'Graduation in any stream',
      entranceExams: ['IBPS PO', 'IBPS Clerk', 'SBI PO'],
      skillsToLearn: ['Numerical Ability', 'Computer Knowledge', 'Banking Awareness', 'English Language'],
      salaryRange: '₹20,000–40,000/month (clerk) · ₹40,000–65,000/month (PO)',
    },
    {
      title: 'Government School Teacher', match: 82,
      description: 'Educate primary or secondary students in government schools with pension and job security.',
      reason: 'Teaching is the most respected career in rural communities with strong annual government recruitment.',
      requiredEducation: 'D.El.Ed (primary) or B.Ed + graduation (secondary)',
      entranceExams: ['CTET', 'State TET'],
      skillsToLearn: ['Subject Expertise', 'Communication', 'Classroom Management', 'DIKSHA Digital Teaching'],
      salaryRange: '₹15,000–35,000/month (private) · ₹35,000–80,000/month (government)',
    },
    {
      title: 'Community Health Worker', match: 79,
      description: 'Provide essential healthcare and awareness services to rural communities.',
      reason: 'Healthcare workers are critically under-supplied in rural India with guaranteed NHM recruitment opportunities near home.',
      requiredEducation: 'Class 10 (ASHA) or ANM 2-year diploma',
      entranceExams: ['State NHM Recruitment'],
      skillsToLearn: ['Basic First Aid', 'Maternal Health', 'Record Keeping', 'Digital Literacy'],
      salaryRange: '₹8,000–18,000/month (ASHA) · ₹20,000–40,000/month (ANM govt)',
    },
  ];

  const finalCareers = (matched.length > 0 ? matched : defaultCareers).slice(0, 4);

  return {
    recommendedCareers: finalCareers,
    roadmap: [
      {
        phase: 'Phase 1: Foundation',
        timeframe: '0–6 months',
        milestone: 'Identify your top career choice and understand its full entry requirements.',
        steps: [
          'Research your top 2 career options and note their entrance exams and minimum qualifications',
          'Enrol in a relevant free course on SWAYAM (swayam.gov.in) to build domain knowledge',
          'Complete PMGDISHA digital literacy training at your nearest Common Service Centre',
          'Register on the National Scholarship Portal (scholarships.gov.in) before the annual deadline',
        ],
      },
      {
        phase: 'Phase 2: Skill Building',
        timeframe: '6–18 months',
        milestone: 'Complete a formal qualification or certification and gain real-world experience.',
        steps: [
          'Enrol in a diploma, ITI, or degree program relevant to your top career choice',
          'Appear for the entrance exam of your target institution or government recruitment',
          'Complete an apprenticeship through NAPS (apprenticeshipindia.org) for stipend + skills',
          'Build English communication skills using BBC Learning English (free) or Duolingo',
        ],
      },
      {
        phase: 'Phase 3: Career Launch',
        timeframe: '18–36 months',
        milestone: 'Secure your first paid position or pass a competitive government examination.',
        steps: [
          'Apply for entry-level positions through the NCS portal (ncs.gov.in) or via PMKVY placement',
          'Obtain an NSDC sector skill certification to strengthen your job applications',
          'Apply for relevant government schemes — PMKVY training, MUDRA loan, or NSP scholarship',
          "Build a professional network on LinkedIn and join your sector's industry groups",
        ],
      },
    ],
    skillGaps: [
      { skill: 'Digital Literacy',      level: 'Beginner',     priority: 'High',   resource: 'PMGDISHA — Free at nearest CSC (pmgdisha.in)' },
      { skill: 'English Communication', level: 'Intermediate', priority: 'High',   resource: 'BBC Learning English — Free (bbc.co.uk/learningenglish)' },
      { skill: 'Domain Knowledge',      level: 'Beginner',     priority: 'High',   resource: 'SWAYAM NPTEL Courses — Free (swayam.gov.in)' },
      { skill: 'Problem Solving',       level: 'Beginner',     priority: 'Medium', resource: 'Khan Academy — Free (khanacademy.org)' },
      { skill: 'Financial Literacy',    level: 'Beginner',     priority: 'Medium', resource: 'SEBI Investor Education — Free (investor.sebi.gov.in)' },
    ],
    governmentSchemes: [
      { name: 'PM Kaushal Vikas Yojana (PMKVY)',  benefit: 'Free skill training with industry certification across 300+ job roles', eligibility: 'Youth aged 15–45 years, no income limit',                                     link: 'https://pmkvyofficial.org' },
      { name: 'National Scholarship Portal (NSP)', benefit: 'Scholarships covering tuition + maintenance for SC/ST/OBC/Minority students',   eligibility: 'Students with family income below ₹2.5 lakh/year',                       link: 'https://scholarships.gov.in' },
      { name: 'Pradhan Mantri MUDRA Yojana',       benefit: 'Collateral-free business loans: Shishu ₹50K, Kishore ₹5L, Tarun ₹10L',          eligibility: 'Any Indian citizen starting a micro or small enterprise',                link: 'https://mudra.org.in' },
      { name: 'SWAYAM Free Online Education',      benefit: 'Credit-transferable courses from IITs, IIMs, and central universities',           eligibility: 'Open to all; free access, paid certificate exams (₹1,000–1,500)',       link: 'https://swayam.gov.in' },
      { name: 'Apprenticeship India (NAPS)',        benefit: 'Earn ₹1,500–5,000/month stipend while learning a trade in a real company',       eligibility: 'Age 14–21 years; Class 8 pass minimum',                                  link: 'https://apprenticeshipindia.org' },
      { name: 'PM GATI SHAKTI / DigiLocker',       benefit: 'One-stop digital vault for all educational certificates, ID proofs, and more',   eligibility: 'Any Indian with Aadhaar number',                                          link: 'https://digilocker.gov.in' },
    ],
    learningResources: [
      {
        category: 'Free Online Courses',
        resources: [
          { name: 'SWAYAM (NPTEL)',   url: 'https://swayam.gov.in',           description: 'Government platform with 1,000+ certificate courses from IITs and IIMs' },
          { name: 'Khan Academy',     url: 'https://khanacademy.org',          description: 'Free maths, science, computing, and economics courses in Hindi and English' },
          { name: 'Coursera (Audit)', url: 'https://coursera.org',             description: 'Audit top global courses for free; pay only for the certificate' },
        ],
      },
      {
        category: 'Skill Development',
        resources: [
          { name: 'Skill India Digital', url: 'https://skillindiadigital.gov.in', description: 'NSDC platform linking PMKVY training centres and sector skill courses' },
          { name: 'PMGDISHA',             url: 'https://pmgdisha.in',              description: 'Free 20-hour digital literacy program delivered at CSCs across rural India' },
          { name: 'Google Skillshop',     url: 'https://skillshop.google.com',    description: 'Free certifications in Google Ads, Analytics, and digital marketing' },
        ],
      },
      {
        category: 'Career Guidance',
        resources: [
          { name: 'National Career Service', url: 'https://ncs.gov.in',               description: 'Government job portal with career counselling, aptitude tests, and job matching' },
          { name: 'LinkedIn Learning',        url: 'https://linkedin.com/learning',    description: 'Professional development courses with 1-month free trial' },
          { name: 'YouTube EDU',              url: 'https://youtube.com/education',    description: 'Free video courses on every subject including competitive exam preparation' },
        ],
      },
    ],
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

/** Health — surfaces status of every IBM service */
app.get('/api/health', (_req, res) => {
  adminStats.recordRequest('GET /api/health', 0);
  res.json({
    status:  'ok',
    message: 'CareerMitra AI Backend is running.',
    services: {
      granite:    envOk  ? 'active' : 'mock-fallback',
      stt:        sttOk  ? 'active' : 'not-configured',
      tts:        ttsOk  ? 'active' : 'not-configured',
      translator: ltOk   ? 'active' : 'not-configured',
    },
    model: envOk ? process.env.WATSONX_MODEL_ID : null,
  });
});

/** Career assessment — Granite with transparent mock fallback */
app.post('/api/career', async (req, res) => {
  const t0      = Date.now();
  const formData = req.body;

  if (!formData.fullName || !formData.age || !formData.education) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: fullName, age, education',
    });
  }

  const profile = {
    name:      formData.fullName,
    education: formData.education,
    state:     formData.state,
    interests: formData.interests || [],
  };

  // ── Path A: Granite + RAG ──────────────────────────────────────────────────
  if (envOk) {
    try {
      const { contextBlock, citations, ragUsed, chunkCount } = await retrieveContext(formData);
      if (ragUsed) {
        console.log(`[rag] Injecting ${chunkCount} chunk(s). Sources: ${citations.join(', ')}`);
      }

      const prompt     = buildCareerPrompt(formData, contextBlock);
      const rawText    = await callGranite(prompt);
      const careerData = parseGraniteResponse(rawText);

      adminStats.recordAssessment(formData);
      adminStats.recordRequest('POST /api/career', Date.now() - t0);

      return res.json({
        success: true,
        data: {
          profile,
          ...careerData,
          generatedBy: `IBM watsonx.ai — ${process.env.WATSONX_MODEL_ID}`,
          ragUsed,
          ragSources: ragUsed ? citations : [],
          timestamp:  new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[watsonx] Granite call failed:', err.message);
      const isDev        = process.env.NODE_ENV !== 'production';
      const fallbackData = mockCareerAdvice(formData);

      adminStats.recordAssessment(formData);
      adminStats.recordRequest('POST /api/career', Date.now() - t0);

      return res.json({
        success: true,
        data: {
          profile,
          ...fallbackData,
          generatedBy:  'CareerMitra AI (Granite unavailable — using mock data)',
          ragUsed:      false,
          graniteError: isDev ? err.message : undefined,
          timestamp:    new Date().toISOString(),
        },
      });
    }
  }

  // ── Path B: Mock fallback (no IBM env vars) ────────────────────────────────
  const fallbackData = mockCareerAdvice(formData);
  adminStats.recordAssessment(formData);
  adminStats.recordRequest('POST /api/career', Date.now() - t0);

  return res.json({
    success: true,
    data: {
      profile,
      ...fallbackData,
      generatedBy: 'CareerMitra AI (Mock Data — IBM env vars not configured)',
      ragUsed:     false,
      ragSources:  [],
      timestamp:   new Date().toISOString(),
    },
  });
});

// ── Speech to Text ────────────────────────────────────────────────────────────

/**
 * POST /api/speech/transcribe
 * Body: raw audio bytes (webm / ogg / wav)
 * Query params:
 *   ?contentType=audio/webm  (default)
 *   ?model=en-IN_BroadbandModel (default)
 * Response: { transcript: string }
 */
app.post('/api/speech/transcribe', async (req, res) => {
  const t0 = Date.now();
  try {
    const contentType = req.query.contentType || 'audio/webm';
    const model       = req.query.model       || 'en-IN_BroadbandModel';
    const transcript  = await transcribeAudio(req.body, contentType, model);

    adminStats.recordSpeechTranscription();
    adminStats.recordRequest('POST /api/speech/transcribe', Date.now() - t0);

    res.json({ success: true, transcript });
  } catch (err) {
    console.error('[stt] Transcription failed:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});

// ── Text to Speech ────────────────────────────────────────────────────────────

/**
 * POST /api/speech/synthesize
 * Body: { text: string, lang?: string }
 * Response: audio/mp3 binary stream
 */
app.post('/api/speech/synthesize', async (req, res) => {
  const t0 = Date.now();
  try {
    const { text, lang = 'en' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'text field is required' });
    }

    const voice      = voiceForLanguage(lang);
    const audioBuffer = await synthesizeSpeech(text.slice(0, 5000), voice);

    adminStats.recordTextSynthesis();
    adminStats.recordRequest('POST /api/speech/synthesize', Date.now() - t0);

    res.set({
      'Content-Type':   'audio/mp3',
      'Content-Length': audioBuffer.length,
      'Cache-Control':  'no-store',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[tts] Synthesis failed:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});

// ── Language Translation ──────────────────────────────────────────────────────

/**
 * POST /api/translate
 * Body: { data: CareerResultData, targetLang: string }
 * Response: { success: true, data: CareerResultData (translated) }
 */
app.post('/api/translate', async (req, res) => {
  const t0 = Date.now();
  try {
    const { data, targetLang } = req.body;
    if (!data || !targetLang) {
      return res.status(400).json({ success: false, error: 'data and targetLang are required' });
    }
    if (targetLang !== 'en' && !SUPPORTED_LANGUAGES[targetLang]) {
      return res.status(400).json({
        success:   false,
        error:     `Unsupported language: "${targetLang}"`,
        supported: Object.keys(SUPPORTED_LANGUAGES),
      });
    }

    const translated = await translateCareerData(data, targetLang);

    adminStats.recordTranslation();
    adminStats.recordRequest('POST /api/translate', Date.now() - t0);

    res.json({ success: true, data: translated });
  } catch (err) {
    console.error('[translator] Translation failed:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});

// ── Resume Generator ──────────────────────────────────────────────────────────

/**
 * POST /api/resume
 * Body: { formData: AssessmentFormData, careerData: CareerResultData }
 * Response: { success: true, resume: ResumeData }
 */
app.post('/api/resume', (req, res) => {
  const t0 = Date.now();
  try {
    const { formData, careerData } = req.body;
    if (!formData || !careerData) {
      return res.status(400).json({ success: false, error: 'formData and careerData are required' });
    }

    const resume = buildResumeData(formData, careerData);

    adminStats.recordResumeGeneration();
    adminStats.recordRequest('POST /api/resume', Date.now() - t0);

    res.json({ success: true, resume });
  } catch (err) {
    console.error('[resume] Build failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Interview Prep ────────────────────────────────────────────────────────────

/**
 * POST /api/interview-prep
 * Body: { careerTitle: string, education: string, interests: string[] }
 * Response: { success: true, data: InterviewPrepData }
 */
app.post('/api/interview-prep', async (req, res) => {
  const t0 = Date.now();
  try {
    const { careerTitle, education = '', interests = [] } = req.body;
    if (!careerTitle) {
      return res.status(400).json({ success: false, error: 'careerTitle is required' });
    }

    const data = await generateInterviewPrep(careerTitle, education, interests, envOk);

    adminStats.recordInterviewPrep();
    adminStats.recordRequest('POST /api/interview-prep', Date.now() - t0);

    res.json({ success: true, data });
  } catch (err) {
    console.error('[interview-prep] Failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin Dashboard ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Optional query: ?key=<ADMIN_SECRET_KEY>  (set ADMIN_SECRET_KEY in .env)
 * Response: AdminStats object
 */
app.get('/api/admin/stats', (req, res) => {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (adminKey && req.query.key !== adminKey) {
    return res.status(401).json({ success: false, error: 'Invalid or missing admin key' });
  }

  adminStats.recordRequest('GET /api/admin/stats', 0);
  res.json({ success: true, stats: adminStats.getStats() });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`CareerMitra AI backend running on http://localhost:${PORT}`);
});
