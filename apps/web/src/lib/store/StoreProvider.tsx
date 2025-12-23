'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

// Create a single instance of QueryClient for the entire app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Main store provider component that initializes auth and provides all necessary contexts
export default function StoreProvider({ children }: PropsWithChildren) {
  const { initializeAuth } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side to avoid hydration issues
    setIsClient(true);
    // Initialize authentication on app load
    const init = async () => {
      await initializeAuth();
    };
    init();
  }, [initializeAuth]);

  // Don't render children until we're on the client to avoid hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}