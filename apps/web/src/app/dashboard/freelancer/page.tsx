'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FolderOpen, Clock, MessageCircle, Calendar, TrendingUp, CheckCircle, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useProjects } from '@/hooks/api/useProjects';
import { useUserBalance } from '@/hooks/api/useUserBalance';
import { useTransactions } from '@/hooks/api/useTransactions';
import { useNotifications } from '@/hooks/api/useNotifications';

export default function FreelancerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  // Load dashboard data using API hooks
  const { data: userProjects, isLoading: projectsLoading } = useProjects(user?._id || '', {}, { page: 1, limit: 10 });
  const { data: userBalance, isLoading: balanceLoading } = useUserBalance(user?._id || '');
  const { data: userTransactions, isLoading: transactionsLoading } = useTransactions(user?._id || '');
  const { data: userNotifications, isLoading: notificationsLoading } = useNotifications(user?._id || '');

  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'freelancer') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'client') {
        router.replace('/dashboard/client');
      } else if (user.role === 'admin' || user.role === 'arbitrator') {
        router.replace('/dashboard/admin');
      }
    }
  }, [isAuthenticated, user?.role, router]);

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading || projectsLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access the dashboard</p>
      </div>
    );
  }

  // Wait for role to be confirmed as 'freelancer'
  if (user?.role !== 'freelancer') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Calculate freelancer stats from API data
  const freelancerStats = {
    totalEarnedThisMonth: userBalance?.availableBalanceInUsd || userBalance?.availableBalance || 0,
    pendingInvoices: userTransactions?.filter?.(t => t.status === 'PENDING').length || 0,
    completedMilestones: userTransactions?.filter?.(t => t.type === 'MILESTONE_RELEASE' && t.status === 'COMPLETED').length || 0,
    unreadClientMessages: userNotifications?.filter(n => !n.read).length || 5
  };

  // Get active projects (those that are not completed or cancelled)
  const activeProjects = userProjects?.items?.filter(project =>
    project.status === 'ACTIVE' ||
    project.status === 'PENDING_ACCEPTANCE' ||
    project.status === 'AWAITING_DEPOSIT'
  ) || [];

  // Get pending payments (from transactions)
  const pendingPayments = userTransactions?.filter?.(transaction =>
    transaction.status === 'PENDING' && transaction.type === 'MILESTONE_RELEASE'
  ) || [];

  // Calculate withdrawable balance
  const withdrawableBalance = userBalance?.availableBalanceInUsd || userBalance?.availableBalance || 0;
  const withdrawableCurrency = userBalance?.currency || 'USD';

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Freelancer', current: true }
        ]}
      />
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.firstName}! Here's an overview of your projects and earnings.
          </p>
        </div>

        <Button size="sm" onClick={() => router.push('/dashboard/freelancer/projects')}>
          <FolderOpen className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Quick Stats - Organized by importance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Available Balance</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{withdrawableBalance.toLocaleString()} {withdrawableCurrency}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Projects</span>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Pending Payments</span>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Unread Messages</span>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{freelancerStats.unreadClientMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Project and Payment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Current projects and milestones</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/freelancer/projects')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="p-3 border rounded-md hover:bg-accent/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{project.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            project.status === 'In Progress' ? 'default' :
                            project.status === 'Client reviewing' ? 'secondary' :
                            project.status === 'Waiting for payment' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Client: {project.client}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">Milestone: {project.currentMilestone}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{project.daysRemaining} days left</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 ml-2"
                      onClick={() => router.push(`/dashboard/freelancer/projects/${project.id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active projects</p>
                  <p className="text-xs">Start working on new projects to see them here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions and Pending Payments */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2"
                  onClick={() => router.push('/dashboard/freelancer/projects')}>
                  <FolderOpen className="h-4 w-4 mb-1" />
                  <span className="text-xs">Projects</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2"
                  onClick={() => router.push('/dashboard/freelancer/milestones')}>
                  <CheckCircle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Milestones</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2"
                  onClick={() => router.push('/dashboard/freelancer/payments')}>
                  <DollarSign className="h-4 w-4 mb-1" />
                  <span className="text-xs">Payments</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2"
                  onClick={() => router.push('/dashboard/freelancer/messages')}>
                  <MessageCircle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Messages</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          {pendingPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPayments.slice(0, 3).map((payment) => (
                    <div key={(payment as any)._id || (payment as any).id || Math.random().toString(36).substr(2, 9)} className="p-3 border rounded-sm hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{(payment as any).projectName || (payment as any).projectTitle || 'Unknown Project'}</h3>
                          <p className="text-xs text-muted-foreground truncate">Client: {(payment as any).client || (payment as any).clientId || 'Unknown Client'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{(payment as any).amount || (payment as any).amountInCents || 0} {(payment as any).currency || withdrawableCurrency}</p>
                          <span className="text-xs text-muted-foreground">{(payment as any).status || payment.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Milestones and Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Milestones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Milestones</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/freelancer/milestones')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.slice(0, 4).map((project) => (
                <div key={project.id} className="p-3 border rounded-sm hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{project.currentMilestone}</h3>
                      <p className="text-xs text-muted-foreground truncate">{project.title}</p>
                    </div>
                    <Badge
                      variant={
                        project.status === 'In Progress' ? 'default' :
                        project.status === 'Client reviewing' ? 'secondary' :
                        project.status === 'Waiting for payment' ? 'destructive' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No recent milestones</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Earnings Overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/freelancer/payments')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{withdrawableBalance.toLocaleString()} {withdrawableCurrency}</div>
                <p className="text-sm text-muted-foreground">Available to withdraw</p>
                <Button size="sm" className="mt-3 w-full sm:w-auto" onClick={() => router.push('/dashboard/freelancer/payments')}>
                  Request Withdrawal
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-medium">{freelancerStats.totalEarnedThisMonth.toLocaleString()} {withdrawableCurrency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{freelancerStats.completedMilestones}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Invoices</span>
                  <span className="font-medium">{freelancerStats.pendingInvoices}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}