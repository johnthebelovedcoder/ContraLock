'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  User,
  Star
} from 'lucide-react';

export default function ReportingPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to access the reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground">
          Detailed insights and analytics for your projects and spending
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$75,000</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Delivery Time</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-muted-foreground">-2 days from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-muted-foreground">-0.3% from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Spending</span>
                <span className="font-medium">$75,000</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Web Development</span>
                  <span>$45,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Design</span>
                  <span>$20,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '27%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Writing</span>
                  <span>$10,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '13%' }}></div>
                </div>
              </div>
              
              <div className="pt-4">
                <h4 className="font-medium mb-2">Spending by Freelancer</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Alex Johnson</span>
                    <span>$32,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sarah Williams</span>
                    <span>$28,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mike Chen</span>
                    <span>$15,000</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Milestone Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Average Delivery Time</span>
                <span className="font-medium">12 days</span>
              </div>
              <div className="flex justify-between">
                <span>First Approval Rate</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between">
                <span>Revision Rate</span>
                <span className="font-medium">15%</span>
              </div>
              
              <div className="pt-4">
                <h4 className="font-medium mb-2">Approval Rate by Freelancer</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Alex Johnson</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sarah Williams</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mike Chen</span>
                    <span>95%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk & Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">High-Risk Projects (AI)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>E-commerce Website</span>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Mobile App Development</span>
                    <Badge variant="secondary">Medium Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Brand Identity Design</span>
                    <Badge variant="outline">Low Risk</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Dispute Frequency</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Last 30 days</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 90 days</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Rate</span>
                    <span className="font-medium">2.1%</span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '2.1%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Freelancer Reliability Insights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Alex Johnson</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="ml-1 text-sm">4.2</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">On-time: 92%</div>
                  <div className="text-sm text-muted-foreground">Dispute Rate: 1.5%</div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Sarah Williams</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="ml-1 text-sm">4.8</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">On-time: 96%</div>
                  <div className="text-sm text-muted-foreground">Dispute Rate: 0.8%</div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Mike Chen</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="ml-1 text-sm">4.0</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">On-time: 88%</div>
                  <div className="text-sm text-muted-foreground">Dispute Rate: 2.5%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}