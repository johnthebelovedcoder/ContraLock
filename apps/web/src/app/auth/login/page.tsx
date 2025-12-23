'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormError } from '@/components/ui/form-error';
import { useAuthStore } from '@/lib/store';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { authSchemas } from '@/lib/validation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(authSchemas.login()),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const { login } = useAuthStore();

  const onSubmit = async (data: z.infer<ReturnType<typeof authSchemas.login>>) => {
    setError('');

    try {
      await login(data.email, data.password);
      console.log('Login successful, checking verification status');
      // Get updated user data after login
      const userData = useAuthStore.getState().user;

      // Check if user is verified
      if (userData?.status === 'unverified') {
        // Redirect to email verification page
        router.replace('/auth/verify');
      } else if (userData?.role === 'client') {
        router.replace('/dashboard/client');
      } else if (userData?.role === 'freelancer') {
        router.replace('/dashboard/freelancer');
      } else {
        router.replace('/dashboard'); // Fallback for other roles
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">ContraLock</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure Freelance Escrow Platform</p>
        </div>

        <Card className="transition-standard">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl font-semibold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  {...register('email')}
                />
                {errors.email && (
                  <FormError message={errors.email.message} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <FormError message={errors.password.message} />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>

                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline transition-standard">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="space-y-2">
                  <SocialLoginButtons
                    onSuccess={() => router.replace('/dashboard')}
                    onError={(error) => setError(error)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Don't have an account?{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:underline transition-standard">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}