const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { logEvent } = require('../utils/logger');

// List all sessions (admin view)
async function listSessions(req, res) {
  try {
    const sessions = await db.sessions.findMany();
    // Sort by created_at desc
    sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Attach candidate counts to each session
    const attempts = await db.candidate_attempts.findMany();
    const enriched = sessions.map(s => {
      const sessionAttempts = attempts.filter(att => att.session_id === s.session_id);
      return {
        ...s,
        stats: {
          total_joined: sessionAttempts.length,
          in_progress: sessionAttempts.filter(a => a.status === 'IN_PROGRESS').length,
          submitted: sessionAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length
        }
      };
    });

    return res.status(200).json({ sessions: enriched });
  } catch (err) {
    console.error('listSessions error:', err);
    return res.status(500).json({ error: 'Failed to list sessions.' });
  }
}

// Get session details
async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempts = await db.candidate_attempts.findMany({ session_id: id });
    const stats = {
      total_joined: attempts.length,
      in_progress: attempts.filter(a => a.status === 'IN_PROGRESS').length,
      submitted: attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length,
      average_score: attempts.length > 0
        ? (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length).toFixed(1)
        : 0
    };

    return res.status(200).json({ session, stats });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session.' });
  }
}

// Create session
async function createSession(req, res) {
  try {
    const {
      title,
      description,
      duration_minutes = 75,
      start_time,
      end_time,
      sections,
      shuffle_questions = true,
      shuffle_options = false,
      show_result = true,
      negative_marking = 0,
      access_code = '',
      question_ids = []
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Session title is required.' });
    }

    // Default sections breakdown if not provided
    const defaultSections = [
      { name: 'Quantitative', count: 20, topics: ['Percentage', 'Ratio', 'Average', 'Time & Work'] },
      { name: 'Logical', count: 20, topics: ['Series', 'Coding-Decoding', 'Blood Relations', 'Syllogisms'] },
      { name: 'Verbal', count: 10, topics: ['Reading Comprehension', 'Sentence Completion', 'Para-jumbles'] },
      { name: 'Grammar', count: 10, topics: ['Error Detection', 'Subject-Verb Agreement', 'Tenses'] }
    ];

    let assignedQuestionIds = question_ids;
    // If no questions explicitly provided, automatically select questions from bank
    if (!assignedQuestionIds || assignedQuestionIds.length === 0) {
      const allActiveQuestions = await db.questions.findMany(q => !q.is_deleted);
      assignedQuestionIds = allActiveQuestions.slice(0, 60).map(q => q.question_id);
    }

    const newSession = {
      session_id: uuidv4(),
      title: title.trim(),
      description: description ? description.trim() : 'Thinqloud Campus Placement Assessment',
      duration_minutes: Number(duration_minutes) || 75,
      total_questions: assignedQuestionIds.length,
      start_time: start_time || null,
      end_time: end_time || null,
      sections: sections || defaultSections,
      shuffle_questions: !!shuffle_questions,
      shuffle_options: !!shuffle_options,
      show_result: show_result !== undefined ? !!show_result : true,
      negative_marking: Number(negative_marking) || 0,
      access_code: access_code ? access_code.trim().toUpperCase() : '',
      status: 'DRAFT',
      question_ids: assignedQuestionIds,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.sessions.create(newSession);

    await logEvent({
      adminId: req.user.id,
      sessionId: newSession.session_id,
      eventType: 'SESSION_CREATED',
      payload: { title: newSession.title, duration: newSession.duration_minutes, total_questions: newSession.total_questions },
      req
    });

    return res.status(201).json({ success: true, session: newSession });
  } catch (err) {
    console.error('createSession error:', err);
    return res.status(500).json({ error: 'Failed to create session.' });
  }
}

// Update session (only allowed in DRAFT state per PRD SA-002)
async function updateSession(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT sessions can be edited. Fields are locked after activation.' });
    }

    const allowedFields = [
      'title', 'description', 'duration_minutes', 'start_time', 'end_time',
      'sections', 'shuffle_questions', 'shuffle_options', 'show_result',
      'negative_marking', 'access_code', 'question_ids'
    ];

    const updates = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.question_ids) {
      updates.total_questions = updates.question_ids.length;
    }

    const updated = await db.sessions.update({ session_id: id }, updates);

    return res.status(200).json({ success: true, session: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update session.' });
  }
}

// Change session status (Draft -> Scheduled -> Active -> Ended)
async function changeSessionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const prevStatus = session.status;
    const updates = { status, updated_at: new Date().toISOString() };

    // If moving to ENDED, auto-submit all in-progress candidate attempts
    if (status === 'ENDED' && prevStatus !== 'ENDED') {
      const inProgressAttempts = await db.candidate_attempts.findMany(a => a.session_id === id && a.status === 'IN_PROGRESS');
      const now = new Date().toISOString();

      for (const attempt of inProgressAttempts) {
        // Calculate score
        const answers = await db.candidate_answers.findMany({ attempt_id: attempt.attempt_id });
        let score = 0;
        let correctCount = 0;
        let incorrectCount = 0;

        for (const ans of answers) {
          const q = await db.questions.findById('question_id', ans.question_id);
          if (q) {
            if (ans.selected_option === q.correct_option) {
              score += 1;
              correctCount += 1;
            } else if (ans.selected_option) {
              score -= (session.negative_marking || 0);
              incorrectCount += 1;
            }
          }
        }

        await db.candidate_attempts.update({ attempt_id: attempt.attempt_id }, {
          status: 'TIMED_OUT',
          submission_type: 'auto',
          submitted_at: now,
          score: Math.max(0, score),
          total_answered: answers.length,
          total_correct: correctCount,
          total_incorrect: incorrectCount,
          total_unanswered: (session.total_questions || 0) - answers.length
        });

        await logEvent({
          sessionId: id,
          candidateId: attempt.candidate_id,
          eventType: 'SESSION_TIMEOUT',
          payload: { reason: 'session_force_ended_by_admin', score: Math.max(0, score) },
          req
        });
      }

      await logEvent({
        adminId: req.user.id,
        sessionId: id,
        eventType: 'SESSION_ENDED',
        payload: { autoSubmittedCount: inProgressAttempts.length },
        req
      });
    }

    if (status === 'ACTIVE' && prevStatus !== 'ACTIVE') {
      await logEvent({
        adminId: req.user.id,
        sessionId: id,
        eventType: 'SESSION_ACTIVATED',
        req
      });
    }

    const updated = await db.sessions.update({ session_id: id }, updates);

    // Notify connected WebSocket clients of status change
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${id}`).emit('session_status_changed', { session_id: id, status });
      io.emit('session_updated', { session_id: id, status });
    }

    return res.status(200).json({ success: true, session: updated });
  } catch (err) {
    console.error('changeSessionStatus error:', err);
    return res.status(500).json({ error: 'Failed to update session status.' });
  }
}

// Clone session (SA-005)
async function cloneSession(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session to clone not found.' });
    }

    const cloned = {
      ...session,
      session_id: uuidv4(),
      title: `${session.title} (Copy)`,
      status: 'DRAFT',
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.sessions.create(cloned);

    return res.status(201).json({ success: true, session: cloned });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clone session.' });
  }
}

// Delete session (SA-006: only allowed in DRAFT)
async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT sessions can be deleted. Non-draft sessions are preserved for audit integrity.' });
    }

    await db.sessions.delete({ session_id: id });
    return res.status(200).json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete session.' });
  }
}

// Get session results and leaderboard (SA-008)
async function getSessionResults(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempts = await db.candidate_attempts.findMany({ session_id: id });
    const users = await db.users.findMany();

    const leaderboard = attempts.map(att => {
      const candidate = users.find(u => u.id === att.candidate_id);
      return {
        attempt_id: att.attempt_id,
        candidate_id: att.candidate_id,
        candidate_name: candidate?.name || 'Unknown Candidate',
        email: candidate?.email || 'N/A',
        roll_number: candidate?.roll_number || 'N/A',
        score: att.score || 0,
        total_questions: att.total_questions || session.total_questions,
        total_answered: att.total_answered || 0,
        total_correct: att.total_correct || 0,
        total_incorrect: att.total_incorrect || 0,
        total_unanswered: att.total_unanswered || 0,
        status: att.status,
        submission_type: att.submission_type || 'manual',
        section_scores: att.section_scores || {},
        time_taken_seconds: att.submitted_at && att.start_time
          ? Math.round((new Date(att.submitted_at) - new Date(att.start_time)) / 1000)
          : null,
        submitted_at: att.submitted_at
      };
    });

    // Sort leaderboard by score descending, then by time taken ascending
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.time_taken_seconds || 999999) - (b.time_taken_seconds || 999999);
    });

    // Assign rank
    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return res.status(200).json({
      session,
      leaderboard,
      total_candidates: leaderboard.length
    });
  } catch (err) {
    console.error('getSessionResults error:', err);
    return res.status(500).json({ error: 'Failed to retrieve results.' });
  }
}

// Export results as CSV
async function exportResultsCSV(req, res) {
  try {
    const { id } = req.params;
    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempts = await db.candidate_attempts.findMany({ session_id: id });
    const users = await db.users.findMany();

    const headers = ['Rank', 'Name', 'Roll Number', 'Email', 'Score', 'Total Questions', 'Correct', 'Incorrect', 'Unanswered', 'Status', 'Submission Type', 'Time Taken (s)', 'Submitted At'];

    const rows = attempts.map(att => {
      const candidate = users.find(u => u.id === att.candidate_id);
      const timeTaken = att.submitted_at && att.start_time
        ? Math.round((new Date(att.submitted_at) - new Date(att.start_time)) / 1000)
        : '';

      return [
        candidate?.name || 'Unknown',
        candidate?.roll_number || '',
        candidate?.email || '',
        att.score || 0,
        att.total_questions || session.total_questions,
        att.total_correct || 0,
        att.total_incorrect || 0,
        att.total_unanswered || 0,
        att.status,
        att.submission_type || '',
        timeTaken,
        att.submitted_at || ''
      ];
    });

    // Sort by score desc
    rows.sort((a, b) => b[3] - a[3]);
    const numberedRows = rows.map((r, i) => [i + 1, ...r]);

    const csvContent = [
      headers.join(','),
      ...numberedRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    await logEvent({
      adminId: req.user.id,
      sessionId: id,
      eventType: 'RESULT_EXPORTED',
      payload: { format: 'csv', rows: rows.length },
      req
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="session_${id}_results.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('exportResultsCSV error:', err);
    return res.status(500).json({ error: 'Failed to export results.' });
  }
}

module.exports = {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  changeSessionStatus,
  cloneSession,
  deleteSession,
  getSessionResults,
  exportResultsCSV
};
