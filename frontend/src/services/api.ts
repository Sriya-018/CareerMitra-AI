import axios from 'axios';
import type {
  AssessmentFormData,
  ApiResponse,
  CareerResultData,
  ResumeApiResponse,
  InterviewPrepApiResponse,
  AdminApiResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Career assessment ────────────────────────────────────────────────────────

export const submitCareerAssessment = async (formData: AssessmentFormData): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/api/career', formData);
  return response.data;
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    await api.get('/api/health');
    return true;
  } catch {
    return false;
  }
};

// ── Speech to Text ────────────────────────────────────────────────────────────

/**
 * Send raw audio Blob to the backend STT endpoint.
 * @param audioBlob  Recorded audio blob (webm/ogg/wav)
 * @param model      Watson STT model id (default: en-IN_BroadbandModel)
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  model = 'en-US_Multimedia'
): Promise<string> => {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const response = await api.post<{ success: boolean; transcript: string }>(
    `/api/speech/transcribe?contentType=${encodeURIComponent(audioBlob.type || 'audio/webm')}&model=${model}`,
    arrayBuffer,
    { headers: { 'Content-Type': audioBlob.type || 'audio/webm' } }
  );
  return response.data.transcript;
};

// ── Text to Speech ────────────────────────────────────────────────────────────

/**
 * Request TTS audio for a given text + language.
 * Returns an object URL for the MP3 blob that can be set on an <audio> src.
 */
export const synthesizeSpeech = async (text: string, lang = 'en'): Promise<string> => {
  const response = await api.post(
    '/api/speech/synthesize',
    { text, lang },
    { responseType: 'blob' }
  );
  const blob = new Blob([response.data as BlobPart], { type: 'audio/mp3' });
  return URL.createObjectURL(blob);
};

// ── Language Translation ──────────────────────────────────────────────────────

export const translateResults = async (
  data: CareerResultData,
  targetLang: string
): Promise<CareerResultData> => {
  const response = await api.post<{ success: boolean; data: CareerResultData }>(
    '/api/translate',
    { data, targetLang }
  );
  return response.data.data;
};

// ── Resume Generator ──────────────────────────────────────────────────────────

export const generateResume = async (
  formData: AssessmentFormData,
  careerData: CareerResultData
): Promise<ResumeApiResponse> => {
  const response = await api.post<ResumeApiResponse>('/api/resume', { formData, careerData });
  return response.data;
};

// ── Interview Prep ────────────────────────────────────────────────────────────

export const fetchInterviewPrep = async (
  careerTitle: string,
  education: string,
  interests: string[]
): Promise<InterviewPrepApiResponse> => {
  const response = await api.post<InterviewPrepApiResponse>('/api/interview-prep', {
    careerTitle,
    education,
    interests,
  });
  return response.data;
};

// ── Admin Dashboard ───────────────────────────────────────────────────────────

export const fetchAdminStats = async (key?: string): Promise<AdminApiResponse> => {
  const url = key ? `/api/admin/stats?key=${encodeURIComponent(key)}` : '/api/admin/stats';
  const response = await api.get<AdminApiResponse>(url);
  return response.data;
};
