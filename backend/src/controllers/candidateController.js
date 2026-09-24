const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { logEvent } = require('../utils/logger');

// List sessions for candidates (ACTIVE or SCHEDULED)
async function getCandidateSessions(req, res) {
  try {
    const candidateId = req.user.id;
    const allSessions = await db.sessions.findMany(s => s.status === 'ACTIVE' || s.status === 'SCHEDULED' || s.status === 'ENDED');
    const attempts = await db.candidate_attempts.findMany({ candidate_id: candidateId });

    const result = allSessions.map(session => {
      const attempt = attempts.find(a => a.session_id === session.session_id);
      return {
        session_id: session.session_id,
        title: session.title,
        description: session.description,
        duration_minutes: session.duration_minutes,
        total_questions: session.total_questions,
        sections: session.sections,
        start_time: session.start_time,
        end_time: session.end_time,
        has_access_code: !!session.access_code,
        status: session.status,
        show_result: session.show_result,
        attempt: attempt ? {
          attempt_id: attempt.attempt_id,
          status: attempt.status,
          start_time: attempt.start_time,
          submitted_at: attempt.submitted_at,
          score: session.show_result ? attempt.score : null
        } : null
      };
    });

    return res.status(200).json({ sessions: result });
  } catch (err) {
    console.error('getCandidateSessions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
}

// Join session / Start test
async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const { access_code } = req.body;
    const candidateId = req.user.id;

    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Cannot join test: session is currently ${session.status}.` });
    }

    if (session.access_code && session.access_code !== access_code?.trim().toUpperCase()) {
      return res.status(401).json({ error: 'Invalid 6-digit access code for this test session.' });
    }

    // Check if attempt already exists
    let attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId
    });

    const now = new Date().toISOString();

    if (attempt) {
      if (attempt.status === 'SUBMITTED' || attempt.status === 'TIMED_OUT') {
        return res.status(400).json({
          error: 'You have already submitted this assessment.',
          already_submitted: true,
          attempt_id: attempt.attempt_id
        });
      }
      // Resume existing in-progress attempt
    } else {
      // Create new attempt
      attempt = {
        attempt_id: uuidv4(),
        session_id: id,
        candidate_id: candidateId,
        candidate_name: req.user.name,
        candidate_email: req.user.email,
        start_time: now,
        duration_minutes: session.duration_minutes,
        total_questions: session.total_questions,
        status: 'IN_PROGRESS',
        tab_switches: 0,
        created_at: now
      };

      await db.candidate_attempts.create(attempt);

      await logEvent({
        sessionId: id,
        candidateId,
        eventType: 'SESSION_JOIN',
        payload: { access_code_used: !!session.access_code },
        req
      });

      await logEvent({
        sessionId: id,
        candidateId,
        eventType: 'TEST_START',
        payload: { start_time: now, duration_minutes: session.duration_minutes },
        req
      });

      // Emit live update to admin monitor
      const io = req.app.get('io');
      if (io) {
        io.to(`session_${id}`).emit('candidate_joined', {
          candidate_id: candidateId,
          name: req.user.name,
          attempt_id: attempt.attempt_id
        });
      }
    }

    return res.status(200).json({
      success: true,
      attempt,
      session: {
        session_id: session.session_id,
        title: session.title,
        description: session.description,
        duration_minutes: session.duration_minutes,
        total_questions: session.total_questions,
        sections: session.sections,
        shuffle_questions: session.shuffle_questions,
        negative_marking: session.negative_marking
      }
    });
  } catch (err) {
    console.error('joinSession error:', err);
    return res.status(500).json({ error: 'Failed to join test session.' });
  }
}

// Get candidate questions (SEC-004: NEVER SEND CORRECT KEYS OR EXPLANATION TO CLIENT)
async function getSessionQuestions(req, res) {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId
    });

    if (!attempt) {
      return res.status(403).json({ error: 'Must join the session first before accessing questions.' });
    }

    // Fetch questions assigned to this session
    let questionIds = session.question_ids || [];
    let questions = [];

    if (questionIds.length > 0) {
      const allQ = await db.questions.findMany(q => !q.is_deleted);
      questions = questionIds.map(qid => allQ.find(q => q.question_id === qid)).filter(Boolean);
    } else {
      questions = await db.questions.findMany(q => !q.is_deleted);
    }

    // Provide question text, options, and explanation/correct_option for post-confirmation card display
    const sanitizedQuestions = questions.map((q, index) => ({
      index: index + 1,
      question_id: q.question_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      section: q.section,
      topic: q.topic,
      difficulty: q.difficulty,
      correct_option: q.correct_option,
      explanation: q.explanation || ''
    }));

    // Fetch answers already submitted by candidate
    const existingAnswers = await db.candidate_answers.findMany({
      attempt_id: attempt.attempt_id
    });

    return res.status(200).json({
      questions: sanitizedQuestions,
      answers: existingAnswers.map(a => ({
        question_id: a.question_id,
        selected_option: a.selected_option,
        is_marked_for_review: a.is_marked_for_review,
        is_confirmed: !!a.is_confirmed
      })),
      attempt: {
        attempt_id: attempt.attempt_id,
        start_time: attempt.start_time,
        duration_minutes: session.duration_minutes,
        tab_switches: attempt.tab_switches || 0,
        status: attempt.status
      }
    });
  } catch (err) {
    console.error('getSessionQuestions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve test questions.' });
  }
}

// Auto-save answer on click (CI-003 idempotent) & handle confirmation
async function saveAnswer(req, res) {
  try {
    const { id } = req.params;
    const { question_id, selected_option, is_marked_for_review, is_confirmed } = req.body;
    const candidateId = req.user.id;

    const attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId,
      status: 'IN_PROGRESS'
    });

    if (!attempt) {
      return res.status(400).json({ error: 'No active attempt in progress.' });
    }

    let existingAnswer = await db.candidate_answers.findOne({
      attempt_id: attempt.attempt_id,
      question_id
    });

    const now = new Date().toISOString();

    if (existingAnswer) {
      const prevOption = existingAnswer.selected_option;
      const prevMarked = existingAnswer.is_marked_for_review;

      const updates = {
        updated_at: now
      };
      if (selected_option !== undefined) updates.selected_option = selected_option;
      if (is_marked_for_review !== undefined) updates.is_marked_for_review = !!is_marked_for_review;
      if (is_confirmed !== undefined) updates.is_confirmed = !!is_confirmed;

      await db.candidate_answers.update({ answer_id: existingAnswer.answer_id }, updates);

      // Log answer change or mark/unmark events
      if (selected_option !== undefined && selected_option !== prevOption) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: 'ANSWER_CHANGE',
          questionId,
          payload: { previous_option: prevOption, new_option: selected_option },
          req
        });
      }

      if (is_marked_for_review !== undefined && is_marked_for_review !== prevMarked) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: is_marked_for_review ? 'ANSWER_MARKED' : 'ANSWER_UNMARKED',
          questionId,
          req
        });
      }

      if (is_confirmed) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: 'ANSWER_CONFIRMED',
          questionId,
          payload: { selected_option: selected_option !== undefined ? selected_option : prevOption },
          req
        });
      }
    } else {
      // First time selecting, marking, or confirming
      const newAnswer = {
        answer_id: uuidv4(),
        attempt_id: attempt.attempt_id,
        session_id: id,
        candidate_id: candidateId,
        question_id,
        selected_option: selected_option || null,
        is_marked_for_review: !!is_marked_for_review,
        is_confirmed: !!is_confirmed,
        answered_at: now,
        updated_at: now
      };

      await db.candidate_answers.create(newAnswer);

      if (selected_option) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: 'ANSWER_SELECT',
          questionId,
          payload: { selected_option },
          req
        });
      }

      if (is_marked_for_review) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: 'ANSWER_MARKED',
          questionId,
          req
        });
      }

      if (is_confirmed) {
        await logEvent({
          sessionId: id,
          candidateId,
          eventType: 'ANSWER_CONFIRMED',
          questionId,
          payload: { selected_option },
          req
        });
      }
    }

    return res.status(200).json({
      success: true,
      saved_at: now,
      is_confirmed: !!is_confirmed
    });
  } catch (err) {
    console.error('saveAnswer error:', err);
    return res.status(500).json({ error: 'Failed to record answer.' });
  }
}

// Log candidate client event (TAB_SWITCH, QUESTION_VIEW)
async function recordCandidateEvent(req, res) {
  try {
    const { id } = req.params;
    const { event_type, question_id, payload } = req.body;
    const candidateId = req.user.id;

    const attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId
    });

    let currentSwitches = 0;
    if (event_type === 'TAB_SWITCH' && attempt) {
      currentSwitches = (attempt.tab_switches || 0) + 1;
      await db.candidate_attempts.update({ attempt_id: attempt.attempt_id }, { tab_switches: currentSwitches });
    }

    await logEvent({
      sessionId: id,
      candidateId,
      eventType: event_type,
      questionId: question_id || null,
      payload: { ...payload, switch_count: currentSwitches },
      req
    });

    return res.status(200).json({ success: true, switch_count: currentSwitches });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record event.' });
  }
}

// Submit test (manual or auto-submit on timer expiry)
async function submitTest(req, res) {
  try {
    const { id } = req.params;
    const { submission_type = 'manual' } = req.body; // 'manual' or 'auto'
    const candidateId = req.user.id;

    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId
    });

    if (!attempt) {
      return res.status(400).json({ error: 'No test attempt found.' });
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'TIMED_OUT') {
      return res.status(200).json({
        success: true,
        already_submitted: true,
        score: session.show_result ? attempt.score : null
      });
    }

    // Evaluate answers server-side
    const candidateAnswers = await db.candidate_answers.findMany({ attempt_id: attempt.attempt_id });
    const sessionQuestions = await db.questions.findMany(q => !q.is_deleted);

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const sectionMetrics = {
      Quantitative: { correct: 0, incorrect: 0, total: 0 },
      Logical: { correct: 0, incorrect: 0, total: 0 },
      Verbal: { correct: 0, incorrect: 0, total: 0 },
      Grammar: { correct: 0, incorrect: 0, total: 0 }
    };

    const targetQuestionIds = session.question_ids && session.question_ids.length > 0
      ? session.question_ids
      : sessionQuestions.map(q => q.question_id);

    targetQuestionIds.forEach(qid => {
      const q = sessionQuestions.find(item => item.question_id === qid);
      if (!q) return;

      const sec = q.section || 'Quantitative';
      if (!sectionMetrics[sec]) {
        sectionMetrics[sec] = { correct: 0, incorrect: 0, total: 0 };
      }
      sectionMetrics[sec].total += 1;

      const candAns = candidateAnswers.find(a => a.question_id === qid);
      if (candAns && candAns.selected_option) {
        if (candAns.selected_option === q.correct_option) {
          score += 1;
          correctCount += 1;
          sectionMetrics[sec].correct += 1;
        } else {
          score -= (session.negative_marking || 0);
          incorrectCount += 1;
          sectionMetrics[sec].incorrect += 1;
        }
      }
    });

    const now = new Date().toISOString();
    const finalScore = Math.max(0, parseFloat(score.toFixed(2)));
    const totalAnswered = candidateAnswers.filter(a => !!a.selected_option).length;
    const totalUnanswered = targetQuestionIds.length - totalAnswered;

    const updatedStatus = submission_type === 'auto' ? 'TIMED_OUT' : 'SUBMITTED';

    await db.candidate_attempts.update({ attempt_id: attempt.attempt_id }, {
      status: updatedStatus,
      submission_type,
      submitted_at: now,
      score: finalScore,
      total_questions: targetQuestionIds.length,
      total_answered: totalAnswered,
      total_correct: correctCount,
      total_incorrect: incorrectCount,
      total_unanswered: totalUnanswered,
      section_scores: sectionMetrics
    });

    await logEvent({
      sessionId: id,
      candidateId,
      eventType: submission_type === 'auto' ? 'SESSION_TIMEOUT' : 'TEST_SUBMIT',
      payload: {
        submission_type,
        total_answered: totalAnswered,
        score: finalScore
      },
      req
    });

    // Notify WebSocket listeners
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${id}`).emit('candidate_submitted', {
        candidate_id: candidateId,
        score: finalScore,
        status: updatedStatus
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully.',
      result: {
        score: session.show_result ? finalScore : null,
        total_questions: targetQuestionIds.length,
        total_answered: totalAnswered,
        total_correct: session.show_result ? correctCount : null,
        total_incorrect: session.show_result ? incorrectCount : null,
        total_unanswered: totalUnanswered,
        section_scores: session.show_result ? sectionMetrics : null,
        show_result: session.show_result
      }
    });
  } catch (err) {
    console.error('submitTest error:', err);
    return res.status(500).json({ error: 'Failed to submit assessment.' });
  }
}

// Get candidate result
async function getCandidateResult(req, res) {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const session = await db.sessions.findById('session_id', id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const attempt = await db.candidate_attempts.findOne({
      session_id: id,
      candidate_id: candidateId
    });

    if (!attempt || (attempt.status !== 'SUBMITTED' && attempt.status !== 'TIMED_OUT')) {
      return res.status(400).json({ error: 'Test not submitted yet.' });
    }

    const candidateAnswers = await db.candidate_answers.findMany({ attempt_id: attempt.attempt_id });
    const allQ = await db.questions.findMany(q => !q.is_deleted);
    let questionIds = session.question_ids || [];
    let sessionQuestions = [];
    if (questionIds.length > 0) {
      sessionQuestions = questionIds.map(qid => allQ.find(q => q.question_id === qid)).filter(Boolean);
    } else {
      sessionQuestions = allQ;
    }

    const reviewQuestions = sessionQuestions.map((q, idx) => {
      const candAns = candidateAnswers.find(a => a.question_id === q.question_id);
      return {
        question_id: q.question_id,
        index: idx + 1,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        section: q.section,
        topic: q.topic,
        difficulty: q.difficulty,
        correct_option: q.correct_option,
        explanation: q.explanation || '',
        selected_option: candAns ? candAns.selected_option : null,
        is_confirmed: candAns ? !!candAns.is_confirmed : false,
        is_correct: candAns && candAns.selected_option ? candAns.selected_option === q.correct_option : false
      };
    });

    return res.status(200).json({
      session: {
        session_id: session.session_id,
        title: session.title,
        show_result: session.show_result
      },
      result: {
        score: session.show_result ? attempt.score : null,
        total_questions: attempt.total_questions,
        total_answered: attempt.total_answered,
        total_correct: session.show_result ? attempt.total_correct : null,
        total_incorrect: session.show_result ? attempt.total_incorrect : null,
        total_unanswered: attempt.total_unanswered,
        section_scores: session.show_result ? attempt.section_scores : null,
        submitted_at: attempt.submitted_at,
        submission_type: attempt.submission_type,
        show_result: session.show_result
      },
      questions: reviewQuestions
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve test result.' });
  }
}

module.exports = {
  getCandidateSessions,
  joinSession,
  getSessionQuestions,
  saveAnswer,
  recordCandidateEvent,
  submitTest,
  getCandidateResult
};
