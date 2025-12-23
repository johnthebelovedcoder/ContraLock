'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail, loading } = useAuthStore();

  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      await verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been successfully verified!');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to verify email. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    // In a real app, this would call an API to resend the verification email
    // For now, we'll simulate it
    setStatus('verifying');
    setMessage('Verification email sent! Please check your inbox.');
    setTimeout(() => {
      setStatus('idle');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            {status === 'verifying' ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            ) : status === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Mail className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            {status === 'verifying'
              ? 'Verifying your email address...'
              : status === 'success'
                ? 'Email verified successfully!'
                : 'Please verify your email to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-center text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <p className="text-center text-lg font-medium text-green-600">Verification Successful!</p>
              <p className="text-center text-muted-foreground mt-2">
                Your email has been verified. Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {message}
              </div>
              <Button
                onClick={handleResendEmail}
                className="w-full"
                disabled={statusRef.current === 'verifying' || loading}
              >
                {statusRef.current === 'verifying' ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Or <Link href="/auth/login" className="text-primary hover:underline">return to login</Link>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                We've sent a verification email to your inbox. Please click the link in the email to verify your account.
              </p>
              <Button
                onClick={handleResendEmail}
                className="w-full"
              >
                Resend Verification Email
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already verified? <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}