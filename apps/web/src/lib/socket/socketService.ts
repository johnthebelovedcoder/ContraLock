import { Message, Conversation } from '@/types';
import { mockConfig } from '@/config/mock-config';

// Dynamically import socket.io-client to avoid build issues
let io: any = null;
let Socket: any = null;

// We'll load socket.io-client when we initialize the connection
interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (data: { messageId: string; readBy: string; timestamp: Date }) => void;
  onConversationRead?: (data: { conversationId: string; readBy: string; timestamp: Date }) => void;
  onProjectStatusChange?: (data: { 
    projectId: string; 
    oldStatus: string; 
    newStatus: string; 
    updatedBy: string; 
    timestamp: Date;
    message: string;
  }) => void;
  onMilestoneStatusChange?: (data: { 
    projectId: string; 
    milestoneId: string; 
    oldStatus: string; 
    newStatus: string; 
    updatedBy: string; 
    timestamp: Date;
    message: string;
  }) => void;
  onError?: (error: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: SocketEventHandlers = {};

  async initialize(token: string, eventHandlers: SocketEventHandlers) {
    this.eventHandlers = eventHandlers;

    // Skip socket connection if using mock data or if token is mock
    if (mockConfig.useMockData || token === 'mock-token' || !token) {
      console.log('Skipping socket connection (mock data mode or no valid token)');
      // Still call onConnect handler to maintain compatibility
      // but don't actually connect
      setTimeout(() => {
        this.eventHandlers.onConnect?.();
      }, 100);
      return;
    }

    // Dynamically import socket.io-client
    if (!io) {
      const socketIo = await import('socket.io-client');
      io = socketIo.io;
    }

    // Initialize socket connection
    this.socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.eventHandlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.eventHandlers.onDisconnect?.();
    });

    // Messaging events
    this.socket.on('new-message', (data) => {
      console.log('Received new message:', data);
      if (data.message) {
        this.eventHandlers.onNewMessage?.(data.message);
      }
    });

    this.socket.on('message-read', (data) => {
      console.log('Message marked as read:', data);
      this.eventHandlers.onMessageRead?.({
        messageId: data.messageId,
        readBy: data.readBy,
        timestamp: new Date(data.timestamp)
      });
    });

    this.socket.on('conversation-read', (data) => {
      console.log('Conversation marked as read:', data);
      this.eventHandlers.onConversationRead?.({
        conversationId: data.conversationId,
        readBy: data.readBy,
        timestamp: new Date(data.timestamp)
      });
    });

    // Project events
    this.socket.on('project-status-change', (data) => {
      console.log('Project status change:', data);
      this.eventHandlers.onProjectStatusChange?.({
        projectId: data.projectId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        updatedBy: data.updatedBy,
        timestamp: new Date(data.timestamp),
        message: data.message
      });
    });

    // Milestone events
    this.socket.on('milestone-status-change', (data) => {
      console.log('Milestone status change:', data);
      this.eventHandlers.onMilestoneStatusChange?.({
        projectId: data.projectId,
        milestoneId: data.milestoneId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        updatedBy: data.updatedBy,
        timestamp: new Date(data.timestamp),
        message: data.message
      });
    });

    // Notification events
    this.socket.on('live-notification', (notification) => {
      console.log('Live notification:', notification);
      // We'll handle this separately if needed
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      // Check if it's an authentication error
      const isAuthError = error.message?.toLowerCase().includes('authentication') || 
                         error.message?.toLowerCase().includes('unauthorized') ||
                         error.message?.toLowerCase().includes('invalid token');
      
      if (isAuthError) {
        // Only log as warning if using mock token, otherwise log as error
        const isMockToken = this.socket?.auth?.token === 'mock-token';
        if (isMockToken) {
          console.warn('Socket authentication failed (using mock token - this is expected in development)');
        } else {
          console.error('Socket authentication failed:', error.message);
          this.eventHandlers.onError?.(error);
        }
      } else {
        console.error('Socket connection error:', error);
        this.eventHandlers.onError?.(error);
      }
    });

    this.socket.on('error', (error) => {
      // Check if it's an authentication error
      const isAuthError = error.message?.toLowerCase().includes('authentication') || 
                         error.message?.toLowerCase().includes('unauthorized') ||
                         error.message?.toLowerCase().includes('invalid token');
      
      if (isAuthError) {
        const isMockToken = this.socket?.auth?.token === 'mock-token';
        if (isMockToken) {
          console.warn('Socket authentication error (using mock token - this is expected in development)');
        } else {
          console.error('Socket authentication error:', error.message);
          this.eventHandlers.onError?.(error);
        }
      } else {
        console.error('Socket error:', error);
        this.eventHandlers.onError?.(error);
      }
    });
  }

  // Join project room to receive project-specific updates
  joinProjectRoom(projectId: string) {
    if (this.socket) {
      this.socket.emit('join-project-room', projectId);
    }
  }

  // Leave project room
  leaveProjectRoom(projectId: string) {
    if (this.socket) {
      this.socket.emit('leave-project-room', projectId);
    }
  }

  // Subscribe to live notifications
  subscribeToNotifications() {
    if (this.socket) {
      this.socket.emit('request-notification-updates');
    }
  }

  // Send real-time message
  sendRealTimeMessage(projectId: string, messageData: any) {
    if (this.socket) {
      this.socket.emit('private-message', {
        toUserId: messageData.toUserId, // In a real implementation
        message: messageData.content,
        projectId: projectId,
        type: 'text'
      });
    }
  }

  // Send project update
  sendProjectUpdate(projectId: string, updateData: any) {
    if (this.socket) {
      this.socket.emit('project-update', {
        projectId,
        ...updateData
      });
    }
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();