import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Map,
  BookOpen,
  IndianRupee,
  Users,
  ShieldCheck,
  Sparkles,
  Globe,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Powered by IBM watsonx.ai Granite models, our AI analyses your profile to give highly personalised career recommendations.',
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Map,
    title: 'Step-by-Step Roadmap',
    description:
      'Get a clear, actionable career roadmap tailored to your education level, interests, and local context.',
    color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  },
  {
    icon: IndianRupee,
    title: 'Government Schemes',
    description:
      'Discover scholarships, skill programs, and government schemes that match your eligibility — all in one place.',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  },
  {
    icon: BookOpen,
    title: 'Free Learning Resources',
    description:
      'Access curated free courses, certifications, and skill development programs from SWAYAM, NSDC, and more.',
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Globe,
    title: 'Regional Language Support',
    description:
      'Access career guidance in your preferred language — Hindi, Tamil, Telugu, Bengali, and more regional languages.',
    color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  },
  {
    icon: TrendingUp,
    title: 'Skill Gap Analysis',
    description:
      'Identify gaps between your current skills and your dream career, with a prioritised learning plan.',
    color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  },
];

const stats = [
  { value: '500K+', label: 'Youth Empowered' },
  { value: '28', label: 'States Covered' },
  { value: '200+', label: 'Career Paths' },
  { value: '15+', label: 'Languages' },
];

const testimonials = [
  {
    quote:
      'CareerMitra AI helped me discover that I could become an agronomist. No one in my village had heard of this, but now I am studying it at state college!',
    name: 'Ramesh Patel',
    location: 'Vidisha, Madhya Pradesh',
    initials: 'RP',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  {
    quote:
      'I thought my only option was to migrate to the city. The AI showed me three careers I could build right here at home using free government training.',
    name: 'Sunita Devi',
    location: 'Sitamarhi, Bihar',
    initials: 'SD',
    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  },
  {
    quote:
      'The scholarship recommendations were life-changing. I got the NSP scholarship and now I can afford my nursing degree.',
    name: 'Priya Kumari',
    location: 'Nalanda, Bihar',
    initials: 'PK',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/20 -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 dark:bg-primary-900/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-100 dark:bg-violet-900/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              Powered by IBM watsonx.ai Granite
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Your AI Career Guide for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600">
              Rural India
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CareerMitra AI bridges the career information gap for rural youth. Get personalized
            career paths, government schemes, and learning resources — in your language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/assessment" className="btn-primary text-base px-8 py-3.5 group">
              Start Free Assessment
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/about" className="btn-secondary text-base px-8 py-3.5">
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">Everything You Need to Succeed</h2>
            <p className="section-subtitle">
              Our AI-powered platform gives rural youth the same career guidance quality available
              to students in top urban schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card group hover:-translate-y-1 transition-transform duration-200">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">How CareerMitra Works</h2>
            <p className="section-subtitle">
              Three simple steps to your personalised career roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Fill Your Profile',
                desc: 'Tell us about your education, interests, skills, and where you are from. It takes just 3 minutes.',
                icon: Users,
              },
              {
                step: '02',
                title: 'AI Analyses Your Profile',
                desc: 'IBM Granite AI processes your inputs against thousands of career pathways to find your best matches.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Get Your Roadmap',
                desc: 'Receive personalised career recommendations, skill gaps, government schemes, and free learning resources.',
                icon: ShieldCheck,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="relative text-center">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent dark:from-primary-700 z-10 -translate-x-4" />
                  )}
                  <div className="relative z-20">
                    <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xs font-bold text-primary-500 mb-2 tracking-widest">
                      STEP {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link to="/assessment" className="btn-primary text-base px-8 py-3.5 group">
              Begin Assessment Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">Stories of Change</h2>
            <p className="section-subtitle">
              Real youth from rural India who found their path with CareerMitra AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card flex flex-col gap-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Find Your Career Path?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of rural youth who have already discovered their potential with
            CareerMitra AI. It's completely free.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-colors shadow-lg group"
          >
            Start Your Free Assessment
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
