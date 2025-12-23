'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/authStore';
import { ProjectCancellationService, CancellationRequest } from '@/lib/services/projectCancellationService';
import { toast } from 'sonner';

interface CancellationRequestsListProps {
  userType: 'client' | 'freelancer';
}

export function CancellationRequestsList({ userType }: CancellationRequestsListProps) {
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadCancellationRequests();
  }, [user, userType]);

  const loadCancellationRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const cancellationService = ProjectCancellationService.getInstance();
      const requests = cancellationService.getPendingCancellationRequests(user.id);
      setCancellationRequests(requests);
    } catch (error) {
      console.error('Error loading cancellation requests:', error);
      toast.error('Failed to load cancellation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) {
      toast.error('You must be logged in to approve cancellation');
      return;
    }

    setApprovingId(requestId);

    try {
      const cancellationService = ProjectCancellationService.getInstance();
      await cancellationService.approveCancellation(requestId, user.id);
      
      toast.success('Project cancellation approved successfully');
      loadCancellationRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving cancellation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve cancellation');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) {
      toast.error('You must be logged in to reject cancellation');
      return;
    }

    setRejectingId(requestId);

    try {
      const cancellationService = ProjectCancellationService.getInstance();
      await cancellationService.rejectCancellation(requestId, user.id);
      
      toast.success('Project cancellation rejected');
      loadCancellationRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject cancellation');
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading cancellation requests...</p>
      </div>
    );
  }

  if (cancellationRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pending cancellation requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cancellation Requests</h3>
      
      {cancellationRequests.map(request => (
        <Card key={request.id} className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">Project Cancellation Request</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Requested on {request.requestedAt.toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">Reason:</span> {request.reason}
              </p>
              
              {userType === 'freelancer' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={approvingId === request.id || rejectingId === request.id}
                  >
                    {rejectingId === request.id ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    disabled={approvingId === request.id || rejectingId === request.id}
                  >
                    {approvingId === request.id ? 'Approving...' : 'Approve Cancellation'}
                  </Button>
                </div>
              )}
              
              {userType === 'client' && (
                <p className="text-sm text-muted-foreground">
                  Awaiting freelancer approval
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}