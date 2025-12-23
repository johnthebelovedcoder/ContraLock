'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (loading) return; // Wait for loading to complete before redirecting

    if (!isAuthenticated) {
      // If not authenticated, redirect to login
      router.push('/auth/login');
      return;
    }

    if (user) {
      // Check if user is verified first
      if (user.status === 'unverified') {
        router.push('/auth/verify');
        return;
      }

      // Then redirect based on role
      switch (user.role) {
        case 'client':
          router.push('/dashboard/client');
          break;
        case 'freelancer':
          router.push('/dashboard/freelancer');
          break;
        case 'admin':
        case 'arbitrator':
          // For other roles, could redirect to admin dashboard
          router.push('/dashboard/admin');
          break;
        default:
          // Default fallback if role is undefined or unrecognized
          router.push('/auth/login');
          break;
      }
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}