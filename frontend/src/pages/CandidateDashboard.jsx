import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Clock, HelpCircle, Layers, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function CandidateDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/candidate/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch sessions.');
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (session) => {
    if (session.attempt?.status === 'SUBMITTED' || session.attempt?.status === 'TIMED_OUT') {
      navigate(`/candidate/sessions/${session.session_id}/result`);
    } else {
      navigate(`/candidate/sessions/${session.session_id}/instructions`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Available Assessments</h1>
            <p className="text-sm text-slate-400 mt-1">Select an active campus placement test session to begin</p>
          </div>

          <button
            onClick={fetchSessions}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Sessions</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Active Sessions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no published test sessions available for your batch. Check back shortly or contact your placement coordinator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const attemptStatus = session.attempt?.status;
              const isCompleted = attemptStatus === 'SUBMITTED' || attemptStatus === 'TIMED_OUT';
              const isInProgress = attemptStatus === 'IN_PROGRESS';

              return (
                <div
                  key={session.session_id}
                  className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between glass-card-hover relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Status badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                        session.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : session.status === 'SCHEDULED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {session.status}
                      </span>

                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-400" />
                          <span>Submitted</span>
                        </span>
                      )}

                      {isInProgress && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                      {session.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {session.description}
                    </p>

                    {/* Metadata chips */}
                    <div className="grid grid-cols-2 gap-2 mt-5 py-3 border-y border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>{session.duration_minutes} Mins</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        <span>{session.total_questions} Questions</span>
                      </div>
                    </div>

                    {/* Section pills */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {session.sections && session.sections.map((sec, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300">
                          {sec.name} ({sec.count || 'Q'})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="mt-6 pt-2">
                    <button
                      onClick={() => handleAction(session)}
                      disabled={session.status !== 'ACTIVE' && !isCompleted}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
                        isCompleted
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : isInProgress
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                          : session.status === 'ACTIVE'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? (
                        <span>View Results & Score</span>
                      ) : isInProgress ? (
                        <>
                          <span>Resume Assessment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : session.status === 'ACTIVE' ? (
                        <>
                          <span>Start Assessment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <span>Upcoming (Not Yet Active)</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
