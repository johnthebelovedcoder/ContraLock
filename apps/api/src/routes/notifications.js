const express = require('express');
const authenticateToken = require('../middleware/auth');
const { Notification, User } = require('../models/modelManager');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// Get notifications for a user
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s notifications' });
      }
    }

    // Build query filter
    const filter = { userId: userId };

    // Add optional filters
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.isRead !== undefined) {
      filter.read = req.query.isRead === 'true';
    }

    const allNotifications = await Notification.find(filter);

    // Apply sorting, limiting, and offset manually since the compatibility wrapper may not support all Sequelize methods
    const sortedNotifications = allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const paginatedNotifications = sortedNotifications.slice(offset, offset + limit);

    res.json(paginatedNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get notification by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify user has permission to access this notification
    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to access this notification' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Mark notification as read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify user has permission to modify this notification
    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this notification' });
    }

    // Update notification as read
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      {
        read: true,
        readAt: new Date()
      },
      { new: true } // Return updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Mark all notifications as read for a user
router.put('/read-all', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to modify this user\'s notifications' });
      }
    }

    // Update all notifications for the user as read - using raw Sequelize model
    const { Notification: SequelizeNotification } = require('../db/sequelizeModels');
    const [updatedRowsCount] = await SequelizeNotification.update(
      { read: true, readAt: new Date() },
      { where: { userId: userId, read: false } }
    );

    res.json({ message: 'All notifications marked as read', modifiedCount: updatedRowsCount });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Delete a notification
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify user has permission to delete this notification
    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get unread count for a user
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const requestingUserId = req.user.userId;

    // Verify the requesting user is the same as the target user or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this user\'s notification count' });
      }
    }

    const count = await Notification.count({
      where: {
        userId: userId,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

module.exports = router;