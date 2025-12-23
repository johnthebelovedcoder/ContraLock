'use client';

import { User as UserIcon, Bell, Menu, Search, MessageCircle, Check, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Notification } from '@/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useMessagingStore } from '@/lib/store/messagingStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations } = useMessagingStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { user: authUser } = useAuthStore();

  // Calculate total unread messages across all conversations
  const totalUnreadMessages = conversations.reduce(
    (total, conversation) => total + (conversation.unreadCount || 0),
    0
  );

  // Calculate total unread notifications
  const totalUnreadNotifications = notifications.filter(n => !n.isRead).length;

  // Track the last time conversations were fetched to prevent rapid calls
  const lastConversationFetch = useRef(0);
  const lastNotificationFetch = useRef(0);

  useEffect(() => {
    // Fetch conversations when component mounts
    if (authUser?.id) {
      // Check if the messaging service is available before fetching
      const fetchConversations = async () => {
        const now = Date.now();
        // Prevent fetching conversations more than once every 5 seconds
        if (now - lastConversationFetch.current < 5000) {
          return;
        }

        lastConversationFetch.current = now;

        try {
          await useMessagingStore.getState().fetchConversations(authUser.id);
        } catch (error) {
          // Silently handle errors - in a real app, you might want to show a notification
          console.warn('Could not load message conversations:', error);
        }
      };

      fetchConversations();

      // Fetch notifications when component mounts
      const fetchNotificationsWrapper = async () => {
        const now = Date.now();
        // Prevent fetching notifications more than once every 5 seconds
        if (now - lastNotificationFetch.current < 5000) {
          return;
        }

        lastNotificationFetch.current = now;

        try {
          await fetchNotifications(authUser.id);
        } catch (error) {
          console.warn('Could not load notifications:', error);
        }
      };

      fetchNotificationsWrapper();
    }
  }, [authUser?.id, fetchNotifications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger a search across the platform
    console.log('Searching for:', searchQuery);
    // For now, just clear the search
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" className="md:hidden" onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>

        {/* Search Bar - Now more prominent on desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-6">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects, messages, contacts, milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full h-9 text-sm focus:ring-2 focus:ring-primary/50"
                aria-label="Global search"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search button on mobile */}
          <div className="md:hidden">
            <Button variant="outline" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>

          {/* Messaging icon with unread count */}
          <Button variant="outline" size="icon" className="relative" asChild>
            <Link href="/dashboard/messages">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Messages</span>
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                  {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                </span>
              )}
            </Link>
          </Button>

          <ThemeToggle />

          {/* Notification dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                {totalUnreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                    {totalUnreadNotifications > 9 ? '9+' : totalUnreadNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-hidden p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead()}
                    className="h-auto p-1 text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-accent cursor-pointer transition-standard ${
                          !notification.isRead ? 'bg-accent/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.timestamp).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // In a real app, you might want to delete the notification
                                // For now, we'll just mark it as read
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/notifications">View all notifications</Link>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar for mobile that appears when the mobile search button is pressed */}
      <div className="md:hidden mt-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full h-9 text-sm"
            />
          </div>
        </form>
      </div>
    </header>
  );
}