'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const provider = searchParams.get('provider');
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');

        if (!provider || !accessToken || !refreshToken || !userParam) {
          throw new Error('Missing required parameters from OAuth callback');
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Update auth store
        setUser(user);
        setIsAuthenticated(true);

        setStatus('success');

        // Redirect to appropriate dashboard after a brief delay
        setTimeout(() => {
          if (user.role === 'client') {
            router.replace('/dashboard/client');
          } else if (user.role === 'freelancer') {
            router.replace('/dashboard/freelancer');
          } else {
            router.replace('/dashboard');
          }
        }, 2000);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setIsAuthenticated]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Authenticating...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <RotateCcw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              Completing your social login. Please wait...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'An error occurred during authentication.'}
            </p>
            <Button 
              onClick={() => router.push('/auth/login')}
              variant="outline"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Authentication Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You've been successfully logged in. Redirecting to your dashboard...
          </p>
          <RotateCcw className="h-6 w-6 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}