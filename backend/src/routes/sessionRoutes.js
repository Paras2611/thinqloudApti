const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate, requireAdmin);

router.get('/', sessionController.listSessions);
router.post('/', sessionController.createSession);
router.get('/:id', sessionController.getSessionById);
router.put('/:id', sessionController.updateSession);
router.patch('/:id/status', sessionController.changeSessionStatus);
router.post('/:id/clone', sessionController.cloneSession);
router.delete('/:id', sessionController.deleteSession);
router.get('/:id/results', sessionController.getSessionResults);
router.get('/:id/export', sessionController.exportResultsCSV);

module.exports = router;
