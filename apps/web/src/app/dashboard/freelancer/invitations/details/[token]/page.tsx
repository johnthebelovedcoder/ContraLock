'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
  PlusCircle,
  MinusCircle,
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

export default function InvitationDetailsPage() {
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

  const [invitation, setInvitation] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCounterForm, setShowCounterForm] = useState<{ [key: string]: boolean }>({});
  const [counterProposals, setCounterProposals] = useState<CounterProposal[]>([]);
  const [counterReason, setCounterReason] = useState<string>('');

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'freelancer')) {
      router.push('/auth/login');
      return;
    }

    // Find the invitation by token
    if (token && invitations.length > 0) {
      const foundInvitation = invitations.find((inv: any) => inv.token === token);
      if (foundInvitation) {
        // Add mock milestone data to the invitation if it doesn't already have it
        const invitationWithMilestones = {
          ...foundInvitation,
          projectDescription: foundInvitation.projectDescription || "This is a comprehensive web development project that involves creating a modern, responsive website with e-commerce capabilities. The project will include multiple pages, a content management system, and integration with payment processors.",
          projectCategory: foundInvitation.projectCategory || "Web Development",
          projectBudget: foundInvitation.projectBudget || 8500,
          projectTimeline: foundInvitation.projectTimeline || "60 days",
          escrowStatus: foundInvitation.escrowStatus || "NOT_DEPOSITED",
          milestones: foundInvitation.milestones || [
            {
              id: 'ms-101',
              title: 'Project Planning & Requirements',
              description: 'Initial project planning, requirements gathering, and technical specification document creation',
              amount: 1200,
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              acceptanceCriteria: [
                'Requirements document signed off by client',
                'Technical architecture approved',
                'Project timeline confirmed'
              ],
              status: 'PENDING',
              order: 1
            },
            {
              id: 'ms-102',
              title: 'UI/UX Design Phase',
              description: 'Create wireframes, mockups, and prototype for the website',
              amount: 2000,
              deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
              acceptanceCriteria: [
                'All page designs completed and approved',
                'Style guide created',
                'Prototype reviewed and accepted'
              ],
              status: 'PENDING',
              order: 2
            },
            {
              id: 'ms-103',
              title: 'Frontend Development',
              description: 'Develop responsive frontend components and pages',
              amount: 2800,
              deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
              acceptanceCriteria: [
                'All pages implemented responsively',
                'Cross-browser compatibility tested',
                'Performance requirements met'
              ],
              status: 'PENDING',
              order: 3
            },
            {
              id: 'ms-104',
              title: 'Backend Development',
              description: 'Create APIs, database schema, and server-side logic',
              amount: 2500,
              deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
              acceptanceCriteria: [
                'All APIs implemented and tested',
                'Database schema finalized',
                'Security measures implemented'
              ],
              status: 'PENDING',
              order: 4
            }
          ]
        };
        setInvitation(invitationWithMilestones);
      } else {
        setError('Invitation not found or invalid token');
      }
    }
  }, [token, invitations, isAuthenticated, authLoading, router, user]);

  const handleAccept = async () => {
    if (!token) return;

    setLoadingAction('accept');
    setSuccess(null);
    setError(null);

    try {
      // Check if there are counter proposals - in a real app, we would handle this differently
      // based on whether we're accepting original terms or accepting a counter proposal
      const acceptedProject = await acceptInvitation(token as string);
      setSuccess('Invitation accepted successfully! Redirecting to project page...');

      // Update the project to disable sharing after acceptance
      if (invitation?.projectId) {
        useProjectStore.getState().updateProject(invitation.projectId, { status: 'ACTIVE' });
      }

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push(`/dashboard/freelancer/projects/${invitation?.projectId}`);
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to accept invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setLoadingAction('decline');
    setSuccess(null);
    setError(null);

    try {
      await declineInvitation(token as string);
      setSuccess('Invitation declined successfully!');

      // Wait a moment before redirecting back to invitations
      setTimeout(() => {
        router.push('/dashboard/freelancer/invitations');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to decline invitation');
    } finally {
      setLoadingAction(null);
    }
  };

  // Toggle counter proposal form for a specific milestone
  const toggleCounterForm = (milestoneId: string) => {
    setShowCounterForm(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // Add a counter proposal
  const addCounterProposal = (milestoneId: string, field: string, value: string | number | Date) => {
    const existingProposalIndex = counterProposals.findIndex(p => p.milestoneId === milestoneId);

    if (existingProposalIndex >= 0) {
      // Update existing proposal
      const updatedProposals = [...counterProposals];
      updatedProposals[existingProposalIndex] = {
        ...updatedProposals[existingProposalIndex],
        [field]: value,
        reason: counterReason
      };
      setCounterProposals(updatedProposals);
    } else {
      // Create new proposal
      const newProposal: CounterProposal = {
        milestoneId,
        [field]: value,
        reason: counterReason
      };
      setCounterProposals([...counterProposals, newProposal]);
    }
  };

  // Remove a counter proposal
  const removeCounterProposal = (milestoneId: string) => {
    setCounterProposals(counterProposals.filter(p => p.milestoneId !== milestoneId));
    setCounterReason('');
  };

  // Handle sending counter proposals
  const handleSendCounter = async () => {
    if (counterProposals.length === 0) {
      setError('No changes to send. Please propose changes to milestones first.');
      return;
    }

    setLoadingAction('counter');
    setSuccess(null);
    setError(null);

    try {
      // Format the proposals for the API
      const formattedProposals = counterProposals.map(proposal => {
        const milestone = invitation.milestones?.find((m: any) => m.id === proposal.milestoneId);

        // Determine what changes were made
        const changes = [];
        if (proposal.amount !== undefined) {
          const originalMilestone = invitation.milestones?.find((m: any) => m.id === proposal.milestoneId);
          changes.push({
            field: 'amount',
            oldValue: originalMilestone?.amount,
            newValue: proposal.amount
          });
        }
        if (proposal.deadline !== undefined) {
          const originalMilestone = invitation.milestones?.find((m: any) => m.id === proposal.milestoneId);
          changes.push({
            field: 'deadline',
            oldValue: originalMilestone?.deadline,
            newValue: proposal.deadline
          });
        }
        if (proposal.title !== undefined) {
          const originalMilestone = invitation.milestones?.find((m: any) => m.id === proposal.milestoneId);
          changes.push({
            field: 'title',
            oldValue: originalMilestone?.title,
            newValue: proposal.title
          });
        }

        return {
          milestoneId: proposal.milestoneId,
          milestoneTitle: milestone?.title || `Milestone ${proposal.milestoneId}`,
          changes,
          reason: proposal.reason || counterReason
        };
      });

      // Send the counter proposals to the backend
      const updatedProject = await projectService.submitCounterProposals(invitation.projectId, formattedProposals);

      setSuccess('Counter proposals sent to client for review. Client will be notified via email.');
      setCounterProposals([]);
      setCounterReason('');
      setShowCounterForm({});
    } catch (error: any) {
      setError(error.message || 'Failed to send counter proposals');
    } finally {
      setLoadingAction(null);
    }
  };

  // Check if all milestones have been accepted without counter proposals
  const hasCounterProposals = counterProposals.length > 0;

  if (authLoading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
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
              onClick={() => router.push('/dashboard/freelancer/invitations')}
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

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Freelancer', href: '/dashboard/freelancer' },
          { name: 'Invitations', href: '/dashboard/freelancer/invitations' },
          { name: 'Invitation Details', current: true }
        ]}
      />
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
                      invitation.status === 'ACCEPTED' ? 'secondary' :
                      invitation.status === 'DECLINED' ? 'destructive' : 'outline'}
            >
              {invitation.status}
            </Badge>
            {invitation.expiresAt && new Date(invitation.expiresAt) < new Date() && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Invitation from {invitation.clientEmail}</p>
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
              <CardDescription>Details about the project you've been invited to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Project Description</h3>
                <p className="text-muted-foreground">
                  {invitation.projectDescription || "This is a project invitation from a client. The project details will be available once you accept the invitation."}
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
                  <h4 className="font-medium mb-1">Client</h4>
                  <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Invitation Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invitation.createdAt || invitation.sentAt || Date.now()).toLocaleDateString()}
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

          {/* Milestones Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Project Milestones</CardTitle>
                </div>
                {hasCounterProposals && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {counterProposals.length} Counter-proposed
                  </Badge>
                )}
              </div>
              <CardDescription>Review and manage the project milestones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {invitation.milestones && invitation.milestones.length > 0 ? (
                invitation.milestones.map((milestone: any, index: number) => {
                  const hasProposal = counterProposals.some(p => p.milestoneId === milestone.id);
                  const proposal = counterProposals.find(p => p.milestoneId === milestone.id);

                  return (
                    <Card key={milestone.id} className={hasProposal ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{index + 1}. {milestone.title}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {milestone.status || 'PENDING'}
                              </Badge>
                              {hasProposal && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs dark:bg-orange-900/50 dark:text-orange-200">
                                  Counter-proposed
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
                            {Array.isArray(milestone.acceptanceCriteria) ? (
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {milestone.acceptanceCriteria.map((criterion, idx) => (
                                  <li key={idx}>{criterion}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">{milestone.acceptanceCriteria}</p>
                            )}
                          </div>

                          {/* Counter Proposal Form */}
                          {showCounterForm[milestone.id] ? (
                            <div className="space-y-3 p-4 bg-muted rounded-lg mt-3 dark:bg-muted/50">
                              <h4 className="font-medium">Counter Proposal</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">New Amount</label>
                                  <Input
                                    type="number"
                                    placeholder={`$${milestone.amount}`}
                                    onChange={(e) => addCounterProposal(milestone.id, 'amount', parseFloat(e.target.value))}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">New Deadline</label>
                                  <Input
                                    type="date"
                                    onChange={(e) => addCounterProposal(milestone.id, 'deadline', new Date(e.target.value))}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">New Title</label>
                                <Input
                                  type="text"
                                  placeholder={milestone.title}
                                  onChange={(e) => addCounterProposal(milestone.id, 'title', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Reason for Changes</label>
                                <Textarea
                                  placeholder="Explain why you're requesting these changes..."
                                  value={proposal?.reason || counterReason}
                                  onChange={(e) => setCounterReason(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    toggleCounterForm(milestone.id);
                                    if (proposal) removeCounterProposal(milestone.id);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => toggleCounterForm(milestone.id)}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => toggleCounterForm(milestone.id)}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              {hasProposal ? 'Edit Counter Proposal' : 'Propose Changes'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-10 w-10 mx-auto mb-2" />
                  <p>No milestone details available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counter Proposals History - if any exist */}
          {counterProposals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Proposed Changes</CardTitle>
                </div>
                <CardDescription>
                  These changes will be sent to the client for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {counterProposals.map((proposal, index) => {
                    const milestone = invitation.milestones?.find((m: any) => m.id === proposal.milestoneId);
                    return (
                      <div key={index} className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone?.title || `Milestone ${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground">Reason: {proposal.reason}</p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                            Pending Response
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                          {proposal.title && (
                            <div>
                              <span className="text-xs text-muted-foreground">Title</span>
                              <p className="text-sm line-through">{milestone?.title}</p>
                              <p className="text-sm font-medium">{proposal.title}</p>
                            </div>
                          )}
                          {proposal.amount && (
                            <div>
                              <span className="text-xs text-muted-foreground">Amount</span>
                              <p className="text-sm line-through">${milestone?.amount}</p>
                              <p className="text-sm font-medium">${proposal.amount}</p>
                            </div>
                          )}
                          {proposal.deadline && (
                            <div>
                              <span className="text-xs text-muted-foreground">Deadline</span>
                              <p className="text-sm line-through">
                                {milestone?.deadline ? new Date(milestone.deadline).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="text-sm font-medium">
                                {new Date(proposal.deadline).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Client Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="font-medium">{invitation.clientEmail.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-medium">Client</h3>
                  <p className="text-sm text-muted-foreground">{invitation.clientEmail}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Rate:</span>
                  <span className="font-medium">98%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projects Posted:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hire Rate:</span>
                  <span className="font-medium">92%</span>
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
                  <span className="font-medium">${invitation.projectBudget || invitation.totalBudget || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funding Status</span>
                  {invitation.escrowStatus === 'HELD' ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Fully Funded</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                  )}
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
                            invitation.status === 'ACCEPTED' ? 'secondary' :
                            invitation.status === 'DECLINED' ? 'destructive' : 'outline'}
                  >
                    {invitation.status}
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
                    {invitation.status === 'PENDING' ? (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Review project details</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Review & propose milestone changes if needed</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>Accept invitation or send counter proposals</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>Begin work if accepted</span>
                        </li>
                      </>
                    ) : invitation.status === 'ACCEPTED' ? (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Invitation accepted</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Access project details</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>Begin work</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Invitation declined</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card - in card design as requested */}
          {invitation.status === 'PENDING' && new Date(invitation.expiresAt) > new Date() && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  {hasCounterProposals
                    ? `${counterProposals.length} change${counterProposals.length !== 1 ? 's' : ''} proposed`
                    : 'Choose how to proceed with this invitation'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!hasCounterProposals ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleAccept}
                      disabled={loadingAction === 'accept'}
                    >
                      {loadingAction === 'accept' ? 'Accepting...' : 'Accept Invitation'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Accept to proceed with project terms
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                      onClick={handleSendCounter}
                      disabled={loadingAction === 'counter'}
                    >
                      {loadingAction === 'counter' ? 'Sending...' : 'Send Changes to Client'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Send proposed changes back to client for review
                    </p>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDecline}
                  disabled={loadingAction === 'decline'}
                >
                  {loadingAction === 'decline' ? 'Declining...' : 'Decline Invitation'}
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  {!hasCounterProposals
                    ? "Your decision will be final."
                    : `Send ${counterProposals.length} change${counterProposals.length !== 1 ? 's' : ''} to client for approval.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}