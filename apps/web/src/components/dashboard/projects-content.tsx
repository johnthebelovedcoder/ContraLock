'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Project, Milestone } from '@/types';
import { projectService } from '@/lib/api/projectService';
import ProjectCard from '@/components/projects/ProjectCard';
import { ViewToggle } from '@/components/common/ViewToggle';
import { useViewToggle } from '@/hooks/useViewToggle';
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  Clock,
  DollarSign,
  User,
  Copy,
  Archive,
  Eye,
  Star,
  Calendar,
  Check,
  X,
  AlertTriangle,
  MessageCircle,
  FileText,
  Download,
  Send,
  MoreHorizontal
} from 'lucide-react';

// Define the Project type with more specific fields based on requirements
type ProjectStatus = 'DRAFT' | 'PENDING_ACCEPTANCE' | 'AWAITING_DEPOSIT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface Freelancer {
  id: string;
  name: string;
  rating: number;
  skills: string[];
  completionRate: number;
  profilePhoto?: string;
}

interface ProjectWithDetails extends Project {
  freelancer?: Freelancer;
  progress: number; // percentage completed
  pendingReviews: number; // number of submitted milestones awaiting review
  lastActivity: Date;
  budgetSpent: number;
  milestonesCompleted: number;
  totalMilestones: number;
}

interface ProjectsContentProps {
  userType: 'client' | 'freelancer';
}

// Define milestone status based on requirements
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'DISPUTED';

interface MilestoneWithActions extends Milestone {
  projectId: string;
  status: MilestoneStatus;
  amount: number;
  autoApproveCountdown?: number; // days remaining
  deliverablePreview?: string;
  submissionNotes?: string;
}

export function ProjectsContent({ userType }: ProjectsContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [freelancerFilter, setFreelancerFilter] = useState<string>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState<string>('all');
  const { currentView, toggleView } = useViewToggle({
    storageKey: `${userType}-projects-view`
  });

  // Mock data for projects - in a real app, this would come from an API
  useEffect(() => {
    // Mock freelancers data
    const mockFreelancers: Freelancer[] = [
      {
        id: 'freelancer-1',
        name: 'Alex Johnson',
        rating: 4.8,
        skills: ['React', 'TypeScript', 'Node.js'],
        completionRate: 98,
        profilePhoto: '/placeholder-freelancer.jpg'
      },
      {
        id: 'freelancer-2',
        name: 'Sarah Williams',
        rating: 4.9,
        skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
        completionRate: 95,
        profilePhoto: '/placeholder-freelancer.jpg'
      }
    ];

    // Mock projects data
    const mockProjects: ProjectWithDetails[] = [
      {
        id: '1',
        title: 'E-commerce Website Development',
        description: 'Full-stack e-commerce solution with payment integration',
        category: 'Web Development',
        totalBudget: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        clientId: 'client-1',
        freelancerId: 'freelancer-1',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        milestones: [
          { id: 'm1', title: 'Design Phase', description: 'Create wireframes and mockups', amount: 1000, status: 'COMPLETED', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
          { id: 'm2', title: 'Frontend Development', description: 'Implement UI components', amount: 2000, status: 'SUBMITTED', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { id: 'm3', title: 'Backend Development', description: 'API development and database setup', amount: 1500, status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { id: 'm4', title: 'Payment Integration', description: 'Stripe payment system', amount: 500, status: 'PENDING', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        ],
        freelancer: mockFreelancers[0],
        progress: 60,
        pendingReviews: 1,
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        budgetSpent: 3500,
        milestonesCompleted: 2,
        totalMilestones: 4
      },
      {
        id: '2',
        title: 'Mobile App for Task Management',
        description: 'Cross-platform mobile application for task management',
        category: 'Mobile Development',
        totalBudget: 7500,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'PENDING_ACCEPTANCE',
        clientId: 'client-2',
        freelancerId: undefined,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        milestones: [
          { id: 'm5', title: 'Project Planning', description: 'Requirements gathering and planning', amount: 1500, status: 'COMPLETED', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
        ],
        progress: 0,
        pendingReviews: 0,
        lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        budgetSpent: 0,
        milestonesCompleted: 1,
        totalMilestones: 1
      },
      {
        id: '3',
        title: 'Brand Identity Design',
        description: 'Complete brand identity package including logo and guidelines',
        category: 'Design',
        totalBudget: 3000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: 'DRAFT',
        clientId: 'client-3',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        milestones: [],
        progress: 0,
        pendingReviews: 0,
        lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        budgetSpent: 0,
        milestonesCompleted: 0,
        totalMilestones: 0
      },
      {
        id: '4',
        title: 'Content Migration',
        description: 'Migrating content from old CMS to new platform',
        category: 'Web Development',
        totalBudget: 2000,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
        status: 'COMPLETED',
        clientId: 'client-4',
        freelancerId: 'freelancer-2',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        milestones: [
          { id: 'm6', title: 'Content Audit', description: 'Catalog existing content', amount: 500, status: 'COMPLETED', dueDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 79 * 24 * 60 * 60 * 1000) },
          { id: 'm7', title: 'Migration Process', description: 'Migrate content to new platform', amount: 1000, status: 'COMPLETED', dueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000) },
          { id: 'm8', title: 'Review & Testing', description: 'Review migrated content and test functionality', amount: 500, status: 'COMPLETED', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) }
        ],
        freelancer: mockFreelancers[1],
        progress: 100,
        pendingReviews: 0,
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        budgetSpent: 2000,
        milestonesCompleted: 3,
        totalMilestones: 3
      },
    ];

    setProjects(mockProjects);
    setFilteredProjects(mockProjects);
  }, []);

  // Filter projects based on search term and filters
  useEffect(() => {
    let result = projects;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }

    // Apply freelancer filter
    if (freelancerFilter !== 'all') {
      result = result.filter(project =>
        project.freelancerId === freelancerFilter ||
        (freelancerFilter === 'unassigned' && !project.freelancerId)
      );
    }

    // Apply budget range filter
    result = result.filter(project =>
      project.totalBudget >= budgetRange[0] &&
      project.totalBudget <= budgetRange[1]
    );

    setFilteredProjects(result);
  }, [searchTerm, statusFilter, freelancerFilter, budgetRange, projects]);

  const handleViewProject = (projectId: string) => {
    // Navigate to the project details page based on user type
    if (userType === 'client') {
      router.push(`/dashboard/client/projects/${projectId}`);
    } else if (userType === 'freelancer') {
      router.push(`/dashboard/freelancer/projects/${projectId}`);
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const duplicatedProject = await projectService.duplicateProject(projectId);
      // Refresh the projects list to include the new duplicated project
      const updatedProjects = [...projects, duplicatedProject];
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      // Show success message
      console.log('Project duplicated successfully');
    } catch (error) {
      console.error('Error duplicating project:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to duplicate project: ${error.message}`);
      } else {
        alert('Failed to duplicate project. Please try again.');
      }
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      const archivedProject = await projectService.archiveProject(projectId);
      // Update the project status in the local state
      const updatedProjects = projects.map(project =>
        project.id === projectId ? { ...project, status: 'ARCHIVED' } : project
      );
      setProjects(updatedProjects);
      // Also update filtered projects
      const updatedFilteredProjects = filteredProjects.map(project =>
        project.id === projectId ? { ...project, status: 'ARCHIVED' } : project
      );
      setFilteredProjects(updatedFilteredProjects);
      // Show success message
      console.log('Project archived successfully');
    } catch (error) {
      console.error('Error archiving project:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to archive project: ${error.message}`);
      } else {
        alert('Failed to archive project. Please try again.');
      }
    }
  };

  const handleInviteFreelancer = (projectId: string) => {
    // In a real app, this would open the invite freelancer modal
    console.log(`Invite freelancer for project: ${projectId}`);
  };

  const handleAcceptProject = (projectId: string) => {
    // In a real app, this would accept the project
    console.log(`Accepting project: ${projectId}`);
  };

  // Get unique freelancers for the filter dropdown
  const uniqueFreelancers = Array.from(new Set(projects.map(p => p.freelancerId).filter(id => id !== undefined)));

  return (
    <div className="space-y-6">
      <Breadcrumb
        pages={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: userType === 'client' ? 'Client' : 'Freelancer', href: `/dashboard/${userType}` },
          { name: 'Projects', current: true }
        ]}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            {userType === 'client'
              ? 'Manage your projects and milestones'
              : 'View projects you are working on'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle currentView={currentView} onToggle={toggleView} />
          {userType === 'client' && (
            <Button onClick={() => window.location.href = '/dashboard/client/projects/create'}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, p) => sum + p.budgetSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.pendingReviews, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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
              <option value="DRAFT">Draft</option>
              <option value="PENDING_ACCEPTANCE">Pending Acceptance</option>
              <option value="AWAITING_DEPOSIT">Awaiting Deposit</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={freelancerFilter}
              onChange={(e) => setFreelancerFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background"
            >
              <option value="all">All Freelancers</option>
              <option value="unassigned">Unassigned</option>
              {uniqueFreelancers.map(id => (
                <option key={id} value={id}>
                  {projects.find(p => p.freelancerId === id)?.freelancer?.name || id}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Budget"
                value={budgetRange[0]}
                onChange={(e) => setBudgetRange([Number(e.target.value), budgetRange[1]])}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max Budget"
                value={budgetRange[1]}
                onChange={(e) => setBudgetRange([budgetRange[0], Number(e.target.value)])}
                className="w-full"
              />
            </div>

            <select
              value={milestoneStatusFilter}
              onChange={(e) => setMilestoneStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background"
            >
              <option value="all">All Milestone Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {currentView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>

                    {project.freelancer && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{project.freelancer.name.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={project.status === 'ACTIVE' ? 'default' :
                                  project.status === 'PENDING_ACCEPTANCE' ? 'secondary' :
                                  project.status === 'COMPLETED' ? 'success' :
                                  project.status === 'DRAFT' ? 'outline' :
                                  project.status === 'ARCHIVED' ? 'secondary' :
                                  'destructive'}>
                      {project.status.replace('_', ' ')}
                    </Badge>

                    <Badge variant="outline" className="text-xs">
                      {project.category}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Budget and Escrow */}
                    <div className="flex justify-between text-sm">
                      <span>Budget:</span>
                      <span className="font-medium">
                        ${project.budgetSpent?.toLocaleString() ?? '0'} / ${project.totalBudget?.toLocaleString() ?? '0'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {project.totalMilestones > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress:</span>
                          <span>{project.milestonesCompleted} / {project.totalMilestones} milestones</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Pending Reviews */}
                    {project.pendingReviews > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{project.pendingReviews} pending review{project.pendingReviews > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Last Activity */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last activity: {project.lastActivity ? Math.floor((Date.now() - project.lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'} days ago
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>

                      {userType === 'client' && project.status !== 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProject(project.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                      )}

                      {userType === 'client' && project.status !== 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project.id);
                          }}
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || freelancerFilter !== 'all'
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : userType === 'client'
                  ? 'Get started by creating a new project.'
                  : 'No projects are currently assigned to you.'}
              </p>

              {userType === 'client' && !searchTerm && statusFilter === 'all' && freelancerFilter === 'all' && (
                <div className="mt-4">
                  <Button onClick={() => window.location.href = '/dashboard/client/projects/create'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 mt-4">
            <div className="space-y-4">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewProject(project.id)}
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{project.title}</h3>
                        <Badge variant={project.status === 'ACTIVE' ? 'default' :
                                      project.status === 'PENDING_ACCEPTANCE' ? 'secondary' :
                                      project.status === 'COMPLETED' ? 'success' :
                                      project.status === 'DRAFT' ? 'outline' :
                                      project.status === 'ARCHIVED' ? 'secondary' :
                                      'destructive'}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.category}
                        </Badge>

                        {project.freelancer && (
                          <Badge variant="outline" className="text-xs">
                            {project.freelancer.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">${project.budgetSpent?.toLocaleString() ?? '0'} / ${project.totalBudget?.toLocaleString() ?? '0'}</p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>

                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{project.milestonesCompleted} / {project.totalMilestones}</p>
                        <p className="text-xs text-muted-foreground">Milestones</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {userType === 'client' && project.status !== 'ARCHIVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProject(project.id);
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Duplicate
                          </Button>
                        )}

                        {userType === 'client' && project.status !== 'ARCHIVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveProject(project.id);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No projects found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || freelancerFilter !== 'all'
                      ? 'Try adjusting your search or filter to find what you\'re looking for.'
                      : userType === 'client'
                      ? 'Get started by creating a new project.'
                      : 'No projects are currently assigned to you.'}
                  </p>

                  {userType === 'client' && !searchTerm && statusFilter === 'all' && freelancerFilter === 'all' && (
                    <div className="mt-4">
                      <Button onClick={() => window.location.href = '/dashboard/client/projects/create'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Project
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProjectsContent;