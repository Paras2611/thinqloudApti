const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate, requireAdmin);

router.get('/', logController.getLogs);
router.get('/export', logController.exportLogsCSV);
router.get('/live/:session_id', logController.getLiveMonitorStats);

module.exports = router;
