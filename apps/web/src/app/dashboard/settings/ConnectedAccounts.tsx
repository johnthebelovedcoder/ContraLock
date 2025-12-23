import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Mail, Linkedin, Chrome, CheckCircle, XCircle } from 'lucide-react';

export function ConnectedAccounts() {
  // In a real app, these would come from the user's profile
  const connectedAccounts = {
    google: true,
    linkedin: false,
    email: true
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Connect your social accounts to login more easily
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Google Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Chrome className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Google Account</h4>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Google account
                </p>
              </div>
            </div>
            {connectedAccounts.google ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Connected</Badge>
                <Button variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Connect
              </Button>
            )}
          </div>

          {/* LinkedIn Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-800">
                <Linkedin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium">LinkedIn Account</h4>
                <p className="text-sm text-muted-foreground">
                  Connect to your LinkedIn profile
                </p>
              </div>
            </div>
            {connectedAccounts.linkedin ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Connected</Badge>
                <Button variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Connect
              </Button>
            )}
          </div>

          {/* Email Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium">Email Account</h4>
                <p className="text-sm text-muted-foreground">
                  Primary account for this platform
                </p>
              </div>
            </div>
            {connectedAccounts.email ? (
              <div className="flex items-center gap-2">
                <Badge variant="default">Primary</Badge>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Set as Primary
              </Button>
            )}
          </div>

          {/* Social Login Buttons */}
          <div className="pt-4">
            <h4 className="font-medium mb-3">Connect New Account</h4>
            <SocialLoginButtons />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}