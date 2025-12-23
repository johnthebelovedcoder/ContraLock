'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  X,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Settings,
  Archive,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Notification } from '@/types';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationType, setNotificationType] = useState<'all' | string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.id) {
      fetchNotifications(user.id);
    }
  }, [loading, isAuthenticated, user, fetchNotifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access notifications</p>
      </div>
    );
  }

  // Filter notifications based on selected filters
  let filteredNotifications = notifications.filter(notification => {
    // Safety check for undefined/null notifications
    if (!notification || !notification._id) return false;

    // Filter by read status
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;

    // Filter by type
    if (notificationType !== 'all' && notification.type !== notificationType) return false;

    // Filter by search query
    if (searchQuery &&
        !notification.message?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Get notification type icon and color
  const getNotificationTypeData = (type: string) => {
    switch (type) {
      case 'MILESTONE_SUBMITTED':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Milestone' };
      case 'PAYMENT_RELEASE':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Payment' };
      case 'REVISION_REQUESTED':
        return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Revision' };
      case 'DISPUTE_SUBMITTED':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Dispute' };
      case 'MESSAGE_RECEIVED':
        return { icon: Mail, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Message' };
      case 'MILESTONE_APPROVED':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Approved' };
      case 'PROJECT_COMPLETED':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' };
      case 'PROJECT_STARTED':
        return { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Started' };
      case 'CONTRACT_SIGNED':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Contract' };
      case 'PAYMENT_DUE':
        return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Payment Due' };
      case 'MILESTONE_APPROVAL_DUE':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Approval Due' };
      default:
        return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100', label: 'General' };
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification?._id) return; // Safety check

    setSelectedNotification(notification);
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    // Navigate to relevant page based on related entity
    if (notification.relatedEntityId) {
      if (notification.relatedEntity === 'project') {
        if (user?.role === 'client') {
          router.push(`/dashboard/client/projects/${notification.relatedEntityId}`);
        } else if (user?.role === 'freelancer') {
          router.push(`/dashboard/freelancer/projects/${notification.relatedEntityId}`);
        }
      } else if (notification.relatedEntity === 'message') {
        router.push(`/dashboard/messages`);
      }
    }
  };

  // Get unique notification types for filter dropdown
  const notificationTypes = Array.from(new Set(notifications.filter(n => n.type).map(n => n.type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            All your platform notifications in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleMarkAllAsRead} disabled={(notifications?.filter(n => n && !n.read)?.length || 0) === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{notifications?.filter(n => n && !n.read)?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Unread notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications?.filter(n => n && n.read)?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Read notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(notifications?.filter(n => {
                if (!n || !n.createdAt) return false;
                const date = new Date(n.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() &&
                       date.getFullYear() === now.getFullYear();
              })?.length) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Notifications this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Read Status</label>
              <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'read') => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notification Type</label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypes.map(type => {
                    const { label } = getNotificationTypeData(type);
                    return (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <div className="text-sm text-muted-foreground">
            {sortedNotifications?.length || 0} {(sortedNotifications?.length || 0) === 1 ? 'notification' : 'notifications'}
          </div>
        </CardHeader>
        <CardContent>
          {sortedNotifications?.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex justify-center">
                <div className="p-3 bg-muted rounded-full">
                  <Bell className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mt-4">No notifications</h3>
              <p className="text-muted-foreground mt-1">
                {filter === 'unread'
                  ? "You have no unread notifications"
                  : "You have no notifications to display"}
              </p>
              <Button className="mt-4" onClick={() => {
                setFilter('all');
                setSearchQuery('');
                setNotificationType('all');
              }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedNotifications.map((notification) => {
                const { icon: Icon, color, bg, label } = getNotificationTypeData(notification.type);
                return (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-lg border flex items-start gap-4 transition-all hover:shadow-sm cursor-pointer ${
                      !notification.read
                        ? 'bg-accent/30 border-primary/30 shadow-sm'
                        : 'border-border'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`p-2 rounded-full ${bg} ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={!notification.read ? 'font-medium' : ''}>{notification.message}</p>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification._id);
                          }}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          className="h-8 w-8 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        className="h-8 w-8 p-0"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        className="h-8 w-8 p-0"
                        title="View details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Notification Details Panel (for future expansion) */}
      {selectedNotification && (
        <Card className="hidden md:block w-96 fixed right-4 top-1/2 transform -translate-y-1/2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notification Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                <p>{getNotificationTypeData(selectedNotification.type).label}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                <p>{selectedNotification.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Message</h4>
                <p>{selectedNotification.message}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                <p>{selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : ''}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <Badge variant={selectedNotification.read ? "default" : "destructive"}>
                  {selectedNotification.read ? "Read" : "Unread"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}