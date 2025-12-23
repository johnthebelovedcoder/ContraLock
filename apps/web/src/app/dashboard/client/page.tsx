'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  FolderOpen,
  CalendarDays,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  User,
  Plus,
  MessageCircle,
  FileText,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useProjects } from '@/hooks/api/useProjects';
import { useNotifications } from '@/hooks/api/useNotifications';
import { projectService } from '@/lib/api';

// Define types for our data
type ProjectStatus = 'DRAFT' | 'PENDING_ACCEPTANCE' | 'AWAITING_DEPOSIT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  totalBudget: number;
  totalBudgetInUsd?: number; // Amount converted to USD for standardization
  deadline: Date;
  status: ProjectStatus;
  clientId: string;
  freelancerId?: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  pendingReviews: number;
  messages: number;
  escrowBalance: number;
  escrowBalanceInUsd?: number; // Amount converted to USD for standardization
  currency: string; // Currency of the escrow account
  exchangeRate?: number; // Exchange rate used for conversion
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'DISPUTED';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  autoApproveCountdown?: number; // days remaining
}

interface Activity {
  id: string;
  projectId: string;
  type: 'MILESTONE_SUBMITTED' | 'PAYMENT_RELEASE' | 'REVISION_REQUESTED' | 'DISPUTE_SUBMITTED' | 'MESSAGE_RECEIVED';
  message: string;
  timestamp: Date;
  relatedId?: string; // milestone id or message thread id
}

interface Notification {
  id: string;
  type: 'MILESTONE_OVERDUE' | 'FREELANCER_UNRESPONSIVE' | 'EXPIRING_MILESTONE' | 'PENDING_APPROVAL';
  message: string;
  timestamp: Date;
  isRead: boolean;
  countdown?: number; // for auto-approval
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load dashboard data using API hooks
  const { data: userProjects, isLoading: projectsLoading } = useProjects(user?._id || '', {}, { page: 1, limit: 10 });
  const { data: userNotificationsData, isLoading: notificationsLoading } = useNotifications(user?._id || '');

  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'client') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'freelancer') {
        router.replace('/dashboard/freelancer');
      } else if (user.role === 'admin' || user.role === 'arbitrator') {
        router.replace('/dashboard/admin');
      }
    }
  }, [isAuthenticated, user?.role, router]);

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // Since we can't directly get activities, we'll construct them from projects/milestones
  useEffect(() => {
    if (userProjects) {
      setProjects(userProjects.items || []);
    }
  }, [userProjects]);

  // We need to load milestones separately for each project
  useEffect(() => {
    if (userProjects?.items) {
      const loadMilestonesForProjects = async () => {
        const allMilestones: Milestone[] = [];
        for (const project of userProjects.items) {
          if (project.id) {
            try {
              const projectMilestones = await projectService.getMilestones(project.id);
              // Only push if projectMilestones is an array to avoid the TypeError
              if (projectMilestones && Array.isArray(projectMilestones)) {
                allMilestones.push(...(projectMilestones as any[]));
              }
            } catch (error) {
              console.error(`Error loading milestones for project ${project.id}:`, error);
            }
          }
        }
        setMilestones(allMilestones);
      };

      loadMilestonesForProjects();
    }
  }, [userProjects]);

  useEffect(() => {
    if (userNotificationsData) {
      setNotifications(userNotificationsData.map((notification: any) => ({
        id: notification._id || notification.id,
        type: 'PENDING_APPROVAL' as const, // Simplifying for now
        message: notification.message || 'Notification message',
        timestamp: new Date(notification.createdAt || Date.now()),
        isRead: notification.read,
        countdown: undefined
      })));
    }
  }, [userNotificationsData]);

  // Create activities from milestones and projects
  useEffect(() => {
    if (projects.length > 0 && milestones.length > 0) {
      const activities: Activity[] = [];

      // Create activities from milestones
      milestones.forEach(milestone => {
        if (milestone.status === 'SUBMITTED') {
          activities.push({
            id: `act-${milestone.id}`,
            projectId: milestone.projectId,
            type: 'MILESTONE_SUBMITTED',
            message: `Milestone "${milestone.title}" submitted for review`,
            timestamp: milestone.updatedAt ? new Date(milestone.updatedAt) : new Date(),
            relatedId: milestone.id
          });
        }
      });

      setActivities(activities);
    }
  }, [projects, milestones]);

  // If still loading, show a loading state
  if (loading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'client') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'freelancer') {
        router.replace('/dashboard/freelancer');
      } else if (user.role === 'admin' || user.role === 'arbitrator') {
        router.replace('/dashboard/admin');
      }
    }
  }, [isAuthenticated, user?.role, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access the dashboard</p>
      </div>
    );
  }

  // Wait for role to be confirmed as 'client'
  if (user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Calculate dashboard metrics
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const pendingActions = milestones.filter(m => m.status === 'SUBMITTED' || m.status === 'REVISION_REQUESTED').length;
  const totalEscrowBalance = projects.reduce((sum, p) => sum + (p.escrowBalanceInUsd || p.escrowBalance), 0);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Client', current: true }
        ]}
      />
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.firstName}! Here's what's happening with your projects today.
          </p>
        </div>

        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Grid - Organized by importance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Projects</span>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Pending Actions</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingActions}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Escrow Balance</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalEscrowBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">In secure escrow</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Alerts</span>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unreadNotifications}</div>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Your Projects</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Track and manage your active projects</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/projects')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 3).map(project => (
                <div key={project.id} className="p-3 border rounded-md hover:bg-accent/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{project.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={project.status === 'ACTIVE' ? 'default' :
                                  project.status === 'PENDING_ACCEPTANCE' ? 'secondary' :
                                  project.status === 'COMPLETED' ? 'success' :
                                  project.status === 'DRAFT' ? 'outline' :
                                  'destructive'}
                          className="text-xs"
                        >
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{project.category}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {project.escrowBalance.toLocaleString()} {project.currency || 'USD'} /
                            {project.totalBudget.toLocaleString()} {project.currency || 'USD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{project.messages} messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{project.pendingReviews} pending</span>
                        </div>
                      </div>
                      {project.status === 'ACTIVE' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 ml-2"
                      onClick={() => router.push(`/dashboard/client/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs">Get started by creating your first project</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Notifications */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2">
                  <Plus className="h-4 w-4 mb-1" />
                  <span className="text-xs">New Project</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2">
                  <FolderOpen className="h-4 w-4 mb-1" />
                  <span className="text-xs">All Projects</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2">
                  <FileText className="h-4 w-4 mb-1" />
                  <span className="text-xs">Contracts</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center justify-center h-16 py-2">
                  <User className="h-4 w-4 mb-1" />
                  <span className="text-xs">Invite</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          {notifications.filter(n => !n.isRead).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Alerts
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.filter(n => !n.isRead).slice(0, 3).map(notification => (
                    <div key={notification.id} className="p-2 rounded-sm bg-amber-50 dark:bg-amber-900/20 text-xs">
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activity & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Activity
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => router.push('/dashboard/projects')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.slice(0, 4).map(activity => (
                <div key={activity.id} className="flex items-start gap-2 text-sm">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {activity.type.split('_')[0]}
                  </Badge>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Recent Messages
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => router.push('/dashboard/messages')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.filter(p => p.messages > 0).slice(0, 3).map(project => (
                <div key={project.id} className="flex items-center justify-between p-2 rounded-sm hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{project.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>{project.messages} new</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => router.push(`/dashboard/client/projects/${project.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
              {projects.filter(p => p.messages > 0).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No new messages</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}