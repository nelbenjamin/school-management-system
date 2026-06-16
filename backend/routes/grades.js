const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.get('/subject/:subjectId', requireRole('teacher', 'principal'), gradeController.getGradesBySubject);
router.post('/', requireRole('teacher'), gradeController.addGrade);
router.delete('/:id', requireRole('teacher'), gradeController.deleteGrade);
router.get('/analytics/:learnerId/:subjectId', requireRole('teacher', 'principal'), gradeController.getStudentAnalytics);

module.exports = router;