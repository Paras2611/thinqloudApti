import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  Download,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Trophy
} from 'lucide-react';

export default function ResultsLeaderboard() {
  const [searchParams] = useSearchParams();
  const initialSessionId = searchParams.get('session_id') || '';

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [leaderboard, setLeaderboard] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await api.get('/admin/sessions');
        const list = res.data.sessions || [];
        setSessions(list);
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(list[0].session_id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchResults();
  }, [selectedSessionId]);

  async function fetchResults() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/sessions/${selectedSessionId}/results`);
      setLeaderboard(res.data.leaderboard || []);
      setSessionInfo(res.data.session);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (!selectedSessionId) return;
    window.open(`/api/admin/sessions/${selectedSessionId}/export`, '_blank');
  };

  const filteredLeaderboard = leaderboard.filter(c =>
    c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Results & Leaderboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Official candidate scores, section accuracy metrics, and CSV reporting
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none max-w-xs truncate"
          >
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center">
        <Search className="w-4 h-4 text-slate-400 ml-2 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter candidate by name, roll number, or email..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Submissions Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Once candidates complete and submit the test, their rank and scores appear here.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Time Taken</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLeaderboard.map((item) => {
                  const pct = item.total_questions > 0 ? Math.round((item.total_correct / item.total_questions) * 100) : 0;
                  const isTop3 = item.rank <= 3;

                  return (
                    <tr key={item.attempt_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                          item.rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : item.rank === 2
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                            : item.rank === 3
                            ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                            : 'text-slate-400'
                        }`}>
                          {item.rank === 1 ? <Trophy className="w-4 h-4 text-amber-400" /> : `#${item.rank}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.candidate_name}</div>
                        <div className="text-[10px] text-slate-500">{item.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{item.roll_number || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-base font-extrabold font-mono text-indigo-400">
                          {item.score}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/ {item.total_questions}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-400 font-semibold">{pct}%</span>
                        <div className="text-[10px] text-slate-500">
                          {item.total_correct}C / {item.total_incorrect}W
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {item.time_taken_seconds ? `${Math.floor(item.time_taken_seconds / 60)}m ${item.time_taken_seconds % 60}s` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.submission_type === 'auto'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {item.submission_type === 'auto' ? 'Auto (Timeout)' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
