import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Layers,
  Plus,
  Play,
  Square,
  Copy,
  Trash2,
  Clock,
  HelpCircle,
  Activity,
  Award,
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 75,
    access_code: '',
    negative_marking: 0.25,
    show_result: true,
    shuffle_questions: true
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await api.get('/admin/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      setError('Failed to fetch test sessions.');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      await api.patch(`/admin/sessions/${sessionId}/status`, { status: newStatus });
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update session status.');
    }
  };

  const handleClone = async (sessionId) => {
    try {
      await api.post(`/admin/sessions/${sessionId}/clone`);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clone session.');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this DRAFT session?')) return;
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete session.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sessions', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        duration_minutes: 75,
        access_code: '',
        negative_marking: 0.25,
        show_result: true,
        shuffle_questions: true
      });
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create session.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Session Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, schedule, activate, and moderate campus placement test windows
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Session</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions Table / Cards */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Sessions Found</h3>
          <p className="text-xs text-slate-500 mt-1">Get started by creating your first campus test session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => {
            const isDraft = session.status === 'DRAFT';
            const isActive = session.status === 'ACTIVE';
            const isEnded = session.status === 'ENDED';

            return (
              <div
                key={session.session_id}
                className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Session Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : isDraft
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : session.status === 'SCHEDULED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {session.status}
                    </span>

                    {session.access_code && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
                        Code: {session.access_code}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500">
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {session.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{session.duration_minutes} Mins</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{session.total_questions} Questions</span>
                    </span>
                    <span className="text-slate-400">
                      Negative Penalty: <strong className="text-slate-200">{session.negative_marking || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Candidate Engagement Stats */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div>
                    <span className="text-base font-bold font-mono text-white block">
                      {session.stats?.total_joined || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Joined</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div>
                    <span className="text-base font-bold font-mono text-amber-400 block">
                      {session.stats?.in_progress || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div>
                    <span className="text-base font-bold font-mono text-emerald-400 block">
                      {session.stats?.submitted || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Submitted</span>
                  </div>
                </div>

                {/* Quick Actions (PRD SA-003 to SA-008) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Activate Action */}
                  {(isDraft || session.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handleStatusChange(session.session_id, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1 shadow-md shadow-emerald-600/20"
                      title="Activate Session (Start test taking)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Activate</span>
                    </button>
                  )}

                  {/* End Session Action */}
                  {isActive && (
                    <button
                      onClick={() => handleStatusChange(session.session_id, 'ENDED')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center space-x-1 shadow-md shadow-rose-600/20"
                      title="Force close and auto-submit all active attempts"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>End Session</span>
                    </button>
                  )}

                  {/* Live Monitor Link */}
                  {isActive && (
                    <button
                      onClick={() => navigate(`/admin/live?session_id=${session.session_id}`)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/50 text-xs font-medium flex items-center space-x-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Live Monitor</span>
                    </button>
                  )}

                  {/* View Results / Leaderboard */}
                  <button
                    onClick={() => navigate(`/admin/results?session_id=${session.session_id}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 border border-slate-700"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Scores</span>
                  </button>

                  {/* Clone */}
                  <button
                    onClick={() => handleClone(session.session_id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                    title="Clone Session Configuration"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete (DRAFT only) */}
                  {isDraft && (
                    <button
                      onClick={() => handleDelete(session.session_id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Delete Draft Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Test Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Thinqloud Campus Placement Screening - Batch B"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Candidate Instructions</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official campus placement aptitude assessment covering Quantitative, Logical, Verbal, and Grammar..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Access Code (Optional)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.access_code}
                    onChange={(e) => setFormData({ ...formData, access_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. THINQ6"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Negative Marking Penalty</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={2}
                    value={formData.negative_marking}
                    onChange={(e) => setFormData({ ...formData, negative_marking: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_result}
                      onChange={(e) => setFormData({ ...formData, show_result: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">Show result immediately</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_questions}
                      onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">Shuffle questions</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
