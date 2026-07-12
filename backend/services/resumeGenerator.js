/**
 * resumeGenerator.js — Resume generation service
 *
 * POST /api/resume
 * Accepts a career result data object + form data and returns
 * a structured resume JSON that the frontend renders to HTML / PDF.
 *
 * No external AI call is needed — the resume is built deterministically
 * from the data we already have (career recommendations, roadmap, skills).
 */

'use strict';

/**
 * Build a resume data object from the student's assessment form + career results.
 *
 * @param {object} formData    — AssessmentFormData from the frontend
 * @param {object} careerData  — CareerResultData from POST /api/career
 * @returns {object}           — structured resume object
 */
function buildResumeData(formData, careerData) {
  const topCareer = careerData.recommendedCareers?.[0];
  const topSkills = careerData.recommendedCareers
    ?.flatMap((c) => c.skillsToLearn || [])
    .filter((s, i, arr) => arr.indexOf(s) === i) // deduplicate
    .slice(0, 8);

  // Parse any freeform skills the student typed in
  const rawSkills = (formData.skills || '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const allSkills = [...new Set([...rawSkills, ...(topSkills || [])])].slice(0, 10);

  // Build one education entry from the assessment form field
  const educationEntry = formData.education
    ? {
        degree:      formData.education,
        institution: formData.district
          ? `School/College, ${formData.district}, ${formData.state || 'India'}`
          : `School/College, ${formData.state || 'India'}`,
        year:        new Date().getFullYear().toString(),
        status:      formData.education.toLowerCase().includes('pursuing') ? 'In Progress' : 'Completed',
      }
    : null;

  // Build certification suggestions from the roadmap steps
  const suggestedCerts = (careerData.roadmap || [])
    .flatMap((p) => p.steps || [])
    .filter((step) =>
      /certificate|certification|pmkvy|swayam|nsdc|nptel|google|microsoft/i.test(step)
    )
    .slice(0, 3)
    .map((step) => ({ title: step, issuer: 'Suggested (not yet obtained)', year: '' }));

  return {
    generatedAt: new Date().toISOString(),
    personal: {
      name:     formData.fullName,
      age:      formData.age,
      gender:   formData.gender,
      location: [formData.district, formData.state].filter(Boolean).join(', '),
      language: formData.preferredLanguage,
    },
    objective: topCareer
      ? `Aspiring ${topCareer.title} with a strong interest in ${
          (formData.interests || []).join(' and ') || 'career development'
        }. Seeking opportunities to build relevant skills through ${
          topCareer.requiredEducation || 'further education and training'
        } and contribute meaningfully to the field.`
      : `Motivated and eager learner from ${formData.state || 'India'} seeking a fulfilling career path that aligns with my interests and skills.`,
    education: educationEntry ? [educationEntry] : [],
    skills: allSkills,
    interests: formData.interests || [],
    favoriteSubjects: formData.favoriteSubjects || [],
    careerGoal: formData.careerGoal || '',
    targetCareers: (careerData.recommendedCareers || []).slice(0, 3).map((c) => ({
      title:    c.title,
      match:    c.match,
      exams:    c.entranceExams || [],
    })),
    suggestedCertifications: suggestedCerts,
    governmentSchemes: (careerData.governmentSchemes || []).slice(0, 3).map((s) => ({
      name:    s.name,
      benefit: s.benefit,
      link:    s.link,
    })),
  };
}

module.exports = { buildResumeData };
