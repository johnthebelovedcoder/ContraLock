'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MilestoneForm } from '@/components/projects/MilestoneForm';
import { useProjectStore } from '@/lib/store/projectStore';
import { Project, Milestone } from '@/types';
import { Check, X, Plus, ArrowLeft, ArrowRight, DollarSign, Clock, Calendar, FileText, DollarIcon } from 'lucide-react';

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  totalBudget: number;
  deadline: Date;
  autoApprovalPeriod: number;
  maxRevisionsPerMilestone: number;
}

export function ProjectCreationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    totalBudget: 0,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
    autoApprovalPeriod: 7, // Default: 7 days
    maxRevisionsPerMilestone: 2, // Default: 2 revisions
  });
  const [milestones, setMilestones] = useState<(Omit<Milestone, 'deadline'> & { deadline: Date })[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const { createProject, loading } = useProjectStore();

  // Step 1: Project Details
  const ProjectDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            value={projectData.title}
            onChange={(e) => setProjectData({...projectData, title: e.target.value})}
            placeholder="e.g., E-commerce Website Development"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={projectData.category} onValueChange={(value) => setProjectData({...projectData, category: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select project category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web-dev">Web Development</SelectItem>
              <SelectItem value="mobile-dev">Mobile Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="content">Content Writing</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={projectData.description}
            onChange={(e) => setProjectData({...projectData, description: e.target.value})}
            placeholder="Describe your project requirements in detail..."
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Total Budget ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                value={projectData.totalBudget || ''}
                onChange={(e) => setProjectData({...projectData, totalBudget: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="deadline">Project Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={projectData.deadline.toISOString().split('T')[0]}
              onChange={(e) => setProjectData({...projectData, deadline: new Date(e.target.value)})}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="autoApproval">Auto-Approval Period (days)</Label>
            <Input
              id="autoApproval"
              type="number"
              value={projectData.autoApprovalPeriod}
              onChange={(e) => setProjectData({...projectData, autoApprovalPeriod: parseInt(e.target.value) || 7})}
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Time before a milestone is auto-approved if not reviewed
            </p>
          </div>
          
          <div>
            <Label htmlFor="maxRevisions">Max Revisions per Milestone</Label>
            <Input
              id="maxRevisions"
              type="number"
              value={projectData.maxRevisionsPerMilestone}
              onChange={(e) => setProjectData({...projectData, maxRevisionsPerMilestone: parseInt(e.target.value) || 2})}
              min="1"
              max="5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of revision requests allowed per milestone
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Milestones Setup
  const MilestonesStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Milestone Setup</CardTitle>
        <p className="text-sm text-muted-foreground">
          Break down your project into milestones to be completed sequentially
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={milestone.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Milestone {index + 1}: {milestone.title}</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount:</span> ${milestone.amount}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span> {milestone.deadline.toLocaleDateString()}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Description:</span> {milestone.description}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <MilestoneForm 
            onAddMilestone={(milestone) => setMilestones([...milestones, milestone])}
            projectStartDate={new Date()}
            projectEndDate={projectData.deadline}
            remainingBudget={projectData.totalBudget - milestones.reduce((sum, m) => sum + m.amount, 0)}
          />
          
          {milestones.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex justify-between font-medium">
                <span>Remaining Budget:</span>
                <span>${(projectData.totalBudget - milestones.reduce((sum, m) => sum + m.amount, 0)).toFixed(2)}</span>
              </div>
              {projectData.totalBudget - milestones.reduce((sum, m) => sum + m.amount, 0) !== 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Milestone amounts must sum to total budget (${projectData.totalBudget.toFixed(2)})
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Funding Confirmation
  const FundingStep = () => {
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const platformFee = totalMilestoneAmount * 0.05; // 5% platform fee
    const totalAmount = totalMilestoneAmount + platformFee;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Summary */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Project Title:</span>
                      <span className="font-medium">{projectData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="font-medium">{projectData.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="font-medium">{projectData.deadline.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auto-Approval Period:</span>
                      <span className="font-medium">{projectData.autoApprovalPeriod} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Revisions:</span>
                      <span className="font-medium">{projectData.maxRevisionsPerMilestone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{milestone.title}</div>
                          <div className="text-sm text-muted-foreground">{milestone.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${milestone.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {milestone.deadline.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Funding Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totalMilestoneAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (5%):</span>
                      <span>${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="mt-4">
                      <Label>Payment Method</Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card-1">Credit Card ending in 4242</SelectItem>
                          <SelectItem value="card-2">Credit Card ending in 5678</SelectItem>
                          <SelectItem value="bank">Bank Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      disabled={!selectedPaymentMethod || totalMilestoneAmount !== projectData.totalBudget}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Confirm Funding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 4: Review & Submit
  const ReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{projectData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{projectData.category.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="font-medium">${projectData.totalBudget.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">{projectData.deadline.toLocaleDateString()}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{projectData.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{index + 1}. {milestone.title}</h4>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${milestone.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {milestone.deadline.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p>Your project will be submitted with the following status:</p>
                <div className="flex justify-center my-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    PENDING ACCEPTANCE
                  </Badge>
                </div>
                <p>
                  After submission, you can invite freelancers to work on your project. 
                  They will need to accept the project before they can start working.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="w-full md:w-auto"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating Project...' : 'Submit Project'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleSubmit = async () => {
    if (milestones.reduce((sum, m) => sum + m.amount, 0) !== projectData.totalBudget) {
      alert('Milestone amounts must sum to total budget');
      return;
    }
    
    try {
      // Prepare project data for submission
      const projectToCreate: Omit<Project, 'id' | 'clientId' | 'createdAt' | 'updatedAt' | 'milestones'> & { milestones: any[] } = {
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        totalBudget: projectData.totalBudget,
        timeline: `Until ${projectData.deadline.toLocaleDateString()}`,
        deadline: projectData.deadline,
        status: 'PENDING_ACCEPTANCE', // Start with pending acceptance
        freelancerId: undefined, // No freelancer assigned yet
        escrowAmount: projectData.totalBudget * 1.05, // Including platform fee
        escrowStatus: 'NOT_DEPOSITED', // Will be updated after funding
        platformFee: projectData.totalBudget * 0.05,
        paymentProcessingFee: 0,
        autoApprovalPeriod: projectData.autoApprovalPeriod,
        maxRevisionsPerMilestone: projectData.maxRevisionsPerMilestone,
        milestones: milestones.map(m => ({
          ...m,
          deadline: m.deadline.toISOString(),
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      };

      // Call the store to create the project
      await createProject(projectToCreate);
      
      // Reset form and show success
      alert('Project created successfully!');
      setCurrentStep(1);
      setProjectData({
        title: '',
        description: '',
        category: '',
        totalBudget: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoApprovalPeriod: 7,
        maxRevisionsPerMilestone: 2,
      });
      setMilestones([]);
      setSelectedPaymentMethod('');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  // Calculate if milestone amounts match the budget (for validation)
  const milestoneSum = milestones.reduce((sum, m) => sum + m.amount, 0);
  const budgetValid = milestoneSum === projectData.totalBudget && projectData.totalBudget > 0;

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1) {
      if (!projectData.title || !projectData.category || projectData.totalBudget <= 0 || !projectData.description) {
        alert('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (milestones.length === 0) {
        alert('Please add at least one milestone');
        return;
      }
      if (!budgetValid) {
        alert('Milestone amounts must sum to total budget');
        return;
      }
    } else if (currentStep === 3) {
      if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
      }
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepTitles = [
    'Project Details',
    'Milestone Setup', 
    'Funding Confirmation',
    'Review & Submit'
  ];

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
        </div>
        
        {stepTitles.map((title, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              currentStep > index + 1 
                ? 'bg-green-500 text-white' 
                : currentStep === index + 1 
                  ? 'bg-primary text-white border-2 border-primary' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm text-center ${currentStep === index + 1 ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
              {title}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 1 && <ProjectDetailsStep />}
      {currentStep === 2 && <MilestonesStep />}
      {currentStep === 3 && <FundingStep />}
      {currentStep === 4 && <ReviewStep />}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div></div> // Empty div for alignment when on last step
        )}
      </div>
    </div>
  );
}