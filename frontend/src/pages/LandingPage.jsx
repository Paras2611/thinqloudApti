import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, CheckCircle2, Clock, BarChart3, Database, FileSpreadsheet, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Campus Placement Screening System · PRD v1.0</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Thinqloud <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">VQAR Aptitude</span> Assessment Platform
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Purpose-built, session-based campus recruitment testing environment with real-time proctor audit logging, strict timer synchronization, and instant analytics.
            </p>

            {/* Portals CTA */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/candidate/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 text-base group"
              >
                <Award className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Candidate Portal</span>
              </Link>

              <Link
                to="/admin/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-2 text-base"
              >
                <Shield className="w-5 h-5 text-slate-400" />
                <span>Placement Admin Portal</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Pillars of VQAR Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The 4-Section VQAR Assessment</h2>
            <p className="text-slate-400 text-sm mt-2">Replicating industry standard campus aptitude patterns</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
                V
              </div>
              <h3 className="text-lg font-bold text-white">Verbal Ability</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Reading comprehension, para-jumbles, vocabulary, sentence completion, and logical analogies.
              </p>
              <div className="mt-4 text-[11px] font-mono text-blue-400">Suggested: 10–15 Qs (~12 min)</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                Q
              </div>
              <h3 className="text-lg font-bold text-white">Quantitative</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Percentages, ratios, time & work, speed-distance, CI/SI, numbers, and data interpretation with LaTeX math notation.
              </p>
              <div className="mt-4 text-[11px] font-mono text-emerald-400">Suggested: 20–25 Qs (~30 min)</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
                A
              </div>
              <h3 className="text-lg font-bold text-white">Analytical / Logical</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Number & alphabet series, syllogisms, blood relations, direction sense, and seating arrangements.
              </p>
              <div className="mt-4 text-[11px] font-mono text-purple-400">Suggested: 20–25 Qs (~25 min)</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
                R
              </div>
              <h3 className="text-lg font-bold text-white">Reasoning & Grammar</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Error detection, subject-verb agreement, tenses, prepositions, and structural syntax verification.
              </p>
              <div className="mt-4 text-[11px] font-mono text-amber-400">Suggested: 10–15 Qs (~8 min)</div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-slate-900/40 border-y border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Synchronized Countdown</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Persistent countdown with amber (10 min) and red (5 min) visual warnings. Server-side auto-submission on expiration.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Continuous Auto-Save</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Zero data loss. Candidate option choices are auto-saved idempotently on every click without needing a manual save button.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Anti-Cheat Audit Trail</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time tab switch tracking using the browser visibility API, flagging violations and logging immutable events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-center text-xs text-slate-500">
        <p>Aptitude Test Platform · Thinqloud Campus Placement Screening System</p>
        <p className="mt-1">Architected & Engineered by Paras Jagadish Patil</p>
      </footer>
    </div>
  );
}
