const express = require('express');
const { auth } = require('../middleware/auth');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', auth, listNotifications);
router.put('/:id/read', auth, markNotificationRead);
router.put('/read-all', auth, markAllNotificationsRead);

module.exports = router;
