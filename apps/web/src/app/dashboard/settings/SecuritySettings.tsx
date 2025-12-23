'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  RefreshCw,
  KeyRound,
  Mail,
  Smartphone
} from 'lucide-react';
import { useAuthStore, useTwoFactorStore } from '@/lib/store';
import { toast } from 'sonner';

export function SecuritySettings() {
  const { user, updateUserProfile } = useAuthStore();
  const { 
    twoFactorEnabled, 
    generateSecret, 
    verifyToken, 
    disableTwoFactor, 
    generateBackupCodes,
    backupCodes
  } = useTwoFactorStore();
  
  const [step, setStep] = useState<'off' | 'setup' | 'enabled'>('off');
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (user) {
      setStep(twoFactorEnabled ? 'enabled' : 'off');
    }
  }, [user, twoFactorEnabled]);

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      const result = await generateSecret();
      setSecret(result.secret);
      setQrCode(result.qrCode);
      setStep('setup');
      toast.success('2FA setup initiated. Scan the QR code with your authenticator app.');
    } catch (error: any) {
      toast.error('Failed to generate 2FA secret', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token || token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await verifyToken(token);
      toast.success('2FA enabled successfully!');
      setStep('enabled');
      setToken('');
      // Update user profile to reflect 2FA status
      if (user) {
        await updateUserProfile({ ...user, twoFactorEnabled: true });
      }
    } catch (error: any) {
      toast.error('Invalid token. Please try again.', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!token || token.length !== 6) {
      toast.error('Please enter your current 2FA code to disable 2FA');
      return;
    }

    try {
      setLoading(true);
      await disableTwoFactor(token);
      toast.success('2FA disabled successfully');
      setStep('off');
      setToken('');
      // Update user profile to reflect 2FA status
      if (user) {
        await updateUserProfile({ ...user, twoFactorEnabled: false });
      }
    } catch (error: any) {
      toast.error('Failed to disable 2FA', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      setLoading(true);
      const codes = await generateBackupCodes();
      toast.success('New backup codes generated');
      setShowBackupCodes(true);
    } catch (error: any) {
      toast.error('Failed to generate backup codes', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'off' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 rounded-full bg-blue-100">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Enable Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Protect your account by requiring a second form of authentication. 
                    You'll need an authenticator app like Google Authenticator or Authy.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleEnable2FA} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'setup' && secret && qrCode && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-center text-sm text-muted-foreground max-w-md">
                  Scan this QR code with your authenticator app (like Google Authenticator or Authy) 
                  or manually enter the secret key below.
                </p>
                <div className="p-3 bg-muted rounded font-mono text-sm">
                  {secret}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="token">Enter 6-digit code from app</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="token"
                      type="text"
                      placeholder="123456"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      maxLength={6}
                      className="max-w-xs"
                    />
                    <Button 
                      onClick={handleVerifyToken} 
                      disabled={loading || token.length !== 6}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Code'
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setStep('off')}
                  disabled={loading}
                >
                  Cancel Setup
                </Button>
              </div>
            </div>
          )}

          {step === 'enabled' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="p-2 rounded-full bg-green-100">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Two-Factor Authentication Enabled</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Enabled</Badge>
                  <span className="text-sm text-muted-foreground">
                    Using authenticator app
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleGenerateBackupCodes}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate Backup Codes
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <Label htmlFor="disable-token">Enter current 2FA code to disable</Label>
                <div className="flex gap-2">
                  <Input
                    id="disable-token"
                    type="text"
                    placeholder="123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    maxLength={6}
                    className="max-w-xs"
                  />
                  <Button 
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading || token.length !== 6}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      'Disable 2FA'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showBackupCodes && backupCodes && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-yellow-600" />
                Backup Codes
              </h4>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                These codes can be used to access your account if you lose access to your authenticator app. 
                Store them in a secure location.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-background border rounded text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowBackupCodes(false)}
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Additional Security</CardTitle>
              <CardDescription>
                Other security settings for your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Password Change</h4>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Verification</h4>
              <p className="text-sm text-muted-foreground">
                {user?.emailVerified ? 'Email is verified' : 'Email needs verification'}
              </p>
            </div>
            <Badge variant={user?.emailVerified ? "default" : "destructive"}>
              {user?.emailVerified ? "Verified" : "Not Verified"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Session Management</h4>
              <p className="text-sm text-muted-foreground">
                View and manage active sessions
              </p>
            </div>
            <Button variant="outline">Manage Sessions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}