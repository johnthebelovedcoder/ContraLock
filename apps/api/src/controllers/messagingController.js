const { Conversation, Message, Project, User } = require('../db/sequelizeModels');
const { Op } = require('sequelize'); // Import Sequelize operators
const { BadRequestError, UnauthorizedError, NotFoundError, InternalServerError } = require('../errors/AppError');
const { validationResult } = require('express-validator');
const contentModerationService = require('../services/contentModerationService');

// Get all conversations for a user
const getConversations = async (req, res, next) => {
  try {
    // Try to get userId from route params, fallback to authenticated user's ID from token
    let userId = req.params.userId;
    if (!userId) {
      userId = req.user.userId;
    }

    // Validate that the authenticated user is the same as the requested user
    // The token was created with userId field in the payload
    const authenticatedUserId = req.user.userId;
    if (authenticatedUserId !== userId) {
      return next(new UnauthorizedError('Unauthorized to access these conversations'));
    }

    // Find all projects where the user is either client or freelancer
    const projects = await Project.findAll({
      where: {
        [Op.or]: [
          { client: authenticatedUserId },
          { freelancer: authenticatedUserId }
        ]
      }
    });

    const projectIds = projects.map(project => project._id);

    // Find all conversations for those projects
    let conversations = [];
    if (projectIds.length > 0) {
      conversations = await Conversation.findAll({
        where: {
          projectId: { [Op.in]: projectIds }
        }
      });
    }

    // For each conversation, get the participants and project details
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Parse participants
        const participants = JSON.parse(conv.participants);

        // Get project details
        const project = await Project.findByPk(conv.projectId);

        // Get the other participant (not the current user)
        const otherParticipantId = participants.find(id => id !== userId);
        let otherParticipant = null;
        if (otherParticipantId) {
          otherParticipant = await User.findByPk(otherParticipantId);
        }

        return {
          id: conv._id,
          projectId: conv.projectId,
          projectName: project ? project.title : 'Unknown Project',
          participants: participants,
          unreadCount: conv.unreadCount,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          isArchived: conv.isArchived,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          otherParticipant: otherParticipant ? {
            id: otherParticipant._id,
            firstName: otherParticipant.firstName,
            lastName: otherParticipant.lastName,
            email: otherParticipant.email,
            role: otherParticipant.role
          } : null
        };
      })
    );

    // Sort conversations by last message date (most recent first)
    conversationDetails.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

    res.status(200).json(conversationDetails);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    next(new InternalServerError('Failed to fetch conversations'));
  }
};

// Get messages for a specific project or all messages for the authenticated user
const getMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params; // This will be undefined if accessing /messaging/messages
    const { limit = 50, before, after } = req.query;

    // Validate query parameters
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100); // Min 1, Max 100

    // Check if we're fetching messages for a specific project or all projects
    if (projectId) {
      // Fetch messages for a specific project
      const project = await Project.findByPk(projectId);
      if (!project) {
        return next(new NotFoundError('Project not found'));
      }

      if (req.user.userId !== project.client && req.user.userId !== project.freelancer) {
        return next(new UnauthorizedError('Unauthorized to access messages for this project'));
      }

      // Build query filter for specific project
      const filter = { projectId: projectId };

      // Add cursor-based filters for better performance with large datasets
      if (before) {
        // Get messages sent before the specified timestamp
        filter.sentAt = { [Op.lt]: new Date(before) };
      } else if (after) {
        // Get messages sent after the specified timestamp
        filter.sentAt = { [Op.gt]: new Date(after) };
      }

      // Get messages with cursor-based pagination
      // Using sentAt field for cursor pagination (chronological order)
      const messages = await Message.findAll({
        where: filter,
        order: [['sentAt', 'DESC']], // Most recent first for better UX
        limit: limitNum + 1, // Get one extra to determine if hasMore
        raw: true // Raw for better performance
      });

      // Check if we have more messages
      const hasMore = messages.length > limitNum;
      const resultMessages = hasMore ? messages.slice(0, limitNum) : messages;

      // Transform messages to match expected format
      const transformedMessages = resultMessages.map(msg => ({
        id: msg._id,
        projectId: msg.projectId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        content: msg.content,
        type: msg.type,
        status: msg.status,
        isSystemMessage: msg.isSystemMessage,
        parentId: msg.parentId,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
        sentAt: msg.sentAt,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }));

      // Prepare cursors for pagination
      const response = {
        items: transformedMessages,
        pagination: {
          limit: limitNum,
          hasMore,
          nextCursor: hasMore && resultMessages.length > 0 ? resultMessages[resultMessages.length - 1].sentAt : null,
          prevCursor: resultMessages.length > 0 && after ? resultMessages[0].sentAt : null
        }
      };

      res.status(200).json(response);
    } else {
      // Fetch messages from all projects the user has access to (client or freelancer)
      // First, find all projects the user is involved in
      const projects = await Project.findAll({
        where: {
          [Op.or]: [
            { client: req.user.userId },
            { freelancer: req.user.userId }
          ]
        }
      });

      const projectIds = projects.map(project => project._id);

      // Build query filter for all projects the user has access to
      const filter = {
        projectId: { [Op.in]: projectIds }
      };

      // Add cursor-based filters for better performance with large datasets
      if (before) {
        // Get messages sent before the specified timestamp
        filter.sentAt = { [Op.lt]: new Date(before) };
      } else if (after) {
        // Get messages sent after the specified timestamp
        filter.sentAt = { [Op.gt]: new Date(after) };
      }

      // Get messages with cursor-based pagination
      // Using sentAt field for cursor pagination (chronological order)
      const messages = await Message.findAll({
        where: filter,
        order: [['sentAt', 'DESC']], // Most recent first for better UX
        limit: limitNum + 1, // Get one extra to determine if hasMore
        raw: true // Raw for better performance
      });

      // Check if we have more messages
      const hasMore = messages.length > limitNum;
      const resultMessages = hasMore ? messages.slice(0, limitNum) : messages;

      // Transform messages to match expected format
      const transformedMessages = resultMessages.map(msg => ({
        id: msg._id,
        projectId: msg.projectId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        content: msg.content,
        type: msg.type,
        status: msg.status,
        isSystemMessage: msg.isSystemMessage,
        parentId: msg.parentId,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
        sentAt: msg.sentAt,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }));

      // Prepare cursors for pagination
      const response = {
        items: transformedMessages,
        pagination: {
          limit: limitNum,
          hasMore,
          nextCursor: hasMore && resultMessages.length > 0 ? resultMessages[resultMessages.length - 1].sentAt : null,
          prevCursor: resultMessages.length > 0 && after ? resultMessages[0].sentAt : null
        }
      };

      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    next(new InternalServerError('Failed to fetch messages'));
  }
};

// Send a message
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, content, type = 'TEXT' } = req.body;

    // Check if user has access to this project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (req.user.userId !== project.client && req.user.userId !== project.freelancer) {
      return next(new UnauthorizedError('Unauthorized to send message for this project'));
    }

    // Moderate message content before sending
    const moderationResult = await contentModerationService.moderateMessage({
      _id: null,
      content: content,
      projectId: projectId
    });

    if (!moderationResult.isApproved) {
      return next(new BadRequestError(`Message content flagged: ${moderationResult.message}`));
    }

    // Determine sender role
    const senderRole = req.user.userId === project.client
      ? 'client'
      : 'freelancer';

    // Create the message
    const newMessage = await Message.create({
      projectId: projectId,
      senderId: req.user.userId,
      senderRole: senderRole,
      content: content,
      type: type,
      status: 'SENT'
    });

    // Update the conversation with the new message info
    let conversation = await Conversation.findOne({
      where: { projectId: projectId }
    });

    if (!conversation) {
      // Create a new conversation if one doesn't exist
      const participants = [project.client, project.freelancer].filter(id => id);
      conversation = await Conversation.create({
        projectId: projectId,
        participants: JSON.stringify(participants),
        lastMessageId: newMessage._id,
        lastMessage: content,
        lastMessageAt: newMessage.sentAt
      });
    } else {
      // Update the existing conversation
      await Conversation.update({
        lastMessageId: newMessage._id,
        lastMessage: content,
        lastMessageAt: newMessage.sentAt,
        updatedAt: new Date()
      }, {
        where: { _id: conversation._id }
      });
    }

    // Transform and return the created message
    const transformedMessage = {
      id: newMessage._id,
      projectId: newMessage.projectId,
      senderId: newMessage.senderId,
      senderRole: newMessage.senderRole,
      content: newMessage.content,
      type: newMessage.type,
      status: newMessage.status,
      isSystemMessage: newMessage.isSystemMessage,
      parentId: newMessage.parentId,
      attachments: newMessage.attachments ? JSON.parse(newMessage.attachments) : [],
      readBy: newMessage.readBy ? JSON.parse(newMessage.readBy) : [],
      sentAt: newMessage.sentAt,
      readAt: newMessage.readAt,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt
    };

    // Emit real-time message notification via WebSocket
    try {
      const { notifyProject } = require('../socket/server');
      notifyProject(projectId, 'new-message', {
        message: transformedMessage,
        timestamp: new Date(),
        from: req.user.userId
      });
    } catch (socketError) {
      console.error('Failed to emit message via WebSocket:', socketError);
      // Don't throw error - continue with response
    }

    res.status(201).json(transformedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    next(new InternalServerError('Failed to send message'));
  }
};

// Mark a message as read
const markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findByPk(messageId);
    if (!message) {
      return next(new NotFoundError('Message not found'));
    }

    // Check if user has access to this message (part of the project)
    const project = await Project.findByPk(message.projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    if (userId !== project.client && userId !== project.freelancer) {
      return next(new UnauthorizedError('Unauthorized to access this message'));
    }

    // Add user to readBy array if not already there
    let readBy = message.readBy ? JSON.parse(message.readBy) : [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await Message.update({
        readBy: JSON.stringify(readBy),
        status: 'READ',
        readAt: new Date(),
        updatedAt: new Date()
      }, {
        where: { _id: messageId }
      });
    }

    // Emit real-time notification for message read status change
    try {
      const { notifyProject } = require('../socket/server');
      notifyProject(message.projectId, 'message-read', {
        messageId: messageId,
        readBy: userId,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.error('Failed to emit message read notification via WebSocket:', socketError);
      // Don't throw error - continue with response
    }

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    next(new InternalServerError('Failed to mark message as read'));
  }
};

// Mark a conversation as read
const markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return next(new NotFoundError('Conversation not found'));
    }

    // Check if user is part of this conversation
    const participants = JSON.parse(conversation.participants);
    if (!participants.includes(userId)) {
      return next(new UnauthorizedError('Unauthorized to access this conversation'));
    }

    // Update all unread messages in this conversation for this user
    const messages = await Message.findAll({
      where: { projectId: conversation.projectId }
    });

    for (const message of messages) {
      let readBy = message.readBy ? JSON.parse(message.readBy) : [];
      if (!readBy.includes(userId) && message.senderId !== userId) {
        readBy.push(userId);
        await Message.update({
          readBy: JSON.stringify(readBy),
          status: 'READ',
          readAt: new Date(),
          updatedAt: new Date()
        }, {
          where: { _id: message._id }
        });
      }
    }

    // Reset unread count to 0
    await Conversation.update({
      unreadCount: 0,
      updatedAt: new Date()
    }, {
      where: { _id: conversationId }
    });

    // Emit real-time notification for conversation read status change
    try {
      const { notifyProject } = require('../socket/server');
      notifyProject(conversation.projectId, 'conversation-read', {
        conversationId: conversationId,
        readBy: userId,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.error('Failed to emit conversation read notification via WebSocket:', socketError);
      // Don't throw error - continue with response
    }

    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    next(new InternalServerError('Failed to mark conversation as read'));
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead
};