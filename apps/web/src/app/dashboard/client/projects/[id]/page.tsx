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
  Users,
  XCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/store/projectStore';
import { ProjectSharing } from '@/components/projects/ProjectSharing';
import { FundingStatusCard } from '@/components/projects/FundingStatusCard';
import { MilestoneTracker } from '@/components/projects/MilestoneTracker';
import { ProjectCancellationService } from '@/lib/services/projectCancellationService';

// Mock data for project details
const mockProjects = [
  {
    id: '1',
    title: 'Website Redesign',
    freelancer: {
      name: 'Alex Johnson',
      email: 'alex@designer.com',
      company: 'DesignPro Agency',
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
    freelancer: {
      name: 'Maria Garcia',
      email: 'maria@appdev.com',
      company: 'AppCraft Studios',
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

export default function ClientProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { projects, milestones, changeProposals, initializeDemoData, fetchChangeProposals } = useProjectStore();
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
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [showCancellationModal, setShowCancellationModal] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  useEffect(() => {
    // Initialize auth and demo data when component mounts
    initializeAuth();
    initializeDemoData();
  }, []);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'client')) {
      router.push('/auth/login');
      return;
    }

    // Try to find project in store first
    const storedProject = projects.find((p: any) => p._id === id || p.id === id);

    if (storedProject) {
      // If found in store, use it
      setProject(storedProject);
      // Fetch related change proposals
      fetchChangeProposals((storedProject as any)._id || (storedProject as any).id);
    } else {
      // If not found in store, try mock data
      const foundProject = mockProjects.find((p: any) => p.id === id);
      if (foundProject) {
        setProject(foundProject);
        // Fetch related change proposals for mock project
        fetchChangeProposals(foundProject.id);
      } else {
        setError('Project not found');
      }
    }
  }, [id, isAuthenticated, loading, user?.role, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
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

  const handleApproveChanges = async () => {
    try {
      // In a real app, this would update the milestone with the proposed changes
      // For now, we'll just update the local state
      const updatedMilestone = {
        ...currentMilestone,
        title: proposedChanges.title,
        deadline: new Date(proposedChanges.deadline),
        amount: parseFloat(proposedChanges.amount),
        description: proposedChanges.description
      };

      // Update the milestone in the project
      setProject(prevProject => ({
        ...prevProject,
        milestones: prevProject.milestones.map(m =>
          m.id === currentMilestone.id ? updatedMilestone : m
        )
      }));

      // Update the current milestone state
      setCurrentMilestone(updatedMilestone);

      alert(`Milestone "${updatedMilestone.title}" updated successfully!`);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone. Please try again.');
    }
  };

  const handleRejectChanges = async () => {
    try {
      // In a real app, this would reject the change proposal
      alert(`Changes rejected for milestone "${currentMilestone.title}" successfully!`);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error rejecting changes:', error);
      alert('Failed to reject changes. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProposedChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle cancellation request
  const handleRequestCancellation = () => {
    if (!project) {
      alert('Project not loaded');
      return;
    }

    if (!user) {
      alert('User not authenticated');
      return;
    }

    setShowCancellationModal(true);
  };

  // Handle cancellation confirmation
  const handleConfirmCancellation = async () => {
    if (!project || !user || !cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      // In a real app, this would call the cancellation service
      const cancellationService = ProjectCancellationService.getInstance();

      await cancellationService.requestProjectCancellation(
        (project as any)._id,
        user._id,
        project.freelancerId || 'freelancer-id', // In a real app, this would come from the project data
        cancellationReason
      );

      alert('Cancellation request submitted successfully. The freelancer will be notified and must approve the cancellation before funds are returned to your wallet.');
      setShowCancellationModal(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error requesting project cancellation:', error);
      alert(error instanceof Error ? error.message : 'Failed to request project cancellation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Project Title and Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={`px-3 py-1 rounded-full ${
                project.status === 'In Progress' || project.status === 'ACTIVE' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                project.status === 'Client reviewing' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                project.status === 'Waiting for payment' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                project.status === 'Completed' || project.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600 text-white' :
                project.status === 'PENDING_ACCEPTANCE' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                project.status === 'AWAITING_DEPOSIT' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                project.status === 'CANCELLED' ? 'bg-gray-500 hover:bg-gray-600 text-white' :
                project.status === 'DISPUTED' ? 'bg-red-500 hover:bg-red-600 text-white' :
                'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {project.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">ID: {(project as any)._id}</span>
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
          <Button size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </Button>
          {(project.status === 'ACTIVE' || project.status === 'AWAITING_DEPOSIT' || project.status === 'PENDING_ACCEPTANCE') && (
            <Button variant="destructive" size="sm" onClick={handleRequestCancellation}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Project
            </Button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Progress Visualization */}
            <div className="lg:w-2/3">
              <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span>
                      {project.milestones ?
                        `${Math.round((project.milestones.filter((m: any) => m.status === 'COMPLETED').length / project.milestones.length) * 100)}%` :
                        '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${project.milestones ?
                        (project.milestones.filter((m: any) => m.status === 'COMPLETED').length / project.milestones.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {project.milestones ? project.milestones.filter((m: any) => m.status === 'COMPLETED').length : 0}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">Completed</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      {project.milestones ? project.milestones.filter((m: any) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED').length : 0}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-300">In Progress</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {project.milestones ? project.milestones.filter((m: any) => m.status === 'PENDING').length : 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Stats */}
            <div className="lg:w-1/3">
              <h3 className="text-lg font-semibold mb-4">Project Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{project.fundedAmount?.toLocaleString() || 0} {project.currency || 'USD'} / {project.totalBudget?.toLocaleString() || 0} {project.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium">{project.deliveryDeadlines?.projectEnd ? new Date(project.deliveryDeadlines.projectEnd).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Next Milestone</span>
                  <span className="font-medium">{project.deliveryDeadlines?.nextMilestone ? new Date(project.deliveryDeadlines.nextMilestone).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className="font-medium">
                    {project.deliveryDeadlines?.projectEnd ?
                      Math.ceil((new Date(project.deliveryDeadlines.projectEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Project Details and Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Project Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Project Brief</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Scope of Work</h3>
                <ul className="list-disc list-inside space-y-1">
                  {project.scope.map((item: string, index: number) => (
                    <li key={index} className="text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Milestones Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </div>
                <Button variant="outline" size="sm">Add Milestone</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.milestones?.map((milestone: any, index: number) => (
                  <div
                    key={milestone.id}
                    className={`border rounded-lg p-5 transition-all hover:shadow-md ${
                      milestone.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                      milestone.status === 'IN_PROGRESS' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                      milestone.status === 'SUBMITTED' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                      'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{milestone.title}</h4>
                          <Badge
                            className={`${
                              milestone.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' :
                              milestone.status === 'IN_PROGRESS' ? 'bg-blue-500 hover:bg-blue-600' :
                              milestone.status === 'SUBMITTED' ? 'bg-yellow-500 hover:bg-yellow-600' :
                              'bg-gray-500 hover:bg-gray-600'
                            }`}
                          >
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{milestone.description}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{milestone.amount?.toLocaleString()} {milestone.currency || project.currency || 'USD'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Due: {new Date(milestone.deadline).toLocaleDateString()}</span>
                          </div>

                          {milestone.acceptanceCriteria && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[100px]">{milestone.acceptanceCriteria.substring(0, 20)}...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() => {
                            // Navigate to milestone details page
                            router.push(`/dashboard/client/projects/${(project as any)._id}/milestones/${(milestone as any)._id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() => {
                            // Set current milestone and open edit modal
                            setCurrentMilestone(milestone);
                            setProposedChanges({
                              title: milestone.title || '',
                              deadline: milestone.deadline ? new Date(milestone.deadline).toISOString().split('T')[0] : '',
                              amount: milestone.amount?.toString() || '',
                              description: milestone.description || ''
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar for milestones that are in progress */}
                    {(milestone.status === 'IN_PROGRESS' || milestone.status === 'SUBMITTED') && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>50%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: '50%' }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Freelancer Info and Project Details */}
        <div className="space-y-6">
          {/* Freelancer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Freelancer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="font-medium">{project.freelancer.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-medium">{project.freelancer.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.freelancer.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-muted/50 p-2 rounded">
                  <div className="text-muted-foreground">Rating</div>
                  <div className="font-medium">{project.freelancer.rating}/5</div>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <div className="text-muted-foreground">Response</div>
                  <div className="font-medium">95%</div>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <div className="text-muted-foreground">Projects</div>
                  <div className="font-medium">42</div>
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <div className="text-muted-foreground">Completion</div>
                  <div className="font-medium">98%</div>
                </div>
              </div>

              <Button className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </CardContent>
          </Card>

          {/* Funding Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Funding</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-medium">{project.totalBudget?.toLocaleString()} {project.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funded</span>
                  <span className="font-medium">{project.fundedAmount?.toLocaleString()} {project.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium">{project.remainingAmount?.toLocaleString()} {project.currency || 'USD'}</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Funding Progress</span>
                    <span>{project.fundedAmount && project.totalBudget ?
                      `${Math.round((project.fundedAmount / project.totalBudget) * 100)}%` : '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${project.fundedAmount && project.totalBudget ?
                        (project.fundedAmount / project.totalBudget) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Terms */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contract Terms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Schedule</span>
                  <span className="font-medium">{project.contractTerms.paymentSchedule}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revision Limit</span>
                  <span className="font-medium">{project.contractTerms.revisionLimit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cancellation</span>
                  <span className="font-medium">{project.contractTerms.cancellationPolicy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Warranty</span>
                  <span className="font-medium">{project.contractTerms.warranty}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Sharing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Share Project</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Invite freelancer to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="freelancer@example.com"
                    className="flex-1"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!inviteEmail) {
                        alert('Please enter a valid email address');
                        return;
                      }

                      try {
                        await useProjectStore.getState().inviteFreelancer((project as any)._id, inviteEmail);
                        setInviteEmail(''); // Clear the input after successful invite
                        // Show success message in a real app
                        alert('Freelancer invited successfully!');
                      } catch (error) {
                        console.error('Error inviting freelancer:', error);
                        alert('Failed to invite freelancer. Please try again.');
                      }
                    }}
                  >
                    Invite
                  </Button>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">Or share link:</p>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/dashboard/client/projects/${(project as any)._id}`}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/dashboard/client/projects/${(project as any)._id}`);
                        // In a real app, you might show a success message
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Milestone Modal Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Milestone Changes</DialogTitle>
            <DialogDescription>
              Review the proposed changes to the milestone
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
                <Label htmlFor="description">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explain why these changes are needed"
                  readOnly
                />
              </div>

              <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">Current Values:</p>
                <p className="text-sm text-yellow-700">Title: {currentMilestone.title}</p>
                <p className="text-sm text-yellow-700">Amount: ${currentMilestone.amount}</p>
                <p className="text-sm text-yellow-700">Deadline: {currentMilestone.deadline.toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={handleRejectChanges}>
              Reject
            </Button>
            <Button size="sm" onClick={handleApproveChanges}>
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Cancellation Modal */}
      <Dialog open={showCancellationModal} onOpenChange={setShowCancellationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Project: {project?.title}</DialogTitle>
            <DialogDescription>
              This will request to cancel the project. The freelancer will need to approve this request before funds are returned to your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancellationReason">Reason for Cancellation</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please explain why you want to cancel this project..."
                rows={4}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Note: The freelancer must approve the cancellation before funds are returned to your wallet.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowCancellationModal(false);
                setCancellationReason('');
              }}
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmCancellation}
            >
              Request Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}