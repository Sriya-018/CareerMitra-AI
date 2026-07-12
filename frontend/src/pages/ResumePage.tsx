/**
 * ResumePage.tsx
 *
 * Displays a formatted, printable resume built from the student's career results.
 * Accessible from the Results page via the "Resume" button.
 */

import React, { useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  User,
  MapPin,
  BookOpen,
  Briefcase,
  Star,
  Award,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import type { ResumeData } from '../types';

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
    <div className="text-center max-w-sm">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="w-9 h-9 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Resume Data</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Complete the career assessment first to generate your resume.
      </p>
      <Link to="/assessment" className="btn-primary">Start Assessment</Link>
    </div>
  </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="mb-6 print:mb-4">
    <div className="flex items-center gap-2 mb-3 pb-1 border-b-2 border-primary-600 print:border-gray-700">
      <span className="text-primary-600 print:text-gray-700">{icon}</span>
      <h2 className="text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 print:text-gray-700">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

// ── Resume page ───────────────────────────────────────────────────────────────

const ResumePage: React.FC = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const printRef  = useRef<HTMLDivElement>(null);

  const state = location.state as { resume: ResumeData | null; form?: object } | null;
  const resume = state?.resume ?? null;

  if (!resume) return <EmptyState />;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gray-50 dark:bg-gray-950 print:bg-white print:pt-0">

      {/* Toolbar — hidden on print */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="btn-primary text-sm py-2 px-5"
        >
          <Download className="w-4 h-4 mr-2" />
          Download / Print
        </button>
      </div>

      {/* Resume document */}
      <div
        ref={printRef}
        className="max-w-3xl mx-auto bg-white dark:bg-gray-900 print:bg-white rounded-2xl shadow-sm
          border border-gray-200 dark:border-gray-700 print:border-0 print:shadow-none p-8 print:p-6"
      >

        {/* Header */}
        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-5 mb-6 print:border-gray-300">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white print:text-black">
            {resume.personal.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">
            {resume.personal.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {resume.personal.location}
              </span>
            )}
            {resume.personal.age && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Age {resume.personal.age}
              </span>
            )}
            {resume.personal.language && (
              <span>Language: {resume.personal.language}</span>
            )}
          </div>
        </div>

        {/* Objective */}
        <Section title="Objective" icon={<Star className="w-4 h-4" />}>
          <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700 leading-relaxed">
            {resume.objective}
          </p>
        </Section>

        {/* Education */}
        {resume.education.length > 0 && (
          <Section title="Education" icon={<BookOpen className="w-4 h-4" />}>
            {resume.education.map((edu, i) => (
              <div key={i} className="flex items-start justify-between gap-3 text-sm mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white print:text-black">{edu.degree}</p>
                  <p className="text-gray-500 dark:text-gray-400 print:text-gray-600">{edu.institution}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-600 dark:text-gray-400 print:text-gray-600">{edu.year}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full print:border ${
                    edu.status === 'In Progress'
                      ? 'bg-amber-50 text-amber-700 print:border-amber-400'
                      : 'bg-green-50 text-green-700 print:border-green-400'
                  }`}>
                    {edu.status}
                  </span>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Target Careers */}
        {resume.targetCareers.length > 0 && (
          <Section title="Career Interests" icon={<Briefcase className="w-4 h-4" />}>
            <div className="space-y-2">
              {resume.targetCareers.map((c) => (
                <div key={c.title} className="flex items-start justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white print:text-black">{c.title}</span>
                    {c.exams.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 print:text-gray-600">
                        Entrance exams: {c.exams.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="ml-3 text-xs font-bold text-primary-600 dark:text-primary-400 print:text-gray-700">
                    {c.match}% match
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <Section title="Skills" icon={<Star className="w-4 h-4" />}>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs font-semibold
                    bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300
                    border border-primary-200 dark:border-primary-800 print:bg-white print:border-gray-300 print:text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Interests */}
        {resume.interests.length > 0 && (
          <Section title="Interests" icon={<Star className="w-4 h-4" />}>
            <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">
              {resume.interests.join(' · ')}
            </p>
          </Section>
        )}

        {/* Career goal */}
        {resume.careerGoal && (
          <Section title="Career Aspiration" icon={<Briefcase className="w-4 h-4" />}>
            <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700 italic leading-relaxed">
              "{resume.careerGoal}"
            </p>
          </Section>
        )}

        {/* Suggested Certifications */}
        {resume.suggestedCertifications.length > 0 && (
          <Section title="Suggested Certifications (To Obtain)" icon={<Award className="w-4 h-4" />}>
            <ul className="space-y-1">
              {resume.suggestedCertifications.map((cert, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">
                  <span className="font-medium">{cert.issuer}</span>
                  {' — '}
                  <span className="italic">{cert.title}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Government Schemes */}
        {resume.governmentSchemes.length > 0 && (
          <Section title="Eligible Government Schemes" icon={<ExternalLink className="w-4 h-4" />}>
            <ul className="space-y-2">
              {resume.governmentSchemes.map((scheme) => (
                <li key={scheme.name} className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white print:text-black">{scheme.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 print:text-gray-600 text-xs">{scheme.benefit}</p>
                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 text-xs print:text-gray-600"
                  >
                    {scheme.link}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 print:border-gray-200 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-500">
            Generated by CareerMitra AI · Powered by IBM watsonx.ai ·{' '}
            {new Date(resume.generatedAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Print CTA at bottom — hidden on print */}
      <div className="max-w-3xl mx-auto mt-6 text-center print:hidden">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Use your browser's print dialog to save as PDF.
        </p>
        <button onClick={handlePrint} className="btn-secondary text-sm py-2 px-5">
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </button>
      </div>
    </div>
  );
};

export default ResumePage;
