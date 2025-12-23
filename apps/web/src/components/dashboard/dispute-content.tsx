'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Calendar,
  FileText,
  Search,
  Upload,
  MessageCircle,
  Users,
  Star,
  Clock,
  CheckCircle,
  User,
  Eye,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Activity,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useDisputeStore } from '@/lib/store/disputeStore';
import { messagingService } from '@/lib/api/messagingService';
import { projectService } from '@/lib/api/projectService';
import { Dispute as DisputeType } from '@/types';
import { getMockProjects } from '@/lib/mock-data';
import { ViewToggle } from '@/components/common/ViewToggle';
import { useViewToggle } from '@/hooks/useViewToggle';

// Define types for dispute data
type DisputeStatus = 'OPEN' | 'AUTOMATED_REVIEW' | 'MEDIATION' | 'ARBITRATION' | 'RESOLVED';
type DisputeTypeInternal = 'MILESTONE' | 'CONTRACT' | 'PAYMENT' | 'QUALITY' | 'TIMELINE';

interface DisputeInternal {
  id: string;
  title: string;
  description: string;
  type: DisputeTypeInternal;
  status: DisputeStatus;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneTitle?: string;
  clientId: string;
  freelancerId: string;
  submittedDate: Date;
  deadline?: Date;
  resolutionDate?: Date;
  evidenceSubmitted: boolean;
  mediatorAssigned?: string;
  mediatorRating?: number;
  arbitratorDecision?: string;
  timeline: DisputeEvent[];
}

interface DisputeEvent {
  id: string;
  timestamp: Date;
  actor: 'CLIENT' | 'FREELANCER' | 'SYSTEM' | 'MEDIATOR' | 'ARBITRATOR';
  action: string;
  details: string;
  evidenceUrl?: string;
}

interface DisputeContentProps {
  userType: 'client' | 'freelancer';
}

export function DisputeContent({ userType }: DisputeContentProps) {
  const { user } = useAuthStore();
  const { disputes, loading, error, fetchDisputes, createDispute } = useDisputeStore();
  const [selectedDispute, setSelectedDispute] = useState<DisputeInternal | null>(null);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeInternal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDisputes, setOpenDisputes] = useState<DisputeInternal[]>([]);
  const [resolvedDisputes, setResolvedDisputes] = useState<DisputeInternal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDispute, setNewDispute] = useState({
    title: '',
    description: '',
    type: 'MILESTONE' as DisputeTypeInternal,
    projectId: '',
    milestoneId: ''
  });
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const { currentView, toggleView } = useViewToggle({
    storageKey: `${userType}-disputes-view`
  });

  // Fetch disputes based on user role when component mounts
  useEffect(() => {
    if (user) {
      fetchDisputes(user.id, statusFilter !== 'all' ? statusFilter : undefined);
    }
  }, [user, fetchDisputes, statusFilter]);

  // Update filtered disputes when disputes change
  useEffect(() => {
    let result = disputes && Array.isArray(disputes) ? disputes.map(d => {
      // Convert date strings to Date objects if needed and map to internal format
      // Get project name by finding the project in mock data if project is a string ID
      let projectName = 'Unknown Project';
      if (typeof d.project === 'string') {
        const mockProjects = getMockProjects();
        const project = mockProjects.find(p => p.id === d.project);
        projectName = project ? project.title : d.project;
      } else if (typeof d.project === 'object' && d.project) {
        projectName = (d.project as any).title || 'Unknown Project';
      }

      return {
        id: d._id || d.id || 'unknown',
        title: d.reason || 'Untitled Dispute',
        description: d.reason || '',
        type: 'MILESTONE' as DisputeTypeInternal, // Default type
        status: d.status as DisputeStatus,
        projectId: typeof d.project === 'string' ? d.project : (d.project as any)?._id || '',
        projectName: projectName,
        milestoneId: typeof d.milestone === 'string' ? d.milestone : (d.milestone as any)?._id,
        milestoneTitle: typeof d.milestone === 'string' ? d.milestone : (d.milestone as any)?.title || '',
        clientId: typeof d.raisedBy === 'string' ? d.raisedBy : (d.raisedBy as any)?.id || '',
        freelancerId: '', // This would need to be determined from the project
        submittedDate: d.createdAt ? new Date(d.createdAt) : new Date(),
        deadline: d.deadline ? (typeof d.deadline === 'string' ? new Date(d.deadline) : d.deadline) : undefined,
        resolutionDate: d.resolution?.decidedAt ? new Date(d.resolution.decidedAt) : undefined,
        evidenceSubmitted: !!(d.evidence && d.evidence.length > 0),
        mediatorAssigned: d.mediator ? (typeof d.mediator === 'string' ? d.mediator : (d.mediator as any)?.name || 'Mediator') : undefined,
        mediatorRating: undefined,
        timeline: d.messages ? d.messages.map((msg, idx) => ({
          id: `msg-${idx}`,
          timestamp: msg.sentAt ? (typeof msg.sentAt === 'string' ? new Date(msg.sentAt) : msg.sentAt) : new Date(),
          actor: typeof msg.sender === 'string' ? (msg.sender === d.raisedBy ? 'CLIENT' : 'FREELANCER') : 'SYSTEM',
          action: 'Message sent',
          details: msg.content,
          evidenceUrl: undefined
        })) : []
      };
    }) : [];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(dispute =>
        dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(dispute => dispute.status === statusFilter);
    }

    setFilteredDisputes(result);

    setOpenDisputes(result.filter(d =>
      d.status !== 'RESOLVED' && d.status !== 'AUTOMATED_REVIEW'
    ));

    setResolvedDisputes(result.filter(d =>
      d.status === 'RESOLVED'
    ));
  }, [disputes, searchTerm, statusFilter]);

  // Apply filters to disputes
  useEffect(() => {
    let result = disputes;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(dispute => 
        dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(dispute => dispute.status === statusFilter);
    }

    setFilteredDisputes(result);
  }, [searchTerm, statusFilter, disputes]);

  // Handle creating a new dispute
  const handleCreateDispute = async () => {
    if (!newDispute.title || !newDispute.description || !newDispute.projectId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Use the dispute store's createDispute method which connects to the API
      const createdDispute = await createDispute(newDispute.milestoneId || '', {
        title: newDispute.title,
        description: newDispute.description,
        type: newDispute.type,
        projectId: newDispute.projectId,
        claimantId: user?.id,
        respondentId: newDispute.milestoneId ? undefined : undefined // Will be determined by backend based on project
      });

      // Reset form and close modal
      setNewDispute({
        title: '',
        description: '',
        type: 'MILESTONE' as DisputeTypeInternal,
        projectId: '',
        milestoneId: ''
      });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating dispute:', err);
      alert('Failed to create dispute. Please try again.');
    }
  };

  // Handle input changes for the new dispute form
  const handleNewDisputeChange = (field: keyof typeof newDispute, value: any) => {
    setNewDispute(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle dispute selection
  const handleSelectDispute = async (dispute: DisputeInternal) => {
    try {
      // Fetch the full dispute details from the API
      const fullDispute = await messagingService.getDisputeById(dispute.id);
      // Convert the fullDispute to our internal format
      const convertedDispute: DisputeInternal = {
        ...fullDispute,
        id: fullDispute._id || fullDispute.id,
        title: fullDispute.title || fullDispute.reason || 'Untitled Dispute',
        description: fullDispute.description || fullDispute.reason || '',
        status: fullDispute.status as DisputeStatus,
        type: fullDispute.type as DisputeTypeInternal || 'MILESTONE',
        projectId: fullDispute.project && typeof fullDispute.project === 'object' ? fullDispute.project._id : (fullDispute.project as string) || fullDispute.projectId || '',
        projectName: fullDispute.project && typeof fullDispute.project === 'object' ? fullDispute.project.title : fullDispute.projectName || 'Unknown Project',
        submittedDate: fullDispute.createdAt ? new Date(fullDispute.createdAt) : fullDispute.submittedDate ? new Date(fullDispute.submittedDate) : new Date(),
        deadline: fullDispute.deadline ? new Date(fullDispute.deadline) : undefined,
        resolutionDate: fullDispute.resolution?.decidedAt ? new Date(fullDispute.resolution.decidedAt) : fullDispute.resolutionDate ? new Date(fullDispute.resolutionDate) : undefined,
        evidenceSubmitted: !!(fullDispute.evidence && fullDispute.evidence.length > 0),
        timeline: fullDispute.messages ? fullDispute.messages.map((msg, idx) => ({
          id: `msg-${idx}`,
          timestamp: msg.sentAt ? new Date(msg.sentAt) : new Date(),
          actor: msg.sender === fullDispute.raisedBy ? 'CLIENT' : 'FREELANCER',
          action: 'Message sent',
          details: msg.content,
          evidenceUrl: undefined
        })) : []
      };
      setSelectedDispute(convertedDispute);
    } catch (err) {
      console.error('Error fetching dispute details:', err);
      // Fallback to the dispute passed in if API call fails, ensuring timeline is always defined
      setSelectedDispute({
        ...dispute,
        timeline: dispute.timeline || []
      });
    }
  };

  // Handle back to dispute list
  const handleBackToList = () => {
    setSelectedDispute(null);
  };

  // Handle submitting evidence
  const handleSubmitEvidence = async (disputeId: string, description: string) => {
    try {
      await messagingService.submitDisputeEvidence(disputeId, {
        description,
        files: evidenceFiles
      });

      // Reset evidence form after successful submission
      setEvidenceDescription('');
      setEvidenceFiles([]);
    } catch (err) {
      console.error('Error submitting evidence:', err);
      alert('Failed to submit evidence. Please try again.');
    }
  };

  // Handle joining mediation
  const handleJoinMediation = (disputeId: string) => {
    console.log(`Joining mediation for dispute ${disputeId}`);
  };

  // Handle rating mediator
  const handleRateMediator = (disputeId: string, rating: number) => {
    console.log(`Rating mediator for dispute ${disputeId}: ${rating}`);
  };

  // Function to render the appropriate view based on selectedDispute state
  const renderDisputeView = () => {
    if (!selectedDispute) {
      // List view
      return (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openDisputes.length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedDisputes.length}</div>
                <p className="text-xs text-muted-foreground">Successfully resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Mediation</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {openDisputes.filter(d => d.status === 'MEDIATION').length}
                </div>
                <p className="text-xs text-muted-foreground">In mediation process</p>
              </CardContent>
            </Card>
          </div>

          {/* Dispute Dashboard */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Dispute Dashboard
              </CardTitle>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search disputes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="AUTOMATED_REVIEW">Automated Review</option>
                  <option value="MEDIATION">Mediation</option>
                  <option value="ARBITRATION">Arbitration</option>
                  <option value="RESOLVED">Resolved</option>
                </select>

                <ViewToggle currentView={currentView} onToggle={toggleView} />

                {userType === 'client' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Create Dispute
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {currentView === 'grid' ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredDisputes.length > 0 ? (
                    filteredDisputes.map(dispute => {
                      // Determine status badge variant based on dispute status
                      const getStatusVariant = () => {
                        switch (dispute.status) {
                          case 'RESOLVED':
                            return 'success';
                          case 'OPEN':
                            return 'destructive';
                          case 'MEDIATION':
                            return 'secondary';
                          case 'ARBITRATION':
                            return 'default';
                          case 'AUTOMATED_REVIEW':
                            return 'outline';
                          default:
                            return 'outline';
                        }
                      };

                      // Determine status icon based on dispute status
                      const getStatusIcon = () => {
                        switch (dispute.status) {
                          case 'RESOLVED':
                            return <CheckCircle className="h-4 w-4" />;
                          case 'MEDIATION':
                          case 'AUTOMATED_REVIEW':
                            return <Users className="h-4 w-4" />;
                          case 'ARBITRATION':
                            return <Shield className="h-4 w-4" />;
                          default:
                            return <AlertTriangle className="h-4 w-4" />;
                        }
                      };

                      return (
                        <Card
                          key={dispute.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleSelectDispute(dispute)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{dispute.title}</CardTitle>
                                  <Badge variant={getStatusVariant()} className="capitalize">
                                    {getStatusIcon()}
                                    <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dispute.projectName}
                                  {dispute.milestoneTitle && `: ${dispute.milestoneTitle}`}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span className="capitalize">{dispute.type?.replace('_', ' ') || 'Dispute'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {dispute.submittedDate instanceof Date
                                    ? dispute.submittedDate.toLocaleDateString()
                                    : 'Date unknown'}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {dispute.description}
                            </p>

                            {dispute.status === 'MEDIATION' && dispute.mediatorAssigned && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium mb-1">Mediator</p>
                                <p className="text-sm text-muted-foreground">{dispute.mediatorAssigned}</p>
                              </div>
                            )}

                            {dispute.status === 'RESOLVED' && dispute.arbitratorDecision && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium mb-1">Resolution</p>
                                <p className="text-sm text-muted-foreground">{dispute.arbitratorDecision}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectDispute(dispute);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No disputes found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter to find what you\'re looking for.'
                          : 'You don\'t have any active disputes at the moment.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredDisputes.length > 0 ? (
                    filteredDisputes.map(dispute => {
                      // Define status colors and icons
                      const statusColors: Record<string, string> = {
                        OPEN: 'bg-gray-500',
                        AUTOMATED_REVIEW: 'bg-blue-500',
                        MEDIATION: 'bg-yellow-500',
                        ARBITRATION: 'bg-orange-500',
                        RESOLVED: 'bg-green-500',
                      };

                      const statusIcons: Record<string, any> = {
                        OPEN: Clock,
                        AUTOMATED_REVIEW: AlertTriangle,
                        MEDIATION: Users,
                        ARBITRATION: Shield,
                        RESOLVED: CheckCircle,
                      };

                      const statusLabels: Record<string, string> = {
                        OPEN: 'Open',
                        AUTOMATED_REVIEW: 'Automated Review',
                        MEDIATION: 'In Mediation',
                        ARBITRATION: 'In Arbitration',
                        RESOLVED: 'Resolved',
                      };

                      const StatusIcon = statusIcons[dispute.status] || AlertTriangle;
                      const statusColor = statusColors[dispute.status] || 'bg-gray-500';
                      const statusLabel = statusLabels[dispute.status] || dispute.status;

                      return (
                        <Card
                          key={dispute.id || dispute._id || Math.random().toString(36)}
                          className="border border-border hover:shadow-lg transition-all duration-300 overflow-hidden group hover:-translate-y-0.5"
                          onClick={() => handleSelectDispute(dispute)}
                        >
                          <div className="flex">
                            <div className={`w-1 ${statusColor}`}></div>
                            <div className="flex-1">
                              <div className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className={`p-2 rounded-lg ${statusColor} bg-opacity-10`}>
                                        <StatusIcon className={`h-5 w-5 ${statusColor.replace('bg-', 'text-')}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <CardTitle className="text-lg font-bold truncate max-w-[300px] group-hover:text-primary transition-colors">
                                            {dispute.title}
                                          </CardTitle>
                                          <Badge className={`${statusColors[dispute.status]?.replace('bg-', 'bg-')} text-white`} variant="default">
                                            {statusLabel}
                                          </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                                            <FileText className="h-4 w-4" />
                                            <span className="truncate max-w-[200px]">
                                              {dispute.projectName}
                                              {dispute.milestoneTitle && `: ${dispute.milestoneTitle}`}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="font-medium">{dispute.type}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <p className="text-base text-foreground">
                                        {dispute.description && dispute.description.length > 150
                                          ? `${dispute.description.substring(0, 150)}...`
                                          : dispute.description || 'No description provided'}
                                      </p>
                                    </div>

                                    {dispute.status === 'MEDIATION' && dispute.mediatorAssigned && (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm">Mediator: {dispute.mediatorAssigned || 'Assigned'}</span>
                                        </div>
                                      </div>
                                    )}

                                    <div className="border-t pt-4">
                                      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                                        <div className="flex flex-wrap gap-4">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Created: {dispute.submittedDate instanceof Date ? dispute.submittedDate.toLocaleDateString() : 'Date unknown'}</span>
                                          </div>
                                          {dispute.resolutionDate && (
                                            <div className="flex items-center gap-1">
                                              <CheckCircle className="h-3 w-3" />
                                              <span>Resolved: {dispute.resolutionDate instanceof Date ? dispute.resolutionDate.toLocaleDateString() : 'Date unknown'}</span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <Activity className="h-3 w-3" />
                                          <span className="capitalize">{dispute.status.toLowerCase().replace('_', ' ')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-3 min-w-[180px]">
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-foreground">
                                        {dispute.milestoneTitle || 'Dispute'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {dispute.submittedDate instanceof Date
                                          ? `Submitted ${Math.floor((Date.now() - dispute.submittedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                          : 'Date unknown'}
                                      </div>
                                    </div>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full flex items-center justify-between"
                                    >
                                      <span>View Details</span>
                                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No disputes found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter to find what you\'re looking for.'
                          : 'You don\'t have any active disputes at the moment.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      );
    } else if (selectedDispute?.title) {
      // Individual view - only render if selectedDispute has a title (is properly loaded)
      return (
        <>
          {/* Individual Dispute View */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedDispute.title}</CardTitle>
                  <Badge
                    variant={
                      selectedDispute.status === 'RESOLVED' ? 'success' :
                      selectedDispute.status === 'OPEN' ? 'destructive' :
                      selectedDispute.status === 'MEDIATION' ? 'secondary' :
                      selectedDispute.status === 'ARBITRATION' ? 'default' :
                      'outline'
                    }
                  >
                    {selectedDispute.status ? selectedDispute.status.replace('_', ' ') : 'Unknown Status'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">{selectedDispute.description}</p>
              </div>

              <Button variant="outline" onClick={handleBackToList}>
                Back to List
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Dispute Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dispute Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span>{selectedDispute.projectName}</span>
                    </div>
                    {selectedDispute.milestoneTitle && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Milestone:</span>
                        <span>{selectedDispute.milestoneTitle}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{selectedDispute.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted:</span>
                      <span>
                        {selectedDispute.submittedDate instanceof Date
                          ? selectedDispute.submittedDate.toLocaleDateString()
                          : 'Date unknown'}
                      </span>
                    </div>
                    {selectedDispute.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {selectedDispute.deadline instanceof Date
                            ? selectedDispute.deadline.toLocaleDateString()
                            : typeof selectedDispute.deadline === 'string'
                            ? new Date(selectedDispute.deadline).toLocaleDateString()
                            : 'Date unknown'}
                        </span>
                      </div>
                    )}
                    {selectedDispute.resolutionDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved:</span>
                        <span>
                          {selectedDispute.resolutionDate instanceof Date
                            ? selectedDispute.resolutionDate.toLocaleDateString()
                            : typeof selectedDispute.resolutionDate === 'string'
                            ? new Date(selectedDispute.resolutionDate).toLocaleDateString()
                            : 'Date unknown'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedDispute.mediatorAssigned && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mediator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedDispute.mediatorAssigned}</div>
                          {selectedDispute.mediatorRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{selectedDispute.mediatorRating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {userType === 'client' && selectedDispute.status === 'MEDIATION' && (
                        <Button className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Join Mediation Session
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Evidence Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Client's Evidence</h4>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">No evidence submitted by client</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Freelancer's Evidence</h4>
                      <div className="p-3 border rounded-lg">
                        {selectedDispute.evidenceSubmitted ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Work sample provided</span>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No evidence submitted by freelancer</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {userType === 'client' && selectedDispute.status !== 'RESOLVED' && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Submit Your Evidence</h4>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Describe your evidence or concerns..."
                          value={evidenceDescription}
                          onChange={(e) => setEvidenceDescription(e.target.value)}
                          className="w-full"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="file"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                setEvidenceFiles(Array.from(e.target.files));
                              }
                            }}
                            className="flex-1"
                          />
                          <Button onClick={() => handleSubmitEvidence(selectedDispute.id, evidenceDescription)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Evidence
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Dispute Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDispute.timeline && selectedDispute.timeline.length > 0 ? (
                      selectedDispute.timeline.map(event => (
                        <div key={event.id || Math.random().toString(36)} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                            <div className="h-full w-px bg-muted ml-0.5"></div>
                          </div>
                          <div className="pb-4 flex-1">
                            <div className="flex justify-between">
                              <div>
                                <span className="font-medium">
                                  {event.actor ? event.actor.replace('_', ' ') : 'Unknown Actor'}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  {event.action}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {event.timestamp instanceof Date
                                  ? event.timestamp.toLocaleDateString()
                                  : typeof event.timestamp === 'string'
                                  ? new Date(event.timestamp).toLocaleDateString()
                                  : 'Date unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.details}
                            </p>
                            {event.evidenceUrl && (
                              <Button size="sm" variant="outline" className="mt-2">
                                <FileText className="h-4 w-4 mr-2" />
                                View Evidence
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No timeline events available for this dispute.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resolution */}
              {selectedDispute.arbitratorDecision && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Arbitrator Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {selectedDispute.arbitratorDecision}
                      </p>
                    </div>

                    {userType === 'client' && selectedDispute.mediatorRating === undefined && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Rate Mediator/Arbitrator</h4>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={`star-${star}`}
                              onClick={() => handleRateMediator(selectedDispute.id, star)}
                              className="text-gray-300 hover:text-yellow-400 focus:outline-none"
                            >
                              <Star className="h-6 w-6" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {userType === 'client' && selectedDispute.status === 'MEDIATION' && (
                  <Button onClick={() => handleJoinMediation(selectedDispute.id)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Join Mediation Session
                  </Button>
                )}

                {userType === 'client' && selectedDispute.status === 'ARBITRATION' && (
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Arbitration Details
                  </Button>
                )}

                {userType === 'client' && selectedDispute.status !== 'RESOLVED' && (
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Further Evidence
                  </Button>
                )}

                <Button variant="outline" onClick={handleBackToList}>
                  Back to List
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      );
    } else {
      // Fallback view
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a dispute to view details</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: userType === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${userType}` },
          { name: 'Disputes', current: true }
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Center</h1>
        <p className="text-muted-foreground">
          {userType === 'client'
            ? 'Manage and resolve disputes with freelancers'
            : 'Manage and respond to disputes from clients'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Loading disputes...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-red-500">Error loading disputes: {error}</p>
        </div>
      )}
      {renderDisputeView()}

      {/* Create Dispute Modal - Using Dialog Component */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project</label>
              <select
                value={newDispute.projectId}
                onChange={(e) => handleNewDisputeChange('projectId', e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">Select a project</option>
                {disputes && Array.isArray(disputes) ? disputes.map(dispute => (
                  <option key={dispute.projectId || dispute._id || Math.random().toString(36)} value={dispute.projectId}>
                    {dispute.projectName}
                  </option>
                )) : null}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Milestone (Optional)</label>
              <select
                value={newDispute.milestoneId}
                onChange={(e) => handleNewDisputeChange('milestoneId', e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">Select a milestone (optional)</option>
                {disputes && Array.isArray(disputes)
                  ? disputes
                      .filter(dispute => dispute.projectId === newDispute.projectId && dispute.milestoneId)
                      .map(dispute => (
                        <option key={dispute.milestoneId || Math.random().toString(36)} value={dispute.milestoneId}>
                          {dispute.milestoneTitle}
                        </option>
                      ))
                  : null}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Dispute Type</label>
              <select
                value={newDispute.type}
                onChange={(e) => handleNewDisputeChange('type', e.target.value as DisputeType)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="MILESTONE">Milestone</option>
                <option value="CONTRACT">Contract</option>
                <option value="PAYMENT">Payment</option>
                <option value="QUALITY">Quality</option>
                <option value="TIMELINE">Timeline</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={newDispute.title}
                onChange={(e) => handleNewDisputeChange('title', e.target.value)}
                placeholder="Dispute title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={newDispute.description}
                onChange={(e) => handleNewDisputeChange('description', e.target.value)}
                placeholder="Describe the dispute"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDispute}>
              Create Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DisputeContent;