import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Radio,
  RefreshCw
} from 'lucide-react';

export default function LiveMonitor() {
  const [searchParams] = useSearchParams();
  const initialSessionId = searchParams.get('session_id') || '';

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [liveData, setLiveData] = useState({
    metrics: { total_joined: 0, in_progress: 0, submitted: 0, total_tab_switches: 0 },
    candidates: []
  });
  const [loading, setLoading] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);

  // Fetch active sessions list
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await api.get('/admin/sessions');
        const list = res.data.sessions || [];
        setSessions(list);
        if (!selectedSessionId && list.length > 0) {
          // Select first active session or first session
          const activeS = list.find(s => s.status === 'ACTIVE') || list[0];
          setSelectedSessionId(activeS.session_id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSessions();
  }, []);

  // Fetch live stats and subscribe to WebSocket room
  useEffect(() => {
    if (!selectedSessionId) return;

    fetchLiveMetrics();

    const socket = getSocket();
    socket.emit('join_session_room', { session_id: selectedSessionId, role: 'ADMIN' });

    const handleCandidateJoined = () => {
      fetchLiveMetrics();
    };

    const handleCandidateSubmitted = () => {
      fetchLiveMetrics();
    };

    const handleLiveEvent = (data) => {
      setLiveEvents(prev => [data, ...prev.slice(0, 19)]);
      fetchLiveMetrics();
    };

    socket.on('candidate_joined', handleCandidateJoined);
    socket.on('candidate_submitted', handleCandidateSubmitted);
    socket.on('live_event', handleLiveEvent);

    // Periodic poll fallback every 5s
    const pollInterval = setInterval(fetchLiveMetrics, 5000);

    return () => {
      socket.emit('leave_session_room', { session_id: selectedSessionId });
      socket.off('candidate_joined', handleCandidateJoined);
      socket.off('candidate_submitted', handleCandidateSubmitted);
      socket.off('live_event', handleLiveEvent);
      clearInterval(pollInterval);
    };
  }, [selectedSessionId]);

  async function fetchLiveMetrics() {
    if (!selectedSessionId) return;
    try {
      const res = await api.get(`/admin/logs/live/${selectedSessionId}`);
      setLiveData(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  const currentSession = sessions.find(s => s.session_id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Real-Time Live Monitor</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            WebSocket-streamed invigilation dashboard monitoring active candidate sessions and proctor violations
          </p>
        </div>

        {/* Session Selector */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium max-w-xs truncate"
          >
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                [{s.status}] {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={fetchLiveMetrics}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Real-time Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Joined</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white font-mono">
            {liveData.metrics?.total_joined || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered candidates enrolled</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Currently Writing</span>
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400 font-mono">
            {liveData.metrics?.in_progress || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active test timers ticking</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400 font-mono">
            {liveData.metrics?.submitted || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Completed assessments</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">Tab Switch Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-400 font-mono">
            {liveData.metrics?.total_tab_switches || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Proctor defocus anomalies</p>
        </div>
      </div>

      {/* Main Grid: Active Candidate Cards & Live Event Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate List (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Candidate Engagement Table</span>
            <span className="text-xs font-mono text-slate-400">{liveData.candidates?.length || 0} Connected</span>
          </h3>

          {liveData.candidates?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Waiting for candidates to join this test session...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Candidate</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Tab Switches</th>
                    <th className="px-3 py-2.5">Start Time</th>
                    <th className="px-3 py-2.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {liveData.candidates.map((cand) => {
                    const isSevere = cand.tab_switches >= 3;
                    return (
                      <tr key={cand.candidate_id} className="hover:bg-slate-900/40">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-white">{cand.candidate_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{cand.candidate_email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            cand.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            {cand.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isSevere
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : cand.tab_switches > 0
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'text-slate-500'
                          }`}>
                            {isSevere && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            <span>{cand.tab_switches} switches</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-400">
                          {cand.start_time ? new Date(cand.start_time).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-200">
                          {cand.score !== null ? cand.score : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Stream / Audit Feed (1 col) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-[480px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Proctor Feed</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {liveEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Events will appear here in real-time as candidates interact with the test.
              </div>
            ) : (
              liveEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300">{evt.candidate_name || 'Candidate'}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    {evt.type === 'tab_switch_alert' ? (
                      <span className="text-rose-400 font-medium">
                        ⚠️ Switched tab (Count: {evt.switch_count})
                      </span>
                    ) : (
                      <span>Active in session</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
