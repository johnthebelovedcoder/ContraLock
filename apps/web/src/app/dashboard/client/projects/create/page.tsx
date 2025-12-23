'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProjectCreationFlow } from '@/components/projects/ProjectCreationFlow';

export default function CreateProjectPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  // Initialize auth when component mounts
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // If still loading or not authenticated, show appropriate state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to create a project</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Fill out the details below to create your project
        </p>
      </div>
      
      <ProjectCreationFlow />
    </div>
  );
}