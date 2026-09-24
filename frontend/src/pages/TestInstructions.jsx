import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ShieldCheck, Clock, Key, AlertTriangle, CheckCircle, ArrowRight, BookOpen } from 'lucide-react';

export default function TestInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  async function fetchSessionDetails() {
    setLoading(true);
    try {
      const res = await api.get('/candidate/sessions');
      const found = (res.data.sessions || []).find(s => s.session_id === id);
      if (found) {
        setSession(found);
      } else {
        setError('Session not found or unavailable.');
      }
    } catch (err) {
      setError('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  }

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) return;

    setJoining(true);
    setError('');

    try {
      await api.post(`/candidate/sessions/${id}/join`, {
        access_code: accessCode
      });
      navigate(`/candidate/sessions/${id}/test`);
    } catch (err) {
      if (err.response?.data?.already_submitted) {
        navigate(`/candidate/sessions/${id}/result`);
      } else {
        setError(err.response?.data?.error || 'Failed to start session. Check your access code.');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="pb-6 border-b border-slate-800">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Thinqloud Placement Assessment
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              {session?.title || 'Campus Placement Screening Test'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Please read the assessment guidelines carefully before initiating the countdown timer.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Total Duration</span>
              <span className="text-lg font-bold text-white font-mono">{session?.duration_minutes} Mins</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Questions</span>
              <span className="text-lg font-bold text-white font-mono">{session?.total_questions} MCQs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Question Pattern</span>
              <span className="text-lg font-bold text-white font-mono">VQAR</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Negative Marking</span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                {session?.negative_marking ? `-${session.negative_marking}` : 'None'}
              </span>
            </div>
          </div>

          {/* Rules and Guidelines */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Test Rules & Proctor Protocol</span>
            </h3>

            <ul className="space-y-2.5 list-disc list-inside text-slate-400">
              <li>
                <strong className="text-slate-200">Strict Countdown:</strong> The 75-minute timer starts immediately upon clicking "Start Test". The test will automatically submit upon expiration.
              </li>
              <li>
                <strong className="text-slate-200">Instant Auto-Save:</strong> Every option you click is immediately saved to the server. You do not need to click a manual save button.
              </li>
              <li>
                <strong className="text-slate-200">Tab Switch Watchdog:</strong> Navigating away from the active tab fires a <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">TAB_SWITCH</code> event. 3 or more tab switches are logged for invigilator review.
              </li>
              <li>
                <strong className="text-slate-200">Navigation:</strong> You can navigate between questions freely using the question palette, Previous/Next buttons, or keyboard arrows.
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleStartTest} className="mt-8 pt-6 border-t border-slate-800 space-y-5">
            {session?.has_access_code && (
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Session Access Code</span>
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. THINQ6"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm font-mono tracking-widest text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Supplied by your test invigilator / placement coordinator</span>
              </div>
            )}

            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
              />
              <span className="text-xs text-slate-300">
                I have read and agree to comply with the assessment rules and proctoring audit conditions.
              </span>
            </label>

            <button
              type="submit"
              disabled={!acceptedTerms || joining}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Start Assessment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
