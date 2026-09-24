const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/**
 * Log an immutable audit event to candidate_events
 */
async function logEvent({
  sessionId = null,
  candidateId = null,
  adminId = null,
  eventType,
  questionId = null,
  payload = {},
  req = null
}) {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'unknown';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      userAgent = req.headers['user-agent'] || 'unknown';
    }

    const eventRecord = {
      event_id: uuidv4(),
      session_id: sessionId,
      candidate_id: candidateId,
      admin_id: adminId,
      event_type: eventType,
      question_id: questionId,
      payload: payload || {},
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    await db.candidate_events.create(eventRecord);
    return eventRecord;
  } catch (err) {
    console.error('Failed to log event:', err);
    return null;
  }
}

module.exports = {
  logEvent
};
