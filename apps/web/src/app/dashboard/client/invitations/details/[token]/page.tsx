'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  User,
  File,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useProjectStore } from '@/lib/store/projectStore';

// TypeScript interface for counter proposal
interface CounterProposal {
  milestoneId: string;
  title?: string;
  description?: string;
  amount?: number;
  deadline?: Date;
  reason: string;
}

// Mock interface for invitation with counter proposals
interface InvitationWithCounterProposals {
  id: string;
  projectId: string;
  clientEmail: string;
  freelancerEmail: string;
  status: 'PENDING' | 'AWAITING_CLIENT_REVIEW' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Extended invitation details
  projectTitle?: string;
  projectDescription?: string;
  projectCategory?: string;
  projectBudget?: number;
  projectTimeline?: string;
  projectDeadline?: Date;
  milestones?: any[];
  counterProposals?: CounterProposal[];
}

export default function ClientInvitationDetailsPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading: authLoading } = useAuthStore();
  const { 
    invitations, 
    fetchInvitations, 
    acceptInvitation, 
    declineInvitation, 
    loading: storeLoading, 
    initializeDemoData 
  } = useProjectStore();
  
  const [invitation, setInvitation] = useState<InvitationWithCounterProposals | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [responses, setResponses] = useState<{[key: string]: 'accept' | 'reject' | 'modify'}>({});
  const [modifiedValues, setModifiedValues] = useState<{[key: string]: {amount?: number, deadline?: Date, title?: string}}>({});

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'client')) {
      router.push('/auth/login');
      return;
    }

    // Find the invitation by token - mock implementation
    if (token) {
      // In a real app, this would call the backend to get invitation details
      // For demo purposes, we'll create a mock invitation with counter proposals
      const mockInvitation: InvitationWithCounterProposals = {
        id: 'demo-invite-1',
        projectId: 'demo-project-1',
        clientEmail: user?.email || 'client@example.com',
        freelancerEmail: 'freelancer@example.com',
        status: 'AWAITING_CLIENT_REVIEW', // This would be the status when freelancer sends counter-proposals
        token: token as string,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(),
        
        // Extended details
        projectTitle: 'Website Development',
        projectDescription: 'Complete website development project with responsive design and CMS integration',
        projectCategory: 'Web Development',
        projectBudget: 5000,
        projectTimeline: '30 days',
        projectDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            id: 'demo-milestone-1',
            projectId: 'demo-project-1',
            title: 'Homepage Design',
            description: 'Create the homepage design with all required sections',
            amount: 1000,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            acceptanceCriteria: 'Design should include header, hero section, features, testimonials, and footer',
            status: 'PENDING',
            order: 1,
          },
          {
            id: 'demo-milestone-2',
            projectId: 'demo-project-1',
            title: 'Frontend Development',
            description: 'Implement the frontend based on approved designs',
            amount: 1500,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            acceptanceCriteria: 'All pages should be responsive and interactive',
            status: 'PENDING',
            order: 2,
          }
        ],
        counterProposals: [
          {
            milestoneId: 'demo-milestone-1',
            amount: 1200, // freelancer wants more money
            reason: 'Additional animations and interactive elements required',
          },
          {
            milestoneId: 'demo-milestone-2',
            deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // freelancer needs more time
            reason: 'Scope increased with additional pages to implement',
          }
        ]
      };
      setInvitation(mockInvitation);
    }
  }, [token, isAuthenticated, authLoading, router, user]);

  const handleAcceptAll = async () => {
    setLoadingAction('accept');
    setSuccess(null);
    setError(null);

    try {
      // In a real app, this would accept all freelancer counter-proposals
      // Update project status to disable sharing after acceptance
      if (invitation.projectId) {
        useProjectStore.getState().updateProject(invitation.projectId, { status: 'ACTIVE' });
      }
      setSuccess('All proposed changes accepted successfully! Invitation updated.');
    } catch (error: any) {
      setError(error.message || 'Failed to accept changes');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectAll = async () => {
    setLoadingAction('reject');
    setSuccess(null);
    setError(null);

    try {
      // In a real app, this would reject all freelancer counter-proposals
      // Note: Rejection doesn't disable sharing as invitation remains pending
      setSuccess('All proposed changes have been rejected. Invitation remains with original terms.');
    } catch (error: any) {
      setError(error.message || 'Failed to reject changes');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAcceptMilestone = (milestoneId: string) => {
    setResponses(prev => ({
      ...prev,
      [milestoneId]: 'accept'
    }));
  };

  const handleRejectMilestone = (milestoneId: string) => {
    setResponses(prev => ({
      ...prev,
      [milestoneId]: 'reject'
    }));
  };

  const handleModifyMilestone = (milestoneId: string) => {
    setResponses(prev => ({
      ...prev,
      [milestoneId]: 'modify'
    }));
  };

  const handleModifyValueChange = (milestoneId: string, field: 'amount' | 'deadline' | 'title', value: any) => {
    setModifiedValues(prev => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        [field]: value
      }
    }));
  };

  const handleSendModified = async () => {
    setLoadingAction('modify');
    setSuccess(null);
    setError(null);

    try {
      // In a real app, this would send the modified terms back to the freelancer
      setSuccess('Modified terms sent back to freelancer for review.');
    } catch (error: any) {
      setError(error.message || 'Failed to send modified terms');
    } finally {
      setLoadingAction(null);
    }
  };

  if (authLoading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to view invitation details</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard/client/invitations')}
            >
              Back to Invitations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  // Find milestones that have counter proposals
  const milestonesWithProposals = invitation.milestones?.filter(milestone => 
    invitation.counterProposals?.some(cp => cp.milestoneId === milestone.id)
  ) || [];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Success/Alert messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{invitation.projectTitle || `Project ${invitation.projectId}`}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={invitation.status === 'PENDING' ? 'default' :
                      invitation.status === 'AWAITING_CLIENT_REVIEW' ? 'secondary' :
                      invitation.status === 'ACCEPTED' ? 'secondary' :
                      invitation.status === 'DECLINED' ? 'destructive' : 'outline'}
            >
              {invitation.status === 'AWAITING_CLIENT_REVIEW' ? 'Changes Proposed' : invitation.status}
            </Badge>
            {invitation.expiresAt && new Date(invitation.expiresAt) < new Date() && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Invitation from freelancer {invitation.freelancerEmail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Project Overview</CardTitle>
              </div>
              <CardDescription>Details about the project you've invited the freelancer to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Project Description</h3>
                <p className="text-muted-foreground">
                  {invitation.projectDescription || "This is an invitation you sent to a freelancer. They have proposed changes to the original terms."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <h4 className="font-medium mb-1">Project Category</h4>
                  <p className="text-sm text-muted-foreground">{invitation.projectCategory || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Project Deadline</h4>
                  <p className="text-sm text-muted-foreground">
                    {invitation.projectDeadline ? new Date(invitation.projectDeadline).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Project ID</h4>
                  <p className="text-sm text-muted-foreground">{invitation.projectId}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Freelancer</h4>
                  <p className="text-sm text-muted-foreground">{invitation.freelancerEmail}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Invitation Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Expires</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                    {new Date(invitation.expiresAt) < new Date() && (
                      <span className="text-destructive ml-2">(Expired)</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones with Counter Proposals Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Project Milestones</CardTitle>
                </div>
                {invitation.counterProposals && invitation.counterProposals.length > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {invitation.counterProposals.length} Change{invitation.counterProposals.length !== 1 ? 's' : ''} Proposed
                  </Badge>
                )}
              </div>
              <CardDescription>Review and respond to the freelancer's proposed changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {milestonesWithProposals.length > 0 ? (
                milestonesWithProposals.map((milestone: any) => {
                  const counterProposal = invitation.counterProposals?.find(cp => cp.milestoneId === milestone.id);
                  const response = responses[milestone.id];
                  
                  return (
                    <Card key={milestone.id} className={counterProposal ? "border-orange-300 bg-orange-50" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{milestone.order}. {milestone.title}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {milestone.status || 'PENDING'}
                              </Badge>
                              {counterProposal && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                                  Change Proposed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">${milestone.amount}</div>
                            <div className="text-sm text-muted-foreground">
                              Due: {new Date(milestone.deadline).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{milestone.description}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Acceptance Criteria</h4>
                            <p className="text-sm text-muted-foreground">{milestone.acceptanceCriteria}</p>
                          </div>
                          
                          {/* Display Counter Proposal */}
                          {counterProposal && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <h4 className="font-medium mb-2">Freelancer's Proposed Changes</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {counterProposal.amount && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Amount</span>
                                    <p className="text-sm line-through">${milestone.amount}</p>
                                    <p className="text-sm font-medium text-green-600">${counterProposal.amount}</p>
                                  </div>
                                )}
                                {counterProposal.deadline && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Deadline</span>
                                    <p className="text-sm line-through">
                                      {new Date(milestone.deadline).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm font-medium text-green-600">
                                      {new Date(counterProposal.deadline).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {counterProposal.title && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Title</span>
                                    <p className="text-sm line-through">{milestone.title}</p>
                                    <p className="text-sm font-medium text-green-600">{counterProposal.title}</p>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm mt-2">
                                <span className="font-medium">Reason:</span> {counterProposal.reason}
                              </p>
                            </div>
                          )}

                          {/* Response Options */}
                          {!response && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAcceptMilestone(milestone.id)}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="h-4 w-4" /> Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRejectMilestone(milestone.id)}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="h-4 w-4" /> Reject
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleModifyMilestone(milestone.id)}
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="h-4 w-4" /> Modify
                              </Button>
                            </div>
                          )}

                          {/* Accept/Reject Confirmation */}
                          {response === 'accept' && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-green-700 font-medium">Changes accepted for this milestone</span>
                              </div>
                              <p className="text-sm mt-2 text-green-600">
                                The freelancer's proposed changes will be incorporated into the project terms.
                              </p>
                            </div>
                          )}

                          {response === 'reject' && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-700 font-medium">Changes rejected for this milestone</span>
                              </div>
                              <p className="text-sm mt-2 text-red-600">
                                The original terms will remain for this milestone.
                              </p>
                            </div>
                          )}

                          {/* Modify Form */}
                          {response === 'modify' && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium mb-3">Modify Terms</h4>
                              <div className="space-y-3">
                                {counterProposal?.amount && (
                                  <div>
                                    <label className="text-sm font-medium">New Amount</label>
                                    <div className="flex gap-2 mt-1">
                                      <Input 
                                        type="number" 
                                        placeholder={`${milestone.amount}`}
                                        onChange={(e) => handleModifyValueChange(milestone.id, 'amount', parseFloat(e.target.value))}
                                        className="bg-white"
                                      />
                                      <span className="self-center text-sm">USD</span>
                                    </div>
                                  </div>
                                )}
                                {counterProposal?.deadline && (
                                  <div>
                                    <label className="text-sm font-medium">New Deadline</label>
                                    <Input 
                                      type="date" 
                                      onChange={(e) => handleModifyValueChange(milestone.id, 'deadline', new Date(e.target.value))}
                                      className="mt-1 bg-white"
                                    />
                                  </div>
                                )}
                                {counterProposal?.title && (
                                  <div>
                                    <label className="text-sm font-medium">New Title</label>
                                    <Input 
                                      type="text" 
                                      placeholder={milestone.title}
                                      onChange={(e) => handleModifyValueChange(milestone.id, 'title', e.target.value)}
                                      className="mt-1 bg-white"
                                    />
                                  </div>
                                )}
                                <Button 
                                  size="sm" 
                                  className="mt-3"
                                  onClick={handleSendModified}
                                  disabled={loadingAction === 'modify'}
                                >
                                  {loadingAction === 'modify' ? 'Sending...' : 'Send Modified Terms'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-10 w-10 mx-auto mb-2" />
                  <p>No proposed changes to review</p>
                  <p className="text-sm mt-2">The freelancer has not made any changes to the original terms.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Freelancer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Freelancer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="font-medium">{invitation.freelancerEmail.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-medium">Freelancer</h3>
                  <p className="text-sm text-muted-foreground">{invitation.freelancerEmail}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Rate:</span>
                  <span className="font-medium">95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed Projects:</span>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="font-medium">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms Card - moved after client info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Payment Terms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-medium">${invitation.projectBudget || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Escrow</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline</span>
                  <span className="text-sm">{invitation.projectTimeline || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="text-sm">
                    {invitation.projectDeadline ? new Date(invitation.projectDeadline).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Invitation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={invitation.status === 'PENDING' ? 'default' :
                            invitation.status === 'AWAITING_CLIENT_REVIEW' ? 'secondary' :
                            invitation.status === 'ACCEPTED' ? 'secondary' :
                            invitation.status === 'DECLINED' ? 'destructive' : 'outline'}
                  >
                    {invitation.status === 'AWAITING_CLIENT_REVIEW' ? 'Changes Proposed' : invitation.status}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span
                    className={new Date(invitation.expiresAt) < new Date() ? 'text-destructive' : ''}
                  >
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="font-medium mb-2">Next Steps</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {invitation.status === 'AWAITING_CLIENT_REVIEW' ? (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Review freelancer's proposed changes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Accept, reject, or modify terms</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>Send decision back to freelancer</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>Project begins when terms are finalized</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Project ready to begin</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card - in card design as requested */}
          {invitation.status === 'AWAITING_CLIENT_REVIEW' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Respond to the freelancer's proposed changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={handleAcceptAll}
                  disabled={loadingAction === 'accept'}
                >
                  {loadingAction === 'accept' ? 'Accepting...' : 'Accept All Changes'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRejectAll}
                  disabled={loadingAction === 'reject'}
                >
                  {loadingAction === 'reject' ? 'Rejecting...' : 'Reject All Changes'}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Review each milestone individually or respond to all at once.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}