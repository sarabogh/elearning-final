const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [notifications, unreadCount, totalCount] = await Promise.all([
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name role')
        .populate('courseId', 'title'),
      Notification.countDocuments({
        user: req.user.id,
        read: false
      }),
      Notification.countDocuments({ user: req.user.id })
    ]);

    const hasMore = skip + notifications.length < totalCount;

    res.json({
      notifications,
      unreadCount,
      page,
      limit,
      hasMore,
      totalCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({ notification, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
