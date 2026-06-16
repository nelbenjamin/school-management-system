const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificationController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', notifController.getNotifications);
router.post('/', requireRole('principal', 'admin'), notifController.sendNotification);
router.patch('/:id/read', notifController.markRead);
router.delete('/:id', requireRole('principal', 'admin'), notifController.deleteNotification);

module.exports = router;