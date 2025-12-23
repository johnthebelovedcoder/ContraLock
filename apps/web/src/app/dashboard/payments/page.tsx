'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethodForm } from './PaymentMethodForm';
import { TransactionList } from './TransactionList';
import { DepositForm } from './DepositForm';
import { usePaymentStore, useAuthStore } from '@/lib/store';
import { Wallet, CreditCard, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { balance, getBalance, transactions, getTransactions } = usePaymentStore();
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          await getBalance(user._id);
          await getTransactions();
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getBalance, getTransactions]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payments & Escrow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your payment methods, escrow funds, and transaction history
          </p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Available Balance</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${balance.availableBalance ? (balance.availableBalance / 100).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Pending Balance</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${balance.pendingBalance ? (balance.pendingBalance / 100).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In pending transactions
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>All-Time Earnings</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${user?.statistics?.totalEarned ? (user.statistics.totalEarned / 100).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {user?.role === 'freelancer' && (
          <Button size="sm">
            <Wallet className="h-4 w-4 mr-2" />
            Request Withdrawal
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowAddMethod(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="transactions" className="text-sm">
            <TrendingDown className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="methods" className="text-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="escrow" className="text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Escrow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
                <CardDescription className="text-sm">
                  Complete payment and escrow transaction history
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
                <CardDescription className="text-sm">
                  Saved payment methods for deposits and withdrawals
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user?.paymentMethods && user.paymentMethods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {user.paymentMethods.map((method, index) => (
                      <Card key={index} className="p-3 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-6 w-6" />
                            <div>
                              <div className="font-medium text-sm">
                                {method.type === 'card' ? 'Credit/Debit Card' : 'Bank Account'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {method.type === 'card' ? `**** ${method.last4}` : 'Bank Account'}
                              </div>
                            </div>
                          </div>
                          <Badge variant={method.default ? "default" : "secondary"} className="text-xs">
                            {method.default ? "Primary" : "Set as Primary"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No payment methods added</p>
                    <p className="text-xs mt-1">Add a payment method to deposit funds or request withdrawals</p>
                    <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowAddMethod(true)}>
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Escrow Management</CardTitle>
                <CardDescription className="text-sm">
                  View and manage funds held in escrow for your projects
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Escrow Explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How Escrow Works
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === 'client'
                      ? "Deposit funds to escrow before starting a project. Funds are released to freelancers as milestones are completed and approved."
                      : "Your earnings are held securely in escrow until project milestones are completed and approved by clients."}
                  </p>
                </div>

                {/* Deposit Section */}
                <div>
                  <h3 className="text-base font-semibold mb-3">Deposit Funds</h3>
                  {!showDepositForm ? (
                    <Card className="p-4 border-dashed hover:border-accent transition-colors">
                      <p className="text-sm text-muted-foreground mb-4">
                        Deposit funds to escrow for a new project
                      </p>
                      <Button size="sm" onClick={() => setShowDepositForm(true)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Deposit to Escrow
                      </Button>
                    </Card>
                  ) : (
                    <DepositForm
                      projectId="temp-project" // This would be replaced with actual project selection
                      projectTitle="Sample Project"
                      projectBudget={50000} // Example: $500.00 in cents
                      currency="USD"
                      onDepositComplete={() => setShowDepositForm(false)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentMethodForm
        open={showAddMethod}
        onOpenChange={setShowAddMethod}
      />
    </div>
  );
}