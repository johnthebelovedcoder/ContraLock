'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { MessagingContent } from '@/components/dashboard/messaging-content';
import { enableMockData } from '@/config/mock-config';

export default function ClientMessagesPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();

    // Enable mock data by default when component mounts
    // This ensures mock data is enabled for development/testing
    if (typeof window !== 'undefined') {
      // Check if mock data is already enabled
      const isMockAlreadyEnabled = localStorage.getItem('useMockData') === 'true';
      if (!isMockAlreadyEnabled) {
        enableMockData();
      }
    }
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to access the messages page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MessagingContent userType="client" />
    </div>
  );
}