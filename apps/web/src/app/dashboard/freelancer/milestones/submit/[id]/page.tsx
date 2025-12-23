'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  ExternalLink,
  File,
  Link as LinkIcon,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/store/projectStore';

// Mock data for milestone details
const mockMilestones = [
  {
    id: '1',
    projectId: '1',
    projectName: 'Website Redesign',
    name: 'Homepage Design',
    amount: 800,
    deadline: '2023-12-10',
    status: 'Paid',
    description: 'Complete design of the homepage with all sections',
    deliverables: ['home-page-design.fig', 'home-page-specs.pdf'],
    links: ['https://preview.com/homepage'],
    notes: 'Client requested a modern look with bold colors',
    submittedAt: '2023-12-05',
    approvedAt: '2023-12-08'
  },
  {
    id: '2',
    projectId: '1',
    projectName: 'Website Redesign',
    name: 'UI/UX Mockups',
    amount: 600,
    deadline: '2023-12-15',
    status: 'In Progress',
    description: 'Complete UI/UX mockups for all website pages',
    deliverables: [],
    links: [],
    notes: ''
  },
  {
    id: '3',
    projectId: '2',
    projectName: 'Mobile App Development',
    name: 'iOS Development',
    amount: 1500,
    deadline: '2023-12-18',
    status: 'In Progress',
    description: 'Develop iOS application based on provided mockups',
    deliverables: [],
    links: [],
    notes: ''
  },
  {
    id: '4',
    projectId: '3',
    projectName: 'Logo Design',
    name: 'Final Delivery',
    amount: 1500,
    deadline: '2023-12-05',
    status: 'In Progress',
    description: 'Final logo files in all required formats',
    deliverables: [],
    links: [],
    notes: ''
  }
];

export default function FreelancerMilestoneSubmitPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const { milestones, fetchMilestones, submitMilestone, initializeDemoData } = useProjectStore();
  const [milestone, setMilestone] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

    // Find the milestone by ID from the store based on the current state passed as props
    // This will be updated when the store changes
    const foundMilestone = milestones.find((m: any) => m._id === id || m.id === id);
    if (foundMilestone) {
      if (foundMilestone.status !== 'IN_PROGRESS' && foundMilestone.status !== 'PENDING') {
        setError('This milestone cannot be submitted at this time');
      } else {
        setMilestone(foundMilestone);
      }
    } else if (milestones.length > 0) {
      // If milestones exist but this one wasn't found, it means it doesn't exist
      setError('Milestone not found');
    }
    // If milestones.length is 0, we'll keep looking as demo data might still be initializing
  }, [id, isAuthenticated, loading, router, user, milestones]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addLinkField = () => {
    setLinks(prev => [...prev, '']);
  };

  const updateLink = (index: number, value: string) => {
    setLinks(prev => prev.map((link, i) => i === index ? value : link));
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(prev => prev.filter((_, i) => i !== index));
    } else {
      setLinks(['']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare submission data
      const submissionData = {
        deliverables: files,
        submissionNotes: notes,
        links: links.filter(l => l.trim() !== ''),
        // Additional acceptance criteria if any
        acceptanceCriteria: [] // For now empty, could be added as form fields if needed
      };

      // Submit the milestone using the store method
      // Ensure id is a string (in case it's an array from params)
      const milestoneId = Array.isArray(id) ? id[0] : id;
      await submitMilestone(milestoneId, submissionData);

      // Update local state to show success
      setSubmitting(false);
      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/freelancer/milestones');
      }, 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitting(false);
      setError(err.message || 'Failed to submit milestone. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'freelancer') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in to access this page</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
          <p className="text-destructive">{error}</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/dashboard/freelancer/milestones')}
          >
            Back to Milestones
          </Button>
        </div>
      </div>
    );
  }

  if (!milestone) {
    // If we have milestones in the store but not the specific one, it means it wasn't found
    if (milestones.length > 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">Milestone Not Found</h3>
            <p className="text-muted-foreground">The milestone you're looking for doesn't exist.</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard/freelancer/milestones')}
            >
              Back to Milestones
            </Button>
          </div>
        </div>
      );
    } else {
      // Still loading or initializing demo data
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-muted-foreground">Loading milestone details...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </div>
        </div>
      );
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Milestone Submitted!</CardTitle>
            <CardDescription>
              Your deliverables have been sent to the client for review
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              The client will review your submission and approve it to release the payment.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push('/dashboard/freelancer/milestones')}>
                View All Milestones
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/dashboard/freelancer/projects/${milestone.projectId}`)}
              >
                View Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{milestone.name}</h1>
        <p className="text-muted-foreground">Submit deliverables for this milestone</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Milestone Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
              <p className="font-medium">{milestone.projectName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
              <p className="font-medium">{milestone.amount} {milestone.currency || 'USD'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Deadline</h3>
              <p className="font-medium">{milestone.deadline}</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-muted-foreground">{milestone.description}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Files */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Upload Deliverables</CardTitle>
                </div>
                <CardDescription>
                  Upload your completed work files for this milestone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <Label htmlFor="files" className="cursor-pointer">
                      <span className="text-sm font-medium">Click to upload</span>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: ZIP, PDF, Figma, PNG, JPG, etc.
                      </p>
                    </Label>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center">
                            <File className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add Links */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Provide Links</CardTitle>
                </div>
                <CardDescription>
                  Add any relevant links like live previews, repositories, or demos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        className="flex-1"
                      />
                      {links.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLink(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLinkField}
                  >
                    Add Another Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Additional Notes</CardTitle>
                </div>
                <CardDescription>
                  Add any important information about this submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe what's included in this submission, any special instructions for the client, or notes about the work..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Preview</CardTitle>
                <CardDescription>
                  Review your submission before sending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Files</h4>
                    {files.length > 0 ? (
                      <ul className="text-sm text-muted-foreground">
                        {files.map((file, index) => (
                          <li key={index} className="flex items-center">
                            <File className="h-3 w-3 mr-1" />
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No files uploaded</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Links</h4>
                    {links.some(link => link.trim() !== '') ? (
                      <ul className="text-sm text-muted-foreground">
                        {links
                          .filter(link => link.trim() !== '')
                          .map((link, index) => (
                            <li key={index} className="flex items-center">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {link.length > 30 ? link.substring(0, 30) + '...' : link}
                              </a>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No links added</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    {notes ? (
                      <p className="text-sm text-muted-foreground">{notes.substring(0, 100)}{notes.length > 100 ? '...' : ''}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes added</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submit Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{milestone.amount} {milestone.currency || 'USD'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">{milestone.deadline}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={`
                      ${milestone.status === 'Not started' ? 'text-gray-600' : 
                        milestone.status === 'In Progress' ? 'text-blue-600' : 
                        milestone.status === 'Submitted' ? 'text-yellow-600' : 
                        milestone.status === 'Awaiting payment' ? 'text-orange-600' : 
                        'text-green-600'}
                    `}>
                      {milestone.status}
                    </Badge>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-4"
                    disabled={submitting || (files.length === 0 && links.every(l => l.trim() === '') && notes.trim() === '')}
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit for Client Review'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    After submission, the client will review your work and approve it to release payment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}