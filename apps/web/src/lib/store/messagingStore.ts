import { create } from 'zustand';
import { Message, Conversation, Dispute } from '@/types';
import { messagingService } from '../api';
import { socketService } from '../socket/socketService';

// Track the last time conversations were fetched to prevent rapid calls
const lastFetchTime = new Map<string, number>();

interface MessagingState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // projectId -> messages
  disputes: Dispute[];
  loading: boolean;
  error: string | null;
  currentConversation: Conversation | null;
  typingUsers: Record<string, string[]>; // projectId -> array of user names/IDs who are typing
  unreadMessages: Record<string, number>; // projectId -> count of unread messages

  // Conversation actions
  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (projectId: string) => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;

  // Dispute actions
  fetchDisputes: (userId: string, status?: string) => Promise<void>;
  createDispute: (milestoneId: string, disputeData: any) => Promise<Dispute>;

  // Typing indicators
  startTyping: (projectId: string, userId: string) => void;
  stopTyping: (projectId: string, userId: string) => void;

  // Socket management
  initializeSocket: (token: string, userId: string) => void;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;

  clearError: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  messages: {},
  disputes: [],
  loading: false,
  error: null,
  currentConversation: null,
  typingUsers: {},
  unreadMessages: {},

  fetchConversations: async (userId) => {
    const now = Date.now();
    const lastFetch = lastFetchTime.get(userId) || 0;

    // Prevent fetching conversations more than once every 5 seconds per user
    if (now - lastFetch < 5000) {
      // Return early if we've fetched recently
      return;
    }

    lastFetchTime.set(userId, now);

    set({ loading: true });
    try {
      const conversations = await messagingService.getConversations(userId);
      set({ conversations, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch conversations', loading: false });
      throw error;
    }
  },

  fetchMessages: async (projectId) => {
    set({ loading: true });
    try {
      const messages = await messagingService.getMessages(projectId);
      set((state) => ({
        messages: { ...state.messages, [projectId]: messages },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch messages', loading: false });
      throw error;
    }
  },

  sendMessage: async (messageData) => {
    try {
      const { projectId } = messageData;
      const newMessage = await messagingService.sendMessage(messageData);

      set((state) => {
        const existingMessages = state.messages[projectId] || [];
        return {
          messages: {
            ...state.messages,
            [projectId]: [...existingMessages, newMessage],
          },
        };
      });

      // Emit real-time message update if socket is connected
      socketService.sendRealTimeMessage(projectId, messageData);
    } catch (error: any) {
      set({ error: error.message || 'Failed to send message' });
      throw error;
    }
  },

  fetchDisputes: async (userId, status) => {
    set({ loading: true });
    try {
      const disputes = await messagingService.getDisputes(userId, status);
      set({ disputes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch disputes', loading: false });
      throw error;
    }
  },

  createDispute: async (milestoneId, disputeData) => {
    try {
      const dispute = await messagingService.createDispute(milestoneId, disputeData);
      set((state) => ({
        disputes: [...state.disputes, dispute],
      }));
      return dispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create dispute' });
      throw error;
    }
  },

  initializeSocket: (token: string, userId: string) => {
    socketService.initialize(token, {
      onConnect: () => {
        console.log('Chat socket connected');
        // Subscribe to live notifications
        socketService.subscribeToNotifications();
      },
      onDisconnect: () => {
        console.log('Chat socket disconnected');
      },
      onNewMessage: (message) => {
        // Add the new message to the store
        set((state) => {
          const existingMessages = state.messages[message.projectId] || [];
          const updatedMessages = [...existingMessages, message];

          return {
            messages: {
              ...state.messages,
              [message.projectId]: updatedMessages,
            },
          };
        });
      },
      onMessageRead: (data) => {
        // Update message read status in store
        set((state) => {
          const updatedMessages = { ...state.messages };

          Object.entries(updatedMessages).forEach(([projectId, messages]) => {
            updatedMessages[projectId] = messages.map(msg =>
              msg.id === data.messageId ? { ...msg, status: 'READ' } : msg
            );
          });

          return { messages: updatedMessages };
        });
      },
      onConversationRead: (data) => {
        // Handle conversation read status update
        console.log('Conversation marked as read:', data);
      },
      onProjectStatusChange: (data) => {
        // Handle project status change updates
        console.log('Project status changed:', data);
      },
      onMilestoneStatusChange: (data) => {
        // Handle milestone status change updates
        console.log('Milestone status changed:', data);
      },
      onError: (error) => {
        console.error('Socket error:', error);
      }
    });
  },

  joinProjectRoom: (projectId: string) => {
    socketService.joinProjectRoom(projectId);
  },

  leaveProjectRoom: (projectId: string) => {
    socketService.leaveProjectRoom(projectId);
  },

  startTyping: (projectId: string, userId: string) => {
    // This would typically be called via socket to notify other users
    // For now, we'll just track it locally
    set((state) => {
      const currentTyping = state.typingUsers[projectId] || [];
      if (!currentTyping.includes(userId)) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [projectId]: [...currentTyping, userId],
          },
        };
      }
      return state; // No changes if user is already typing
    });
  },

  stopTyping: (projectId: string, userId: string) => {
    set((state) => {
      const currentTyping = state.typingUsers[projectId] || [];
      // Remove current user from typing list
      const updatedTyping = currentTyping.filter(id => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [projectId]: updatedTyping,
        },
      };
    });
  },

  clearError: () => set({ error: null }),
}));