const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const { logEvent } = require('../utils/logger');

// Admin login
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await db.users.findOne({ email: email.toLowerCase().trim() });

    if (!admin || admin.role !== 'SYSTEM_ADMIN') {
      await logEvent({
        eventType: 'ADMIN_LOGIN',
        payload: { email, success: false, reason: 'user_not_found_or_not_admin' },
        req
      });
      return res.status(401).json({ error: 'Invalid credentials or unauthorized role.' });
    }

    // Check account lockout
    if (admin.account_locked_until) {
      const lockExpiry = new Date(admin.account_locked_until);
      if (lockExpiry > new Date()) {
        const remainingMinutes = Math.ceil((lockExpiry - new Date()) / 60000);
        return res.status(429).json({
          error: `Account is locked due to 5 consecutive failed attempts. Try again in ${remainingMinutes} minutes.`
        });
      } else {
        // Lock expired, reset failed count
        await db.users.update({ id: admin.id }, { failed_attempts: 0, account_locked_until: null });
        admin.failed_attempts = 0;
        admin.account_locked_until = null;
      }
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      const currentFails = (admin.failed_attempts || 0) + 1;
      let lockoutDate = null;
      if (currentFails >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      await db.users.update(
        { id: admin.id },
        { failed_attempts: currentFails, account_locked_until: lockoutDate }
      );

      await logEvent({
        adminId: admin.id,
        eventType: 'ADMIN_LOGIN',
        payload: { email, success: false, failed_attempts: currentFails, locked: !!lockoutDate },
        req
      });

      if (lockoutDate) {
        return res.status(429).json({
          error: 'Too many failed login attempts. Account is locked for 15 minutes.'
        });
      }

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Login successful
    await db.users.update(
      { id: admin.id },
      { failed_attempts: 0, account_locked_until: null, last_login_at: new Date().toISOString() }
    );

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });

    setAuthCookie(res, token);

    await logEvent({
      adminId: admin.id,
      eventType: 'ADMIN_LOGIN',
      payload: { email: admin.email, success: true },
      req
    });

    return res.status(200).json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      token
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Candidate login
async function candidateLogin(req, res) {
  try {
    const { identifier, password } = req.body; // email or roll number

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Roll Number and password are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const candidate = await db.users.findOne(u =>
      (u.email?.toLowerCase() === cleanId || u.roll_number?.toLowerCase() === cleanId) &&
      u.role === 'CANDIDATE'
    );

    if (!candidate) {
      return res.status(401).json({ error: 'Invalid candidate credentials.' });
    }

    const isMatch = await bcrypt.compare(password, candidate.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid candidate credentials.' });
    }

    const token = generateToken({
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      roll_number: candidate.roll_number,
      role: candidate.role
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        roll_number: candidate.roll_number,
        role: candidate.role
      },
      token
    });
  } catch (err) {
    console.error('candidateLogin error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Candidate register
async function candidateRegister(req, res) {
  try {
    const { name, email, roll_number, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.users.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newCandidate = {
      id: uuidv4(),
      name: name.trim(),
      email: cleanEmail,
      roll_number: roll_number ? roll_number.trim() : null,
      password_hash: passwordHash,
      role: 'CANDIDATE',
      created_at: new Date().toISOString()
    };

    await db.users.create(newCandidate);

    const token = generateToken({
      id: newCandidate.id,
      email: newCandidate.email,
      name: newCandidate.name,
      roll_number: newCandidate.roll_number,
      role: newCandidate.role
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      user: {
        id: newCandidate.id,
        email: newCandidate.email,
        name: newCandidate.name,
        roll_number: newCandidate.roll_number,
        role: newCandidate.role
      },
      token
    });
  } catch (err) {
    console.error('candidateRegister error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Check logged in user
async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { password_hash, ...safeUser } = req.user;
    return res.status(200).json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Logout
async function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  adminLogin,
  candidateLogin,
  candidateRegister,
  getCurrentUser,
  logout
};
