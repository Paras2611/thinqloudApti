import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  UserPlus,
  Upload,
  KeyRound,
  Search,
  CheckCircle,
  X,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export default function CandidateManager() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Single candidate form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    password: 'Password@123'
  });

  // Reset password form
  const [newPassword, setNewPassword] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    try {
      const res = await api.get('/admin/candidates');
      setCandidates(res.data.candidates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/candidates', formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', roll_number: '', password: 'Password@123' });
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create candidate.');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', bulkFile);

    try {
      const res = await api.post('/admin/candidates/bulk', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || 'Candidates uploaded successfully.');
      setShowBulkModal(false);
      setBulkFile(null);
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to bulk upload candidates.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      await api.post(`/admin/candidates/${selectedCandidate.id}/reset-password`, {
        new_password: newPassword
      });
      alert('Password updated successfully.');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedCandidate(null);
    } catch (err) {
      alert('Failed to reset password.');
    }
  };

  const downloadSampleCandidatesCSV = () => {
    const csv = 'name,email,roll_number,password\n"John Smith","john@college.edu","CS2026-001","Demo@123"\n"Alice Brown","alice@college.edu","CS2026-002","Demo@123"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_candidates_roster.csv';
    a.click();
  };

  const filteredCandidates = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enroll student cohorts, manage credentials, and audit test attempts
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Bulk Upload CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Candidate</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center">
        <Search className="w-4 h-4 text-slate-400 ml-2 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, roll number, or email..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Candidates Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Candidates Found</h3>
          <p className="text-xs text-slate-500 mt-1">Enroll candidates individually or upload a batch CSV roster.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Candidate Name</th>
                  <th className="px-4 py-3">College Roll No</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Tests Attempted</th>
                  <th className="px-4 py-3">Enrolled At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCandidates.map((cand, idx) => (
                  <tr key={cand.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{cand.name}</td>
                    <td className="px-4 py-3 font-mono text-indigo-300">{cand.roll_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{cand.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {cand.tests_completed || 0} finished
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setShowResetModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors inline-flex items-center space-x-1"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Pwd</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Enroll Candidate</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">College Roll / Reg No</label>
                <input
                  type="text"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  placeholder="e.g. CS-2026-101"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Default Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Bulk Candidate Enrollment</span>
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">Required Columns:</div>
                <code>name, email, roll_number, password</code>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={downloadSampleCandidatesCSV}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Roster CSV</span>
                </button>
              </div>

              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkFile || uploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Enrolling...' : 'Upload & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter new password for <strong>{selectedCandidate.name}</strong> ({selectedCandidate.email})
            </p>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
