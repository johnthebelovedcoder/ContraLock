'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  User,
  File,
  MessageCircle,
  Eye,
  Edit3,
  Upload,
  Download,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/store/projectStore';

export default function MilestoneDetailPage() {
  const { id: projectId, milestoneId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { projects, milestones, fetchMilestones, updateMilestone, startMilestone, submitMilestone, approveMilestone, requestRevision } = useProjectStore();
  const [project, setProject] = useState<any>(null);
  const [milestone, setMilestone] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>(['']);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'client')) {
      router.push('/auth/login');
      return;
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (projectId) {
      // Fetch milestones for the project
      fetchMilestones(projectId as string);
    }
  }, [projectId, fetchMilestones]);

  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const foundProject = projects.find((p: any) => p._id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }
    }

    if (projectId) {
      // Fetch project and its milestones
      const fetchData = async () => {
        try {
          await useProjectStore.getState().fetchProject(projectId as string);
          await fetchMilestones(projectId as string);
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      };
      fetchData();
    }
  }, [projects, projectId, fetchMilestones]);

  // Get the project from the store after fetching
  const { currentProject } = useProjectStore();
  useEffect(() => {
    if (currentProject && (currentProject as any)._id === projectId) {
      setProject(currentProject);
    }
  }, [currentProject, projectId]);

  useEffect(() => {
    let foundMilestone = null;

    // Helper function to check if milestone matches
    const milestoneMatches = (milestone: any, id: string) => {
      // Direct match
      if (milestone.id === id) return true;

      // Check if the id is just a number that might match the numeric part of the milestone ID
      // For example, if id is "3" and milestone.id is "ms-3"
      if (id.match(/^\d+$/)) { // Check if id is just digits
        // Look for patterns like "ms-3", "milestone-3", etc.
        const match = milestone.id.match(/[a-zA-Z]*-?(\d+)$/);
        if (match) {
          return match[1] === id;
        }
      }

      return false;
    };

    // First try to find in project
    if (project && project.milestones && Array.isArray(project.milestones)) {
      foundMilestone = project.milestones.find((m: any) => milestoneMatches(m, milestoneId as string));
    }

    // If not found in project, try to find in store milestones
    if (!foundMilestone && milestones && Array.isArray(milestones)) {
      foundMilestone = milestones.find((m: any) => milestoneMatches(m, milestoneId as string));
    }

    if (foundMilestone) {
      setMilestone(foundMilestone);
      setDeliverables(foundMilestone.deliverables || []);
    }
  }, [project, milestones, milestoneId, projectId]); // Added projectId to the dependency array

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading milestone details...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access the milestone</p>
      </div>
    );
  }

  if (!project && !currentProject) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!milestone) {
    // If project exists but milestone doesn't, it might still be loading
    // Check if we have the project with milestones or if milestones are loading
    const hasProjectMilestones = project && project.milestones && Array.isArray(project.milestones);
    const hasStoreMilestones = milestones && Array.isArray(milestones);
    const hasProject = project && project.id === projectId;
    const isStillLoading = loading || (hasProject && !hasProjectMilestones && !hasStoreMilestones);

    if (isStillLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Loading milestone...</p>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Milestone not found</p>
        </div>
      );
    }
  }

  const handleAddLink = () => {
    setLinks([...links, '']);
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    if (links.length > 1) {
      const newLinks = [...links];
      newLinks.splice(index, 1);
      setLinks(newLinks);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleApproveMilestone = async () => {
    try {
      await approveMilestone(milestone.id, submissionNotes);
      setShowApproveModal(false);
      // Refresh milestone data
      fetchMilestones(projectId as string);
      // Also refresh project data to update milestone status
      if (projectId) {
        await useProjectStore.getState().fetchProject(projectId as string);
      }
      alert('Milestone approved successfully!');
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone. Please try again.');
    }
  };

  const handleRequestRevision = async () => {
    try {
      await requestRevision(milestone.id, revisionNotes);
      setShowRevisionModal(false);
      // Refresh milestone data
      fetchMilestones(projectId as string);
      // Also refresh project data to update milestone status
      if (projectId) {
        await useProjectStore.getState().fetchProject(projectId as string);
      }
      alert('Revision requested successfully!');
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('Failed to request revision. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{milestone.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(milestone.status)}>
              {milestone.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">Milestone #{milestone.order || 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Contract
          </Button>
        </div>
      </div>

      {/* Milestone Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Milestone Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-muted-foreground">{milestone.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">${milestone.amount?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium">{milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{milestone.createdAt ? new Date(milestone.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Acceptance Criteria</h3>
            <p className="text-muted-foreground">{milestone.acceptanceCriteria || 'No acceptance criteria specified'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Deliverables</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {deliverables.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliverables.length > 0 ? (
              deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded p-2">
                      <File className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{deliverable.fileName}</p>
                      <p className="text-xs text-muted-foreground">{deliverable.fileType} • {(deliverable.fileSize || 0).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={deliverable.status === 'APPROVED' ? 'default' : 
                                   deliverable.status === 'SUBMITTED' ? 'secondary' : 
                                   'outline'}>
                      {deliverable.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No deliverables submitted yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Notes */}
      {milestone.submissionNotes && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Submission Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground whitespace-pre-line">{milestone.submissionNotes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Links */}
      {milestone.submissionLinks && milestone.submissionLinks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Submission Links</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestone.submissionLinks.map((link: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {link}
                  </a>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {milestone.status === 'SUBMITTED' && user?.role === 'client' && (
          <>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowRevisionModal(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              Request Revision
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowApproveModal(true)}
            >
              <Check className="h-4 w-4" />
              Approve Milestone
            </Button>
          </>
        )}
        
        {milestone.status === 'IN_PROGRESS' && user?.role === 'client' && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              // In a real app, this might start the milestone
              console.log('Starting milestone:', milestone.id);
            }}
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Started
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => router.push(`/dashboard/client/projects/${projectId}`)}
        >
          <RotateCcw className="h-4 w-4" />
          Back to Project
        </Button>
      </div>

      {/* Approve Milestone Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Milestone</DialogTitle>
            <DialogDescription>
              Confirm that you want to approve this milestone. This will release the payment to the freelancer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Approval Notes (Optional)</label>
              <Textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Add any feedback or notes for the freelancer..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveMilestone}>
              Approve Milestone
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Revision Modal */}
      <Dialog open={showRevisionModal} onOpenChange={setShowRevisionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Provide feedback to the freelancer about what needs to be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Revision Notes</label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Describe what needs to be revised..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRevisionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestRevision}>
              Request Revision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}