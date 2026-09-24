const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'thinqloud_super_secure_jwt_secret_key_2026';
const TOKEN_EXPIRY = '8h';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token');
}

module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie
};
