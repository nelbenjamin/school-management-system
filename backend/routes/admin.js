const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.get('/stats', requireRole('admin', 'principal'), adminController.getStats);
router.get('/staff', requireRole('admin', 'principal'), adminController.getAllStaff);
router.patch('/staff/:id/status', requireRole('admin', 'principal'), adminController.toggleStaffStatus);
router.get('/subjects/all', requireRole('admin', 'principal'), adminController.getAllSubjects);
router.get('/grades/overview', requireRole('admin', 'principal'), adminController.getGradesOverview);

module.exports = router;