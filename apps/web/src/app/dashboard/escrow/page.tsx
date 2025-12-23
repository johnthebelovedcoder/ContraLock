'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/authStore';
import { usePaymentStore } from '@/lib/store/paymentStore';
import { Transaction } from '@/types';

// Define types for project funding summary
interface ProjectFundingSummary {
  projectId: string;
  projectName: string;
  totalDeposited: number;
  totalDepositedInUsd?: number; // Amount converted to USD for standardization
  totalReleased: number;
  totalReleasedInUsd?: number; // Amount converted to USD for standardization
  totalFees: number;
  totalFeesInUsd?: number; // Amount converted to USD for standardization
  currentBalance: number;
  currentBalanceInUsd?: number; // Amount converted to USD for standardization
  currency: string; // Currency of the project
  exchangeRate?: number; // Exchange rate used for conversion
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
}

export default function EscrowPage() {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions } = usePaymentStore();
  const [projectFundingList, setProjectFundingList] = useState<ProjectFundingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      // Fetch transactions for the user
      fetchTransactions(user._id, user.role)
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [user?._id, user?.role, fetchTransactions]);

  // Calculate project-specific funding summary when transactions update
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const projectFundingSummary = transactions.reduce((acc, transaction) => {
        if (transaction.projectId) {
          if (!acc[transaction.projectId]) {
            acc[transaction.projectId] = {
              projectId: transaction.projectId,
              projectName: transaction.description || 'Unknown Project',
              totalDeposited: 0,
              totalDepositedInUsd: 0,
              totalReleased: 0,
              totalReleasedInUsd: 0,
              totalFees: 0,
              totalFeesInUsd: 0,
              currentBalance: 0,
              currentBalanceInUsd: 0,
              currency: transaction.currency || 'USD',
              exchangeRate: transaction.exchangeRate,
              exchangeRateTimestamp: transaction.exchangeRateTimestamp ? new Date(transaction.exchangeRateTimestamp) : undefined
            };
          }

          const project = acc[transaction.projectId];

          if (transaction.type === 'DEPOSIT') {
            project.totalDeposited += transaction.amount;
            project.currentBalance += transaction.amount;
            if (transaction.amountInUsd) {
              project.totalDepositedInUsd = (project.totalDepositedInUsd || 0) + transaction.amountInUsd;
              project.currentBalanceInUsd = (project.currentBalanceInUsd || 0) + transaction.amountInUsd;
            }
          } else if (transaction.type === 'MILESTONE_RELEASE') {
            project.totalReleased += transaction.amount;
            project.currentBalance -= transaction.amount;
            if (transaction.amountInUsd) {
              project.totalReleasedInUsd = (project.totalReleasedInUsd || 0) + transaction.amountInUsd;
              project.currentBalanceInUsd = (project.currentBalanceInUsd || 0) - transaction.amountInUsd;
            }
          } else if (transaction.type === 'FEE' || transaction.type === 'DISPUTE_PAYMENT' || transaction.type === 'DISPUTE_REFUND') {
            project.totalFees += transaction.amount;
            project.currentBalance -= transaction.amount;
            if (transaction.amountInUsd) {
              project.totalFeesInUsd = (project.totalFeesInUsd || 0) + transaction.amountInUsd;
              project.currentBalanceInUsd = (project.currentBalanceInUsd || 0) - transaction.amountInUsd;
            }
          } else if (transaction.type === 'REFUND' || transaction.type === 'WITHDRAWAL') {
            project.currentBalance -= transaction.amount;
            if (transaction.amountInUsd) {
              project.currentBalanceInUsd = (project.currentBalanceInUsd || 0) - transaction.amountInUsd;
            }
          }
        }
        return acc;
      }, {} as Record<string, ProjectFundingSummary>);

      setProjectFundingList(Object.values(projectFundingSummary));
    }
  }, [transactions]);

  // Calculate totals using USD equivalent when available
  const totalHeld = projectFundingList.reduce((sum, project) => sum + (project.currentBalanceInUsd || project.currentBalance), 0);
  const totalDeposited = projectFundingList.reduce((sum, project) => sum + (project.totalDepositedInUsd || project.totalDeposited), 0);
  const totalReleased = projectFundingList.reduce((sum, project) => sum + (project.totalReleasedInUsd || project.totalReleased), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Escrow Overview</h1>
          <p className="text-muted-foreground">
            Manage your escrow accounts and funds
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading escrow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Escrow Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your secure escrow accounts
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Current Balance</span>
              <span className="text-green-600 font-bold text-lg">{totalHeld.toLocaleString()} USD</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground">Securely held in escrow</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projectFundingList.length} project{projectFundingList.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Deposited</span>
              <span className="text-foreground font-bold text-lg">{totalDeposited.toLocaleString()} USD</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground">Total funds added</div>
            <p className="text-xs text-muted-foreground mt-1">To projects</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Released</span>
              <span className="text-foreground font-bold text-lg">{totalReleased.toLocaleString()} USD</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground">To freelancers</div>
            <p className="text-xs text-muted-foreground mt-1">Milestone payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Funding Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Project Funding Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">View funds allocated to each project</p>
          </div>
        </CardHeader>
        <CardContent>
          {projectFundingList.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="hidden md:table w-full">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left text-sm font-medium p-3">Project</th>
                      <th className="text-right text-sm font-medium p-3">Deposited (USD)</th>
                      <th className="text-right text-sm font-medium p-3">Released (USD)</th>
                      <th className="text-right text-sm font-medium p-3">Fees (USD)</th>
                      <th className="text-right text-sm font-medium p-3">Balance (USD)</th>
                      <th className="text-right text-sm font-medium p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectFundingList.map((project) => (
                      <tr key={project.projectId} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-medium truncate max-w-[150px]">{project.projectName}</div>
                        </td>
                        <td className="p-3 text-right">{(project.totalDepositedInUsd || project.totalDeposited).toLocaleString()} USD</td>
                        <td className="p-3 text-right">{(project.totalReleasedInUsd || project.totalReleased).toLocaleString()} USD</td>
                        <td className="p-3 text-right">{(project.totalFeesInUsd || project.totalFees).toLocaleString()} USD</td>
                        <td className={`p-3 text-right font-medium ${project.currentBalance > 0 ? 'text-green-600' : project.currentBalance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                          {(project.currentBalanceInUsd || project.currentBalance).toLocaleString()} USD
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.currentBalance > 0 ? 'bg-green-100 text-green-800' :
                            project.currentBalance < 0 ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.currentBalance > 0 ? 'Active' : project.currentBalance < 0 ? 'Overdrawn' : 'Settled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-medium bg-muted/30">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">
                        {projectFundingList.reduce((sum, p) => sum + (p.totalDepositedInUsd || p.totalDeposited), 0).toLocaleString()} USD
                      </td>
                      <td className="p-3 text-right">
                        {projectFundingList.reduce((sum, p) => sum + (p.totalReleasedInUsd || p.totalReleased), 0).toLocaleString()} USD
                      </td>
                      <td className="p-3 text-right">
                        {projectFundingList.reduce((sum, p) => sum + (p.totalFeesInUsd || p.totalFees), 0).toLocaleString()} USD
                      </td>
                      <td className="p-3 text-right">
                        {projectFundingList.reduce((sum, p) => sum + (p.currentBalanceInUsd || p.currentBalance), 0).toLocaleString()} USD
                      </td>
                      <td className="p-3 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile-friendly card view */}
              <div className="md:hidden space-y-3">
                {projectFundingList.map((project) => (
                  <div key={project.projectId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.projectName}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.currentBalance > 0 ? 'bg-green-100 text-green-800' :
                        project.currentBalance < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.currentBalance > 0 ? 'Active' : project.currentBalance < 0 ? 'Overdrawn' : 'Settled'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div className="text-muted-foreground">Deposited (USD)</div>
                      <div className="text-right">{(project.totalDepositedInUsd || project.totalDeposited).toLocaleString()} USD</div>
                      <div className="text-muted-foreground">Released (USD)</div>
                      <div className="text-right">{(project.totalReleasedInUsd || project.totalReleased).toLocaleString()} USD</div>
                      <div className="text-muted-foreground">Fees (USD)</div>
                      <div className="text-right">{(project.totalFeesInUsd || project.totalFees).toLocaleString()} USD</div>
                      <div className="text-muted-foreground font-medium">Balance (USD)</div>
                      <div className={`text-right font-medium ${project.currentBalance > 0 ? 'text-green-600' : project.currentBalance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                        {(project.currentBalanceInUsd || project.currentBalance).toLocaleString()} USD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>No escrow funds currently held</p>
              <p className="text-sm mt-1">Deposit funds to a project to see it here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escrow Security Notice */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure Escrow Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All funds held in escrow are securely protected and released only upon milestone completion or as per dispute resolution.
            Our system supports multiple currencies including traditional (USD, EUR, etc.) and cryptocurrencies (BTC, ETH, etc.).
            Your payments are safeguarded by our secure escrow system throughout the project lifecycle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}