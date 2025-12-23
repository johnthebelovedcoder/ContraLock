import Link from 'next/link';

// This page will redirect to the login page
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">ContraLock</h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground">Secure Freelance Escrow Platform</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm sm:text-muted-foreground">
            Protect your payments with milestone-based escrow.
            Release funds only when work is completed to your satisfaction.
          </p>

          <Link
            href="/auth/login"
            className="inline-block w-full max-w-xs bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors h-10 flex items-center justify-center"
          >
            Get Started
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:underline py-1">
            Login
          </Link>
          <Link href="/auth/register" className="hover:underline py-1">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}