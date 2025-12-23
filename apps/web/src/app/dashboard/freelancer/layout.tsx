'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Sidebar } from '@/components/dashboard/freelancer/sidebar';
import { Header } from '@/components/dashboard/header';

export default function FreelancerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMobileMenuToggle = () => {
      setIsMobileMenuOpen(prev => !prev);
    };

    window.addEventListener('toggle-mobile-menu', handleMobileMenuToggle);

    return () => {
      window.removeEventListener('toggle-mobile-menu', handleMobileMenuToggle);
    };
  }, []);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'freelancer')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    return null; // Redirect effect will handle navigation
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu button - only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-md bg-primary text-primary-foreground"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar - hidden on mobile when closed, full width when open */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:flex md:flex-col h-screen overflow-y-auto`}
      >
        <Sidebar />
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-4 right-4 p-1 rounded-md text-muted-foreground"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 transition-all duration-300">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-2 bg-muted/40">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}