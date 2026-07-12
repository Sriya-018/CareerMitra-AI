/**
 * AdminPage.tsx
 *
 * Admin dashboard — displays usage metrics fetched from GET /api/admin/stats.
 * Protected by an optional ADMIN_SECRET_KEY query parameter.
 *
 * Route: /admin
 * Access: Enter the admin key in the UI, or set it via VITE_ADMIN_KEY env var.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  Users,
  Mic,
  Volume2,
  Globe,
  FileText,
  MessageSquare,
  Activity,
  Clock,
  RefreshCw,
  Lock,
  AlertTriangle,
  Loader2,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import type { AdminStats } from '../types';
import { fetchAdminStats } from '../services/api';

// ── Metric card ───────────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Bar row ───────────────────────────────────────────────────────────────────

const BarRow: React.FC<{ label: string; count: number; max: number; color: string }> = ({
  label, count, max, color,
}) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-600 dark:text-gray-400 w-40 flex-shrink-0 truncate">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-2 rounded-full ${color} animate-bar-grow`}
        style={{ width: max > 0 ? `${(count / max) * 100}%` : '0%' }}
      />
    </div>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right flex-shrink-0">
      {count}
    </span>
  </div>
);

// ── Admin page ────────────────────────────────────────────────────────────────

const AdminPage: React.FC = () => {
  const [key, setKey]         = useState(import.meta.env.VITE_ADMIN_KEY ?? '');
  const [keyInput, setKeyInput] = useState('');
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async (k: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminStats(k || undefined);
      setStats(res.stats);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load if key already set (from env var)
  useEffect(() => {
    if (key) void load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setKey(keyInput);
    void load(keyInput);
  };

  const handleRefresh = () => void load(key);

  // ── Login screen ────────────────────────────────────────────────────────────

  if (!key && !stats) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enter your admin key to continue</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="input-field"
              placeholder="Admin secret key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            <button type="submit" disabled={loading || !keyInput.trim()} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Access Dashboard
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
            Leave blank if ADMIN_SECRET_KEY is not set on the server.
          </p>
          <button
            type="button"
            onClick={() => { setKey(''); void load(''); }}
            className="w-full mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Try without a key
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (error && !stats) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={() => { setKey(''); setStats(null); setError(''); }} className="btn-secondary text-sm py-2 px-5">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { counters, topStates, topInterests, topLanguages, topEducation, recentRequests, uptime } = stats;
  const maxState    = topStates[0]?.count    ?? 1;
  const maxInterest = topInterests[0]?.count ?? 1;
  const maxLang     = topLanguages[0]?.count ?? 1;
  const maxEdu      = topEducation[0]?.count ?? 1;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Server uptime: <span className="font-semibold">{uptime.human}</span>
              {lastFetched && (
                <span> · Last refreshed: {lastFetched.toLocaleTimeString('en-IN')}</span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary text-sm py-2 px-4"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Requests"       value={counters.totalRequests}     icon={<Activity className="w-5 h-5 text-primary-600" />}     color="bg-primary-50 dark:bg-primary-900/20" />
          <MetricCard label="Assessments"          value={counters.careerAssessments} icon={<TrendingUp className="w-5 h-5 text-violet-600" />}    color="bg-violet-50 dark:bg-violet-900/20" />
          <MetricCard label="Voice Inputs"         value={counters.speechTranscribed} icon={<Mic className="w-5 h-5 text-rose-600" />}             color="bg-rose-50 dark:bg-rose-900/20" />
          <MetricCard label="TTS Plays"            value={counters.textSynthesized}   icon={<Volume2 className="w-5 h-5 text-amber-600" />}         color="bg-amber-50 dark:bg-amber-900/20" />
          <MetricCard label="Translations"         value={counters.translationsDone}  icon={<Globe className="w-5 h-5 text-cyan-600" />}            color="bg-cyan-50 dark:bg-cyan-900/20" />
          <MetricCard label="Resumes Generated"    value={counters.resumesGenerated}  icon={<FileText className="w-5 h-5 text-emerald-600" />}      color="bg-emerald-50 dark:bg-emerald-900/20" />
          <MetricCard label="Interview Preps"      value={counters.interviewPreps}    icon={<MessageSquare className="w-5 h-5 text-indigo-600" />}  color="bg-indigo-50 dark:bg-indigo-900/20" />
          <MetricCard label="Active Users"         value={`${uptime.human}`}          icon={<Clock className="w-5 h-5 text-gray-500" />}            color="bg-gray-100 dark:bg-gray-800" />
        </div>

        {/* Distribution charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Top States */}
          {topStates.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top States</h2>
              </div>
              <div className="space-y-2">
                {topStates.map((s) => (
                  <BarRow key={s.state} label={s.state} count={s.count} max={maxState} color="bg-primary-500" />
                ))}
              </div>
            </div>
          )}

          {/* Top Interests */}
          {topInterests.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Career Interests</h2>
              </div>
              <div className="space-y-2">
                {topInterests.map((s) => (
                  <BarRow key={s.interest} label={s.interest} count={s.count} max={maxInterest} color="bg-violet-500" />
                ))}
              </div>
            </div>
          )}

          {/* Language distribution */}
          {topLanguages.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Languages</h2>
              </div>
              <div className="space-y-2">
                {topLanguages.map((s) => (
                  <BarRow key={s.language} label={s.language} count={s.count} max={maxLang} color="bg-cyan-500" />
                ))}
              </div>
            </div>
          )}

          {/* Education distribution */}
          {topEducation.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Education Levels</h2>
              </div>
              <div className="space-y-2">
                {topEducation.map((s) => (
                  <BarRow key={s.level} label={s.level} count={s.count} max={maxEdu} color="bg-emerald-500" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent requests log */}
        {recentRequests.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Recent Requests (last {recentRequests.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-2 pr-4 font-semibold">Endpoint</th>
                    <th className="pb-2 pr-4 font-semibold">Time</th>
                    <th className="pb-2 font-semibold text-right">ms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {recentRequests.map((r, i) => (
                    <tr key={i} className="text-gray-600 dark:text-gray-400">
                      <td className="py-1.5 pr-4 font-mono">{r.endpoint}</td>
                      <td className="py-1.5 pr-4">
                        {new Date(r.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-1.5 text-right">{r.ms > 0 ? `${r.ms}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No data notice */}
        {counters.totalRequests === 0 && (
          <div className="card text-center py-10 mt-4">
            <Activity className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No requests recorded yet. Stats accumulate as users interact with the app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
