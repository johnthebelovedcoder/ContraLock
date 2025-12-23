'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { MessagingContent } from '@/components/dashboard/messaging-content';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function MessagesPage() {
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

  if (!isAuthenticated || (user?.role !== 'client' && user?.role !== 'freelancer')) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client or freelancer to access the messages page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          pages={[
            { name: 'Dashboard', href: '/dashboard' },
            { name: user?.role === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${user?.role}` },
            { name: 'Messages', current: true }
          ]}
        />
      </div>
      <MessagingContent userType={user?.role as 'client' | 'freelancer'} />
    </div>
  );
}