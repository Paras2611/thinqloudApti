import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Eye,
  X
} from 'lucide-react';

export default function LogExplorer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('ALL');
  const [adminOnly, setAdminOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const eventTypes = [
    'ALL',
    'SESSION_JOIN',
    'TEST_START',
    'QUESTION_VIEW',
    'ANSWER_SELECT',
    'ANSWER_CHANGE',
    'ANSWER_MARKED',
    'ANSWER_UNMARKED',
    'TAB_SWITCH',
    'TEST_SUBMIT',
    'SESSION_TIMEOUT',
    'ADMIN_LOGIN',
    'SESSION_CREATED',
    'SESSION_ACTIVATED',
    'SESSION_ENDED',
    'QUESTION_ADDED',
    'RESULT_EXPORTED'
  ];

  useEffect(() => {
    fetchLogs();
  }, [eventType, adminOnly]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = {};
      if (eventType !== 'ALL') params.event_type = eventType;
      if (adminOnly) params.admin_only = 'true';

      const res = await api.get('/admin/logs', { params });
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    let url = '/api/admin/logs/export';
    if (eventType !== 'ALL') url += `?event_type=${eventType}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Log Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable write-once proctor audit trail of candidate activities and administrative decisions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Logs (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-300 font-medium">Filter by Event:</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer select-none text-xs text-slate-300">
          <input
            type="checkbox"
            checked={adminOnly}
            onChange={(e) => setAdminOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
          />
          <span>Admin Actions Only</span>
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Events Found</h3>
          <p className="text-xs text-slate-500 mt-1">Audit events will be logged automatically as activities occur.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {logs.map((log) => {
                  const isViolation = log.event_type === 'TAB_SWITCH';
                  const isAdminEvent = !!log.admin_id;

                  return (
                    <tr key={log.event_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isViolation
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 animate-pulse'
                            : isAdminEvent
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                            : log.event_type === 'TEST_SUBMIT'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {log.session_id ? log.session_id.slice(0, 8) + '...' : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.candidate_id ? (
                          <span className="text-cyan-400">Cand: {log.candidate_id.slice(0, 6)}</span>
                        ) : log.admin_id ? (
                          <span className="text-purple-400">Admin: {log.admin_id.slice(0, 6)}</span>
                        ) : (
                          <span className="text-slate-600">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans"
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{selectedLog.event_type}</h3>
                <span className="text-[11px] text-slate-500 font-mono">{selectedLog.event_id}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72">
              {JSON.stringify(selectedLog.payload, null, 2)}
            </pre>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
