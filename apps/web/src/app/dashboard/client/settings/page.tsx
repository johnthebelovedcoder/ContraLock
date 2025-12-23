'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { SettingsContent } from '@/components/dashboard/settings-content';

export default function ClientSettingsPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to access the settings page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsContent userType="client" />
    </div>
  );
}