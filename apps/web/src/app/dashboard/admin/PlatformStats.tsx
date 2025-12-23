import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Calendar, Users, FileText, Wallet, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminAnalyticsSummary } from '@/lib/api';

interface AnalyticsData {
  totalUsers?: number;
  totalProjects?: number;
  totalVolume?: number;
  disputeRate?: number;
  resolvedDisputes?: number;
  totalDisputes?: number;
  disputeResolutionRate?: number;
  avgDisputeResolutionTime?: number;
}

export function PlatformStats() {
  const { data: analyticsData, isLoading, error } = useAdminAnalyticsSummary() as { data?: AnalyticsData; isLoading: boolean; error?: Error };
  const [timeRange, setTimeRange] = useState('7d');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Error loading analytics: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock chart data for now - will implement real timeline data later
  const chartData = [
    { date: '2023-01-01', count: 10 },
    { date: '2023-01-02', count: 20 },
    { date: '2023-01-03', count: 15 },
    { date: '2023-01-04', count: 25 },
    { date: '2023-01-05', count: 18 },
    { date: '2023-01-06', count: 30 },
    { date: '2023-01-07', count: 22 },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalVolume ? `$${(analyticsData.totalVolume / 100).toLocaleString()}` : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.disputeRate ? `${analyticsData.disputeRate.toFixed(2)}%` : '0.00%'}
            </div>
            <p className="text-xs text-muted-foreground">-2% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Project Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Development', 'Design', 'Writing', 'Marketing', 'Consulting'].map((category, index) => (
                <div key={category} className="flex items-center justify-between">
                  <span>{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${100 - index * 15}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{100 - index * 15}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Resolved Disputes</span>
                <Badge variant="default">
                  {analyticsData?.resolvedDisputes || 0} / {analyticsData?.totalDisputes || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Resolution Rate</span>
                <Badge variant="outline">
                  {analyticsData?.disputeResolutionRate ? `${analyticsData.disputeResolutionRate.toFixed(1)}%` : '0.0%'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg. Resolution Time</span>
                <Badge variant="secondary">
                  {analyticsData?.avgDisputeResolutionTime ? `${analyticsData.avgDisputeResolutionTime.toFixed(1)} days` : 'N/A'}
                </Badge>
              </div>
              <div className="pt-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Dispute Status Distribution
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">24</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">12</div>
                    <div className="text-xs text-muted-foreground">In Mediation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">8</div>
                    <div className="text-xs text-muted-foreground">In Arbitration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">42</div>
                    <div className="text-xs text-muted-foreground">Resolved</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}