/**
 * InterviewPrepPage.tsx
 *
 * Displays AI-generated interview questions + model answers for the
 * student's top career recommendation.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { InterviewPrepData, InterviewQuestion, Career } from '../types';
import SpeakButton from '../components/SpeakButton';

// ── Colours per category ──────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Personal:       { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  Technical:      { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  Behavioural:    { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500' },
  Scenario:       { bg: 'bg-rose-50 dark:bg-rose-900/20',     text: 'text-rose-700 dark:text-rose-300',     dot: 'bg-rose-500' },
  Motivation:     { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500' },
  Pedagogy:       { bg: 'bg-cyan-50 dark:bg-cyan-900/20',     text: 'text-cyan-700 dark:text-cyan-300',     dot: 'bg-cyan-500' },
  'Self-Assessment': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  'Career Goals': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

function catStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };
}

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
    <div className="text-center max-w-sm">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="w-9 h-9 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Interview Data</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Complete the career assessment first to access interview preparation.
      </p>
      <Link to="/assessment" className="btn-primary">Start Assessment</Link>
    </div>
  </div>
);

// ── Question card ─────────────────────────────────────────────────────────────

const QuestionCard: React.FC<{ q: InterviewQuestion; index: number }> = ({ q, index }) => {
  const [open, setOpen]     = useState(index === 0);
  const style               = catStyle(q.category);

  return (
    <div className="card animate-fade-slide-up" style={{ '--i': index % 6 } as React.CSSProperties}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style.bg} ${style.text}`}>
              {q.category}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Q{index + 1}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
            {q.question}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <SpeakButton text={`Question: ${q.question}. Model answer: ${q.answer}`} size="sm" />
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expandable answer */}
      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {/* Model answer */}
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-wide">
                Model Answer
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.answer}</p>
            </div>
          </div>

          {/* Coaching tip */}
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{q.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const InterviewPrepPage: React.FC = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const state = location.state as {
    data: InterviewPrepData | null;
    career: Career;
    form: object;
  } | null;

  if (!state?.career) return <EmptyState />;

  // If data is null (fetch failed), we still show a useful empty state
  const data: InterviewPrepData | null = state.data;
  const career = state.career;

  const filtered = data
    ? (activeCategory
        ? data.questions.filter((q) => q.category === activeCategory)
        : data.questions)
    : [];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
            hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Interview Preparation
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Curated questions and model answers for{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{career.title}</span>
          </p>

          {data && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              {data.generatedBy}
            </div>
          )}
        </div>

        {!data ? (
          <div className="card text-center py-10">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Could not load interview questions. Please go back and try again.
            </p>
            <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm py-2 px-5">
              Go Back
            </button>
          </div>
        ) : (
          <>
            {/* Prep tips */}
            {data.prepTips.length > 0 && (
              <div className="card mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Before the Interview — Top Tips
                  </h2>
                </div>
                <ul className="space-y-2">
                  {data.prepTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30
                        text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category filter chips */}
            {data.categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activeCategory === null
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400'
                  }`}
                >
                  All ({data.questions.length})
                </button>
                {data.categories.map((cat) => {
                  const count = data.questions.filter((q) => q.category === cat).length;
                  const cs    = catStyle(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        activeCategory === cat
                          ? `${cs.bg} ${cs.text} border-transparent`
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              {filtered.map((q, i) => (
                <QuestionCard key={i} q={q} index={i} />
              ))}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Practice these questions aloud — it makes a big difference.
              </p>
              <Link to="/results" className="btn-secondary text-sm py-2.5 px-5">
                Back to Career Results
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewPrepPage;
