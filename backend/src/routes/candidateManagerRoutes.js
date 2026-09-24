const express = require('express');
const multer = require('multer');
const router = express.Router();
const candidateManager = require('../controllers/candidateManagerController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authenticate, requireAdmin);

router.get('/', candidateManager.listCandidates);
router.post('/', candidateManager.createCandidate);
router.post('/bulk', upload.single('file'), candidateManager.bulkUploadCandidates);
router.post('/:id/reset-password', candidateManager.resetCandidatePassword);

module.exports = router;
