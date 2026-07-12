import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Map,
  TrendingUp,
  IndianRupee,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Trophy,
  Clock,
  ChevronRight,
  RotateCcw,
  Share2,
  Download,
  Zap,
  GraduationCap,
  Landmark,
  MonitorPlay,
  Globe,
  FileText,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import type { CareerResultData, AssessmentFormData, SkillGap } from '../types';
import SpeakButton from '../components/SpeakButton';
import { translateResults, generateResume, fetchInterviewPrep } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const priorityMeta: Record<string, { label: string; bar: string; text: string; bg: string }> = {
  High:   { label: 'High',   bar: 'bg-red-500',   text: 'text-red-700 dark:text-red-300',   bg: 'bg-red-50 dark:bg-red-900/20' },
  Medium: { label: 'Medium', bar: 'bg-amber-400',  text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  Low:    { label: 'Low',    bar: 'bg-green-500',  text: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
};

const levelMeta: Record<string, { pct: number; color: string; text: string }> = {
  Beginner:     { pct: 25, color: 'bg-sky-400',    text: 'text-sky-700 dark:text-sky-300' },
  Intermediate: { pct: 60, color: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  Advanced:     { pct: 90, color: 'bg-green-500',  text: 'text-green-700 dark:text-green-300' },
};

const phaseConfig = [
  { accent: 'bg-blue-600',   ring: 'ring-blue-200 dark:ring-blue-900',   dot: 'bg-blue-600',   label: 'Foundation',    months: '0–6 months' },
  { accent: 'bg-violet-600', ring: 'ring-violet-200 dark:ring-violet-900', dot: 'bg-violet-600', label: 'Skill Building', months: '6–18 months' },
  { accent: 'bg-emerald-600', ring: 'ring-emerald-200 dark:ring-emerald-900', dot: 'bg-emerald-600', label: 'Career Launch', months: '18–36 months' },
];

const sectionIcons = [
  { Icon: Briefcase,    bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  { Icon: Map,          bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  { Icon: TrendingUp,   bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { Icon: Landmark,     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { Icon: MonitorPlay,  bg: 'bg-rose-100 dark:bg-rose-900/30',   text: 'text-rose-600 dark:text-rose-400' },
];

// ── sub-components ────────────────────────────────────────────────────────────

/** Animated section header */
const SectionHeader: React.FC<{
  index: number;
  title: string;
  subtitle?: string;
}> = ({ index, title, subtitle }) => {
  const { Icon, bg, text } = sectionIcons[index];
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

/** Animated progress bar — grows from 0 when it enters the viewport */
const AnimatedBar: React.FC<{
  pct: number;
  color: string;
  delay?: number;
}> = ({ pct, color, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-none ${color} ${started ? 'animate-bar-grow' : ''}`}
        style={{
          width: started ? `${pct}%` : '0%',
          animationDuration: '1s',
          animationDelay: `${delay}ms`,
          animationFillMode: 'both',
          animationTimingFunction: 'cubic-bezier(.22,.61,.36,1)',
        }}
      />
    </div>
  );
};

/** Full-page loading skeleton */
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen pt-20 pb-12 px-4 bg-gray-50 dark:bg-gray-950">
    <div className="max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-4 w-32 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-48 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
      </div>
      {/* Card skeletons */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="card mb-5 space-y-3">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

/** Empty-state when navigated directly without data */
const EmptyState: React.FC = () => (
  <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
    <div className="text-center max-w-sm">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5 animate-pulse-ring">
        <AlertTriangle className="w-9 h-9 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Results Yet</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
        Complete the career assessment to see your personalised career roadmap, skill gaps, and
        government schemes.
      </p>
      <Link to="/assessment" className="btn-primary">
        <Zap className="w-4 h-4 mr-2" />
        Start Free Assessment
      </Link>
    </div>
  </div>
);

// ── Career card ───────────────────────────────────────────────────────────────

const matchGradient = (pct: number) => {
  if (pct >= 88) return 'from-primary-500 to-violet-500';
  if (pct >= 75) return 'from-primary-400 to-cyan-500';
  return 'from-gray-400 to-gray-500';
};

const CareerCard: React.FC<{
  career: import('../types').Career;
  rank: number;
  delay: number;
}> = ({ career, rank, delay }) => (
  <div
    className="card group flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 animate-fade-slide-up stagger"
    style={{ '--i': delay } as React.CSSProperties}
  >
    {/* Top row */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        {rank === 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Top Pick
            </span>
          </div>
        )}
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
          {career.title}
        </h3>
      </div>

      {/* Match ring */}
      <div className="relative flex-shrink-0 w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5"
            className="stroke-gray-100 dark:stroke-gray-800" />
          <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5"
            strokeLinecap="round"
            stroke={`url(#grad-${rank})`}
            strokeDasharray={`${(career.match / 100) * 138.2} 138.2`}
            className="transition-all duration-1000 delay-200" />
          <defs>
            <linearGradient id={`grad-${rank}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
            {career.match}%
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">match</span>
        </div>
      </div>
    </div>

    {/* Description + speak button */}
    <div className="flex items-start gap-2">
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
        {career.description}
      </p>
      <SpeakButton text={`${career.title}. ${career.description} ${career.reason ?? ''}`} size="sm" />
    </div>

    {/* Why this career (reason) */}
    {career.reason && (
      <p className="text-xs text-primary-700 dark:text-primary-300 italic leading-relaxed border-l-2 border-primary-300 dark:border-primary-700 pl-2.5">
        {career.reason}
      </p>
    )}

    {/* Required education pill */}
    {career.requiredEducation && (
      <div className="flex items-start gap-1.5">
        <GraduationCap className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
        <span className="text-xs text-violet-700 dark:text-violet-300 leading-snug">
          {career.requiredEducation}
        </span>
      </div>
    )}

    {/* Salary range */}
    {career.salaryRange && (
      <div className="flex items-start gap-1.5">
        <IndianRupee className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 leading-snug">
          {career.salaryRange}
        </span>
      </div>
    )}

    {/* Entrance exams */}
    {career.entranceExams && career.entranceExams.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {career.entranceExams.map((exam) => (
          <span
            key={exam}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold
              bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300
              border border-amber-200 dark:border-amber-800"
          >
            {exam}
          </span>
        ))}
      </div>
    )}

    {/* Skills to learn */}
    {career.skillsToLearn && career.skillsToLearn.length > 0 && (
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Skills to build
        </p>
        <ul className="space-y-0.5">
          {career.skillsToLearn.map((skill) => (
            <li key={skill} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="w-1 h-1 rounded-full bg-primary-400 flex-shrink-0" />
              {skill}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Match progress bar */}
    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-auto">
      <div
        className={`h-1.5 rounded-full bg-gradient-to-r ${matchGradient(career.match)} animate-bar-grow stagger`}
        style={{
          width: `${career.match}%`,
          '--i': delay,
          animationDuration: '1s',
          animationDelay: `${delay * 80 + 300}ms`,
          animationFillMode: 'both',
        } as React.CSSProperties}
      />
    </div>
  </div>
);

// ── Timeline roadmap ──────────────────────────────────────────────────────────

const RoadmapTimeline: React.FC<{
  phases: import('../types').RoadmapPhase[];
}> = ({ phases }) => (
  <div className="relative">
    {/* Vertical connector line (desktop) */}
    <div className="hidden sm:block absolute left-[21px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-300 via-violet-300 to-emerald-300 dark:from-blue-800 dark:via-violet-800 dark:to-emerald-800" />

    <div className="space-y-5">
      {phases.map((phase, i) => {
        const cfg = phaseConfig[i % phaseConfig.length];
        // Prefer the real timeframe from data, fall back to the hardcoded config label
        const timeLabel = phase.timeframe || cfg.months;
        return (
          <div
            key={phase.phase}
            className="relative flex gap-4 sm:gap-5 animate-fade-slide-up stagger"
            style={{ '--i': i } as React.CSSProperties}
          >
            {/* Timeline node */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full ring-4 ${cfg.ring} ${cfg.accent}
                  flex items-center justify-center text-white font-bold text-sm
                  relative z-10 shadow-md`}
              >
                {i + 1}
              </div>
            </div>

            {/* Card */}
            <div className="flex-1 card mb-0 pb-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {phase.phase}
                </h3>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {timeLabel}
                </span>
              </div>

              {/* Milestone goal */}
              {phase.milestone && (
                <p className="text-xs text-violet-700 dark:text-violet-300 italic mb-3 leading-relaxed">
                  🎯 {phase.milestone}
                </p>
              )}

              <ul className="space-y-2.5">
                {phase.steps.map((step, si) => (
                  <li
                    key={si}
                    className="flex items-start gap-2.5 animate-fade-slide-up stagger"
                    style={{ '--i': i * 4 + si } as React.CSSProperties}
                  >
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5
                      ${i === 0 ? 'text-blue-500' : i === 1 ? 'text-violet-500' : 'text-emerald-500'}`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Skill gap card with progress bar ─────────────────────────────────────────

const SkillGapCard: React.FC<{ gap: SkillGap; delay: number }> = ({ gap, delay }) => {
  const pm = priorityMeta[gap.priority] ?? priorityMeta.Medium;
  const lm = levelMeta[gap.level]      ?? levelMeta.Beginner;

  return (
    <div
      className="card animate-fade-slide-up stagger"
      style={{ '--i': delay } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{gap.skill}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Level badge */}
          <span className={`badge text-xs ${lm.text} bg-opacity-10
            bg-gray-100 dark:bg-gray-800 border border-current/20`}>
            {gap.level}
          </span>
          {/* Priority badge */}
          <span className={`badge text-xs ${pm.text} ${pm.bg}`}>
            {pm.label} priority
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Current level</span>
          <span>{lm.pct}%</span>
        </div>
        <AnimatedBar pct={lm.pct} color={lm.color} delay={delay * 60} />
      </div>

      {/* Resource */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{gap.resource}</span>
      </div>
    </div>
  );
};

// ── Government scheme card ────────────────────────────────────────────────────

const SchemeCard: React.FC<{
  scheme: { name: string; benefit: string; eligibility: string; link: string };
  delay: number;
}> = ({ scheme, delay }) => (
  <div
    className="card flex flex-col gap-3 group hover:-translate-y-0.5 transition-transform duration-200 animate-fade-slide-up stagger"
    style={{ '--i': delay } as React.CSSProperties}
  >
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1">
          {scheme.name}
        </h3>
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-snug">
          {scheme.benefit}
        </p>
      </div>
    </div>

    <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
      <span className="font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">Eligibility:</span>
      <span className="leading-snug">{scheme.eligibility}</span>
    </div>

    <a
      href={scheme.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 text-xs font-semibold
        text-primary-600 dark:text-primary-400
        hover:text-primary-700 dark:hover:text-primary-300
        bg-primary-50 dark:bg-primary-900/20
        hover:bg-primary-100 dark:hover:bg-primary-900/30
        rounded-lg px-3 py-2 transition-colors duration-150 group/link"
    >
      <span>Visit Official Website</span>
      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
    </a>
  </div>
);

// ── Learning resource card ────────────────────────────────────────────────────

const categoryIcon: Record<string, React.ReactNode> = {
  'Free Online Courses': <BookOpen className="w-4 h-4" />,
  'Skill Development':   <Zap className="w-4 h-4" />,
  'Career Guidance':     <GraduationCap className="w-4 h-4" />,
};

const categoryColors: Record<string, { bg: string; text: string; item: string }> = {
  'Free Online Courses': { bg: 'bg-sky-50 dark:bg-sky-900/20',     text: 'text-sky-700 dark:text-sky-300',    item: 'hover:bg-sky-50 dark:hover:bg-sky-900/20' },
  'Skill Development':   { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', item: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' },
  'Career Guidance':     { bg: 'bg-rose-50 dark:bg-rose-900/20',    text: 'text-rose-700 dark:text-rose-300',  item: 'hover:bg-rose-50 dark:hover:bg-rose-900/20' },
};

const LearningCategoryCard: React.FC<{
  category: string;
  resources: { name: string; url: string; description: string }[];
  delay: number;
}> = ({ category, resources, delay }) => {
  const colors = categoryColors[category] ?? categoryColors['Career Guidance'];
  return (
    <div
      className="card animate-fade-slide-up stagger"
      style={{ '--i': delay } as React.CSSProperties}
    >
      {/* Category header */}
      <div className={`flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}>
          {categoryIcon[category] ?? <BookOpen className="w-4 h-4" />}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{category}</h3>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {resources.length} resources
        </span>
      </div>

      {/* Resource rows */}
      <div className="space-y-2">
        {resources.map((res, ri) => (
          <a
            key={res.name}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-3 p-3 rounded-xl
              bg-gray-50 dark:bg-gray-800/60 ${colors.item}
              transition-colors duration-150 group/res`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${colors.bg} ${colors.text}`}>
                {ri + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate
                  group-hover/res:text-primary-600 dark:group-hover/res:text-primary-400 transition-colors">
                  {res.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{res.description}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600
              group-hover/res:text-primary-500 group-hover/res:translate-x-0.5
              transition-all duration-150 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};

// ── RAG badge ─────────────────────────────────────────────────────────────────

const RagBadge: React.FC<{ sources: string[] }> = ({ sources }) => (
  <div className="flex items-start gap-2 px-4 py-3 rounded-xl
    bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800
    text-primary-700 dark:text-primary-300 text-xs">
    <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
    <div>
      <span className="font-semibold">Knowledge-grounded response</span>
      {' — '}retrieved from verified career & scheme documents.
      {sources.length > 0 && (
        <div className="mt-1 text-primary-500 dark:text-primary-400">
          Sources: {sources.map(s => s.replace(/\[SOURCE \d+\] /, '')).join(' · ')}
        </div>
      )}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

// Language options available in the translator
const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible]             = useState(false);
  const [currentData, setCurrentData]     = useState<CareerResultData | null>(null);
  const [translating, setTranslating]     = useState(false);
  const [selectedLang, setSelectedLang]   = useState('en');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const state = location.state as {
    data: CareerResultData & { ragUsed?: boolean; ragSources?: string[] };
    form: AssessmentFormData;
  } | null;

  // Simulate a brief "loading" moment so the skeleton renders first,
  // making the transition from Assessment feel seamless.
  useEffect(() => {
    if (!state?.data) return;
    setCurrentData(state.data);
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, [state]);

  const handleTranslate = async (langCode: string) => {
    if (!currentData) return;
    setSelectedLang(langCode);
    if (langCode === 'en') {
      setCurrentData(state!.data);
      return;
    }
    setTranslating(true);
    try {
      const translated = await translateResults(currentData, langCode);
      setCurrentData(translated);
    } catch {
      // Silently fall back to original data
    } finally {
      setTranslating(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!state) return;
    setResumeLoading(true);
    try {
      const res = await generateResume(state.form, currentData ?? state.data);
      navigate('/resume', { state: { resume: res.resume, form: state.form } });
    } catch {
      // navigating with current data as fallback
      navigate('/resume', { state: { resume: null, form: state.form, careerData: currentData } });
    } finally {
      setResumeLoading(false);
    }
  };

  const handleInterviewPrep = async () => {
    if (!state) return;
    const topCareer = (currentData ?? state.data).recommendedCareers?.[0];
    if (!topCareer) return;
    setInterviewLoading(true);
    try {
      const res = await fetchInterviewPrep(topCareer.title, state.form.education, state.form.interests);
      navigate('/interview-prep', { state: { data: res.data, career: topCareer, form: state.form } });
    } catch {
      navigate('/interview-prep', { state: { data: null, career: topCareer, form: state.form } });
    } finally {
      setInterviewLoading(false);
    }
  };

  if (!state?.data) return <EmptyState />;
  if (!visible)       return <LoadingSkeleton />;

  const data       = currentData ?? state.data;
  const ragUsed    = (state.data as any).ragUsed    ?? false;
  const ragSources = (state.data as any).ragSources ?? [];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="animate-fade-slide-up mb-8">
          <button
            onClick={() => navigate('/assessment')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
              hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Your Career Results
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Personalised for{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{data.profile.name}</span>
                {data.profile.state && (
                  <span> · {data.profile.state}</span>
                )}
                {data.profile.education && (
                  <span> · {data.profile.education}</span>
                )}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Resume */}
              <button
                onClick={handleGenerateResume}
                disabled={resumeLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                  bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
                title="Generate Resume"
              >
                {resumeLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileText className="w-3.5 h-3.5" />}
                Resume
              </button>

              {/* Interview Prep */}
              <button
                onClick={handleInterviewPrep}
                disabled={interviewLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                  bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
                title="Interview Preparation"
              >
                {interviewLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <MessageSquare className="w-3.5 h-3.5" />}
                Interview Prep
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                  text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors"
                title="Print results"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                  text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors"
                title="Copy link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/assessment')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                  bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>
            </div>
          </div>

          {/* AI / RAG provenance */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
              text-xs font-medium text-gray-600 dark:text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              {data.generatedBy}
            </div>

            {data.profile.interests.length > 0 && data.profile.interests.map((int) => (
              <span key={int}
                className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20
                  text-xs font-semibold text-primary-700 dark:text-primary-300">
                {int}
              </span>
            ))}
          </div>

          {/* Language Selector */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Translate:</span>
            {translating && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />}
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                onClick={() => handleTranslate(l.code)}
                disabled={translating}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
                  ${selectedLang === l.code
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400'
                  } disabled:opacity-50`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {ragUsed && <div className="mt-3"><RagBadge sources={ragSources} /></div>}
        </div>

        {/* ── Section 1: Recommended Careers ──────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            index={0}
            title="Recommended Careers"
            subtitle={`${data.recommendedCareers.length} career paths matched to your profile`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.recommendedCareers.map((career, i) => (
              <CareerCard key={career.title} career={career} rank={i} delay={i} />
            ))}
          </div>
        </section>

        {/* ── Section 2: Career Roadmap ────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            index={1}
            title="Your Career Roadmap"
            subtitle="A phased action plan tailored to your current education level"
          />
          <RoadmapTimeline phases={data.roadmap} />
        </section>

        {/* ── Section 3: Skill Gap ─────────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            index={2}
            title="Skill Gap Analysis"
            subtitle="Skills to develop on the path to your recommended careers"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.skillGaps.map((gap, i) => (
              <SkillGapCard key={gap.skill} gap={gap} delay={i} />
            ))}
          </div>
        </section>

        {/* ── Section 4: Government Schemes ───────────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            index={3}
            title="Government Schemes for You"
            subtitle="Scholarships, training programs & loans you're eligible for"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.governmentSchemes.map((scheme, i) => (
              <SchemeCard key={scheme.name} scheme={scheme} delay={i} />
            ))}
          </div>
        </section>

        {/* ── Section 5: Free Learning Resources ──────────────────────────── */}
        <section className="mb-10">
          <SectionHeader
            index={4}
            title="Free Learning Resources"
            subtitle="Curated free platforms to start building your skills today"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.learningResources.map((cat, i) => (
              <LearningCategoryCard
                key={cat.category}
                category={cat.category}
                resources={cat.resources}
                delay={i}
              />
            ))}
          </div>
        </section>

        {/* ── Footer CTA ───────────────────────────────────────────────────── */}
        <div className="animate-fade-slide-up text-center py-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Want to explore a different set of careers?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/assessment" className="btn-secondary text-sm py-2.5 px-5">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Assessment
            </Link>
            <Link to="/" className="btn-primary text-sm py-2.5 px-5">
              Back to Home
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResultsPage;
