'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CreditCard, 
  Wallet, 
  FileText, 
  PiggyBank,
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import EnhancedModal from '@/components/common/EnhancedModal';
import { currencyService } from '@/lib/services/currencyService';

import { useUserBalance, useTransactions, useProjects } from '@/lib/api';

export default function FreelancerPaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { data: userBalance, isLoading: balanceLoading } = useUserBalance(user?._id || '');
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(user?._id || '');
  const { data: projectsResponse, isLoading: projectsLoading } = useProjects(user?._id || '', { role: 'freelancer' }, { page: 1, limit: 10 });

  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  // Get user's preferred currency
  const userPreferredCurrency = user?.preferredCurrency || 'USD';

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'freelancer')) {
      router.push('/auth/login');
      return;
    }

    if (userBalance) {
      setWithdrawalAmount(userBalance.availableBalance / 100); // Convert from cents to dollars
    }
  }, [loading, isAuthenticated, user, router, userBalance]);

  if (loading || balanceLoading || transactionsLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    // Redirect to login if not authenticated or not a freelancer
    router.push('/auth/login');
    return null;
  }

  // Calculate earnings from API data
  const totalEarnings = userBalance?.availableBalance + userBalance?.pendingBalance || 0; // In cents
  const availableForWithdrawal = userBalance?.availableBalance || 0; // In cents
  const upcomingPayments = userBalance?.pendingBalance || 0; // In cents

  // Process projects data
  const projects = projectsResponse?.items || [];

  // Process transactions data
  const processedTransactions = Array.isArray(transactions) ? transactions : [];

  const handleWithdrawal = () => {
    setShowWithdrawalModal(true);
  };

  const confirmWithdrawal = () => {
    // In a real app, this would call an API to process the withdrawal
    console.log('Processing withdrawal:', { withdrawalAmount, withdrawalMethod });
    setShowWithdrawalModal(false);
    setWithdrawalSuccess(true);
    
    // Reset success after 3 seconds
    setTimeout(() => {
      setWithdrawalSuccess(false);
    }, 3000);
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate withdrawal fee (2.5% in this example)
  const withdrawalFee = withdrawalAmount * 0.025;
  const netAmount = withdrawalAmount - withdrawalFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Center</h1>
        <p className="text-muted-foreground">
          Manage your earnings, payments, and withdrawals
        </p>
      </div>

      {/* Earnings Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(convertToUserCurrency(totalEarnings / 100), userPreferredCurrency)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available to Withdraw</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(convertToUserCurrency(availableForWithdrawal / 100), userPreferredCurrency)}</div>
            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(convertToUserCurrency(upcomingPayments / 100), userPreferredCurrency)}</div>
            <p className="text-xs text-muted-foreground">Expected in next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedTransactions.filter(t => t.status === 'PENDING').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting client approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Payment Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status by Project */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status by Project</CardTitle>
              <CardDescription>
                Overview of earnings and pending payments for each project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  // Calculate project payment metrics from transactions
                  const projectTransactions = processedTransactions.filter(
                    t => t.projectId === project.id
                  );

                  const totalPaid = projectTransactions
                    .filter(t => t.status === 'COMPLETED')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const pendingAmount = projectTransactions
                    .filter(t => t.status === 'PENDING')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const progress = project.budget > 0
                    ? Math.round((totalPaid / project.budget) * 100)
                    : 0;

                  return (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">Total: {formatCurrency(convertToUserCurrency(project.budget / 100), userPreferredCurrency)}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/freelancer/projects/${project.id}`)}>
                          View Details
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Earned So Far</p>
                          <p className="font-medium">{formatCurrency(convertToUserCurrency(totalPaid / 100), userPreferredCurrency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid Milestones</p>
                          <p className="font-medium">{projectTransactions.filter(t => t.status === 'COMPLETED').length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Milestones</p>
                          <p className="font-medium">{projectTransactions.filter(t => t.status === 'PENDING').length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Next Invoice</p>
                          <p className="font-medium">
                            {project.nextInvoiceDate || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar for earnings */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Earnings Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent payments and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        transaction.status === 'COMPLETED' ? 'bg-green-100' :
                        transaction.status === 'PENDING' ? 'bg-yellow-100' :
                        'bg-destructive/20'
                      }`}>
                        {transaction.status === 'COMPLETED' ?
                          <CheckCircle className="h-4 w-4 text-green-600" /> :
                          transaction.status === 'PENDING' ?
                          <Clock className="h-4 w-4 text-yellow-600" /> :
                          <XCircle className="h-4 w-4 text-destructive" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()} •
                          {projects.find(p => p.id === transaction.projectId)?.title || 'Project'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">+{formatCurrency(convertToUserCurrency(transaction.amount / 100), userPreferredCurrency)}</p>
                      <Badge
                        className={`text-xs mt-1 ${getStatusColor(transaction.status.toLowerCase())}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Withdraw Funds */}
        <div className="space-y-6">
          {/* Withdraw Funds Card */}
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>
                Transfer your earnings to your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Withdrawal Amount</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                      className="pl-10 block w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      min="1"
                      max={availableForWithdrawal / 100}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {formatCurrency(convertToUserCurrency(availableForWithdrawal / 100), userPreferredCurrency)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                        withdrawalMethod === 'bank'
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-accent'
                      }`}
                      onClick={() => setWithdrawalMethod('bank')}
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Bank</span>
                    </button>
                    <button
                      type="button"
                      className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                        withdrawalMethod === 'mobile'
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-accent'
                      }`}
                      onClick={() => setWithdrawalMethod('mobile')}
                    >
                      <PiggyBank className="h-5 w-5 mb-1" />
                      <span className="text-xs">Mobile Money</span>
                    </button>
                    <button
                      type="button"
                      className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                        withdrawalMethod === 'crypto'
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-accent'
                      }`}
                      onClick={() => setWithdrawalMethod('crypto')}
                    >
                      <DollarSign className="h-5 w-5 mb-1" />
                      <span className="text-xs">Crypto</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount to withdraw:</span>
                    <span>{formatCurrency(withdrawalAmount, userPreferredCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing fee:</span>
                    <span>{formatCurrency(withdrawalFee, userPreferredCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>You will receive:</span>
                    <span>{formatCurrency(netAmount, userPreferredCurrency)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Estimated processing time: 1-3 business days
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleWithdrawal}
                    disabled={withdrawalAmount <= 0 || withdrawalAmount > (availableForWithdrawal / 100)}
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Withdrawal Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Last Withdrawal</CardTitle>
              <CardDescription>
                Summary of your most recent withdrawal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No withdrawals yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your withdrawal history will appear here after your first withdrawal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal Confirmation Modal */}
      <EnhancedModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        title="Confirm Withdrawal"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawalModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmWithdrawal}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Please review your withdrawal details before proceeding
          </p>
          <div className="space-y-4">
            <div className="flex justify-between text-lg font-medium">
              <span>Amount:</span>
              <span>{formatCurrency(withdrawalAmount, userPreferredCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="capitalize">{withdrawalMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee:</span>
              <span>{formatCurrency(withdrawalFee, userPreferredCurrency)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Net Amount:</span>
              <span>{formatCurrency(netAmount, userPreferredCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Est. Processing:</span>
              <span>1-3 business days</span>
            </div>
          </div>
        </div>
      </EnhancedModal>

      {/* Withdrawal Success Message */}
      {withdrawalSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg z-50 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Withdrawal Requested!</p>
            <p className="text-sm">Your withdrawal of {formatCurrency(netAmount, userPreferredCurrency)} is being processed.</p>
          </div>
        </div>
      )}
    </div>
  );
}