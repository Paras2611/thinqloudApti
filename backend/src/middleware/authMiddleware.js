const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

async function authenticate(req, res, next) {
  let token = null;

  // Check httpOnly cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const user = await db.users.findById('id', decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Access denied: System Admin credentials required.' });
  }
  next();
}

function requireCandidate(req, res, next) {
  if (!req.user || req.user.role !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Access denied: Candidate account required.' });
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
  requireCandidate
};
