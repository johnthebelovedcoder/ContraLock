'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Wallet, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuthStore, useAnalyticsStore } from '@/lib/store';
import { UserList } from './UserList';
import { TransactionList } from './TransactionList';
import { DisputeManagement } from './DisputeManagement';
import { PlatformStats } from './PlatformStats';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { getPlatformOverview, platformOverview } = useAnalyticsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (user?.role === 'admin') {
        try {
          await getPlatformOverview();
        } catch (error) {
          console.error('Error fetching analytics:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    initialize();
  }, [user, getPlatformOverview]);

  if (user?.role !== 'admin') {
    return (
      <div className="w-full p-2 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Admin access required to view this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full p-2">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Admin', current: true }
        ]}
      />
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and manage platform operations</p>
          </div>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Platform Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Users</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{platformOverview?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Projects</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{platformOverview?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Transaction Volume</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {platformOverview?.totalVolume ? `$${(platformOverview.totalVolume / 100).toFixed(2)}` : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total processed</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Dispute Rate</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {platformOverview?.disputeRate ? `${platformOverview.disputeRate.toFixed(2)}%` : '0.00%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active disputes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* User Growth Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">User Growth</CardTitle>
            <CardDescription className="text-xs">New registrations this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              Chart visualization would appear here
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Transaction Volume</CardTitle>
            <CardDescription className="text-xs">Monthly transaction trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              Chart visualization would appear here
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Platform Health</CardTitle>
            <CardDescription className="text-xs">System status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">System Status</span>
                <Badge variant="success" className="text-xs">Operational</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">99.9%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">120ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-sm">
            <Wallet className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="disputes" className="text-sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserList />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionList />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <DisputeManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PlatformStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}