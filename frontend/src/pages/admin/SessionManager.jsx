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
  Edit3,
  RefreshCw,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DRAFT' | 'ENDED'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [reactivatingSession, setReactivatingSession] = useState(null);
  const [resetAttemptsOnReactivate, setResetAttemptsOnReactivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 75,
    access_code: '',
    negative_marking: 0.25,
    show_result: true,
    shuffle_questions: true,
    status: 'DRAFT',
    reset_attempts: false
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

  const handleStatusChange = async (sessionId, newStatus, resetAttempts = false) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/sessions/${sessionId}/status`, {
        status: newStatus,
        reset_attempts: resetAttempts
      });
      setReactivatingSession(null);
      setResetAttemptsOnReactivate(false);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update session status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClone = async (sessionId) => {
    try {
      await api.post(`/admin/sessions/${sessionId}/clone`);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clone session.');
    }
  };

  const handleDelete = async (session) => {
    const isEnded = session.status === 'ENDED';
    const message = isEnded
      ? `Are you sure you want to delete previous session "${session.title}"? All test records for this session will be permanently removed.`
      : `Are you sure you want to delete this draft session "${session.title}"?`;

    if (!window.confirm(message)) return;

    try {
      await api.delete(`/admin/sessions/${session.session_id}`);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete session.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
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
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create session.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    setEditFormData({
      title: session.title || '',
      description: session.description || '',
      duration_minutes: session.duration_minutes || 75,
      access_code: session.access_code || '',
      negative_marking: session.negative_marking !== undefined ? session.negative_marking : 0.25,
      show_result: session.show_result !== undefined ? session.show_result : true,
      shuffle_questions: session.shuffle_questions !== undefined ? session.shuffle_questions : true,
      status: session.status || 'DRAFT',
      reset_attempts: false
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/sessions/${editingSession.session_id}`, editFormData);
      setEditingSession(null);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update session.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter sessions by active tab
  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'ACTIVE') return s.status === 'ACTIVE';
    if (activeTab === 'DRAFT') return s.status === 'DRAFT' || s.status === 'SCHEDULED';
    if (activeTab === 'ENDED') return s.status === 'ENDED';
    return true;
  });

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const draftCount = sessions.filter(s => s.status === 'DRAFT' || s.status === 'SCHEDULED').length;
  const endedCount = sessions.filter(s => s.status === 'ENDED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Session Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, schedule, edit, activate, or restart previous campus placement test sessions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchSessions}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
            title="Refresh Sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active ({activeCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('DRAFT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'DRAFT'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Draft / Scheduled ({draftCount})
        </button>
        <button
          onClick={() => setActiveTab('ENDED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ENDED'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Previous / Ended ({endedCount})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Sessions Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'ALL'
              ? 'Get started by creating your first campus test session.'
              : `No sessions found in ${activeTab.toLowerCase()} category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session) => {
            const isDraft = session.status === 'DRAFT';
            const isActive = session.status === 'ACTIVE';
            const isEnded = session.status === 'ENDED';

            return (
              <div
                key={session.session_id}
                className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden glass-card-hover"
              >
                {/* Session Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : isDraft
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : session.status === 'SCHEDULED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                    }`}>
                      {session.status === 'ENDED' ? 'Previous / Ended' : session.status}
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

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {session.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{session.duration_minutes} Mins</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{session.total_questions} Questions</span>
                    </span>
                    <span className="text-slate-400">
                      Penalty: <strong className="text-slate-200">-{session.negative_marking || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Candidate Engagement Stats */}
                <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div>
                    <span className="text-sm sm:text-base font-bold font-mono text-white block">
                      {session.stats?.total_joined || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Joined</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-800" />
                  <div>
                    <span className="text-sm sm:text-base font-bold font-mono text-amber-400 block">
                      {session.stats?.in_progress || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-800" />
                  <div>
                    <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block">
                      {session.stats?.submitted || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">Submitted</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Start / Activate for DRAFT or SCHEDULED */}
                  {(isDraft || session.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handleStatusChange(session.session_id, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-emerald-600/20"
                      title="Activate Session (Start test taking)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Activate</span>
                    </button>
                  )}

                  {/* START / RESTART PREVIOUS SESSION (ENDED) */}
                  {isEnded && (
                    <button
                      onClick={() => {
                        setReactivatingSession(session);
                        setResetAttemptsOnReactivate(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
                      title="Reactivate and start this previous session"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Session</span>
                    </button>
                  )}

                  {/* End Session Action */}
                  {isActive && (
                    <button
                      onClick={() => handleStatusChange(session.session_id, 'ENDED')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-rose-600/20"
                      title="Force close and auto-submit all active attempts"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>End Session</span>
                    </button>
                  )}

                  {/* EDIT SESSION (Available for ALL sessions including previous/ended) */}
                  <button
                    onClick={() => openEditModal(session)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center space-x-1 transition-colors"
                    title="Edit Session Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

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
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 border border-slate-700 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
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

                  {/* Delete (DRAFT or ENDED) */}
                  {(isDraft || isEnded) && (
                    <button
                      onClick={() => handleDelete(session)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title={isDraft ? 'Delete Draft Session' : 'Delete Previous Session & Records'}
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

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white">Create Test Session</h3>
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="flex flex-col justify-end space-y-2 pt-1">
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
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SESSION MODAL (Allows editing any session, including previous/ended sessions) */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Edit Session Details</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Modifying {editingSession.title}
                </p>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={editFormData.duration_minutes}
                    onChange={(e) => setEditFormData({ ...editFormData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Access Code</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editFormData.access_code}
                    onChange={(e) => setEditFormData({ ...editFormData, access_code: e.target.value.toUpperCase() })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Session Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="ACTIVE">ACTIVE (Start Test)</option>
                    <option value="ENDED">ENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Negative Marking Penalty</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={2}
                    value={editFormData.negative_marking}
                    onChange={(e) => setEditFormData({ ...editFormData, negative_marking: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.show_result}
                      onChange={(e) => setEditFormData({ ...editFormData, show_result: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">Show result immediately</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.shuffle_questions}
                      onChange={(e) => setEditFormData({ ...editFormData, shuffle_questions: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">Shuffle questions</span>
                  </label>
                </div>
              </div>

              {/* Reset Attempts Option (Crucial when restarting a previous session) */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.reset_attempts}
                    onChange={(e) => setEditFormData({ ...editFormData, reset_attempts: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-amber-500 text-amber-600 focus:ring-amber-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-semibold text-amber-300 block">
                      Reset candidate test attempts
                    </span>
                    <span className="text-[11px] text-amber-200/80">
                      Check this if you are restarting this session so students can take the test again fresh.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* START PREVIOUS SESSION CONFIRMATION MODAL */}
      {reactivatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Start / Reactivate Session</h3>
                <p className="text-[11px] text-slate-400">Previous Session Management</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You are about to restart <strong className="text-white">"{reactivatingSession.title}"</strong>. The test will become active immediately for candidates to join.
            </p>

            <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetAttemptsOnReactivate}
                  onChange={(e) => setResetAttemptsOnReactivate(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Reset prior candidate submissions
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Clear previous attempts so students who took it before can retake this assessment.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReactivatingSession(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleStatusChange(reactivatingSession.session_id, 'ACTIVE', resetAttemptsOnReactivate)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{actionLoading ? 'Starting...' : 'Start Session Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
