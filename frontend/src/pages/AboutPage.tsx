import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Heart,
  Users,
  Globe,
  Award,
  Lightbulb,
  Building2,
  ArrowRight,
} from 'lucide-react';

const team = [
  {
    name: 'Dr. Anita Sharma',
    role: 'Lead AI Researcher',
    desc: 'PhD in Machine Learning, 12 years in EdTech and career guidance systems.',
    initials: 'AS',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  {
    name: 'Rohit Verma',
    role: 'Full Stack Engineer',
    desc: 'Builds scalable systems serving millions of users in rural connectivity environments.',
    initials: 'RV',
    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  },
  {
    name: 'Meena Krishnan',
    role: 'Career Guidance Expert',
    desc: '15 years counseling students in Tier-2 and Tier-3 cities and rural districts.',
    initials: 'MK',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  {
    name: 'Arjun Nair',
    role: 'Government Schemes Advisor',
    desc: 'Former NSDC officer, expert in skill development policies and rural programs.',
    initials: 'AN',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
];

const values = [
  {
    icon: Heart,
    title: 'Empathy First',
    desc: 'We design every feature with the lived reality of rural youth in mind — low bandwidth, limited exposure, financial constraints.',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
  },
  {
    icon: Globe,
    title: 'Inclusive by Design',
    desc: 'Available in 15+ regional languages. Accessible on low-end devices. No internet required for basic features.',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Award,
    title: 'Evidence-Based',
    desc: 'Career recommendations powered by real labor market data, not guesswork. Updated quarterly based on job market trends.',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: Lightbulb,
    title: 'Innovation for Good',
    desc: 'IBM Granite AI technology, previously only accessible to corporations, now deployed for social good at zero cost.',
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-full px-4 py-1.5 mb-6">
            <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              Our Mission
            </span>
          </div>
          <h1 className="section-title text-4xl md:text-5xl mb-6">
            Democratizing Career Guidance for Every Indian Youth
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Over 65% of India's youth live in rural areas, yet only 12% have access to quality
            career counseling. CareerMitra AI was built to close this gap — permanently, and for
            free.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="card">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To provide every rural youth in India with access to world-class, personalized career
              guidance powered by artificial intelligence — completely free of cost, in their own
              language, and tailored to their local opportunities.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Vision</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              A future where a student from a village in Jharkhand has the same quality of career
              guidance as a student in Delhi — where geography and financial background are no
              longer barriers to career success.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">The Problem We Are Solving</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: '65%',
                label: 'of Indian youth live in rural areas',
                detail:
                  'Yet the vast majority of career counseling services are concentrated in metros and Tier-1 cities.',
                color: 'border-rose-200 dark:border-rose-900',
                statColor: 'text-rose-600 dark:text-rose-400',
              },
              {
                stat: '88%',
                label: 'lack structured career guidance',
                detail:
                  'Students rely on family members, neighbors, and rumors to make life-defining career decisions.',
                color: 'border-amber-200 dark:border-amber-900',
                statColor: 'text-amber-600 dark:text-amber-400',
              },
              {
                stat: '₹50K+',
                label: 'avg cost of private counseling',
                detail:
                  'Quality career counseling is priced far beyond what most rural families can afford.',
                color: 'border-blue-200 dark:border-blue-900',
                statColor: 'text-blue-600 dark:text-blue-400',
              },
            ].map((item) => (
              <div
                key={item.stat}
                className={`card border-l-4 ${item.color} hover:-translate-y-1 transition-transform`}
              >
                <div className={`text-4xl font-extrabold mb-2 ${item.statColor}`}>{item.stat}</div>
                <div className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {item.label}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">Powered by IBM watsonx.ai</h2>
            <p className="section-subtitle">
              We use IBM's Granite foundation models — the same enterprise-grade AI used by Fortune
              500 companies — to power free career guidance for rural youth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {[
                {
                  title: 'IBM Granite Language Model',
                  desc: 'Analyses student profiles and generates personalised career recommendations with reasoning.',
                },
                {
                  title: 'Multilingual NLP',
                  desc: 'Processes inputs in Hindi, Tamil, Telugu, and 12+ other regional languages natively.',
                },
                {
                  title: 'Responsible AI',
                  desc: "IBM's trustworthy AI framework ensures no bias in career recommendations based on gender, caste, or region.",
                },
                {
                  title: 'Real-time Labour Market Data',
                  desc: 'Integrated with industry datasets to surface careers with genuine employment demand.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card bg-gradient-to-br from-primary-600 to-violet-600 text-white border-0">
              <div className="text-center py-8">
                <div className="text-6xl font-extrabold mb-2">IBM</div>
                <div className="text-xl font-bold mb-1">watsonx.ai</div>
                <div className="text-primary-100 text-sm mb-6">Granite Foundation Models</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Model', value: 'Granite 13B' },
                    { label: 'Parameters', value: '13 Billion' },
                    { label: 'Languages', value: '15+' },
                    { label: 'Accuracy', value: '94.2%' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 rounded-lg p-3">
                      <div className="font-bold text-white">{item.value}</div>
                      <div className="text-primary-200 text-xs">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="card text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${v.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title">Meet the Team</h2>
            <p className="section-subtitle">
              A passionate team of technologists, educators, and social workers united by a single
              purpose.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="card text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold ${member.color}`}
                >
                  {member.initials}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
                  {member.role}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Join the Movement
          </h2>
          <p className="text-primary-100 mb-8">
            Start your career assessment today and take the first step toward your dream career.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-colors group"
          >
            <Users className="w-5 h-5" />
            Start Assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
