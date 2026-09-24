const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticate, requireCandidate } = require('../middleware/authMiddleware');

router.use(authenticate, requireCandidate);

router.get('/sessions', candidateController.getCandidateSessions);
router.post('/sessions/:id/join', candidateController.joinSession);
router.get('/sessions/:id/questions', candidateController.getSessionQuestions);
router.post('/sessions/:id/answer', candidateController.saveAnswer);
router.post('/sessions/:id/event', candidateController.recordCandidateEvent);
router.post('/sessions/:id/submit', candidateController.submitTest);
router.get('/sessions/:id/result', candidateController.getCandidateResult);

module.exports = router;
