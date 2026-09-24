const express = require('express');
const multer = require('multer');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authenticate, requireAdmin);

router.get('/', questionController.listQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionController.createQuestion);
router.post('/import', upload.single('file'), questionController.importQuestionsCSV);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
