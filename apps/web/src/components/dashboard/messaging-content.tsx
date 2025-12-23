'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Mic,
  Smile,
  Send,
  Users,
  Archive,
  Trash2,
  X,
  Plus,
  MessageCircle,
  Check
} from 'lucide-react';

// Import messaging store
import { useMessagingStore } from '@/lib/store';
// Import the enhanced message thread component
import { EnhancedMessageThread } from '@/app/dashboard/messaging/EnhancedMessageThread';

// Define types for messaging data
type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'VOICE' | 'SYSTEM';
type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: 'client' | 'freelancer';
  isOnline?: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: MessageType;
  timestamp: Date;
  status: MessageStatus;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  imageUrl?: string;
  isEdited?: boolean;
}

interface Conversation {
  id: string;
  projectId: string;
  projectName: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount: number;
  isPinned: boolean;
  isFlagged: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MessagingContentProps {
  userType: 'client' | 'freelancer';
}

export function MessagingContent({ userType }: MessagingContentProps) {
  const { conversations, messages: allMessages, sendMessage, fetchConversations, fetchMessages, loading, error, clearError, initializeSocket } = useMessagingStore();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{file: File, url: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);

  // Load conversations from store and initialize socket
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        // Get current user ID from auth store
        const token = localStorage.getItem('access_token');
        let userId = 'user-1'; // default for mock data

        if (token) {
          // Decode token to get user info or get from local storage
          try {
            // Split the token and get the payload part
            const parts = token.split('.');
            if (parts.length === 3) {
              // Decode the payload part (add padding if needed for base64)
              let payload = parts[1];
              // Add base64 padding if needed
              payload += '='.repeat((4 - payload.length % 4) % 4);

              const userData = JSON.parse(atob(payload));
              userId = userData.userId || 'user-1';
            } else {
              // Token format is invalid, fall back to localStorage
              console.warn('Token format is invalid, falling back to localStorage');
              const storedUser = localStorage.getItem('currentUser');
              if (storedUser) {
                const userObj = JSON.parse(storedUser);
                userId = userObj.id || 'user-1';
              }
            }
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            // Fallback to localStorage if token decoding fails
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
              const userObj = JSON.parse(storedUser);
              userId = userObj.id || 'user-1';
            }
          }
        } else {
          // Fallback to localStorage for user info
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            const userObj = JSON.parse(storedUser);
            userId = userObj.id || 'user-1';
          }
        }

        // Initialize socket connection
        initializeSocket(token || 'mock-token', userId);

        // Fetch conversations
        await fetchConversations(userId);
      } catch (err) {
        console.error('Error initializing messaging:', err);
      }
    };

    initializeMessaging();

    // Cleanup: disconnect socket on unmount
    return () => {
      // Note: We might want to add a disconnect function to the store
    };
  }, [fetchConversations, initializeSocket]);

  // Update filtered conversations when conversations change
  useEffect(() => {
    setFilteredConversations(conversations);
  }, [conversations]);

  // Filter conversations based on search
  useEffect(() => {
    let result = conversations;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(conv =>
        conv.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredConversations(result);
  }, [searchTerm, conversations]);

  // Handle creating a new message
  const handleCreateNewMessage = () => {
    setShowNewMessageModal(true);
    setNewMessageRecipient('');
    setNewMessageContent('');
  };

  // Handle sending the new message
  const handleSendNewMessage = () => {
    if (!newMessageRecipient || !newMessageContent.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Find the recipient user
    const recipientUser = conversations
      .flatMap(conv => conv.participants)
      .find(user => user.name.toLowerCase().includes(newMessageRecipient.toLowerCase()));

    if (!recipientUser) {
      alert('Recipient not found');
      return;
    }

    // Create a new conversation if one doesn't exist
    let conversation = conversations.find(conv =>
      conv.participants.some(p => p.id === recipientUser.id)
    );

    if (!conversation) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        projectId: 'new',
        projectName: 'General',
        participants: [
          { id: 'client-1', name: 'Alex Johnson', role: 'client', isOnline: true },
          recipientUser
        ],
        lastMessage: {
          id: `msg-${Date.now()}`,
          conversationId: `conv-${Date.now()}`,
          sender: { id: 'client-1', name: 'Alex Johnson', role: 'client', isOnline: true },
          content: newMessageContent,
          type: 'TEXT',
          timestamp: new Date(),
          status: 'SENT'
        },
        lastMessageAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isFlagged: false,
        isMuted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setConversations(prev => [newConv, ...prev]);
      setFilteredConversations(prev => [newConv, ...prev]);
    } else {
      // Update existing conversation
      const updatedConversation = {
        ...conversation,
        lastMessage: {
          id: `msg-${Date.now()}`,
          conversationId: conversation.id,
          sender: { id: 'client-1', name: 'Alex Johnson', role: 'client', isOnline: true },
          content: newMessageContent,
          type: 'TEXT',
          timestamp: new Date(),
          status: 'SENT'
        },
        lastMessageAt: new Date(),
        updatedAt: new Date()
      };

      setConversations(prev =>
        prev.map(conv => conv.id === conversation.id ? updatedConversation : conv)
      );
      setFilteredConversations(prev =>
        prev.map(conv => conv.id === conversation.id ? updatedConversation : conv)
      );
    }

    setShowNewMessageModal(false);
    setNewMessageRecipient('');
    setNewMessageContent('');
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Validate files before adding
      const validFiles = files.filter(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 10MB limit`);
          return false;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          alert(`File type ${file.type} not allowed`);
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // Create previews for image files
      const newPreviews = await Promise.all(validFiles.map(async file => {
        let url = '';
        if (file.type.startsWith('image/')) {
          url = URL.createObjectURL(file);
        }
        return { file, url };
      }));

      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle adding files to message
  const handleAddFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => handleFileChange(e);
    input.click();
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };


  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const loadMessages = async () => {
        try {
          // Reset pagination when changing conversations
          setCurrentPage(1);
          setHasMoreMessages(true);

          await fetchMessages(selectedConversation.projectId);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };

      loadMessages();
    } else {
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(true);
    }
  }, [selectedConversation?.projectId, fetchMessages]);

  // Sync messages from store when they change for the selected conversation
  useEffect(() => {
    if (selectedConversation?.projectId) {
      const conversationMessages = allMessages[selectedConversation.projectId] || [];
      setMessages(conversationMessages);
    }
  }, [selectedConversation?.projectId, allMessages]);

  // Load more messages when scrolling up
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !selectedConversation) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      // We need to modify the fetchMessages to support pagination
      // For now, we'll just fetch all messages again since the current store implementation
      // doesn't support pagination, so we'll simulate it by fetching all messages
      await fetchMessages(selectedConversation.projectId);

      // Get messages for the selected conversation from the store
      const conversationMessages = allMessages[selectedConversation.projectId] || [];

      // For true pagination, we would check if we have more messages to load
      // For now, we'll just say we've reached the end since the mock data is limited
      setHasMoreMessages(false);
      setMessages(conversationMessages);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle sending a message in chat (with file support)
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && filePreviews.length === 0) return;

    if (!selectedConversation) {
      alert('Please select a conversation first');
      return;
    }

    setIsTyping(false);

    try {
      let attachments = [];

      // Upload files if any
      if (filePreviews.length > 0) {
        // If we have multiple files, we might want to upload them first
        // For now, we'll just pass them directly to the messaging service
        // which should handle the upload internally
        attachments = filePreviews.map(fp => fp.file);
      }

      // Prepare the message data
      const messageData = {
        projectId: selectedConversation.projectId,
        content: newMessage,
        type: filePreviews.length > 0 ?
          (filePreviews[0].file.type.startsWith('image/') ? 'IMAGE' : 'FILE') :
          'TEXT',
        attachments: attachments,
      };

      // Use the store's sendMessage function
      await sendMessage(messageData);

      // Clear the input fields
      setNewMessage('');
      setFilePreviews([]);

      // Refetch messages to update the UI
      await fetchMessages(selectedConversation.projectId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle bulk actions
  const handleBulkDelete = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const handleBulkArchive = (conversationId: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, isPinned: false } : conv
    ));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const msgDate = new Date(date);
    
    // If same day, show time only
    if (msgDate.toDateString() === now.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within last 7 days, show day name
    const diffTime = Math.abs(now.getTime() - msgDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return msgDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Determine which view to render
  let chatAreaView;
  if (selectedConversation) {
    // Extract participant IDs - handle both string[] and User[] formats
    const participantIds = selectedConversation.participants.length > 0
      ? typeof selectedConversation.participants[0] === 'string'
        ? selectedConversation.participants as string[]
        : (selectedConversation.participants as User[]).map(p => p.id)
      : [];
    
    // Render the enhanced message thread component for project conversations
    chatAreaView = (
      <EnhancedMessageThread
        projectId={selectedConversation.projectId}
        participantIds={participantIds}
      />
    );
  } else {
    // Render empty state
    chatAreaView = (
      <div className="flex-1 flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground max-w-md">
            Choose a conversation from the list to start messaging or create a new conversation
          </p>
          <Button className="mt-4" onClick={handleCreateNewMessage}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: userType === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${userType}` },
          { name: 'Messages', current: true }
        ]}
      />
      <div className="flex h-[calc(100vh-120px)] bg-background border border-border rounded-lg overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
            <Button variant="ghost" size="sm" onClick={handleCreateNewMessage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => {
              // Get the other participant in the conversation
              const currentUserId = userType === 'client' ? 'user-1' : 'user-2';
              
              // Handle both string[] and User[] formats for participants
              let otherParticipantId: string | undefined;
              let otherParticipant: User | undefined;
              
              if (conversation.participants.length > 0) {
                const firstParticipant = conversation.participants[0];
                // Check if participants is an array of User objects or strings
                if (typeof firstParticipant === 'string') {
                  // participants is string[]
                  otherParticipantId = conversation.participants.find((id: string) => id !== currentUserId) as string || conversation.participants[0] as string;
                } else {
                  // participants is User[]
                  otherParticipant = conversation.participants.find((p: User) => p.id !== currentUserId) as User || conversation.participants[0] as User;
                  otherParticipantId = otherParticipant?.id;
                }
              }

              // For mock data purposes, we'll map user IDs to names
              const participantNames: Record<string, string> = {
                'user-1': 'John Client',
                'user-2': 'Jane Freelancer'
              };

              // Get the name - prefer User object name, then mapped name, then ID, then fallback
              let otherParticipantName: string;
              if (otherParticipant && 'name' in otherParticipant) {
                otherParticipantName = otherParticipant.name;
              } else if (otherParticipantId && participantNames[otherParticipantId]) {
                otherParticipantName = participantNames[otherParticipantId];
              } else if (otherParticipantId) {
                otherParticipantName = otherParticipantId;
              } else {
                otherParticipantName = 'Unknown';
              }
              
              // Ensure it's a string and get first character safely
              const displayInitial = typeof otherParticipantName === 'string' && otherParticipantName.length > 0 
                ? otherParticipantName.charAt(0).toUpperCase() 
                : '?';

              return (
                <div
                  key={conversation.id}
                  className={`p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-accent'
                      : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-foreground">
                          {displayInitial}
                        </span>
                      </div>
                      {/* In a real app, we would check participant online status */}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate text-foreground">{otherParticipantName}</h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new conversation to begin messaging</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleCreateNewMessage}>
                <Plus className="h-4 w-4 mr-1" />
                New Message
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {chatAreaView}
      </div>

      {/* New Message Modal - Using Dialog Component */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-foreground">To</label>
              <select
                value={newMessageRecipient}
                onChange={(e) => setNewMessageRecipient(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Select a recipient</option>
                {conversations
                  .flatMap(conv => conv.participants)
                  .filter((user, index, self) =>
                    index === self.findIndex(u => u.id === user.id) // Remove duplicates
                  )
                  .filter(user => user.id !== 'client-1') // Exclude current user
                  .map(user => (
                    <option key={`user-${user.id}`} value={user.name}>
                      {user.name} ({user.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-foreground">Message</label>
              <Textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className=""
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNewMessage}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}

export default MessagingContent;