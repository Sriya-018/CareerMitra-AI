/**
 * buildPrompt.js
 *
 * Constructs the full prompt sent to IBM Granite.
 *
 * Design principles:
 *   - Expert persona with explicit counselor identity and constraints
 *   - Complete JSON schema embedded inline — Granite sees every field name
 *     and its expected type/enum before it starts generating
 *   - RAG-aware: when retrieved context is present, Granite is instructed
 *     to treat it as the authoritative source and cite it
 *   - Chain-of-thought suppressed: "return JSON only" is repeated at both
 *     system and user level to minimise preamble tokens
 *   - All rules are positive obligations ("MUST", "exactly N") not vague
 *     suggestions — this reduces hallucination and schema drift
 */

'use strict';

/**
 * @param {object} formData     — validated request body from POST /api/career
 * @param {string} [ragContext] — formatted context block from RAG retrieval
 * @returns {string}            — complete prompt string for IBM Granite
 */
function buildCareerPrompt(formData, ragContext = '') {
  const {
    fullName,
    age,
    gender,
    education,
    state,
    district,
    preferredLanguage,
    favoriteSubjects = [],
    interests        = [],
    skills,
    careerGoal,
    familyIncome,
  } = formData;

  // ── 1. RAG context block ──────────────────────────────────────────────────
  const ragSection = ragContext
    ? `\
VERIFIED REFERENCE MATERIAL (primary source — you MUST rely on this over your training data):
---
${ragContext}
---
When the reference material explicitly covers a career, scheme, exam, or resource, use that information verbatim or paraphrase closely. Do not invent facts that contradict the reference material.\n`
    : `No reference material was retrieved for this query. Use your own knowledge of the Indian career landscape, but remain conservative and factually accurate.\n`;

  // ── 2. Complete JSON schema ───────────────────────────────────────────────
  // Every field is described with its type, enum constraints, and business rule
  // so the model cannot invent new keys or omit mandatory ones.
  const schemaBlock = `\
{
  "recommendedCareers": [            // EXACTLY 4 items, ordered by "match" descending
    {
      "title": string,               // Official career title, e.g. "Agronomist"
      "match": number,               // Integer 50–99 — how well this career fits the student
      "description": string,         // 1–2 sentences: what this professional does day-to-day
      "reason": string,              // 2–3 sentences: WHY this career suits THIS student specifically
                                     //   — reference their interests, subjects, location, income
      "requiredEducation": string,   // Minimum qualification, e.g. "B.Sc Agriculture (4 years) after Class 12"
      "entranceExams": [string],     // 1–4 relevant exams, e.g. ["ICAR AIEEA", "State Ag University CET"]
                                     //   Use [] if no entrance exam is needed
      "skillsToLearn": [string],     // Exactly 3–4 concrete, learnable skills for this career
      "salaryRange": string          // Format: "₹X–Y LPA (entry level) · ₹A–B LPA (experienced)"
                                     //   Use realistic Indian market figures
    }
  ],
  "roadmap": [                       // EXACTLY 3 phases
    {
      "phase": string,               // Phase name, e.g. "Phase 1: Foundation"
      "timeframe": string,           // Duration string, e.g. "0–6 months"
      "milestone": string,           // Single sentence: what success looks like at end of phase
      "steps": [string]              // EXACTLY 4 specific, actionable steps for THIS student
                                     //   — mention real programs, exams, portals by name
    }
  ],
  "skillGaps": [                     // EXACTLY 5 items
    {
      "skill": string,               // Skill name
      "level": "Beginner" | "Intermediate" | "Advanced",  // student's CURRENT level
      "priority": "High" | "Medium" | "Low",              // urgency to bridge this gap
      "resource": string             // Single best free/low-cost resource with platform name
    }
  ],
  "governmentSchemes": [             // 4–5 items
    {
      "name": string,                // Official scheme name
      "benefit": string,             // Concrete benefit in one sentence
      "eligibility": string,         // Who qualifies — be specific about income/caste/age
      "link": string                 // Official government URL — must be real and verified
    }
  ],
  "learningResources": [             // EXACTLY 3 categories
    {
      "category": string,            // One of: "Free Online Courses" | "Skill Development" | "Career Guidance"
      "resources": [                 // EXACTLY 3 resources per category
        {
          "name": string,            // Platform or course name
          "url": string,             // Real, working URL — no placeholders
          "description": string      // One sentence: what the student gets from this resource
        }
      ]
    }
  ]
}`;

  // ── 3. System block ───────────────────────────────────────────────────────
  const systemBlock = `\
You are CareerMitra AI — India's most knowledgeable AI career counselor for rural youth.

Your expertise spans:
• All Indian education pathways from Class 8 through postgraduate, including ITI, polytechnic, IGNOU, NIOS, and open schooling
• Entrance examinations: JEE, NEET, UPSC, IBPS, SSC, ICAR AIEEA, state CETs, and 50+ others
• Government skill development and scholarship programs: PMKVY, NSP, PMEGP, SWAYAM, Startup India, MUDRA, and state-level schemes
• Realistic Indian salary data across Tier-1, Tier-2, and rural job markets
• Free and low-cost learning platforms: SWAYAM, NPTEL, Khan Academy, freeCodeCamp, NSDC Skill India, PMGDISHA, and more
• Labour market demand across agriculture, healthcare, technology, government services, skilled trades, and the green economy

${ragSection}
YOUR TASK:
Analyse the student profile provided and produce a comprehensive, personalised career guidance report.

OUTPUT FORMAT:
Return a SINGLE valid JSON object that exactly matches the schema below.
• Output NOTHING before the opening brace {
• Output NOTHING after the closing brace }
• Do NOT wrap in markdown fences
• Do NOT add comments inside the JSON
• Do NOT use trailing commas

MANDATORY SCHEMA (copy field names exactly):
${schemaBlock}

QUALITY RULES:
1. recommendedCareers — 4 careers strictly aligned to the student's stated interests and education level. Assign match scores honestly: 90+ only for very strong fits. Reference the student's specific subjects, skills, or location when writing "reason".
2. roadmap — 3 phases covering 0–36 months total. Each step must name a real action (enrol in X, appear for Y exam, register on Z portal). Never use vague steps like "study hard" or "work diligently".
3. skillGaps — 5 gaps directly relevant to the top 2 recommended careers. "resource" must name the exact platform and whether it is free.
4. governmentSchemes — MUST include at least one scheme specific to the student's state if known. Prioritise schemes the student is realistically eligible for based on income and education.
5. learningResources — All 3 categories present; all URLs must be real Indian government or globally recognised platforms. No affiliate links. No dead URLs.
6. Salary figures must reflect the Indian job market, not global benchmarks.
7. Entrance exams must be real, currently active Indian examinations.`;

  // ── 4. User block ─────────────────────────────────────────────────────────
  const incomeContext = familyIncome
    ? `Family Annual Income: ${familyIncome} — ${
        familyIncome.toLowerCase().includes('below') || familyIncome.includes('1,00,000')
          ? 'LOW INCOME — prioritise free resources and scholarship schemes'
          : familyIncome.includes('2,50,000') || familyIncome.includes('5,00,000')
          ? 'LOWER-MIDDLE INCOME — include subsidised and free options'
          : 'MIDDLE INCOME — include both free and affordable paid options'
      }`
    : 'Family Annual Income: Not specified';

  const profileBlock = [
    `Full Name:          ${fullName}`,
    `Age:                ${age}`,
    `Gender:             ${gender || 'Not specified'}`,
    `Education Level:    ${education}`,
    `State:              ${state || 'Not specified'}`,
    `District:           ${district || 'Not specified'}`,
    `Preferred Language: ${preferredLanguage || 'Hindi'}`,
    `Favourite Subjects: ${favoriteSubjects.length > 0 ? favoriteSubjects.join(', ') : 'Not specified'}`,
    `Interests:          ${interests.length > 0 ? interests.join(', ') : 'Not specified'}`,
    `Current Skills:     ${skills || 'None mentioned'}`,
    `Career Goal:        ${careerGoal || 'Not specified'}`,
    incomeContext,
  ].join('\n');

  const userBlock = `\
Provide a comprehensive career guidance report for the student below.
Return ONLY the JSON object — no preamble, no explanation, no markdown.

═══════════════════════════════════════
STUDENT PROFILE
═══════════════════════════════════════
${profileBlock}
═══════════════════════════════════════

JSON RESPONSE:`;

  // ── 5. Final prompt ───────────────────────────────────────────────────────
  // Granite instruct format: <|system|> … <|user|> … <|assistant|>
  // The empty <|assistant|> tag primes the model to start generating JSON directly.
  return `<|system|>
${systemBlock}
<|user|>
${userBlock}
<|assistant|>
`;
}

module.exports = { buildCareerPrompt };
