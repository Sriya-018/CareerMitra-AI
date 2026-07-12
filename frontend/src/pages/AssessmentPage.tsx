import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCareerAssessment } from '../services/api';
import type { AssessmentFormData } from '../types';
import VoiceMicButton from '../components/VoiceMicButton';
import {
  User,
  BookOpen,
  MapPin,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

const LANGUAGES = [
  'Hindi','English','Tamil','Telugu','Kannada','Malayalam','Bengali',
  'Marathi','Gujarati','Punjabi','Odia','Assamese','Urdu',
];

const SUBJECTS = [
  'Mathematics','Physics','Chemistry','Biology','History','Geography',
  'Economics','Political Science','Literature','Computer Science',
  'Agriculture','Vocational Studies','Fine Arts','Physical Education',
];

const INTERESTS = [
  'Technology','Agriculture','Healthcare','Education','Arts & Design',
  'Business','Sports','Music','Environment','Social Work',
  'Government Services','Engineering','Media & Communication','Finance',
];

const EDUCATION_LEVELS = [
  'Class 8 or below','Class 9–10 (High School)','Class 11–12 (Intermediate)',
  'Diploma / ITI','Undergraduate (Pursuing)','Graduate (Completed)',
  'Postgraduate','Vocational Training',
];

const INCOME_RANGES = [
  'Below ₹1,00,000','₹1,00,000 – ₹2,50,000','₹2,50,000 – ₹5,00,000',
  '₹5,00,000 – ₹10,00,000','Above ₹10,00,000',
];

const initialForm: AssessmentFormData = {
  fullName: '',
  age: '',
  gender: '',
  education: '',
  state: '',
  district: '',
  preferredLanguage: '',
  favoriteSubjects: [],
  interests: [],
  skills: '',
  careerGoal: '',
  familyIncome: '',
};

type FieldErrors = Partial<Record<keyof AssessmentFormData, string>>;

const steps = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Education', icon: BookOpen },
  { id: 3, label: 'Location', icon: MapPin },
  { id: 4, label: 'Interests', icon: Heart },
  { id: 5, label: 'Goals', icon: Star },
];

function MultiSelect({
  options,
  selected,
  onChange,
  max = 6,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  max?: number;
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else if (selected.length < max) {
      onChange([...selected, item]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
              active
                ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600'
            } ${!active && selected.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {opt}
          </button>
        );
      })}
      {selected.length > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 self-center ml-1">
          {selected.length}/{max} selected
        </span>
      )}
    </div>
  );
}

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentFormData>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field: keyof AssessmentFormData, value: AssessmentFormData[keyof AssessmentFormData]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (currentStep: number): boolean => {
    const errs: FieldErrors = {};
    if (currentStep === 1) {
      if (!form.fullName.trim()) errs.fullName = 'Full name is required';
      else if (form.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters';
      if (!form.age) errs.age = 'Age is required';
      else if (parseInt(form.age) < 10 || parseInt(form.age) > 40) errs.age = 'Age must be between 10 and 40';
      if (!form.gender) errs.gender = 'Please select a gender';
      if (!form.preferredLanguage) errs.preferredLanguage = 'Please select a preferred language';
    }
    if (currentStep === 2) {
      if (!form.education) errs.education = 'Please select your education level';
    }
    if (currentStep === 3) {
      if (!form.state) errs.state = 'Please select your state';
      if (!form.district.trim()) errs.district = 'District is required';
    }
    if (currentStep === 4) {
      if (form.interests.length === 0) errs.interests = 'Select at least one interest';
    }
    if (currentStep === 5) {
      if (!form.familyIncome) errs.familyIncome = 'Please select income range';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate(5)) return;
    setLoading(true);
    setApiError('');
    try {
      const result = await submitCareerAssessment(form);
      navigate('/results', { state: { data: result.data, form } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to connect to server. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) =>
    msg ? (
      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5" /> {msg}
      </p>
    ) : null;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Assessment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tell us about yourself — our AI will recommend the perfect career path for you.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      done
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : active
                        ? 'bg-white dark:bg-gray-900 border-primary-600 text-primary-600'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      step > s.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="card animate-fade-in">
          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>

              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                />
                <ErrorMsg msg={errors.fullName} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 18"
                    min={10}
                    max={40}
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                  />
                  <ErrorMsg msg={errors.age} />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    className="input-field"
                    value={form.gender}
                    onChange={(e) => set('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                  <ErrorMsg msg={errors.gender} />
                </div>
              </div>

              <div>
                <label className="label">Preferred Language *</label>
                <select
                  className="input-field"
                  value={form.preferredLanguage}
                  onChange={(e) => set('preferredLanguage', e.target.value)}
                >
                  <option value="">Select language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.preferredLanguage} />
              </div>
            </div>
          )}

          {/* Step 2 — Education */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Education Background</h2>

              <div>
                <label className="label">Highest Education Level *</label>
                <select
                  className="input-field"
                  value={form.education}
                  onChange={(e) => set('education', e.target.value)}
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.education} />
              </div>

              <div>
                <label className="label">Favourite Subjects (select up to 5)</label>
                <MultiSelect
                  options={SUBJECTS}
                  selected={form.favoriteSubjects}
                  onChange={(v) => set('favoriteSubjects', v)}
                  max={5}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Current Skills / Abilities</label>
                  <VoiceMicButton
                    onTranscript={(t) => set('skills', form.skills ? `${form.skills} ${t}` : t)}
                  />
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="e.g. Basic computer knowledge, farming, stitching, cooking, driving..."
                  value={form.skills}
                  onChange={(e) => set('skills', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3 — Location */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Location</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Location helps us recommend government schemes and local opportunities specific to your region.
              </p>

              <div>
                <label className="label">State *</label>
                <select
                  className="input-field"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                >
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.state} />
              </div>

              <div>
                <label className="label">District *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your district"
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                />
                <ErrorMsg msg={errors.district} />
              </div>
            </div>
          )}

          {/* Step 4 — Interests */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Interests & Passions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select areas that genuinely excite you. Our AI uses these to match careers you'll truly enjoy.
              </p>

              <div>
                <label className="label">Interests * (select up to 4)</label>
                <MultiSelect
                  options={INTERESTS}
                  selected={form.interests}
                  onChange={(v) => set('interests', v)}
                  max={4}
                />
                <ErrorMsg msg={errors.interests} />
              </div>
            </div>
          )}

          {/* Step 5 — Goals & Income */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goals & Background</h2>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Career Goal (optional)</label>
                  <VoiceMicButton
                    onTranscript={(t) => set('careerGoal', form.careerGoal ? `${form.careerGoal} ${t}` : t)}
                  />
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What do you dream of doing? (e.g. I want to become a doctor and serve my village, or start my own business...)"
                  value={form.careerGoal}
                  onChange={(e) => set('careerGoal', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Family Annual Income *</label>
                <select
                  className="input-field"
                  value={form.familyIncome}
                  onChange={(e) => set('familyIncome', e.target.value)}
                >
                  <option value="">Select income range</option>
                  {INCOME_RANGES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Used only to recommend relevant scholarships. Not shared.
                </p>
                <ErrorMsg msg={errors.familyIncome} />
              </div>

              {/* Summary */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mt-2">
                <h4 className="text-sm font-bold text-primary-700 dark:text-primary-300 mb-2">Your Profile Summary</h4>
                <div className="grid grid-cols-2 gap-1 text-xs text-primary-800 dark:text-primary-200">
                  <span><strong>Name:</strong> {form.fullName || '–'}</span>
                  <span><strong>Age:</strong> {form.age || '–'}</span>
                  <span><strong>Education:</strong> {form.education || '–'}</span>
                  <span><strong>State:</strong> {form.state || '–'}</span>
                  <span><strong>Language:</strong> {form.preferredLanguage || '–'}</span>
                  <span><strong>Interests:</strong> {form.interests.join(', ') || '–'}</span>
                </div>
              </div>

              {apiError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {apiError}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {step} of {steps.length}
            </span>

            {step < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary text-sm py-2.5 px-5"
              >
                Next
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary text-sm py-2.5 px-5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    Get My Results
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
