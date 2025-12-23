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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { useAuthStore } from '@/lib/store';
import { Eye, EyeOff, Check } from 'lucide-react';
import Link from 'next/link';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { authSchemas } from '@/lib/validation';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
      hasSpecialChar: /[\!\@\#\$\%\^\&\*\(\)\,\.\?\"\:\{\}\|\<\>]/.test(password)
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError: setFormError
  } = useForm({
    resolver: zodResolver(authSchemas.register()),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'client' as 'client' | 'freelancer'
    }
  });

  const password = watch('password');

  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    validatePassword(newPassword);
  };

  const { register } = useAuthStore();

  const onSubmit = async (data: z.infer<ReturnType<typeof authSchemas.register>>) => {
    setError('');

    try {
      await register(data.email, data.password, data.firstName, data.lastName, data.role);
      setSuccess(true);

      // In a real application, the user would be redirected to verify email page
      // For now, we'll show a success message and redirect to verification
      setTimeout(() => {
        router.push('/auth/verify');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const allValidationsPassed = Object.values(passwordValidations).every(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-xl font-semibold text-foreground">Create an Account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <Check className="h-5 w-5 text-success" />
              </div>
              <p className="text-lg font-medium text-foreground">Registration Successful!</p>
              <p className="text-sm text-muted-foreground">
                A verification email has been sent to <span className="font-medium">{watch('email')}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    disabled={isSubmitting}
                    {...registerForm('firstName')}
                  />
                  {errors.firstName && (
                    <FormError message={errors.firstName.message} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    disabled={isSubmitting}
                    {...registerForm('lastName')}
                  />
                  {errors.lastName && (
                    <FormError message={errors.lastName.message} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  {...registerForm('email')}
                />
                {errors.email && (
                  <FormError message={errors.email.message} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value: 'client' | 'freelancer') => {
                    // Update the form field value
                    setFormError('role', { message: '' });
                  }}
                  {...registerForm('role')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <FormError message={errors.role.message} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    {...registerForm('password')}
                    onChange={(e) => {
                      registerForm('password').onChange(e);
                      handleChangePassword(e);
                    }}
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

                {/* Password requirements */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Password must contain:</p>
                  <ul className="space-y-1">
                    <li className={`text-sm flex items-center ${passwordValidations.minLength ? 'text-success' : 'text-muted-foreground'}`}>
                      {passwordValidations.minLength ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground"></div>}
                      At least 8 characters
                    </li>
                    <li className={`text-sm flex items-center ${passwordValidations.hasUpperCase ? 'text-success' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasUpperCase ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground"></div>}
                      One uppercase letter
                    </li>
                    <li className={`text-sm flex items-center ${passwordValidations.hasLowerCase ? 'text-success' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasLowerCase ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground"></div>}
                      One lowercase letter
                    </li>
                    <li className={`text-sm flex items-center ${passwordValidations.hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasNumber ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground"></div>}
                      One number
                    </li>
                    <li className={`text-sm flex items-center ${passwordValidations.hasSpecialChar ? 'text-success' : 'text-muted-foreground'}`}>
                      {passwordValidations.hasSpecialChar ? <Check className="h-4 w-4 mr-2" /> : <div className="h-4 w-4 mr-2 rounded-full border border-muted-foreground"></div>}
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !allValidationsPassed}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

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
                  onSuccess={() => router.push('/auth/verify')}
                  onError={(error) => setError(error)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline transition-standard">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}