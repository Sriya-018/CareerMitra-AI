/**
 * interviewPrep.js — Interview preparation service
 *
 * POST /api/interview-prep
 * Generates interview questions + model answers for the student's top career
 * using IBM Granite (with mock fallback when env vars are absent).
 */

'use strict';

const { callGranite } = require('./watsonx');

// ── Mock Q&A pool (used when Granite is unavailable) ──────────────────────────

/**
 * Return a static set of interview Q&A for a given career title.
 * Falls back to generic questions when career is unknown.
 *
 * @param {string} careerTitle
 * @returns {object}  — interview prep data
 */
function mockInterviewPrep(careerTitle) {
  const generic = [
    {
      question: 'Tell me about yourself.',
      answer:   'Begin with your educational background, then your interests and relevant skills. End with why you are interested in this role.',
      tip:      'Keep your answer to 1–2 minutes. Practise out loud.',
      category: 'Personal',
    },
    {
      question: 'Why do you want this career/job?',
      answer:   'Connect your personal interests and background to the role. Mention specific aspects of the job that excite you.',
      tip:      'Be genuine. Mention a specific skill or subject you enjoyed.',
      category: 'Motivation',
    },
    {
      question: 'What are your strengths?',
      answer:   'Choose 2–3 strengths directly relevant to the role and back each one with a brief example.',
      tip:      'Avoid generic answers like "I am hardworking." Be specific.',
      category: 'Self-Assessment',
    },
    {
      question: 'What are your weaknesses?',
      answer:   'Choose a real but minor weakness and immediately explain what you are doing to improve it.',
      tip:      'Never say "I have no weaknesses." Interviewers respect self-awareness.',
      category: 'Self-Assessment',
    },
    {
      question: 'Where do you see yourself in 5 years?',
      answer:   'Describe realistic career growth within the field, showing ambition without overreaching.',
      tip:      'Research the typical career ladder for this role in India before the interview.',
      category: 'Career Goals',
    },
    {
      question: 'How do you handle pressure or tight deadlines?',
      answer:   'Describe a real situation where you managed pressure — even from studies, sports, or household responsibilities.',
      tip:      'Use the STAR method: Situation, Task, Action, Result.',
      category: 'Behavioural',
    },
  ];

  const careerSpecific = {
    'Software Developer': [
      { question: 'Explain what an API is in simple terms.', answer: 'An API (Application Programming Interface) is a bridge that allows two software applications to communicate with each other, like a waiter taking orders between a customer and a kitchen.', tip: 'Always explain technical concepts with a simple real-life analogy.', category: 'Technical' },
      { question: 'What is the difference between frontend and backend development?', answer: 'Frontend is what users see (HTML, CSS, JavaScript). Backend is the server-side logic that processes data (Node.js, Python, databases).', tip: 'Know at least one frontend and one backend technology.', category: 'Technical' },
    ],
    'Government School Teacher': [
      { question: 'How would you handle a student who is struggling with a topic?', answer: 'I would identify the specific gap, use simpler language, provide examples from the student\'s daily life, and give extra practice with encouragement.', tip: 'Show empathy and patience in your answer.', category: 'Pedagogy' },
      { question: 'What teaching methods do you find most effective for large classrooms?', answer: 'Storytelling, group activities, and visual aids keep students engaged. I would use DIKSHA platform resources for digital support.', tip: 'Mention government tools like DIKSHA to show awareness of the system.', category: 'Pedagogy' },
    ],
    'Community Health Worker': [
      { question: 'What would you do if a pregnant woman in your village refuses her immunisation?', answer: 'I would listen patiently to her concerns, provide accurate information about the vaccine\'s safety, involve a trusted community member, and report to the ANM supervisor.', tip: 'Demonstrate communication skills, patience, and knowledge of protocol.', category: 'Scenario' },
      { question: 'How do you maintain health records accurately?', answer: 'I would use the standardised ASHA/ANM register, enter data immediately after each visit, and submit reports to the PHC on time. I would also use the NHM mobile app if available.', tip: 'Show familiarity with NHM tools and processes.', category: 'Technical' },
    ],
    'Agronomist': [
      { question: 'What is integrated pest management (IPM)?', answer: 'IPM is a sustainable approach that uses biological controls, crop rotation, and resistant varieties first, resorting to chemical pesticides only as a last resort to minimise environmental impact.', tip: 'Know the key government IPM guidelines for crops in your state.', category: 'Technical' },
      { question: 'How would you advise a farmer experiencing low crop yield?', answer: 'I would first conduct a soil test, check for nutrient deficiencies, assess irrigation, look for pest or disease signs, and then give specific recommendations with cost estimates.', tip: 'Show a systematic diagnosis approach rather than jumping to solutions.', category: 'Scenario' },
    ],
  };

  const specific = careerSpecific[careerTitle] || [];

  return {
    careerTitle,
    totalQuestions: generic.length + specific.length,
    categories:     [...new Set([...specific.map((q) => q.category), ...generic.map((q) => q.category)])],
    questions:      [...specific, ...generic],
    prepTips: [
      'Research the organisation or government department thoroughly before the interview.',
      'Prepare 2–3 questions to ask the interviewer — this shows genuine interest.',
      'Dress professionally and arrive 10 minutes early.',
      'Practise answers aloud, not just in your head.',
      'Bring original and photocopied certificates, ID proof, and a printed resume.',
    ],
    generatedBy: 'CareerMitra AI (Mock — Granite unavailable)',
  };
}

/**
 * Build a Granite prompt that returns interview prep JSON.
 *
 * @param {string} careerTitle
 * @param {string} education
 * @param {string[]} interests
 * @returns {string}
 */
function buildInterviewPrepPrompt(careerTitle, education, interests) {
  return `<|system|>
You are CareerMitra AI — an expert Indian career counsellor who specialises in interview preparation for rural youth. Return ONLY valid JSON. No preamble, no markdown fences.
<|user|>
Generate interview preparation content for a student from rural India who wants to become a "${careerTitle}".
Student education level: ${education}
Student interests: ${interests.join(', ')}

Return a JSON object with this exact schema:
{
  "careerTitle": string,
  "questions": [    // EXACTLY 8 questions
    {
      "question": string,    // Interview question
      "answer": string,      // 2-4 sentence model answer
      "tip": string,         // 1 sentence coaching tip
      "category": string     // one of: "Personal" | "Technical" | "Behavioural" | "Scenario" | "Motivation" | "Pedagogy" | "Self-Assessment" | "Career Goals"
    }
  ],
  "prepTips": [string],    // EXACTLY 5 practical interview preparation tips specific to this career in India
  "categories": [string]   // unique category names used in questions array
}

JSON RESPONSE:
<|assistant|>
`;
}

/**
 * Generate interview prep content for a career using Granite or mock fallback.
 *
 * @param {string} careerTitle
 * @param {string} education
 * @param {string[]} interests
 * @param {boolean} useGranite
 * @returns {Promise<object>}
 */
async function generateInterviewPrep(careerTitle, education, interests, useGranite) {
  if (!useGranite) {
    return mockInterviewPrep(careerTitle);
  }

  try {
    const prompt    = buildInterviewPrepPrompt(careerTitle, education, interests);
    const rawText   = await callGranite(prompt, { max_new_tokens: 1500 });

    // Extract the JSON block
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Granite response');

    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, generatedBy: `IBM watsonx.ai — ${process.env.WATSONX_MODEL_ID}` };
  } catch (err) {
    console.error('[interview-prep] Granite failed, using mock:', err.message);
    return mockInterviewPrep(careerTitle);
  }
}

module.exports = { generateInterviewPrep };
