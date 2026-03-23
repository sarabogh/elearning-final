const Notification = require('../models/Notification');

const emitNotification = (req, notification) => {
  const io = req.app.get('io');
  if (!io) return;

  io.to(`user-${notification.user}`).emit('notification:new', notification);
};

const createNotification = async (req, payload) => {
  const notification = await Notification.create(payload);
  emitNotification(req, notification);
  return notification;
};

const createBulkNotifications = async (req, payloads) => {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    return [];
  }

  const notifications = await Notification.insertMany(payloads);
  notifications.forEach((notification) => emitNotification(req, notification));
  return notifications;
};

module.exports = {
  createNotification,
  createBulkNotifications
};
