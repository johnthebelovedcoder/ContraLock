'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useProjectStore } from '@/lib/store/projectStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedModal from '@/components/common/EnhancedModal';
import { ViewToggle } from '@/components/common/ViewToggle';
import { useViewToggle } from '@/hooks/useViewToggle';
import {
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  MessageCircle,
  AlertTriangle,
  User,
  DollarSign
} from 'lucide-react';

// Define types for milestone data based on project requirements
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'DISPUTED' | 'COMPLETED';
type ProjectStatus = 'DRAFT' | 'PENDING_ACCEPTANCE' | 'AWAITING_DEPOSIT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  totalBudget: number;
  deadline: Date;
  status: ProjectStatus;
  clientId: string;
  freelancerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Milestone {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  description: string;
  amount: number;
  currency?: string; // Currency of the milestone amount
  status: MilestoneStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  revisionRequestedAt?: Date;
  revisionNotes?: string;
  deliverablePreview?: string;
  submissionNotes?: string;
  autoApproveCountdown?: number; // days remaining
  freelancerId?: string;
  clientId: string;
  acceptanceCriteria?: string;
  order?: number;
  deliverables?: any[]; // Array of deliverable objects
  approvalNotes?: string;
}

export default function ClientMilestonesPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { milestones: rawMilestones, approveMilestone, releasePayment, initializeDemoData, requestRevision, disputeMilestone, createMilestone } = useProjectStore();
  const milestones = rawMilestones as any[];
  const [filteredMilestones, setFilteredMilestones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showActions, setShowActions] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    projectId: ''
  });
  const { currentView, toggleView } = useViewToggle({ storageKey: 'client-milestones-view' });

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();

    // Initialize demo milestones
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  // Filter milestones based on search term and filters
  useEffect(() => {
    let result = Array.isArray(milestones) ? milestones : [];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(milestone => {
        const milestoneAny: any = milestone;
        return (
          milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (milestoneAny.projectTitle && milestoneAny.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
          milestone.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(milestone => milestone.status === statusFilter);
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      result = result.filter(milestone => {
        const milestoneAny: any = milestone;
        return milestoneAny.projectId === projectFilter;
      });
    }

    setFilteredMilestones(result);
  }, [searchTerm, statusFilter, projectFilter, milestones]);

  // Handle approve milestone
  const handleApproveMilestone = (milestoneId: string) => {
    const milestone = Array.isArray(milestones) ? milestones.find(m => m.id === milestoneId) : null;
    if (milestone) {
      setSelectedMilestone(milestone);
      setShowApproveModal(true);
    }
  };

  // Handle approve milestone confirmation
  const confirmApproveMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      // Call the store method to approve the milestone
      await approveMilestone(selectedMilestone.id);
      // Payment is released automatically after approval in our implementation
      await releasePayment(selectedMilestone.id);

      // Show success message
      alert('Milestone approved and payment released successfully!');

      // Close modal and refresh the milestones list
      setShowApproveModal(false);
      setSelectedMilestone(null);
      initializeDemoData(); // This reloads the demo data which includes updated milestone statuses
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone. Please try again.');
    }
  };

  // Handle request revision
  const handleRequestRevision = (milestoneId: string) => {
    const milestone = Array.isArray(milestones) ? milestones.find(m => m.id === milestoneId) : null;
    if (milestone) {
      setSelectedMilestone(milestone);
      setRevisionNotes(''); // Reset notes
      setShowRevisionModal(true);
    }
  };

  // Handle request revision confirmation
  const confirmRequestRevision = async () => {
    if (!selectedMilestone) return;

    if (!revisionNotes.trim()) {
      alert('Please provide revision notes');
      return;
    }

    try {
      console.log(`Requesting revision for milestone: ${selectedMilestone.id}`);
      await requestRevision(selectedMilestone.id, revisionNotes);

      // Show success message
      alert('Revision requested successfully!');

      // Close modal and refresh the milestones list
      setShowRevisionModal(false);
      setSelectedMilestone(null);
      setRevisionNotes('');
      initializeDemoData(); // This reloads the demo data which includes updated milestone statuses
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('Failed to request revision. Please try again.');
    }
  };

  // Handle open dispute
  const handleOpenDispute = (milestoneId: string) => {
    const milestone = Array.isArray(milestones) ? milestones.find(m => m.id === milestoneId) : null;
    if (milestone) {
      setSelectedMilestone(milestone);
      setDisputeReason(''); // Reset reason
      setShowDisputeModal(true);
    }
  };

  // Handle open dispute confirmation
  const confirmOpenDispute = async () => {
    if (!selectedMilestone) return;

    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    try {
      console.log(`Opening dispute for milestone: ${selectedMilestone.id}`);
      await disputeMilestone(selectedMilestone.id, {
        title: 'Dispute Initiated',
        description: disputeReason
      });

      // Show success message
      alert('Dispute opened successfully! The issue will be reviewed.');

      // Close modal and refresh the milestones list
      setShowDisputeModal(false);
      setSelectedMilestone(null);
      setDisputeReason('');
      initializeDemoData(); // This reloads the demo data which includes updated milestone statuses
    } catch (error) {
      console.error('Error opening dispute:', error);
      alert('Failed to open dispute. Please try again.');
    }
  };

  // State for modals
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Handle view milestone
  const handleViewMilestone = (milestoneId: string) => {
    const milestone = Array.isArray(milestones) ? milestones.find(m => m.id === milestoneId) : null;
    if (milestone) {
      setSelectedMilestone(milestone);
      setShowViewModal(true);
    }
  };

  // Handle creating a new milestone
  const handleCreateMilestone = async () => {
    if (!newMilestone.title || !newMilestone.projectId || newMilestone.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const milestoneData = {
        projectId: newMilestone.projectId,
        title: newMilestone.title,
        description: newMilestone.description,
        amount: newMilestone.amount,
        dueDate: newMilestone.dueDate,
        status: 'PENDING',
        clientId: user?._id || 'client-1'
      };

      await createMilestone(milestoneData);
      setNewMilestone({
        title: '',
        description: '',
        amount: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        projectId: ''
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Failed to create milestone. Please try again.');
    }
  };

  // Handle input changes for the new milestone form
  const handleNewMilestoneChange = (field: keyof typeof newMilestone, value: any) => {
    setNewMilestone(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get unique projects for the filter dropdown
  const uniqueProjects = Array.from(new Set(Array.isArray(milestones) ? milestones.map(m => m.projectId) : []));

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading milestones...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to access milestones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Milestone Tracker</h1>
          <p className="text-muted-foreground">
            Review and approve project milestones submitted by freelancers
          </p>
        </div>
        <ViewToggle currentView={currentView} onToggle={toggleView} />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search milestones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REVISION_REQUESTED">Revision Requested</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map(projectId => (
                <SelectItem key={projectId} value={projectId}>
                  {Array.isArray(milestones) && milestones.length > 0 ? (milestones.find((m: any) => m.projectId === projectId) as any)?.projectTitle || projectId : projectId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setShowCreateModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Create Milestone
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(milestones) ? milestones.length : 0}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(milestones) ? milestones.filter(m => m.status === 'SUBMITTED').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(milestones) ? milestones.filter(m => m.status === 'IN_PROGRESS').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(milestones) ? milestones.filter(m => m.status === 'COMPLETED' || m.status === 'APPROVED').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Finished milestones</p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      {currentView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMilestones.length > 0 ? (
            filteredMilestones.map((milestone) => {
              // Determine status badge variant based on milestone status
              const getStatusVariant = () => {
                switch (milestone.status) {
                  case 'COMPLETED':
                  case 'APPROVED':
                    return 'success';
                  case 'SUBMITTED':
                    return 'secondary';
                  case 'REVISION_REQUESTED':
                    return 'destructive';
                  case 'DISPUTED':
                    return 'destructive';
                  case 'IN_PROGRESS':
                    return 'default';
                  case 'PENDING':
                    return 'outline';
                  default:
                    return 'outline';
                }
              };

              // Determine status icon based on milestone status
              const getStatusIcon = () => {
                switch (milestone.status) {
                  case 'COMPLETED':
                  case 'APPROVED':
                    return <CheckCircle className="h-4 w-4" />;
                  case 'SUBMITTED':
                  case 'IN_PROGRESS':
                    return <Clock className="h-4 w-4" />;
                  case 'REVISION_REQUESTED':
                  case 'DISPUTED':
                    return <AlertCircle className="h-4 w-4" />;
                  default:
                    return <FileText className="h-4 w-4" />;
                }
              };

              return (
                <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <Badge variant={getStatusVariant()} className="capitalize">
                            {getStatusIcon()}
                            <span className="ml-1">{milestone.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {milestone.projectTitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{milestone.amount?.toLocaleString() || '0'} {milestone.currency || 'USD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {milestone.dueDate ? milestone.dueDate.toLocaleDateString() : 'No due date'}
                          {milestone.status === 'SUBMITTED' && milestone.autoApproveCountdown !== undefined && (
                            <span className="ml-1 text-amber-600 dark:text-amber-400">
                              (Auto: {milestone.autoApproveCountdown}d)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {milestone.description}
                    </p>

                    {milestone.submissionNotes && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Submission Notes</p>
                        <p className="text-sm text-muted-foreground">{milestone.submissionNotes}</p>
                      </div>
                    )}

                    {milestone.revisionNotes && milestone.status === 'REVISION_REQUESTED' && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium mb-1 text-destructive">Revision Notes</p>
                        <p className="text-sm text-destructive/80">{milestone.revisionNotes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewMilestone(milestone.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>

                      {milestone.status === 'SUBMITTED' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveMilestone(milestone.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestRevision(milestone.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Request Revision
                          </Button>
                        </>
                      )}

                      {milestone.status === 'SUBMITTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDispute(milestone.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Open Dispute
                        </Button>
                      )}

                      {(milestone.status === 'REVISION_REQUESTED' || milestone.status === 'IN_PROGRESS') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDispute(milestone.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Open Dispute
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No milestones found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'You don\'t have any milestones at the moment.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 mt-4">
            <div className="space-y-4">
              {filteredMilestones.length > 0 ? (
                filteredMilestones.map((milestone) => {
                  // Determine status badge variant based on milestone status
                  const getStatusVariant = () => {
                    switch (milestone.status) {
                      case 'COMPLETED':
                      case 'APPROVED':
                        return 'success';
                      case 'SUBMITTED':
                        return 'secondary';
                      case 'REVISION_REQUESTED':
                        return 'destructive';
                      case 'DISPUTED':
                        return 'destructive';
                      case 'IN_PROGRESS':
                        return 'default';
                      case 'PENDING':
                        return 'outline';
                      default:
                        return 'outline';
                    }
                  };

                  // Determine status icon based on milestone status
                  const getStatusIcon = () => {
                    switch (milestone.status) {
                      case 'COMPLETED':
                      case 'APPROVED':
                        return <CheckCircle className="h-4 w-4" />;
                      case 'SUBMITTED':
                      case 'IN_PROGRESS':
                        return <Clock className="h-4 w-4" />;
                      case 'REVISION_REQUESTED':
                      case 'DISPUTED':
                        return <AlertCircle className="h-4 w-4" />;
                      default:
                        return <FileText className="h-4 w-4" />;
                    }
                  };

                  return (
                    <div
                      key={milestone.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{milestone.title}</h3>
                            <p className="text-sm text-muted-foreground">{milestone.projectTitle}</p>
                          </div>
                          <Badge variant={getStatusVariant()} className="capitalize">
                            {getStatusIcon()}
                            <span className="ml-1">{milestone.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>{milestone.amount?.toLocaleString() || '0'} {milestone.currency || 'USD'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {milestone.dueDate ? milestone.dueDate.toLocaleDateString() : 'No due date'}
                              {milestone.status === 'SUBMITTED' && milestone.autoApproveCountdown !== undefined && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400">
                                  (Auto: {milestone.autoApproveCountdown}d)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {milestone.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMilestone(milestone.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {milestone.status === 'SUBMITTED' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveMilestone(milestone.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestRevision(milestone.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Rev
                            </Button>
                          </>
                        )}

                        {milestone.status === 'SUBMITTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDispute(milestone.id)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Dispute
                          </Button>
                        )}

                        {(milestone.status === 'REVISION_REQUESTED' || milestone.status === 'IN_PROGRESS') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDispute(milestone.id)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Dispute
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No milestones found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                      ? 'Try adjusting your search or filter to find what you\'re looking for.'
                      : 'You don\'t have any milestones at the moment.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    {/* Create Milestone Modal */}
    <EnhancedModal
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      title="Create New Milestone"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateMilestone}>
            Create Milestone
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Project</label>
          <Select
            value={newMilestone.projectId}
            onValueChange={(value) => handleNewMilestoneChange('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {uniqueProjects.map(projectId => (
                <SelectItem key={projectId} value={projectId}>
                  {Array.isArray(milestones) && milestones.length > 0 ? (milestones.find((m: any) => m.projectId === projectId) as any)?.projectTitle || projectId : projectId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <Input
            value={newMilestone.title}
            onChange={(e) => handleNewMilestoneChange('title', e.target.value)}
            placeholder="Milestone title"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Input
            value={newMilestone.description}
            onChange={(e) => handleNewMilestoneChange('description', e.target.value)}
            placeholder="Milestone description"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Amount ($)</label>
          <Input
            type="number"
            value={newMilestone.amount}
            onChange={(e) => handleNewMilestoneChange('amount', Number(e.target.value))}
            placeholder="Amount"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Due Date</label>
          <Input
            type="date"
            value={newMilestone.dueDate.toISOString().split('T')[0]}
            onChange={(e) => handleNewMilestoneChange('dueDate', new Date(e.target.value))}
          />
        </div>
      </div>
    </EnhancedModal>

    {/* View Milestone Modal */}
    {showViewModal && selectedMilestone && (
      <EnhancedModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedMilestone.title}
        size="2xl"
        footer={
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
        }
      >
        <div className="space-y-6">
          <p className="text-muted-foreground">{selectedMilestone.projectTitle}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
              <p className="text-lg font-semibold">{selectedMilestone.amount?.toLocaleString() || '0'} {selectedMilestone.currency || 'USD'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <Badge className="capitalize">{selectedMilestone.status.replace('_', ' ')}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
              <p>{selectedMilestone.dueDate ? selectedMilestone.dueDate.toLocaleDateString() : 'No due date'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p>{selectedMilestone.createdAt.toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
            <p className="text-muted-foreground">{selectedMilestone.description}</p>
          </div>

          {selectedMilestone.acceptanceCriteria && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Acceptance Criteria</h4>
              <p className="text-muted-foreground">{selectedMilestone.acceptanceCriteria}</p>
            </div>
          )}

          {selectedMilestone.submissionNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Submission Notes</h4>
              <p className="text-muted-foreground">{selectedMilestone.submissionNotes}</p>
            </div>
          )}

          {selectedMilestone.revisionNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Revision Notes</h4>
              <p className="text-muted-foreground">{selectedMilestone.revisionNotes}</p>
            </div>
          )}
        </div>
      </EnhancedModal>
    )}

    {/* Approve Milestone Modal */}
    {showApproveModal && selectedMilestone && (
      <EnhancedModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Milestone"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApproveMilestone} className="bg-green-600 hover:bg-green-700">
              Approve Milestone
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800">Confirm Approval</h4>
            <p className="text-green-700 mt-1">You are about to approve the milestone: <strong>{selectedMilestone.title}</strong></p>
            <p className="text-green-700 mt-2">Payment of <strong>{selectedMilestone.amount?.toLocaleString() || '0'} {selectedMilestone.currency || 'USD'}</strong> will be released to the freelancer.</p>
          </div>
          <p className="text-sm text-muted-foreground">Are you sure you want to approve this milestone? This action cannot be undone.</p>
        </div>
      </EnhancedModal>
    )}

    {/* Request Revision Modal */}
    {showRevisionModal && selectedMilestone && (
      <EnhancedModal
        isOpen={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setRevisionNotes('');
        }}
        title="Request Revision"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setShowRevisionModal(false);
              setRevisionNotes('');
            }}>
              Cancel
            </Button>
            <Button onClick={confirmRequestRevision}>
              Request Revision
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Milestone</label>
            <p className="font-medium">{selectedMilestone.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Revision Notes</label>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Please describe what needs to be revised..."
              className="w-full p-3 border rounded-md min-h-[100px]"
            />
          </div>
          <p className="text-sm text-muted-foreground">The freelancer will receive your revision request and will need to make the requested changes.</p>
        </div>
      </EnhancedModal>
    )}

    {/* Open Dispute Modal */}
    {showDisputeModal && selectedMilestone && (
      <EnhancedModal
        isOpen={showDisputeModal}
        onClose={() => {
          setShowDisputeModal(false);
          setDisputeReason('');
        }}
        title="Open Dispute"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setShowDisputeModal(false);
              setDisputeReason('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={confirmOpenDispute}
              className="bg-destructive hover:bg-destructive/90"
            >
              Open Dispute
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Milestone</label>
            <p className="font-medium">{selectedMilestone.title}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Dispute Reason</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Please describe the issue that requires dispute resolution..."
              className="w-full p-3 border rounded-md min-h-[100px]"
            />
          </div>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="font-medium text-destructive">Important</h4>
            <p className="text-destructive/80 text-sm mt-1">Opening a dispute will escalate this issue to our dispute resolution team. Please provide detailed information about the problem.</p>
          </div>
        </div>
      </EnhancedModal>
    )}
  </div>
  );
}