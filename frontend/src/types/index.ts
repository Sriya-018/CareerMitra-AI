export interface AssessmentFormData {
  fullName: string;
  age: string;
  gender: string;
  education: string;
  state: string;
  district: string;
  preferredLanguage: string;
  favoriteSubjects: string[];
  interests: string[];
  skills: string;
  careerGoal: string;
  familyIncome: string;
}

export interface Career {
  title: string;
  match: number;
  description: string;
  // ── enriched fields added in v2 ──
  reason: string;
  requiredEducation: string;
  entranceExams: string[];
  skillsToLearn: string[];
  salaryRange: string;
}

export interface RoadmapPhase {
  phase: string;
  steps: string[];
  timeframe: string;
  milestone: string;
}

export interface SkillGap {
  skill: string;
  level: string;
  priority: string;
  resource: string;
}

export interface GovernmentScheme {
  name: string;
  benefit: string;
  eligibility: string;
  link: string;
}

export interface LearningResource {
  name: string;
  url: string;
  description: string;
}

export interface LearningCategory {
  category: string;
  resources: LearningResource[];
}

export interface CareerResultData {
  profile: {
    name: string;
    education: string;
    state: string;
    interests: string[];
  };
  recommendedCareers: Career[];
  roadmap: RoadmapPhase[];
  skillGaps: SkillGap[];
  governmentSchemes: GovernmentScheme[];
  learningResources: LearningCategory[];
  generatedBy: string;
  timestamp: string;
  ragUsed?: boolean;
  ragSources?: string[];
}

export interface ApiResponse {
  success: boolean;
  data: CareerResultData;
}

// ── Resume ───────────────────────────────────────────────────────────────────

export interface ResumeEducationEntry {
  degree: string;
  institution: string;
  year: string;
  status: string;
}

export interface ResumeCertification {
  title: string;
  issuer: string;
  year: string;
}

export interface ResumeTargetCareer {
  title: string;
  match: number;
  exams: string[];
}

export interface ResumeGovernmentScheme {
  name: string;
  benefit: string;
  link: string;
}

export interface ResumeData {
  generatedAt: string;
  personal: {
    name: string;
    age: string;
    gender: string;
    location: string;
    language: string;
  };
  objective: string;
  education: ResumeEducationEntry[];
  skills: string[];
  interests: string[];
  favoriteSubjects: string[];
  careerGoal: string;
  targetCareers: ResumeTargetCareer[];
  suggestedCertifications: ResumeCertification[];
  governmentSchemes: ResumeGovernmentScheme[];
}

export interface ResumeApiResponse {
  success: boolean;
  resume: ResumeData;
}

// ── Interview Prep ───────────────────────────────────────────────────────────

export interface InterviewQuestion {
  question: string;
  answer: string;
  tip: string;
  category: string;
}

export interface InterviewPrepData {
  careerTitle: string;
  totalQuestions: number;
  categories: string[];
  questions: InterviewQuestion[];
  prepTips: string[];
  generatedBy: string;
}

export interface InterviewPrepApiResponse {
  success: boolean;
  data: InterviewPrepData;
}

// ── Admin Dashboard ──────────────────────────────────────────────────────────

export interface AdminCounters {
  totalRequests: number;
  careerAssessments: number;
  speechTranscribed: number;
  textSynthesized: number;
  translationsDone: number;
  resumesGenerated: number;
  interviewPreps: number;
}

export interface AdminRecentRequest {
  endpoint: string;
  ts: string;
  ms: number;
}

export interface AdminStats {
  uptime: { ms: number; seconds: number; human: string };
  counters: AdminCounters;
  topStates: { state: string; count: number }[];
  topInterests: { interest: string; count: number }[];
  topLanguages: { language: string; count: number }[];
  topEducation: { level: string; count: number }[];
  recentRequests: AdminRecentRequest[];
  generatedAt: string;
}

export interface AdminApiResponse {
  success: boolean;
  stats: AdminStats;
}
