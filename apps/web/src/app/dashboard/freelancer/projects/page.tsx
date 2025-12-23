'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Clock, DollarSign, CheckCircle, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { ViewToggle } from '@/components/common/ViewToggle';
import { useViewToggle } from '@/hooks/useViewToggle';

// Mock data for freelancer projects
const mockProjects = [
  {
    id: '1',
    title: 'Website Redesign',
    client: 'John Smith',
    status: 'In Progress',
    currentMilestone: 'UI/UX Mockups',
    daysRemaining: 10,
    totalAmount: 3000,
    paidAmount: 800,
    nextMilestoneAmount: 600
  },
  {
    id: '2',
    title: 'Mobile App Development',
    client: 'Jane Doe',
    status: 'Client reviewing',
    currentMilestone: 'iOS Development',
    daysRemaining: 13,
    totalAmount: 4700,
    paidAmount: 1000,
    nextMilestoneAmount: 1500
  },
  {
    id: '3',
    title: 'Logo Design',
    client: 'Mike Wilson',
    status: 'Waiting for payment',
    currentMilestone: 'Final Delivery',
    daysRemaining: 3,
    totalAmount: 1500,
    paidAmount: 0,
    nextMilestoneAmount: 1500
  },
  {
    id: '4',
    title: 'E-commerce Platform',
    client: 'Sarah Johnson',
    status: 'In Progress',
    currentMilestone: 'Project Kickoff',
    daysRemaining: 25,
    totalAmount: 5200,
    paidAmount: 0,
    nextMilestoneAmount: 1000
  }
];

export default function FreelancerProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { currentView, toggleView } = useViewToggle({ storageKey: 'freelancer-projects-view' });

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
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

  const handleViewProject = (projectId: string) => {
    router.push(`/dashboard/freelancer/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            Manage your active and upcoming projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle currentView={currentView} onToggle={toggleView} />
          <Button onClick={() => router.push('/dashboard/freelancer/projects/create')}>
            + Create New Project
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProjects.length}</div>
            <p className="text-xs text-muted-foreground">4 projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockProjects
                .filter(p => p.status === 'Waiting for payment')
                .reduce((sum, project) => sum + project.nextMilestoneAmount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockProjects.filter(p => p.status === 'Waiting for payment').length} awaiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">+1 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">From clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <p className="text-sm text-muted-foreground">Current projects and their milestone status</p>
        </CardHeader>
        <CardContent>
          {currentView === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewProject(project.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">Client: {project.client}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        project.status === 'In Progress' ? 'border-blue-500 text-blue-600' :
                        project.status === 'Client reviewing' ? 'border-yellow-500 text-yellow-600' :
                        project.status === 'Waiting for payment' ? 'border-orange-500 text-orange-600' :
                        'border-gray-500 text-gray-600'
                      }`}
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {project.currentMilestone}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {project.daysRemaining} days left
                    </Badge>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">${project.paidAmount} / ${project.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">Paid / Total</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project.id);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewProject(project.id)}
                >
                  <div className="flex-1 mb-2 sm:mb-0">
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">Client: {project.client}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          project.status === 'In Progress' ? 'border-blue-500 text-blue-600' :
                          project.status === 'Client reviewing' ? 'border-yellow-500 text-yellow-600' :
                          project.status === 'Waiting for payment' ? 'border-orange-500 text-orange-600' :
                          'border-gray-500 text-gray-600'
                        }`}
                      >
                        {project.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {project.currentMilestone}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.daysRemaining} days left
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium">${project.paidAmount} / ${project.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">Paid / Total</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project.id);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}