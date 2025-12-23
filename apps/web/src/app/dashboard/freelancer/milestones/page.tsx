'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  DollarSign,
  FileText,
  Upload,
  ExternalLink,
  CheckCircle,
  Circle,
  FileCheck,
  Eye,
  Edit
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/store/projectStore';
import { ViewToggle } from '@/components/common/ViewToggle';
import { useViewToggle } from '@/hooks/useViewToggle';

export default function FreelancerMilestonesPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { milestones, fetchMilestones, initializeDemoData } = useProjectStore();
  const { currentView, toggleView } = useViewToggle({ storageKey: 'freelancer-milestones-view' });

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();

    // Initialize demo milestones
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'freelancer')) {
      router.push('/auth/login');
      return;
    }

    // Demo data is initialized via initializeDemoData, so no need to fetch separately
    // In a real app, we would fetch the freelancer's projects and milestones here
  }, [loading, isAuthenticated, user, router, fetchMilestones]);

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

  const handleViewMilestone = (milestoneId: string) => {
    router.push(`/dashboard/freelancer/milestones/submit/${milestoneId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-gray-500 text-gray-600';
      case 'IN_PROGRESS':
        return 'border-blue-500 text-blue-600';
      case 'SUBMITTED':
        return 'border-yellow-500 text-yellow-600';
      case 'AWAITING_PAYMENT':
        return 'border-orange-500 text-orange-600';
      case 'APPROVED':
        return 'border-green-500 text-green-600';
      default:
        return 'border-gray-500 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Milestones & Deliverables</h1>
          <p className="text-muted-foreground">
            Manage your milestones, submit deliverables, and track payments
          </p>
        </div>
        <ViewToggle currentView={currentView} onToggle={toggleView} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milestones.length}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'SUBMITTED' || m.status === 'AWAITING_PAYMENT' || m.status === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Edit className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">Active work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones
                .filter(m => m.status === 'AWAITING_PAYMENT' || m.status === 'SUBMITTED')
                .reduce((sum, milestone) => sum + (milestone.amount || 0), 0)} USD
            </div>
            <p className="text-xs text-muted-foreground">Expected payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      {currentView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone) => (
            <Card
              key={(milestone as any)._id || (milestone as any).id || (milestone as any).milestoneId || 'fallback-' + Math.random().toString(36).substr(2, 9)}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleViewProject((milestone as any).project || (milestone as any).projectId || (milestone as any).project_id || 'unknown-project')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{(milestone as any).title || milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">Project: {(milestone as any).projectTitle || (milestone as any).project || (milestone as any).projectId || 'Unknown Project'}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getStatusColor((milestone as any).status || milestone.status)}`}
                >
                  {((milestone as any).status || milestone.status).replace('_', ' ')}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {(milestone as any).amountInUsd || (milestone as any).amount || milestone.amount} {(milestone as any).currency || (milestone as any).paymentCurrency || 'USD'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Due: {(milestone as any).deadline ? new Date((milestone as any).deadline).toLocaleDateString() : milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : (milestone as any).dueDate ? new Date((milestone as any).dueDate).toLocaleDateString() : 'No due date'}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(((milestone as any).status || milestone.status) === 'IN_PROGRESS' || ((milestone as any).status || milestone.status) === 'PENDING') && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMilestone((milestone as any)._id || (milestone as any).id || milestone._id);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Submit
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProject((milestone as any).project || (milestone as any).projectId || (milestone as any).project_id || 'unknown-project');
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Project
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Milestones</CardTitle>
            <p className="text-sm text-muted-foreground">All milestones across your projects</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={(milestone as any)._id || (milestone as any).id || (milestone as any).milestoneId || 'fallback-' + Math.random().toString(36).substr(2, 9)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 mb-3 md:mb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{(milestone as any).title || milestone.title}</h3>
                        <p className="text-sm text-muted-foreground">Project: {(milestone as any).projectTitle || (milestone as any).project || (milestone as any).projectId || 'Unknown Project'}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ml-2 ${getStatusColor((milestone as any).status || milestone.status)}`}
                      >
                        {((milestone as any).status || milestone.status).replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {(milestone as any).amountInUsd || (milestone as any).amount || milestone.amount} {(milestone as any).currency || (milestone as any).paymentCurrency || 'USD'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {(milestone as any).deadline ? new Date((milestone as any).deadline).toLocaleDateString() : milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : (milestone as any).dueDate ? new Date((milestone as any).dueDate).toLocaleDateString() : 'No due date'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProject((milestone as any).project || (milestone as any).projectId || (milestone as any).project_id || 'unknown-project')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Project
                    </Button>
                    {(((milestone as any).status || milestone.status) === 'IN_PROGRESS' || ((milestone as any).status || milestone.status) === 'PENDING') && (
                      <Button
                        size="sm"
                        onClick={() => handleViewMilestone((milestone as any)._id || (milestone as any).id || milestone._id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}