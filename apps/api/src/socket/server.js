const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models/modelManager');

let io;

function initializeSocket(server) {
  // Initialize Socket.IO with CORS configuration
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication failed'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // Join user-specific room
    socket.join(`user-${socket.user.id}`);

    // Join project rooms if user is part of projects
    // This would be done after authentication to specific projects
    socket.on('join-project-room', (projectId) => {
      // Verify user is part of this project before joining
      socket.join(`project-${projectId}`);
      console.log(`User ${socket.user.id} joined project room: ${projectId}`);
    });

    socket.on('leave-project-room', (projectId) => {
      socket.leave(`project-${projectId}`);
      console.log(`User ${socket.user.id} left project room: ${projectId}`);
    });

    // Enhanced messaging with typing indicators and read receipts
    socket.on('typing-start', (data) => {
      const { projectId, toUserId } = data;
      if (projectId) {
        socket.to(`project-${projectId}`).emit('user-typing', {
          userId: socket.user.id,
          projectId,
          isTyping: true
        });
      } else if (toUserId) {
        io.to(`user-${toUserId}`).emit('user-typing', {
          userId: socket.user.id,
          toUserId,
          isTyping: true
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { projectId, toUserId } = data;
      if (projectId) {
        socket.to(`project-${projectId}`).emit('user-typing', {
          userId: socket.user.id,
          projectId,
          isTyping: false
        });
      } else if (toUserId) {
        io.to(`user-${toUserId}`).emit('user-typing', {
          userId: socket.user.id,
          toUserId,
          isTyping: false
        });
      }
    });

    // Listen for message read receipts
    socket.on('message-read', (data) => {
      const { messageId, projectId, fromUserId } = data;
      
      // Broadcast read receipt to sender
      if (fromUserId) {
        io.to(`user-${fromUserId}`).emit('message-read-receipt', {
          messageId,
          readBy: socket.user.id,
          timestamp: new Date()
        });
      }
      
      // Also broadcast to project if it's a project message
      if (projectId) {
        socket.to(`project-${projectId}`).emit('message-read-receipt', {
          messageId,
          readBy: socket.user.id,
          timestamp: new Date()
        });
      }
    });

    // Listen for private messages
    socket.on('private-message', async (data) => {
      try {
        const { toUserId, message, projectId, type = 'text' } = data;

        // Verify recipients exist
        const recipient = await User.findById(toUserId);
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        // Prepare message object
        const messageData = {
          id: Date.now().toString(),
          from: socket.user.id,
          to: toUserId,
          message,
          projectId,
          type,
          timestamp: new Date(),
          read: false
        };

        // Send to specific user
        io.to(`user-${toUserId}`).emit('new-private-message', messageData);

        // Also send to project room if it's a project message
        if (projectId) {
          socket.to(`project-${projectId}`).emit('new-project-message', messageData);
        }

        // Also emit to sender to confirm delivery
        socket.emit('message-sent', { ...messageData, delivered: true });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Listen for project updates
    socket.on('project-update', (data) => {
      const { projectId, updateType, details } = data;

      // Broadcast to project room
      io.to(`project-${projectId}`).emit('project-notification', {
        projectId,
        updateType,
        details,
        timestamp: new Date(),
        from: socket.user.id
      });
    });

    // Listen for milestone updates
    socket.on('milestone-update', (data) => {
      const { projectId, milestoneId, status, message } = data;

      // Broadcast milestone status update to project room
      io.to(`project-${projectId}`).emit('milestone-status-change', {
        milestoneId,
        status,
        message,
        updatedBy: socket.user.id,
        timestamp: new Date()
      });
    });

    // Listen for payment notifications
    socket.on('payment-notification', (data) => {
      const { projectId, amount, type, message } = data;

      // Broadcast to project participants
      io.to(`project-${projectId}`).emit('payment-update', {
        projectId,
        amount,
        type,
        message,
        timestamp: new Date(),
        processedBy: socket.user.id
      });
    });

    // Listen for dispute updates
    socket.on('dispute-update', (data) => {
      const { projectId, disputeId, status, message } = data;

      // Broadcast to project room
      io.to(`project-${projectId}`).emit('dispute-status-change', {
        disputeId,
        status,
        message,
        updatedBy: socket.user.id,
        timestamp: new Date()
      });
    });

    // Listen for notification requests (for live notifications)
    socket.on('request-notification-updates', () => {
      // Client requests to receive live notification updates
      socket.join(`notifications-${socket.user.id}`);
      console.log(`User ${socket.user.id} subscribed to notification updates`);
    });

    // Listen for file uploads
    socket.on('file-upload-start', (data) => {
      const { projectId, fileName, fileSize } = data;
      
      // Notify project participants that file upload is happening
      socket.to(`project-${projectId}`).emit('file-upload-start', {
        fileName,
        fileSize,
        uploadedBy: socket.user.id,
        timestamp: new Date()
      });
    });

    socket.on('file-upload-progress', (data) => {
      const { projectId, fileName, progress } = data;
      
      // Notify project participants of upload progress
      socket.to(`project-${projectId}`).emit('file-upload-progress', {
        fileName,
        progress,
        updatedBy: socket.user.id,
        timestamp: new Date()
      });
    });

    socket.on('file-upload-complete', (data) => {
      const { projectId, fileName, fileUrl } = data;
      
      // Notify project participants that file upload completed
      socket.to(`project-${projectId}`).emit('file-upload-complete', {
        fileName,
        fileUrl,
        uploadedBy: socket.user.id,
        timestamp: new Date()
      });
    });

    // Listen for disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.id}, reason: ${reason}`);
      
      // Notify project rooms that user disconnected
      // This could be used to update online status
      // For now, we'll broadcast it to all project rooms the user was in
      // In a real implementation, you'd track user's project memberships
    });
  });

  return io;
}

// Function to emit notifications to specific users
function notifyUser(userId, event, data) {
  if (io) {
    io.to(`user-${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }
}

// Function to emit notifications to project participants
function notifyProject(projectId, event, data) {
  if (io) {
    io.to(`project-${projectId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }
}

// Function to emit system-wide notifications (for admins)
function broadcastSystemMessage(message) {
  if (io) {
    io.emit('system-message', {
      message,
      timestamp: new Date()
    });
  }
}

// Function to send live notification to specific user
function sendNotificationToUser(userId, notification) {
  if (io) {
    io.to(`notifications-${userId}`).emit('live-notification', {
      ...notification,
      timestamp: new Date()
    });
  }
}

// Function to broadcast notification to multiple users
function broadcastNotification(userIds, notification) {
  if (io) {
    userIds.forEach(userId => {
      io.to(`notifications-${userId}`).emit('live-notification', {
        ...notification,
        timestamp: new Date()
      });
    });
  }
}

module.exports = {
  initializeSocket,
  notifyUser,
  notifyProject,
  broadcastSystemMessage,
  sendNotificationToUser,
  broadcastNotification,
};