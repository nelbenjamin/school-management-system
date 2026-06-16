const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', requireRole('teacher', 'principal'), subjectController.getSubjects);
router.post('/', requireRole('teacher'), subjectController.createSubject);
router.delete('/:id', requireRole('teacher'), subjectController.deleteSubject);

module.exports = router;