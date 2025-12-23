import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { FaLinkedinIn } from 'react-icons/fa';
import { authService } from '@/lib/api/authService';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

type SocialProvider = 'google' | 'linkedin';

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SocialLoginButtons({ onSuccess, onError }: SocialLoginButtonsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      // Fetch the OAuth URL from the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/social/urls`);
      const urls = await response.json();

      if (provider === 'google') {
        // Redirect to Google OAuth URL
        window.location.href = urls.googleUrl;
      } else if (provider === 'linkedin') {
        // Redirect to LinkedIn OAuth URL
        window.location.href = urls.linkedinUrl;
      }
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      toast({
        title: 'Login failed',
        description: error.message || `Failed to sign in with ${provider}`,
        variant: 'destructive'
      });
      onError?.(error.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={() => handleSocialLogin('google')}
        type="button"
      >
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-[#0077B5] hover:bg-[#005f8d] text-white"
        onClick={() => handleSocialLogin('linkedin')}
        type="button"
      >
        <FaLinkedinIn className="h-5 w-5" />
        Continue with LinkedIn
      </Button>
    </div>
  );
}