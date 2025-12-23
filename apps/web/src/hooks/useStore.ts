import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

// Custom hook to initialize authentication on component mount
export const useInitializeAuth = () => {
  const { initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await initializeAuth();
    };

    // Only initialize if we haven't already done so
    if (!loading) {
      initAuth();
    }
  }, [initializeAuth, loading]);

  return { loading };
};

// Generic error handling hook
export const useErrorHandler = () => {
  const { error, clearError } = useAuthStore();

  // This could be expanded to handle errors from all stores
  return { error, clearError };
};