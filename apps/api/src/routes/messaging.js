const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead
} = require('../controllers/messagingController');

// Validation middleware for various endpoints
const validateSendMessage = [
  body('projectId').isString().notEmpty().withMessage('Project ID is required'),
  body('content').isString().notEmpty().withMessage('Message content is required'),
  body('type').optional().isIn(['TEXT', 'FILE', 'NOTIFICATION']).withMessage('Invalid message type'),
];

const validateGetMessages = [
  param('projectId').isString().notEmpty().withMessage('Project ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

const validateUserIdParam = [
  param('userId').isString().notEmpty().withMessage('User ID is required'),
];

const validateMessageIdParam = [
  param('messageId').isString().notEmpty().withMessage('Message ID is required'),
];

const validateConversationIdParam = [
  param('conversationId').isString().notEmpty().withMessage('Conversation ID is required'),
];

// Routes
// GET /messaging/conversations/:userId - Get all conversations for a user
router.get('/conversations/:userId', authenticateToken, validateUserIdParam, getConversations);

// GET /messaging/conversations - Get conversations for the authenticated user (when userId comes from token)
router.get('/conversations', authenticateToken, getConversations);

// GET /messaging/messages - Get all messages for the authenticated user across all projects
router.get('/messages', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], getMessages);

// GET /messaging/messages/:projectId - Get messages for a project
router.get('/messages/:projectId', authenticateToken, validateGetMessages, getMessages);

// POST /messaging/send - Send a new message
router.post('/send', authenticateToken, validateSendMessage, sendMessage);

// POST /messaging/messages/:messageId/read - Mark a message as read
router.post('/messages/:messageId/read', authenticateToken, validateMessageIdParam, markMessageAsRead);

// POST /messaging/conversations/:conversationId/read - Mark a conversation as read
router.post('/conversations/:conversationId/read', authenticateToken, validateConversationIdParam, markConversationAsRead);

// Additional routes that might be needed based on the web app
// POST /messaging/upload - File upload would go here if needed

module.exports = router;