const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const db = require('../config/db');

// List all registered candidates
async function listCandidates(req, res) {
  try {
    const candidates = await db.users.findMany({ role: 'CANDIDATE' });
    const attempts = await db.candidate_attempts.findMany();

    const result = candidates.map(c => {
      const { password_hash, ...safe } = c;
      const candAttempts = attempts.filter(a => a.candidate_id === c.id);
      return {
        ...safe,
        tests_attempted: candAttempts.length,
        tests_completed: candAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT').length
      };
    });

    return res.status(200).json({ candidates: result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list candidates.' });
  }
}

// Create single candidate
async function createCandidate(req, res) {
  try {
    const { name, email, roll_number, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and default password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.users.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const candidate = {
      id: uuidv4(),
      name: name.trim(),
      email: cleanEmail,
      roll_number: roll_number ? roll_number.trim() : null,
      password_hash: hash,
      role: 'CANDIDATE',
      created_at: new Date().toISOString()
    };

    await db.users.create(candidate);
    const { password_hash, ...safe } = candidate;
    return res.status(201).json({ success: true, candidate: safe });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create candidate.' });
  }
}

// Bulk upload candidates CSV
async function bulkUploadCandidates(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded.' });
    }

    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const createdList = [];
    const defaultPassword = 'Password@123';
    const defaultHash = await bcrypt.hash(defaultPassword, 12);

    for (const row of records) {
      const email = (row.email || '').toLowerCase().trim();
      const name = row.name ? row.name.trim() : 'Candidate';
      const rollNumber = row.roll_number || row.rollNumber || row.roll_no || null;
      const pwd = row.password ? await bcrypt.hash(row.password, 12) : defaultHash;

      if (!email) continue;
      const existing = await db.users.findOne({ email });
      if (existing) continue;

      const cand = {
        id: uuidv4(),
        name,
        email,
        roll_number: rollNumber,
        password_hash: pwd,
        role: 'CANDIDATE',
        created_at: new Date().toISOString()
      };

      createdList.push(cand);
    }

    if (createdList.length > 0) {
      await db.users.createMany(createdList);
    }

    return res.status(200).json({
      success: true,
      count: createdList.length,
      message: `Enrolled ${createdList.length} candidates successfully.`
    });
  } catch (err) {
    console.error('bulkUploadCandidates error:', err);
    return res.status(500).json({ error: 'Failed to process candidate CSV.' });
  }
}

// Reset candidate password
async function resetCandidatePassword(req, res) {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    const user = await db.users.findById('id', id);
    if (!user || user.role !== 'CANDIDATE') {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await db.users.update({ id }, { password_hash: hash, updated_at: new Date().toISOString() });

    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

module.exports = {
  listCandidates,
  createCandidate,
  bulkUploadCandidates,
  resetCandidatePassword
};
