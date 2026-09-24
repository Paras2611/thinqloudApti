const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/admin/login', authLimiter, authController.adminLogin);
router.post('/candidate/login', authLimiter, authController.candidateLogin);
router.post('/candidate/register', authLimiter, authController.candidateRegister);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
