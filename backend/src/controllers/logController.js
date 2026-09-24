const db = require('../config/db');

// List event logs with filters
async function getLogs(req, res) {
  try {
    const { session_id, candidate_id, event_type, admin_only } = req.query;

    let logs = await db.candidate_events.findMany();

    if (session_id) {
      logs = logs.filter(l => l.session_id === session_id);
    }

    if (candidate_id) {
      logs = logs.filter(l => l.candidate_id === candidate_id);
    }

    if (event_type && event_type !== 'ALL') {
      logs = logs.filter(l => l.event_type === event_type);
    }

    if (admin_only === 'true') {
      logs = logs.filter(l => !!l.admin_id);
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit to latest 500 events
    const sliced = logs.slice(0, 500);

    return res.status(200).json({ logs: sliced, total: logs.length });
  } catch (err) {
    console.error('getLogs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

// Export logs as CSV
async function exportLogsCSV(req, res) {
  try {
    const { session_id, event_type } = req.query;

    let logs = await db.candidate_events.findMany();

    if (session_id) {
      logs = logs.filter(l => l.session_id === session_id);
    }

    if (event_type && event_type !== 'ALL') {
      logs = logs.filter(l => l.event_type === event_type);
    }

    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const headers = ['Event ID', 'Timestamp', 'Event Type', 'Session ID', 'Candidate ID', 'Admin ID', 'IP Address', 'Payload'];

    const rows = logs.map(l => [
      l.event_id,
      l.created_at,
      l.event_type,
      l.session_id || '',
      l.candidate_id || '',
      l.admin_id || '',
      l.ip_address || '',
      JSON.stringify(l.payload || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('exportLogsCSV error:', err);
    return res.status(500).json({ error: 'Failed to export logs CSV.' });
  }
}

// Live monitor status for active sessions
async function getLiveMonitorStats(req, res) {
  try {
    const { session_id } = req.params;

    const attempts = await db.candidate_attempts.findMany({ session_id });
    const joined = attempts.length;
    const inProgress = attempts.filter(a => a.status === 'IN_PROGRESS').length;
    const submitted = attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length;
    const totalSwitches = attempts.reduce((acc, curr) => acc + (curr.tab_switches || 0), 0);

    const candidates = attempts.map(att => ({
      candidate_id: att.candidate_id,
      candidate_name: att.candidate_name,
      candidate_email: att.candidate_email,
      status: att.status,
      start_time: att.start_time,
      submitted_at: att.submitted_at,
      tab_switches: att.tab_switches || 0,
      score: att.score !== undefined ? att.score : null
    }));

    return res.status(200).json({
      session_id,
      metrics: {
        total_joined: joined,
        in_progress: inProgress,
        submitted: submitted,
        total_tab_switches: totalSwitches
      },
      candidates
    });
  } catch (err) {
    console.error('getLiveMonitorStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch live monitor stats.' });
  }
}

module.exports = {
  getLogs,
  exportLogsCSV,
  getLiveMonitorStats
};
