'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
  XCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/store/projectStore';
import { useMessagingStore } from '@/lib/store';
import { ProjectSharing } from '@/components/projects/ProjectSharing';
import { FundingStatusCard } from '@/components/projects/FundingStatusCard';
import { MilestoneTracker } from '@/components/projects/MilestoneTracker';
import { projectService } from '@/lib/api/projectService'; // Import for change proposal functionality
import { ProjectCancellationService } from '@/lib/services/projectCancellationService';
import { invoiceService } from '@/lib/services/invoiceService';
import { toast } from 'sonner';

// Mock data for project details
const mockProjects = [
  {
    id: '1',
    title: 'Website Redesign',
    client: {
      name: 'John Smith',
      email: 'john@company.com',
      company: 'ABC Corp',
      avatar: '/placeholder-avatar.jpg'
    },
    status: 'ACTIVE',
    description: 'Complete redesign of the company website with modern UI/UX, responsive design, and improved performance. The project includes creating a new homepage, about page, and product pages with a focus on user experience and conversion optimization.',
    scope: [
      'Homepage design and development',
      'About us page',
      'Product catalog pages',
      'Contact form integration',
      'Mobile responsive design',
      'Performance optimization'
    ],
    escrowAmount: 3000,
    escrowStatus: 'HELD',
    totalBudget: 3000,
    platformFee: 150,
    currency: 'USD',
    milestones: [
      {
        id: 1,
        title: 'Homepage Design',
        amount: 800,
        currency: 'USD',
        deadline: new Date('2023-12-10'),
        status: 'COMPLETED',
        description: 'Design the new homepage with all required sections',
        acceptanceCriteria: 'Homepage includes header, hero section, features, testimonials, and footer',
        order: 1,
        createdAt: new Date('2023-11-25'),
        updatedAt: new Date('2023-12-10'),
        approvedAt: new Date('2023-12-10'),
        deliverables: [
          {
            id: 'd1',
            fileName: 'homepage-mockup.pdf',
            fileType: 'pdf',
            fileSize: 2.4,
            status: 'APPROVED'
          }
        ]
      },
      {
        id: 2,
        title: 'UI/UX Mockups',
        amount: 600,
        currency: 'USD',
        deadline: new Date('2023-12-15'),
        status: 'IN_PROGRESS',
        description: 'Create UI/UX mockups for all main pages',
        acceptanceCriteria: 'All main pages have responsive mockups',
        order: 2,
        createdAt: new Date('2023-11-26'),
        updatedAt: new Date('2023-12-14'),
        submittedAt: new Date('2023-12-14'),
        deliverables: [
          {
            id: 'd2',
            fileName: 'ui-ux-mockups.pdf',
            fileType: 'pdf',
            fileSize: 4.2,
            status: 'SUBMITTED'
          }
        ]
      },
      {
        id: 3,
        title: 'Development Phase',
        amount: 1200,
        currency: 'USD',
        deadline: new Date('2023-12-25'),
        status: 'PENDING',
        description: 'Full development of the website based on approved designs',
        acceptanceCriteria: 'All pages are responsive and interactive',
        order: 3,
        createdAt: new Date('2023-11-27'),
        updatedAt: new Date('2023-11-27')
      },
      {
        id: 4,
        title: 'Testing & Deployment',
        amount: 400,
        currency: 'USD',
        deadline: new Date('2023-12-30'),
        status: 'PENDING',
        description: 'Comprehensive testing and deployment to production',
        acceptanceCriteria: 'All functionality works and website is live',
        order: 4,
        createdAt: new Date('2023-11-28'),
        updatedAt: new Date('2023-11-28')
      }
    ],
    deliveryDeadlines: {
      projectStart: new Date('2023-12-01'),
      projectEnd: new Date('2023-12-30'),
      nextMilestone: new Date('2023-12-15')
    },
    contractTerms: {
      paymentSchedule: 'Milestone-based payments upon completion of each milestone',
      revisionLimit: 2,
      cancellationPolicy: 'Client may cancel with 7 days notice',
      ownership: 'Client retains full ownership of the final deliverables',
      warranty: '30-day warranty period for bug fixes'
    },
    fundingStatus: 'PARTIALLY_FUNDED',
    fundedAmount: 1400,
    remainingAmount: 1600,
    createdAt: new Date('2023-11-25'),
    updatedAt: new Date('2023-12-05')
  },
  {
    id: '2',
    title: 'Mobile App Development',
    client: {
      name: 'Jane Doe',
      email: 'jane@techstart.com',
      company: 'TechStart Inc',
      avatar: '/placeholder-avatar.jpg'
    },
    status: 'ACTIVE',
    description: 'Full-featured mobile application for iOS and Android with backend integration. The app includes user authentication, real-time notifications, and integration with third-party APIs.',
    scope: [
      'iOS mobile app development',
      'Android mobile app development',
      'Backend API development',
      'User authentication system',
      'Real-time notifications',
      'Third-party API integration'
    ],
    escrowAmount: 5200,
    escrowStatus: 'HELD',
    totalBudget: 5200,
    platformFee: 260,
    currency: 'USD',
    milestones: [
      {
        id: 1,
        title: 'UI/UX Design',
        amount: 1000,
        currency: 'USD',
        deadline: new Date('2023-12-05'),
        status: 'COMPLETED',
        description: 'Design the user interface and experience for the app',
        acceptanceCriteria: 'Complete design system and all screen mockups',
        order: 1,
        createdAt: new Date('2023-11-30'),
        updatedAt: new Date('2023-12-05'),
        approvedAt: new Date('2023-12-05'),
        deliverables: [
          {
            id: 'd3',
            fileName: 'app-design-specs.pdf',
            fileType: 'pdf',
            fileSize: 5.3,
            status: 'APPROVED'
          }
        ]
      },
      {
        id: 2,
        title: 'iOS Development',
        amount: 1500,
        currency: 'USD',
        deadline: new Date('2023-12-18'),
        status: 'IN_PROGRESS',
        description: 'Develop iOS version of the mobile application',
        acceptanceCriteria: 'iOS app meets all functional requirements',
        order: 2,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-10'),
        submittedAt: new Date('2023-12-10'),
        deliverables: [
          {
            id: 'd4',
            fileName: 'ios-build.ipa',
            fileType: 'ipa',
            fileSize: 18.7,
            status: 'SUBMITTED'
          }
        ]
      },
      {
        id: 3,
        title: 'Android Development',
        amount: 1500,
        currency: 'USD',
        deadline: new Date('2023-12-25'),
        status: 'PENDING',
        description: 'Develop Android version of the mobile application',
        acceptanceCriteria: 'Android app meets all functional requirements',
        order: 3,
        createdAt: new Date('2023-12-02'),
        updatedAt: new Date('2023-12-02')
      },
      {
        id: 4,
        title: 'Testing & Deployment',
        amount: 700,
        currency: 'USD',
        deadline: new Date('2023-12-30'),
        status: 'PENDING',
        description: 'Comprehensive testing and deployment of both apps',
        acceptanceCriteria: 'Both apps are published and working in production',
        order: 4,
        createdAt: new Date('2023-12-03'),
        updatedAt: new Date('2023-12-03')
      }
    ],
    deliveryDeadlines: {
      projectStart: new Date('2023-12-01'),
      projectEnd: new Date('2023-12-30'),
      nextMilestone: new Date('2023-12-18')
    },
    contractTerms: {
      paymentSchedule: 'Milestone-based payments upon completion of each milestone',
      revisionLimit: 3,
      cancellationPolicy: 'Client may cancel with 14 days notice',
      ownership: 'Client retains full ownership of the final deliverables',
      warranty: '45-day warranty period for bug fixes'
    },
    fundingStatus: 'PARTIALLY_FUNDED',
    fundedAmount: 2500,
    remainingAmount: 2700,
    createdAt: new Date('2023-11-30'),
    updatedAt: new Date('2023-12-05')
  }
];

// Mock data for change proposals
const mockChangeProposals = [
  {
    id: 'proposal-1',
    projectId: '1',
    milestoneId: '2', // Refers to the UI/UX Mockups milestone in project 1
    proposer: 'freelancer',
    status: 'PENDING',
    originalValues: {
      title: 'UI/UX Mockups',
      amount: 600,
      currency: 'USD',
      deadline: new Date('2023-12-15'),
    },
    proposedValues: {
      title: 'UI/UX Mockups and Prototypes',
      amount: 750,
      currency: 'USD',
      deadline: new Date('2023-12-20'),
    },
    reason: 'Additional prototyping work needed based on client feedback',
    createdAt: new Date('2023-12-12'),
    updatedAt: new Date('2023-12-12'),
  },
  {
    id: 'proposal-2',
    projectId: '2',
    milestoneId: '3', // Refers to the Android Development milestone in project 2
    proposer: 'freelancer',
    status: 'APPROVED',
    originalValues: {
      title: 'Android Development',
      amount: 1500,
      currency: 'USD',
      deadline: new Date('2023-12-25'),
    },
    proposedValues: {
      title: 'Android Development',
      amount: 1600,
      currency: 'USD',
      deadline: new Date('2023-12-28'),
    },
    reason: 'Additional features requested by client',
    createdAt: new Date('2023-12-10'),
    updatedAt: new Date('2023-12-11'),
    resolvedAt: new Date('2023-12-11'),
  }
];

export default function FreelancerProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { projects, milestones, changeProposals, initializeDemoData, fetchChangeProposals, fetchProject } = useProjectStore();
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);
  const [proposedChanges, setProposedChanges] = useState({
    title: '',
    deadline: '',
    amount: '',
    description: ''
  });
  const [changeReason, setChangeReason] = useState<string>('');
  const [showCancellationModal, setShowCancellationModal] = useState<boolean>(false);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();
    initializeDemoData();
  }, [initializeAuth, initializeDemoData]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'freelancer')) {
      router.push('/auth/login');
      return;
    }

    // Try to find project in store first
    const storedProject = projects.find((p: any) => p.id === id);

    if (storedProject) {
      // If found in store, use it
      setProject(storedProject);
      // Fetch related change proposals
      fetchChangeProposals(storedProject.id);
    } else {
      // If not found in store, try mock data
      const foundProject = mockProjects.find(p => p.id === id);
      if (foundProject) {
        setProject(foundProject);
        // Fetch related change proposals for mock project
        fetchChangeProposals(foundProject.id);
      } else {
        setError('Project not found');
      }
    }
  }, [id, isAuthenticated, loading, router, user, projects, fetchChangeProposals, initializeDemoData]);

  // Update project data when store milestones or change proposals change
  useEffect(() => {
    if (project && milestones.length > 0) {
      // Find updated project from store if available
      const updatedProjectFromStore = projects.find((p: any) => p.id === id);
      if (updatedProjectFromStore) {
        setProject(updatedProjectFromStore);
      }
    }
  }, [id, projects, milestones, changeProposals]);

  // Check for cancellation requests for this project
  useEffect(() => {
    if (project && user) {
      const cancellationService = ProjectCancellationService.getInstance();
      const requests = cancellationService.getProjectCancellationRequests(project.id);
      setCancellationRequests(requests.filter(req => req.status === 'PENDING'));
    }
  }, [project, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access the project</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  // Use store milestones for the project if available, otherwise fall back to project.milestones
  const projectMilestones = milestones.filter((m: any) => m.projectId === project.id);
  const displayMilestones = projectMilestones.length > 0 ? projectMilestones : project.milestones || [];

  const handleEditMilestone = (milestone: any) => {
    setCurrentMilestone(milestone);
    setProposedChanges({
      title: milestone.title || '',
      deadline: milestone.deadline ? milestone.deadline.toISOString().split('T')[0] : '',
      amount: milestone.amount.toString() || '',
      description: milestone.description || ''
    });
    setShowEditModal(true);
  };

  const handleProposeChanges = async () => {
    try {
      // Prepare the change proposal data
      const proposalData = {
        projectId: project.id,
        milestoneId: currentMilestone.id,
        proposer: 'freelancer', // Since the freelancer is proposing the change
        originalValues: {
          title: currentMilestone.title,
          description: currentMilestone.description,
          deadline: currentMilestone.deadline,
          amount: currentMilestone.amount
        },
        proposedValues: {
          title: proposedChanges.title || currentMilestone.title,
          description: proposedChanges.description || currentMilestone.description,
          deadline: proposedChanges.deadline ? new Date(proposedChanges.deadline) : currentMilestone.deadline,
          amount: proposedChanges.amount ? parseFloat(proposedChanges.amount) : currentMilestone.amount
        },
        reason: changeReason
      };

      // Create the change proposal using the store
      await projectService.createChangeProposal(proposalData);

      // Refetch change proposals to update the UI
      await fetchChangeProposals(project.id);

      // Show success feedback
      alert(`Changes proposed for milestone "${currentMilestone.title}" successfully!

The client will be notified and can approve or reject these changes.`);

      setShowEditModal(false);
      setChangeReason('');
    } catch (error) {
      console.error('Error creating change proposal:', error);
      alert('Failed to propose changes. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProposedChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle messaging the client
  const handleMessageClient = () => {
    // In a real app, this would navigate to the messaging interface
    // For now, we'll navigate to the messages page
    window.location.href = `/dashboard/freelancer/messages?projectId=${project.id}`;
  };

  // Handle viewing the contract
  const handleViewContract = () => {
    // In a real app, this would open the contract in a modal or navigate to a contract view page
    // For now, we'll show an alert with contract details
    alert(`Viewing contract for project: ${project.title}\n\nContract details would be displayed here.`);
  };

  // Handle submitting an invoice
  const handleSubmitInvoice = () => {
    // In a real app, this would open an invoice creation form
    // For now, we'll navigate to a hypothetical invoice creation page
    window.location.href = `/dashboard/freelancer/projects/${project.id}/invoice`;
  };

  // Handle submitting a milestone for client review
  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      // Find the milestone to get its acceptance criteria
      const milestone = displayMilestones.find((m: any) => m.id === milestoneId);

      if (!milestone) {
        alert('Milestone not found');
        return;
      }

      // In a real app, this would collect deliverables and submission notes
      // For now, we'll simulate the submission with proper data
      const submissionData = {
        deliverables: [], // In a real app, these would be the actual deliverable files
        submissionNotes: `Milestone "${milestone.title}" completed and ready for review.`
      };

      // Call the API to submit the milestone
      await projectService.submitMilestone(milestoneId, submissionData);

      // Show success message
      toast.success('Milestone submitted successfully! The client will be notified for review.');

      // Update the milestone status in the UI immediately
      setProject(prevProject => {
        if (!prevProject) return prevProject;

        return {
          ...prevProject,
          milestones: prevProject.milestones.map((m: any) =>
            m.id === milestoneId
              ? { ...m, status: 'SUBMITTED', submittedAt: new Date() }
              : m
          )
        };
      });
    } catch (error: any) {
      console.error('Error submitting milestone:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit milestone';
      toast.error(`Failed to submit milestone: ${errorMessage}`);
    }
  };

  // Handle responding to a cancellation request
  const handleRespondToCancellation = async (requestId: string, action: 'approve' | 'reject') => {
    if (!user) {
      alert('You must be logged in to respond to cancellation requests');
      return;
    }

    try {
      const cancellationService = ProjectCancellationService.getInstance();

      if (action === 'approve') {
        await cancellationService.approveCancellation(requestId, user.id);
        alert('Cancellation approved. Funds will be returned to the client.');
      } else {
        await cancellationService.rejectCancellation(requestId, user.id);
        alert('Cancellation request rejected.');
      }

      // Refresh cancellation requests
      if (project) {
        const requests = cancellationService.getProjectCancellationRequests(project.id);
        setCancellationRequests(requests.filter(req => req.status === 'PENDING'));
      }
    } catch (error) {
      console.error('Error responding to cancellation request:', error);
      alert(error instanceof Error ? error.message : 'Failed to respond to cancellation request');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Freelancer', href: '/dashboard/freelancer' },
          { name: 'Projects', href: '/dashboard/freelancer/projects' },
          { name: project.title, current: true }
        ]}
      />
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project?.title || 'Unknown Project'}</h1>
          <p className="text-muted-foreground mt-1">Project ID: {project?.id || 'N/A'}</p>
        </div>
        <Badge
          className={`px-3 py-1 rounded-full ${
            project?.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            project?.status === 'Client reviewing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            project?.status === 'Waiting for payment' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
            project?.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            project?.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            project?.status === 'PENDING_ACCEPTANCE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            project?.status === 'AWAITING_DEPOSIT' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
            project?.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            project?.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300' :
            project?.status === 'DISPUTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'
          }`}
        >
          {project?.status?.replace('_', ' ') || 'Unknown'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Project Overview</CardTitle>
              </div>
              <CardDescription>Details about the project scope and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Project Brief</h3>
                <p className="text-muted-foreground">{project.description || 'No description available'}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Scope of Work</h3>
                <ul className="list-disc list-inside space-y-1">
                  {(project.scope || []).map((item: string, index: number) => (
                    <li key={index} className="text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Funding Status Card */}
          <FundingStatusCard project={project} />

          {/* Milestone Tracker */}
          <MilestoneTracker
            milestones={displayMilestones}
            onEditMilestone={handleEditMilestone}
            onSubmitMilestone={handleSubmitMilestone}
            currentUserRole="freelancer"
            onViewDeliverables={(milestoneId) => {
              // In a real app, this would open deliverables viewer
              const milestone = displayMilestones.find(m => m.id === milestoneId);
              if (milestone) {
                alert(`Opening deliverables for milestone: ${milestone.title}`);
              }
            }}
          />

          {/* Contract Terms Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contract Terms</CardTitle>
              </div>
              <CardDescription>Agreed terms for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Payment Schedule</h4>
                  <p className="text-sm text-muted-foreground">{project.contractTerms?.paymentSchedule || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Revision Limit</h4>
                  <p className="text-sm text-muted-foreground">{project.contractTerms?.revisionLimit || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Cancellation Policy</h4>
                  <p className="text-sm text-muted-foreground">{project.contractTerms?.cancellationPolicy || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Ownership</h4>
                  <p className="text-sm text-muted-foreground">{project.contractTerms?.ownership || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-1">Warranty</h4>
                  <p className="text-sm text-muted-foreground">{project.contractTerms?.warranty || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Proposals Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Change Proposals</CardTitle>
              </div>
              <CardDescription>Proposed changes to milestones and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayMilestones.map((milestone: any) => {
                  // Find any change proposals for this specific milestone
                  const milestoneProposals = changeProposals.filter((proposal: any) =>
                    proposal.milestoneId === milestone.id && proposal.projectId === project.id
                  );

                  return milestoneProposals.length > 0 ? (
                    milestoneProposals.map((proposal: any) => (
                      <div key={proposal.id} className="border rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Change to "{milestone.title}"</h4>
                            <p className="text-sm text-muted-foreground mt-1">{proposal.reason}</p>
                          </div>
                          <Badge
                            variant={
                              proposal.status === 'APPROVED' ? 'secondary' :
                              proposal.status === 'REJECTED' ? 'destructive' :
                              'default'
                            }
                          >
                            {proposal.status}
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium">Original</p>
                            {proposal.originalValues.title && (
                              <p><span className="text-muted-foreground">Title:</span> {proposal.originalValues.title}</p>
                            )}
                            {proposal.originalValues.amount && (
                              <p><span className="text-muted-foreground">Amount:</span> {proposal.originalValues.amount} {project?.currency || 'USD'}</p>
                            )}
                            {proposal.originalValues.deadline && (
                              <p><span className="text-muted-foreground">Deadline:</span> {new Date(proposal.originalValues.deadline).toLocaleDateString()}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium">Proposed</p>
                            {proposal.proposedValues.title && (
                              <p><span className="text-muted-foreground">Title:</span> {proposal.proposedValues.title}</p>
                            )}
                            {proposal.proposedValues.amount && (
                              <p><span className="text-muted-foreground">Amount:</span> {proposal.proposedValues.amount} {project?.currency || 'USD'}</p>
                            )}
                            {proposal.proposedValues.deadline && (
                              <p><span className="text-muted-foreground">Deadline:</span> {new Date(proposal.proposedValues.deadline).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <p>Proposed by: {proposal.proposer} on {new Date(proposal.createdAt).toLocaleDateString()}</p>
                          {proposal.status === 'PENDING' && proposal.proposer === 'freelancer' && (
                            <p className="text-xs text-blue-600 mt-1">Waiting for client approval</p>
                          )}
                          {proposal.status === 'PENDING' && proposal.proposer === 'client' && (
                            <p className="text-xs text-blue-600 mt-1">Waiting for your review</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div key={milestone.id} className="text-center py-4 text-muted-foreground">
                      No change proposals for milestone "{milestone.title}"
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Client Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="font-medium">{project.client?.name?.charAt(0) || '?'}</span>
                </div>
                <div>
                  <h3 className="font-medium">{project.client?.name || 'Unknown Client'}</h3>
                  <p className="text-sm text-muted-foreground">{project.client?.company || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{project.client?.email || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Sharing */}
          <ProjectSharing
            project={project}
            onToggleSharing={(projectId, enabled) => {
              // Call update function from store
              useProjectStore.getState().toggleProjectSharing(projectId, enabled);
            }}
            onInviteByEmail={async (projectId, email) => {
              // In a real app, this would call the backend to invite via email
              // For mock app, we'll just show a success message
              alert(`Invitation sent to ${email} for project ${projectId}`);
            }}
          />

          {/* Delivery Deadlines Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Delivery Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Start</span>
                  <span>{project.deliveryDeadlines?.projectStart ? new Date(project.deliveryDeadlines.projectStart).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project End</span>
                  <span>{project.deliveryDeadlines?.projectEnd ? new Date(project.deliveryDeadlines.projectEnd).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Milestone</span>
                  <span>{project.deliveryDeadlines?.nextMilestone ? new Date(project.deliveryDeadlines.nextMilestone).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleMessageClient}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Client
                </Button>
                <Button variant="outline" className="w-full" onClick={handleViewContract}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
                <Button className="w-full" onClick={handleSubmitInvoice}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Submit Invoice
                </Button>

                {/* Show cancellation request alerts if any exist */}
                {cancellationRequests.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Cancellation Request
                    </h4>
                    <div className="space-y-2">
                      {cancellationRequests.map(request => (
                        <div key={request.id} className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">{request.reason}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 text-xs h-7"
                              onClick={() => handleRespondToCancellation(request.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-7"
                              onClick={() => handleRespondToCancellation(request.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Edit Milestone Modal Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Propose Changes to Milestone</DialogTitle>
            <DialogDescription>
              Make changes to the milestone and send to the client for approval
            </DialogDescription>
          </DialogHeader>
          {currentMilestone && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={proposedChanges.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Milestone title"
                />
              </div>

              <div>
                <Label htmlFor="deadline">New Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={proposedChanges.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="amount">New Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={proposedChanges.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Amount"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={proposedChanges.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Milestone description"
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason for Changes</Label>
                <Textarea
                  id="reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explain why these changes are needed"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleProposeChanges}>
              Propose Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}