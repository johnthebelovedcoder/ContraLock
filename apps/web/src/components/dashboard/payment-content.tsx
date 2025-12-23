'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuthStore } from '@/lib/store/authStore';
import { WithdrawalModal } from '@/components/payments/WithdrawalModal';
import { PaymentMethodsManager } from '@/components/payments/PaymentMethodsManager';
import {
  CreditCard,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Lock
} from 'lucide-react';
import { walletService } from '@/lib/services/walletService';
import { currencyService } from '@/lib/services/currencyService';

// Define types for payment data
type TransactionType = 'ESCROW_DEPOSIT' | 'FEE' | 'REFUND' | 'PAYOUT' | 'DISPUTE_FEE' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PROJECT_FUNDS' | 'PROJECT_REFUND' | 'MILESTONE_PAYMENT' | 'MILESTONE_INCOME';
type PaymentMethodType = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CRYPTO';

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4?: string;
  expiry?: string;
  email?: string;
  walletAddress?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in cents
  projectId?: string;
  projectName?: string;
  date: Date;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  description: string;
  receiptUrl?: string;
  currency?: string;
}

interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  date: Date;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  type: 'PROJECT' | 'MONTHLY_SUMMARY' | 'YEARLY_SUMMARY';
  downloadUrl?: string;
}

interface WalletBalance {
  availableBalance: number; // in cents
  totalBalance: number; // in cents
  lockedBalance: number; // in cents
  currency: string;
  cryptoBalances?: Record<string, number>; // crypto currency balances (e.g., { 'BTC': 0.5, 'ETH': 2.1 })
}

interface PaymentContentProps {
  userType: 'client' | 'freelancer';
}

export function PaymentContent({ userType }: PaymentContentProps) {
  const { user } = useAuthStore(); // Get user from auth store to access preferred currency
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>(user?.preferredCurrency || 'USD');

  // Update user's preferred currency when user object changes
  useEffect(() => {
    setUserCurrency(user?.preferredCurrency || 'USD');
  }, [user?.preferredCurrency]);

  // Determine user's preferred currency (default to USD if not set)
  const userPreferredCurrency = userCurrency;

  // Helper function to convert amount to user's preferred currency
  const convertToUserCurrency = (amount: number, fromCurrency: string = 'USD'): number => {
    if (fromCurrency === userPreferredCurrency) {
      return amount;
    }

    // Convert using the currency service
    return currencyService.convertCurrency({
      fromCurrency,
      toCurrency: userPreferredCurrency,
      amount
    });
  };

  // Helper function to format currency with proper symbol
  const formatCurrency = (amount: number, currency: string = userPreferredCurrency): string => {
    return currencyService.formatCurrency(amount, currency);
  };

  // Load wallet data when component mounts or when user object changes (which includes currency preference)
  useEffect(() => {
    loadWalletData();
  }, [user?.preferredCurrency]);

  // Load wallet data from API with fallback to mock data
  const loadWalletData = async () => {
    try {
      // Load wallet balance
      try {
        const balance = await walletService.getPlatformBalance();
        setWalletBalance(balance);
      } catch (balanceError) {
        console.warn('Failed to load wallet balance:', balanceError);
        // Fallback to mock balance data
        setWalletBalance({
          availableBalance: 50000, // $500.00 in cents
          totalBalance: 75000,     // $750.00 in cents
          lockedBalance: 25000,    // $250.00 in cents
          currency: 'USD',
          cryptoBalances: {
            'BTC': 0.5,
            'ETH': 2.1,
            'USDT': 1500
          }
        });
      }

      // Load wallet transactions
      try {
        const walletTransactions = await walletService.getPlatformTransactions();

        // Convert backend transactions to our frontend format
        const convertedTransactions = walletTransactions.map(tx => ({
          id: tx._id,
          type: tx.type as TransactionType,
          amount: tx.amount / 100, // Convert from cents to dollars
          projectId: tx.relatedEntityId,
          projectName: tx.description.includes('project') ? tx.description : undefined,
          date: new Date(tx.createdAt),
          status: tx.status as 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED',
          description: tx.description,
          receiptUrl: undefined, // Add receipt URL if available
          currency: tx.currency || 'USD'
        }));

        setTransactions(convertedTransactions);
        setFilteredTransactions(convertedTransactions);
      } catch (transactionsError) {
        console.warn('Failed to load wallet transactions:', transactionsError);
        // Fallback to mock transaction data
        const mockTransactions: Transaction[] = [
          {
            id: 't-1',
            type: 'DEPOSIT',
            amount: 500.00,
            projectId: 'p-1',
            projectName: 'E-commerce Website',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            status: 'COMPLETED',
            description: 'Initial wallet deposit',
            currency: 'USD'
          },
          {
            id: 't-2',
            type: 'PROJECT_FUNDS',
            amount: 200.00,
            projectId: 'p-1',
            projectName: 'E-commerce Website',
            date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
            status: 'COMPLETED',
            description: 'Funds for project milestone',
            currency: 'USD'
          },
          {
            id: 't-3',
            type: 'MILESTONE_INCOME',
            amount: 300.00,
            projectId: 'p-2',
            projectName: 'Mobile App Development',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            status: 'COMPLETED',
            description: 'Milestone payment received',
            currency: 'USD'
          },
          {
            id: 't-4',
            type: 'WITHDRAWAL',
            amount: 100.00,
            projectId: undefined,
            projectName: undefined,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            status: 'COMPLETED',
            description: 'Withdrawal to bank account',
            currency: 'USD'
          },
          {
            id: 't-5',
            type: 'FEE',
            amount: 25.00,
            projectId: 'p-3',
            projectName: 'Logo Design',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            status: 'COMPLETED',
            description: 'Platform service fee',
            currency: 'USD'
          },
          {
            id: 't-6',
            type: 'DEPOSIT',
            amount: 1.5,
            projectId: undefined,
            projectName: undefined,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'COMPLETED',
            description: 'Crypto deposit (BTC)',
            currency: 'BTC'
          }
        ];
        setTransactions(mockTransactions);
        setFilteredTransactions(mockTransactions);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Fallback to empty arrays if there's an error
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle funding wallet
  const handleFundWallet = async () => {
    if (depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsDepositLoading(true);
    try {
      // For now, we'll use card as the payment method - in a real app, this would be dynamic
      await walletService.depositToPlatformWallet(depositAmount, 'card', `Wallet deposit via card`);

      // Refresh data after successful deposit
      await loadWalletData();
      setDepositAmount(0); // Reset the deposit amount
      alert('Deposit successful!');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed: ' + (error as Error).message);
    } finally {
      setIsDepositLoading(false);
    }
  };

  // Apply filters to transactions
  useEffect(() => {
    let result = transactions;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      result = result.filter(transaction => transaction.date >= dateRange.start!);
    }
    if (dateRange.end) {
      result = result.filter(transaction => transaction.date <= dateRange.end!);
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      result = result.filter(transaction => transaction.projectId === projectFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(transaction => transaction.type === typeFilter);
    }

    setFilteredTransactions(result);
  }, [searchTerm, dateRange, projectFilter, typeFilter, transactions]);

  // Handle adding payment method
  const handleAddPaymentMethod = () => {
    setShowPaymentMethodsModal(true);
  };

  // Handle downloading receipt
  const handleDownloadReceipt = (receiptUrl?: string) => {
    if (receiptUrl) {
      // In a real app, this would download the receipt
      alert(`Receipt would download from: ${receiptUrl}`);
    } else {
      alert('Receipt not available');
    }
  };

  // Handle downloading invoice
  const handleDownloadInvoice = (invoiceId: string) => {
    // In a real app, this would download the specific invoice
    alert(`Invoice ${invoiceId} would download in a real application`);
  };

  // Handle downloading summary
  const handleDownloadSummary = (type: 'MONTHLY' | 'YEARLY') => {
    // In a real app, this would generate and download the summary
    alert(`${type} summary would download in a real application`);
  };

  // Calculate project-specific funding summary
  const projectFundingSummary = transactions.reduce((acc, transaction) => {
    if (transaction.projectId) {
      if (!acc[transaction.projectId]) {
        acc[transaction.projectId] = {
          projectId: transaction.projectId,
          projectName: transaction.projectName || 'Unknown Project',
          totalDeposited: 0,
          totalReleased: 0,
          totalFees: 0,
          currentBalance: 0,
        };
      }

      const project = acc[transaction.projectId];

      if (transaction.type === 'ESCROW_DEPOSIT' || transaction.type === 'DEPOSIT' || transaction.type === 'PROJECT_FUNDS') {
        project.totalDeposited += transaction.amount;
        project.currentBalance += transaction.amount;
      } else if (transaction.type === 'PAYOUT' || transaction.type === 'MILESTONE_PAYMENT') {
        project.totalReleased += transaction.amount;
        project.currentBalance -= transaction.amount;
      } else if (transaction.type === 'FEE' || transaction.type === 'DISPUTE_FEE') {
        project.totalFees += transaction.amount;
        project.currentBalance -= transaction.amount;
      } else if (transaction.type === 'REFUND' || transaction.type === 'PROJECT_REFUND') {
        // For refunds, we reduce the balance
        project.currentBalance -= transaction.amount;
      }
    }
    return acc;
  }, {} as Record<string, {
    projectId: string;
    projectName: string;
    totalDeposited: number;
    totalReleased: number;
    totalFees: number;
    currentBalance: number;
  }>);

  const projectFundingList = Object.values(projectFundingSummary);

  // Get unique projects for filter
  const uniqueProjects = Array.from(new Set(transactions.map(t => t.projectId).filter(id => id !== undefined) as string[]));

  // Calculate summary stats
  const totalDeposits = transactions
    .filter(t => t.type === 'ESCROW_DEPOSIT' || t.type === 'DEPOSIT' || t.type === 'PROJECT_FUNDS')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFees = transactions
    .filter(t => t.type === 'FEE' || t.type === 'DISPUTE_FEE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter(t => t.type === 'REFUND' || t.type === 'PROJECT_REFUND')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = transactions
    .filter(t => t.type === 'PAYOUT' || t.type === 'MILESTONE_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get transaction type icon and color
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'ESCROW_DEPOSIT':
      case 'DEPOSIT':
      case 'PROJECT_FUNDS':
        return { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-100' };
      case 'PAYOUT':
      case 'MILESTONE_PAYMENT':
      case 'MILESTONE_INCOME':
        return { icon: ArrowUpRight, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'FEE':
        return { icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-100' };
      case 'REFUND':
      case 'PROJECT_REFUND':
        return { icon: TrendingDown, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'DISPUTE_FEE':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' };
      case 'WITHDRAWAL':
        return { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-100' };
      case 'TRANSFER':
        return { icon: ArrowUpRight, color: 'text-indigo-500', bg: 'bg-indigo-100' };
      default:
        return { icon: DollarSign, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  // Handle withdrawal request
  const handleWithdrawalRequest = () => {
    if (!walletBalance) {
      alert('Wallet balance not loaded yet');
      return;
    }

    // Only show withdrawal modal if there's an available balance
    if (walletBalance.availableBalance <= 0) {
      alert('No available balance to withdraw');
      return;
    }

    setShowWithdrawalModal(true);
  };

  // Handle adding payment method
  const handleAddPaymentMethodClick = () => {
    setShowPaymentMethodsModal(true);
  };

  // Handle withdrawal request completion
  const handleWithdrawalCompleted = () => {
    // Refresh wallet data after withdrawal
    loadWalletData();
  };

  // Handle payment method addition
  const handlePaymentMethodAdded = () => {
    // Refresh payment methods after addition
    // In the mock implementation, we'll just reload wallet data which includes payment methods
    loadWalletData();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: userType === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${userType}` },
          { name: 'Payments', current: true }
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet & Payments</h1>
          <p className="text-muted-foreground mt-1">
            {userType === 'client'
              ? 'Manage your wallet and project payments'
              : 'View your wallet and earnings'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleWithdrawalRequest} disabled={isBalanceLoading || !walletBalance || walletBalance.availableBalance <= 0}>
            <DollarSign className="h-4 w-4 mr-2" />
            Request Withdrawal
          </Button>
          <Button onClick={handleAddPaymentMethodClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isBalanceLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {walletBalance ?
                  formatCurrency(convertToUserCurrency(walletBalance.availableBalance / 100, walletBalance.currency || 'USD'), userPreferredCurrency)
                : '0.00'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Funds available for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isBalanceLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {walletBalance ?
                  formatCurrency(convertToUserCurrency(walletBalance.totalBalance / 100, walletBalance.currency || 'USD'), userPreferredCurrency)
                : '0.00'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total in your wallet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <Lock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isBalanceLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {walletBalance ?
                  formatCurrency(convertToUserCurrency(walletBalance.lockedBalance / 100, walletBalance.currency || 'USD'), userPreferredCurrency)
                : '0.00'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Funds in pending transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Activity</CardTitle>
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalDeposits - totalFees - totalPayouts, userPreferredCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Net movement in wallet</p>
          </CardContent>
        </Card>
      </div>

      {/* Funding Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Billing History Section */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Wallet Transactions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Your wallet activity history</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Button variant="outline" className="flex items-center gap-2" onClick={() => alert('Advanced filtering options would appear in a real application')}>
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="PROJECT_FUNDS">Project Funds</SelectItem>
                    <SelectItem value="MILESTONE_INCOME">Milestone Income</SelectItem>
                    <SelectItem value="ESCROW_DEPOSIT">Escrow Deposit</SelectItem>
                    <SelectItem value="FEE">Fee</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                    <SelectItem value="PAYOUT">Payout</SelectItem>
                    <SelectItem value="DISPUTE_FEE">Dispute Fee</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjects.map(projectId => (
                      <SelectItem key={projectId} value={projectId}>
                        {transactions.find(t => t.projectId === projectId)?.projectName || projectId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Project</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map(transaction => {
                        const { icon: Icon, color, bg } = getTransactionIcon(transaction.type);
                        return (
                          <tr key={transaction.id} className="border-t hover:bg-muted/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${bg} ${color}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">
                                  {transaction.type.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">{transaction.projectName || 'N/A'}</td>
                            <td className="p-3 font-medium">
                              {formatCurrency(convertToUserCurrency(transaction.amount, transaction.currency || 'USD'), userPreferredCurrency)}
                            </td>
                            <td className="p-3">{transaction.date.toLocaleDateString()}</td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  transaction.status === 'COMPLETED' ? 'default' :
                                  transaction.status === 'PENDING' ? 'secondary' :
                                  transaction.status === 'FAILED' ? 'destructive' :
                                  'outline'
                                }
                              >
                                {transaction.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReceipt(transaction.receiptUrl)}
                                disabled={!transaction.receiptUrl}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Section */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5" />
                  Invoices
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Billing documents and receipts</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => handleDownloadSummary('MONTHLY')}>
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Summary
                </Button>
                <Button variant="outline" onClick={() => handleDownloadSummary('YEARLY')}>
                  <Download className="h-4 w-4 mr-2" />
                  Yearly Summary
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Invoice ID</th>
                      <th className="text-left p-3">Project</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length > 0 ? (
                      invoices.map(invoice => (
                        <tr key={invoice.id} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="p-3">#{invoice.id}</td>
                          <td className="p-3">{invoice.projectName}</td>
                          <td className="p-3 font-medium">${invoice.amount.toLocaleString()}</td>
                          <td className="p-3">{invoice.date.toLocaleDateString()}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                invoice.status === 'PAID' ? 'default' :
                                invoice.status === 'PENDING' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {invoice.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Fund Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount to deposit</label>
                  <div className="relative">
                    <Input
                      placeholder={`Enter amount in ${userPreferredCurrency}`}
                      type="number"
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-3 text-sm text-muted-foreground">
                      {userPreferredCurrency}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Payment method</label>
                  <Select value="card" onValueChange={() => {}}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">💳 Credit Card</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="paypal">🅿️ PayPal</SelectItem>
                      <SelectItem value="crypto">🔗 Crypto Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleFundWallet}
                  className="w-full"
                  disabled={isDepositLoading || depositAmount <= 0}
                >
                  {isDepositLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Deposit to Wallet
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Payment Methods</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {method.type === 'CREDIT_CARD' && <CreditCard className="h-5 w-5" />}
                        {method.type === 'BANK_TRANSFER' && <Wallet className="h-5 w-5" />}
                        {method.type === 'PAYPAL' && <span className="font-bold">P</span>}
                        {method.type === 'CRYPTO' && <DollarSign className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">
                          {method.type === 'CREDIT_CARD' && `Card ending in ${method.last4}`}
                          {method.type === 'BANK_TRANSFER' && 'Bank Transfer'}
                          {method.type === 'PAYPAL' && `PayPal: ${method.email}`}
                          {method.type === 'CRYPTO' && `Crypto: ${method.walletAddress?.substring(0, 6)}...${method.walletAddress?.substring(method.walletAddress?.length - 4) || 'Wallet'}`}
                        </p>
                        {method.isDefault && (
                          <Badge variant="secondary" className="mt-1">Default</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button size="sm" variant="outline" onClick={() => alert(`Setting payment method ${method.id} as default in a real application`)}>
                          Set Default
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => alert(`Editing payment method ${method.id} in a real application`)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Crypto Balances - Only show if crypto balances exist */}
          {walletBalance?.cryptoBalances && Object.keys(walletBalance.cryptoBalances).length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Crypto Balances</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(walletBalance.cryptoBalances).map(([currency, balance]) => {
                    // Convert crypto balance to user's preferred currency
                    const convertedValue = convertToUserCurrency(balance, currency);
                    return (
                      <div key={currency} className="flex justify-between">
                        <div>
                          <span className="font-medium">{currency}</span>
                          <div className="text-xs text-muted-foreground">{balance} {currency}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(convertedValue, userPreferredCurrency)}</span>
                          <div className="text-xs text-muted-foreground">converted</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Funding Overview - Only for clients */}
          {userType === 'client' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Project Funding</CardTitle>
                <Button variant="outline" size="sm">
                  <PieChart className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {projectFundingList.length > 0 ? (
                  <div className="space-y-3">
                    {projectFundingList.map((project) => (
                      <div key={project.projectId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{project.projectName}</span>
                          <span className={`font-medium ${project.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${project.currentBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              project.currentBalance >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.abs(project.currentBalance) / (project.totalDeposited || 1) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No project funding data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onWithdrawalRequested={handleWithdrawalCompleted}
        availableBalance={walletBalance ? walletBalance.availableBalance / 100 : 0}
      />

      {/* Payment Methods Manager Modal */}
      <PaymentMethodsManager
        isOpen={showPaymentMethodsModal}
        onClose={() => setShowPaymentMethodsModal(false)}
        onPaymentMethodAdded={handlePaymentMethodAdded}
      />
    </div>
  );
}

export default PaymentContent;