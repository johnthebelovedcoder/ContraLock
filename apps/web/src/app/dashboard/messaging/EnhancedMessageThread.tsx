import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  File,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Users,
  Phone,
  Video,
  Search
} from 'lucide-react';
import { useMessagingStore, useAuthStore } from '@/lib/store';
import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedMessageThreadProps {
  projectId: string;
  participantIds: string[];
}

export function EnhancedMessageThread({ projectId, participantIds }: EnhancedMessageThreadProps) {
  const { user } = useAuthStore();
  const {
    messages,
    currentConversation,
    typingUsers,
    unreadMessages,
    sendMessage,
    fetchMessages,
    startTyping,
    stopTyping
  } = useMessagingStore();

  const [messageText, setMessageText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      // Reset pagination when changing projects
      setCurrentPage(1);
      setHasMoreMessages(true);
      fetchMessages(projectId);
    }
  }, [projectId, fetchMessages]);

  // Load more messages when needed
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      // For now, we'll just fetch all messages again since the current store implementation
      // doesn't support pagination, so we'll simulate it by fetching all messages
      await fetchMessages(projectId);

      // For true pagination support, we would need to modify the fetchMessages function in the store
      // to accept page and limit parameters

      // For now, just set hasMoreMessages to false as mock data is limited
      setHasMoreMessages(false);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Get messages for the current project
  const projectMessages = messages[projectId] || [];

  // Scroll to bottom when messages for this project change
  useEffect(() => {
    scrollToBottom();
  }, [projectMessages.length, projectId]); // Only depend on the length and projectId to avoid unnecessary scrolls

  // Handle typing indicator
  useEffect(() => {
    if (!inputRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (messageText.trim()) {
        startTyping(projectId, user?._id || 'unknown-user');

        // Clear any existing timeout and set a new one
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          stopTyping(projectId, user?._id || 'unknown-user');
        }, 1500); // Stop typing indicator after 1.5 seconds of inactivity
      }
    };

    const inputElement = inputRef.current;
    inputElement?.addEventListener('keydown', handleKeyDown);

    return () => {
      inputElement?.removeEventListener('keydown', handleKeyDown);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, projectId, startTyping, stopTyping, user?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage({
        projectId,
        content: messageText,
        type: 'TEXT'
      });
      setMessageText('');
      stopTyping(projectId); // Stop typing when message is sent
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === user?._id;
    
    return (
      <div 
        key={message._id} 
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
          {!isCurrentUser && (
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {message.sender.firstName?.[0]}
                {message.sender.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            {!isCurrentUser && (
              <span className="text-xs text-muted-foreground mb-1">
                {message.sender.firstName} {message.sender.lastName}
              </span>
            )}
            
            <div 
              className={`rounded-2xl px-4 py-2 ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                  : 'bg-secondary text-secondary-foreground rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
              </span>
              
              {isCurrentUser && (
                <div className="flex items-center gap-0.5">
                  {message.status === 'DELIVERED' && (
                    <Check className="h-3 w-3 text-muted-foreground" />
                  )}
                  {message.status === 'READ' && (
                    <CheckCheck className="h-3 w-3 text-primary" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {isCurrentUser && (
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Project Discussion</h3>
            <p className="text-sm text-muted-foreground">
              {participantIds.length} participants • Active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear Conversation</DropdownMenuItem>
              <DropdownMenuItem>Leave Conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full w-full pr-4">
          <div className="space-y-4">
            {/* Load more button at the top for older messages */}
            {hasMoreMessages && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  className="mb-4"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Messages'
                  )}
                </Button>
              </div>
            )}

            {/* Messages container - reverse order to show newer messages at the bottom */}
            <div ref={messagesStartRef}>
              {projectMessages.length > 0 ? (
                [...projectMessages].reverse().map(renderMessage) // Reverse to show newest at bottom
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="p-3 rounded-full bg-secondary mb-4">
                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">No messages yet</h4>
                  <p className="text-muted-foreground max-w-md">
                    Start a conversation with your project partner. All messages are securely stored and encrypted.
                  </p>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Typing Indicator */}
      {typingUsers && typingUsers[projectId] && typingUsers[projectId].length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          {typingUsers[projectId].length === 1 ? (
            <span>{typingUsers[projectId][0]} is typing...</span>
          ) : (
            <span>{typingUsers[projectId].join(', ')} are typing...</span>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 resize-none py-3"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          multiple 
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              // Handle file upload
              console.log('Files selected:', Array.from(files));
            }
          }}
        />
      </div>
    </div>
  );
}