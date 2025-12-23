'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/api/authService';
import { Key, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Password validation
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const validatePassword = (password: string) => {
    const validations = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet requirements');
      return;
    }

    if (!token) {
      setError('No reset token provided');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allValidationsPassed = Object.values(passwordValidations).every(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium">Password Reset Success!</p>
              <p className="text-muted-foreground">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-muted-foreground">
                You can now sign in with your new password.
              </p>
              <Button 
                className="w-full mt-4"
                onClick={() => router.push('/auth/login')}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handleChangePassword}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">Password must contain:</p>
                <ul className="space-y-1">
                  <li className={`text-xs flex items-center ${passwordValidations.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordValidations.minLength ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 mr-1 rounded-full border border-muted-foreground"></div>
                    )}
                    At least 8 characters
                  </li>
                  <li className={`text-xs flex items-center ${passwordValidations.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordValidations.hasUpperCase ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 mr-1 rounded-full border border-muted-foreground"></div>
                    )}
                    One uppercase letter
                  </li>
                  <li className={`text-xs flex items-center ${passwordValidations.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordValidations.hasLowerCase ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 mr-1 rounded-full border border-muted-foreground"></div>
                    )}
                    One lowercase letter
                  </li>
                  <li className={`text-xs flex items-center ${passwordValidations.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordValidations.hasNumber ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 mr-1 rounded-full border border-muted-foreground"></div>
                    )}
                    One number
                  </li>
                  <li className={`text-xs flex items-center ${passwordValidations.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordValidations.hasSpecialChar ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 mr-1 rounded-full border border-muted-foreground"></div>
                    )}
                    One special character (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !allValidationsPassed || password !== confirmPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link href="/auth/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}