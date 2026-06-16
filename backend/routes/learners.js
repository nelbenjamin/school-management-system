const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

const learnerController = require('../controllers/learnerController');

console.log('learnerController:', learnerController);

router.use(verifyToken);
router.get('/subject/:subjectId', requireRole('teacher', 'principal'), learnerController.getLearnersBySubject);
router.post('/', requireRole('teacher'), learnerController.createLearner);
router.delete('/:id', requireRole('teacher'), learnerController.deleteLearner);

module.exports = router;