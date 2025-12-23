'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useProjectStore } from '@/lib/store/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  User,
  FileText
} from 'lucide-react';

export default function InvitationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { user, isAuthenticated, initializeAuth, loading: authLoading } = useAuthStore();
  const { acceptInvitation, declineInvitation, loading: storeLoading } = useProjectStore();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize auth
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // When component mounts, try to validate the token/invitation
  useEffect(() => {
    if (token) {
      // In a real app, we'd call an API to validate the token and get project details
      // For now, we'll just simulate it
      const fetchInvitationData = () => {
        // Simulated data - in a real app this would come from the backend
        setInvitationData({
          id: 'inv-123',
          projectId: 'proj-456',
          projectTitle: 'Website Redesign',
          projectDescription: 'Complete redesign of the client\'s e-commerce website with modern UI/UX',
          clientName: 'John Smith',
          clientEmail: 'john@example.com',
          projectBudget: 3000,
          projectDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          milestones: [
            { id: 'm1', title: 'Design Phase', amount: 1000, deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
            { id: 'm2', title: 'Development', amount: 1500, deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
            { id: 'm3', title: 'Testing & Deployment', amount: 500, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          inviteSent: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        });
        setLoading(false);
      };
      
      fetchInvitationData();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=/invitations/' + token);
      return;
    }

    setActionLoading(true);
    try {
      await acceptInvitation(token);
      // Redirect to the accepted project page or dashboard
      router.push('/dashboard/freelancer/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=/invitations/' + token);
      return;
    }

    setActionLoading(true);
    try {
      await declineInvitation(token);
      setError('Invitation declined successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Invitation</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Invitation Not Found</h2>
          <p className="text-muted-foreground">The invitation may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const { 
    projectTitle, 
    projectDescription, 
    clientName, 
    clientEmail, 
    projectBudget, 
    projectDeadline, 
    milestones,
    expiresAt
  } = invitationData;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Invitation</h1>
        <p className="text-muted-foreground">Review the project details and accept or decline the invitation</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{projectTitle}</h3>
                <p className="text-muted-foreground mt-2">{projectDescription}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{clientEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium">${projectBudget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{projectDeadline.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">{expiresAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone: any, index: number) => (
                  <div key={milestone.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Milestone {index + 1}: {milestone.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {milestone.deadline.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${milestone.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accept Invitation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the project details and decide whether to accept this project
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Project Budget:</span>
                  <span className="font-medium">${projectBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Deadline:</span>
                  <span className="text-sm">{projectDeadline.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleAccept}
                  disabled={actionLoading || new Date() > new Date(expiresAt)}
                >
                  {actionLoading ? 'Processing...' : 'Accept Project'}
                  {actionLoading && <span className="ml-2 animate-spin">...</span>}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleDecline}
                  disabled={actionLoading}
                >
                  Decline
                </Button>
              </div>

              {new Date() > new Date(expiresAt) && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-sm text-destructive">
                    This invitation has expired and can no longer be accepted.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expires: {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need to Sign In?</CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Signed in as {user?.email}</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In to Accept
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}