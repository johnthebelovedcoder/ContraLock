'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { MessagingContent } from '@/components/dashboard/messaging-content';

export default function FreelancerMessagesPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a freelancer to access the messages page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MessagingContent userType="freelancer" />
    </div>
  );
}