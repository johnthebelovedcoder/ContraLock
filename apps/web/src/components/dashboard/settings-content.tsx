'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuthStore } from '@/lib/store/authStore';
import { PaymentMethodsManager } from '@/components/payments/PaymentMethodsManager';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Smartphone,
  Globe,
  SmartphoneIcon,
  Key,
  Activity,
  Monitor,
  Settings as SettingsIcon,
  Star,
  MessageCircle
} from 'lucide-react';

interface ClientProfile {
  id: string;
  businessName: string;
  logo?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  description: string;
  verified: boolean;
  rating: number;
  totalProjects: number;
  totalSpend: number;
  averageApprovalTime: number; // in days
  disputeRate: number; // percentage
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastLogin: Date;
  loginHistory: LoginEvent[];
  authorizedDevices: Device[];
  passwordLastChanged: Date;
}

interface PaymentSettings {
  savedCards: PaymentMethod[];
  bankAccounts: BankAccount[];
  cryptoWallets: CryptoWallet[];
  preferredMethod: string;
  autoFundingEnabled: boolean;
  preferredCurrency: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppAlerts: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
}

interface LoginEvent {
  id: string;
  device: string;
  location: string;
  timestamp: Date;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILED';
}

interface Device {
  id: string;
  name: string;
  type: 'MOBILE' | 'DESKTOP' | 'TABLET';
  lastActive: Date;
  isCurrent: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT' | 'CRYPTO';
  last4?: string;
  expiry?: string;
  walletAddress?: string;
  isPreferred: boolean;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  isPreferred: boolean;
}

interface CryptoWallet {
  id: string;
  currency: string;
  walletAddress: string;
  isPreferred: boolean;
}

interface SettingsContentProps {
  userType: 'client' | 'freelancer';
}

export function SettingsContent({ userType }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');

  // Mock data initialization
  useEffect(() => {
    const mockProfile: ClientProfile = {
      id: 'client-1',
      businessName: 'ABC Corporation',
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1 (555) 123-4567',
      description: 'Digital marketing agency specializing in e-commerce solutions',
      verified: true,
      rating: 4.8,
      totalProjects: 24,
      totalSpend: 75000,
      averageApprovalTime: 1.5, // days
      disputeRate: 2.1 // percentage
    };

    const mockSecurity: SecuritySettings = {
      twoFactorEnabled: true,
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      loginHistory: [
        {
          id: 'lh-1',
          device: 'Chrome on Windows',
          location: 'New York, NY',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.10',
          status: 'SUCCESS'
        },
        {
          id: 'lh-2',
          device: 'Safari on iPhone',
          location: 'New York, NY',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.15',
          status: 'SUCCESS'
        },
        {
          id: 'lh-3',
          device: 'Firefox on Mac',
          location: 'New York, NY',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.20',
          status: 'SUCCESS'
        }
      ],
      authorizedDevices: [
        {
          id: 'device-1',
          name: 'Alex\'s MacBook Pro',
          type: 'DESKTOP',
          lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isCurrent: true
        },
        {
          id: 'device-2',
          name: 'Alex\'s iPhone',
          type: 'MOBILE',
          lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isCurrent: false
        },
        {
          id: 'device-3',
          name: 'Work Laptop',
          type: 'DESKTOP',
          lastActive: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          isCurrent: false
        }
      ],
      passwordLastChanged: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 2 months ago
    };

    const mockPayment: PaymentSettings = {
      savedCards: [
        {
          id: 'cc-1',
          type: 'CREDIT_CARD',
          last4: '4242',
          expiry: '12/26',
          isPreferred: true
        },
        {
          id: 'cc-2',
          type: 'DEBIT_CARD',
          last4: '1234',
          expiry: '08/25',
          isPreferred: false
        }
      ],
      bankAccounts: [
        {
          id: 'ba-1',
          bankName: 'Chase Bank',
          accountNumber: '****5678',
          routingNumber: '****1234',
          isPreferred: true
        }
      ],
      cryptoWallets: [
        {
          id: 'cw-1',
          currency: 'BTC',
          walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          isPreferred: false
        },
        {
          id: 'cw-2',
          currency: 'ETH',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          isPreferred: true
        },
        {
          id: 'cw-3',
          currency: 'USDT',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44f',
          isPreferred: false
        }
      ],
      preferredMethod: 'cc-1',
      autoFundingEnabled: true,
      preferredCurrency: 'USD'
    };

    setPreferredCurrency('USD'); // Set the default preferred currency

    const mockNotifications: NotificationSettings = {
      emailNotifications: true,
      smsNotifications: false,
      inAppAlerts: true,
      dailySummary: false,
      weeklySummary: true
    };

    setClientProfile(mockProfile);
    setSecuritySettings(mockSecurity);
    setPaymentSettings(mockPayment);
    setNotificationSettings(mockNotifications);
  }, []);

  // Handle profile update
  const handleUpdateProfile = () => {
    console.log('Profile updated');
  };

  // Handle password change
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Password changed');
    setNewPassword('');
    setConfirmPassword('');
  };

  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);

  // Handle adding payment method
  const handleAddPaymentMethod = () => {
    setShowPaymentMethodsModal(true);
  };

  // Handle notification settings change
  const handleNotificationChange = (setting: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => prev ? { ...prev, [setting]: value } : null);
  };

  // Handle preferred currency change
  const handlePreferredCurrencyChange = async (currency: string) => {
    // In a real app, this would update the user profile in the backend
    try {
      // Update user profile with preferred currency
      const updatedUser = await useAuthStore.getState().updateProfile({ preferredCurrency: currency });
      setPreferredCurrency(currency);
      alert(`Preferred currency updated to ${currency}`);
    } catch (error) {
      console.error('Error updating preferred currency:', error);
      alert('Failed to update preferred currency');
    }
  };

  if (!clientProfile || !securitySettings || !paymentSettings || !notificationSettings) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: userType === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${userType}` },
          { name: 'Settings', current: true }
        ]}
      />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, security, and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="profile" className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Legal
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={clientProfile.firstName}
                        onChange={(e) => setClientProfile({...clientProfile, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={clientProfile.lastName}
                        onChange={(e) => setClientProfile({...clientProfile, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientProfile.email}
                      onChange={(e) => setClientProfile({...clientProfile, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={clientProfile.phone}
                      onChange={(e) => setClientProfile({...clientProfile, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={clientProfile.description}
                      onChange={(e) => setClientProfile({...clientProfile, description: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleUpdateProfile}>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={clientProfile.businessName}
                      onChange={(e) => setClientProfile({...clientProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        {clientProfile.logo ? (
                          <img src={clientProfile.logo} alt="Logo" className="w-12 h-12" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Profile Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-primary">
                        {clientProfile.firstName.charAt(0)}{clientProfile.lastName.charAt(0)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{clientProfile.firstName} {clientProfile.lastName}</h2>
                    <p className="text-sm text-muted-foreground">{clientProfile.businessName}</p>

                    <div className="mt-4 w-full space-y-2">
                      {clientProfile.verified && (
                        <Badge className="w-full justify-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < Math.floor(clientProfile.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        <span className="ml-1 text-sm">{clientProfile.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Projects</span>
                    <span className="font-medium text-foreground">{clientProfile.totalProjects}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spend</span>
                    <span className="font-medium text-foreground">${clientProfile.totalSpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Approval Time</span>
                    <span className="font-medium text-foreground">{clientProfile.averageApprovalTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dispute Rate</span>
                    <span className="font-medium text-foreground">{clientProfile.disputeRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-foreground">Password Last Changed</p>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings.passwordLastChanged.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Change Password</Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handleChangePassword}>Update Password</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {securitySettings.twoFactorEnabled
                        ? 'Enabled'
                        : 'Not enabled - increase your account security'}
                    </p>
                  </div>
                  <div>
                    <Badge variant={securitySettings.twoFactorEnabled ? 'default' : 'destructive'}>
                      {securitySettings.twoFactorEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant={securitySettings.twoFactorEnabled ? 'outline' : 'default'}>
                    {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Login History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securitySettings.loginHistory.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-sm border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{event.device}</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{event.timestamp.toLocaleString()}</p>
                        <Badge variant={event.status === 'SUCCESS' ? 'default' : 'destructive'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Authorized Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securitySettings.authorizedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 rounded-sm border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{device.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{device.type.toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Active {Math.floor((Date.now() - device.lastActive.getTime()) / (1000 * 60 * 60))}h ago</p>
                        {device.isCurrent && (
                          <Badge variant="outline" className="mt-1">Current</Badge>
                        )}
                        <Button variant="outline" size="sm" className="mt-2">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Saved Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentSettings.savedCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          {card.type === 'CREDIT_CARD' || card.type === 'DEBIT_CARD' ? (
                            <CreditCard className="h-5 w-5" />
                          ) : (
                            <DollarSign className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {card.type === 'CREDIT_CARD' ? 'Credit Card' :
                             card.type === 'DEBIT_CARD' ? 'Debit Card' :
                             'Crypto Wallet'}
                            {card.type !== 'CRYPTO' && card.last4 ? ` ending in ${card.last4}` : ''}
                            {card.type === 'CRYPTO' && card.walletAddress ? ` ${card.walletAddress.substring(0, 6)}...${card.walletAddress.substring(card.walletAddress.length - 4)}` : ''}
                          </p>
                          {card.type !== 'CRYPTO' && card.expiry && (
                            <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                          )}
                          {card.type === 'CRYPTO' && card.walletAddress && (
                            <p className="text-sm text-muted-foreground">Crypto Wallet</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.isPreferred && (
                          <Badge variant="outline">Preferred</Badge>
                        )}
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4">
                    <h3 className="text-sm font-medium text-foreground">Bank Accounts</h3>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </div>

                  {paymentSettings.bankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{account.bankName}</p>
                          <p className="text-sm text-muted-foreground">Account ending in {account.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.isPreferred && (
                          <Badge variant="outline">Preferred</Badge>
                        )}
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  ))}

                  {/* Crypto Wallets Section */}
                  <div className="flex justify-between items-center pt-4">
                    <h3 className="text-sm font-medium text-foreground">Crypto Wallets</h3>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Add Wallet
                    </Button>
                  </div>

                  {paymentSettings.cryptoWallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{wallet.currency} Wallet</p>
                          <p className="text-sm text-muted-foreground">
                            {wallet.walletAddress.substring(0, 6)}...{wallet.walletAddress.substring(wallet.walletAddress.length - 4)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {wallet.isPreferred && (
                          <Badge variant="outline">Preferred</Badge>
                        )}
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full mt-4" onClick={handleAddPaymentMethod}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Payment Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Preferred Payment Method</p>
                    <p className="text-sm text-muted-foreground">Default method for transactions</p>
                  </div>
                  <Select value={paymentSettings.preferredMethod}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentSettings.savedCards.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.type === 'CREDIT_CARD' ? 'Credit Card' : 'Debit Card'} ending in {card.last4}
                        </SelectItem>
                      ))}
                      {paymentSettings.bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bankName} ending in {account.accountNumber}
                        </SelectItem>
                      ))}
                      {paymentSettings.cryptoWallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} Wallet
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-funding</p>
                    <p className="text-sm text-muted-foreground">Automatically fund projects from preferred method</p>
                  </div>
                  <div>
                    <Badge variant={paymentSettings.autoFundingEnabled ? 'default' : 'destructive'}>
                      {paymentSettings.autoFundingEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Button variant={paymentSettings.autoFundingEnabled ? 'outline' : 'default'}>
                    {paymentSettings.autoFundingEnabled ? 'Disable' : 'Enable'} Auto-funding
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Preferred Currency</p>
                    <p className="text-sm text-muted-foreground">Default currency for transactions</p>
                  </div>
                  <Select value={preferredCurrency} onValueChange={handlePreferredCurrencyChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="BTC">BTC (₿)</SelectItem>
                      <SelectItem value="ETH">ETH (Ξ)</SelectItem>
                      <SelectItem value="USDT">USDT (₮)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Button
                  variant={notificationSettings.emailNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleNotificationChange('emailNotifications', !notificationSettings.emailNotifications)}
                >
                  {notificationSettings.emailNotifications ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                </div>
                <Button
                  variant={notificationSettings.smsNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleNotificationChange('smsNotifications', !notificationSettings.smsNotifications)}
                >
                  {notificationSettings.smsNotifications ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">In-App Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
                </div>
                <Button
                  variant={notificationSettings.inAppAlerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleNotificationChange('inAppAlerts', !notificationSettings.inAppAlerts)}
                >
                  {notificationSettings.inAppAlerts ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Summary Preferences</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Daily Summary</p>
                      <p className="text-sm text-muted-foreground">Daily digest of notifications</p>
                    </div>
                    <Button
                      variant={notificationSettings.dailySummary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleNotificationChange('dailySummary', !notificationSettings.dailySummary)}
                    >
                      {notificationSettings.dailySummary ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">Weekly digest of notifications</p>
                    </div>
                    <Button
                      variant={notificationSettings.weeklySummary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleNotificationChange('weeklySummary', !notificationSettings.weeklySummary)}
                    >
                      {notificationSettings.weeklySummary ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Legal Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-sm font-medium text-foreground">Terms of Service</p>
                  <p className="text-sm text-muted-foreground">Last updated: January 15, 2024</p>
                </div>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                  <p className="text-sm text-muted-foreground">Last updated: March 1, 2024</p>
                </div>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-sm font-medium text-foreground">Arbitration Rights</p>
                  <p className="text-sm text-muted-foreground">Your rights and obligations</p>
                </div>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Request a copy of your personal data stored in our system. You can download your information including profile details, project history, and communication logs.
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Payment Methods Manager Modal */}
      <PaymentMethodsManager
        isOpen={showPaymentMethodsModal}
        onClose={() => setShowPaymentMethodsModal(false)}
        onPaymentMethodAdded={() => {
          // Optionally refresh payment methods after addition
          // For now, just close the modal
        }}
      />
    </div>
  );
}

export default SettingsContent;