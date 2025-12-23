'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FormError } from '@/components/ui/form-error';
import { Plus, Trash2, ChevronRight, Check } from 'lucide-react';
import { Milestone } from '@/types/project';
import { projectSchemas } from '@/lib/validation';
import { aiService } from '@/lib/api/aiService';
import { useAIStore } from '@/lib/store/aiStore';

type ProjectFormData = z.infer<ReturnType<typeof projectSchemas.create>>;
type MilestoneFormData = z.infer<ReturnType<typeof projectSchemas.milestone>>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData & { milestones: Milestone[] }) => void;
  onCancel?: () => void;
}

const categories = [
  'Design', 'Development', 'Writing', 'Marketing', 'Consulting', 'Video', 'Audio',
  'Data Entry', 'Virtual Assistance', 'Other'
];

const ProjectForm = ({ onSubmit, onCancel }: ProjectFormProps) => {
  const { getMilestoneSuggestions, milestoneSuggestionsLoading } = useAIStore();
  const [currentStep, setCurrentStep] = useState(0); // 0: Basic Info, 1: Milestones, 2: Review
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: '', description: '', amount: 0, deadline: '', acceptanceCriteria: '', status: 'pending' }
  ]);
  const [totalMilestoneAmount, setTotalMilestoneAmount] = useState(0);

  // Basic info form
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: basicErrors },
    watch,
    trigger: triggerBasic
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchemas.create()),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      category: '',
      totalBudget: 0,
      timeline: '',
    }
  });

  // Watch totalBudget to calculate milestone distribution
  const totalBudget = watch('totalBudget');

  // Function to handle basic info submission
  const onBasicSubmit = async (data: ProjectFormData) => {
    // Validate the basic info form
    const isValid = await triggerBasic();
    if (isValid) {
      setCurrentStep(1);
    }
  };

  // Function to add a new milestone
  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      amount: 0,
      deadline: '',
      acceptanceCriteria: '',
      status: 'pending'
    };
    setMilestones([...milestones, newMilestone]);
  };

  // Function to remove a milestone
  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  // Function to update a milestone
  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
    
    // Recalculate total when amounts change
    if (field === 'amount') {
      const newTotal = milestones
        .map((m, index) => index === milestones.findIndex(milestone => milestone.id === id) ? { ...m, [field]: parseFloat(value) || 0 } : m)
        .reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(m.amount || '0')), 0);
      
      setTotalMilestoneAmount(newTotal);
    } else {
      // Calculate total normally if not updating amount
      const newTotal = milestones.reduce((sum, m) => sum + (typeof m.amount === 'number' ? m.amount : parseFloat(m.amount || '0')), 0);
      setTotalMilestoneAmount(newTotal);
    }
  };

  // Function to continue to review step
  const goToReviewStep = () => {
    const budget = parseFloat(totalBudget || '0');
    if (totalMilestoneAmount > 0 && totalMilestoneAmount !== budget) {
      alert(`Milestone amounts ($${totalMilestoneAmount}) don't match project budget ($${budget})`);
      return;
    }
    setCurrentStep(2);
  };

  // Function to submit the complete project
  const submitProject = () => {
    const projectData = {
      ...watch(),
      milestones: milestones.map(m => ({
        ...m,
        amount: parseFloat(m.amount.toString())
      }))
    };
    onSubmit(projectData);
  };

  // Function to handle AI suggestion request
  const handleAISuggestion = async () => {
    if (!projectDescription || !totalBudget) {
      alert('Please provide project description and budget to get AI suggestions');
      return;
    }

    try {
      // Show loading state
      setSubmitting(true);

      // Call the AI store to get milestone suggestions
      const suggestions = await getMilestoneSuggestions({
        projectDescription,
        budget: totalBudget,
        category: category || undefined
      });

      // Convert AI suggestions to our milestone format
      const convertedMilestones = suggestions.suggestedMilestones.map((suggestion, index) => ({
        id: `ai-${Date.now()}-${index}`,
        title: suggestion.title,
        description: suggestion.description,
        amount: suggestion.amount,
        deadline: new Date(Date.now() + suggestion.deadlineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Convert days to date
        acceptanceCriteria: `Completion of ${suggestion.title} as per requirements`,
        status: 'pending' as const
      }));

      setMilestones(convertedMilestones);

      // Update total amount based on AI suggestions
      const totalAmount = convertedMilestones.reduce((sum, milestone) => sum + milestone.amount, 0);
      setTotalMilestoneAmount(totalAmount);

      // Show recommendations as a notification
      if (suggestions.recommendations && suggestions.recommendations.length > 0) {
        console.log('AI Recommendations:', suggestions.recommendations);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      alert('Failed to get AI suggestions. Using default milestones instead.');

      // Fallback to default milestones
      setMilestones([
        {
          id: 'ai-1',
          title: 'Initial Consultation & Planning',
          description: 'Initial project discussion, requirements analysis, and planning',
          amount: 200,
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          acceptanceCriteria: 'Completed project plan document approved',
          status: 'pending'
        },
        {
          id: 'ai-2',
          title: 'Design Phase',
          description: 'Wireframes, mockups, and design specifications',
          amount: 500,
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          acceptanceCriteria: 'Design deliverables completed and approved',
          status: 'pending'
        },
        {
          id: 'ai-3',
          title: 'Development Phase',
          description: 'Implementation of the project based on approved designs',
          amount: 1000,
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          acceptanceCriteria: 'Development deliverables completed and tested',
          status: 'pending'
        },
        {
          id: 'ai-4',
          title: 'Final Delivery & Revisions',
          description: 'Final delivery and any necessary revisions',
          amount: 300,
          deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          acceptanceCriteria: 'Final deliverables approved and project completed',
          status: 'pending'
        }
      ]);

      // Update total amount
      setTotalMilestoneAmount(2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Define your project requirements and payment milestones</CardDescription>
            </div>
            <div className="flex space-x-1">
              {[0, 1, 2].map((step) => (
                <div 
                  key={step} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground' 
                      : step < currentStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted'
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step + 1}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Project Information */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <form onSubmit={handleSubmitBasic(onBasicSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Website Redesign"
                    {...registerBasic('title')}
                  />
                  {basicErrors.title && (
                    <FormError message={basicErrors.title.message} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail..."
                    rows={4}
                    {...registerBasic('description')}
                  />
                  {basicErrors.description && (
                    <FormError message={basicErrors.description.message} />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={watch('category')}
                      onValueChange={(value) => registerBasic('category').onChange({ target: { value } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {basicErrors.category && (
                      <FormError message={basicErrors.category.message} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">Estimated Timeline *</Label>
                    <Input
                      id="timeline"
                      type="date"
                      {...registerBasic('timeline')}
                    />
                    {basicErrors.timeline && (
                      <FormError message={basicErrors.timeline.message} />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget ($) *</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="0.00"
                    {...registerBasic('totalBudget', { valueAsNumber: true })}
                  />
                  {basicErrors.totalBudget && (
                    <FormError message={basicErrors.totalBudget.message} />
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Next: Define Milestones</Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 2: Milestone Definition */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Define Payment Milestones</h3>
                <Button variant="outline" onClick={handleAISuggestion} disabled={submitting || milestoneSuggestionsLoading}>
                  {milestoneSuggestionsLoading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Break your project into milestones with specific deliverables and deadlines.
                You'll release payments as each milestone is completed.
              </p>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <Card key={milestone.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Milestone {index + 1}</CardTitle>
                        {milestones.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeMilestone(milestone.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`milestone-title-${milestone.id}`}>Title *</Label>
                            <Input
                              id={`milestone-title-${milestone.id}`}
                              placeholder="e.g. Homepage Design"
                              value={milestone.title}
                              onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`milestone-amount-${milestone.id}`}>Amount ($) *</Label>
                            <Input
                              id={`milestone-amount-${milestone.id}`}
                              type="number"
                              placeholder="0.00"
                              value={milestone.amount}
                              onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`milestone-description-${milestone.id}`}>Description *</Label>
                          <Textarea
                            id={`milestone-description-${milestone.id}`}
                            placeholder="Describe what will be delivered..."
                            rows={2}
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`milestone-deadline-${milestone.id}`}>Deadline *</Label>
                            <Input
                              id={`milestone-deadline-${milestone.id}`}
                              type="date"
                              value={milestone.deadline}
                              onChange={(e) => updateMilestone(milestone.id, 'deadline', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`milestone-acceptance-${milestone.id}`}>Acceptance Criteria</Label>
                            <Textarea
                              id={`milestone-acceptance-${milestone.id}`}
                              placeholder="Define how this milestone will be approved..."
                              rows={2}
                              value={milestone.acceptanceCriteria}
                              onChange={(e) => updateMilestone(milestone.id, 'acceptanceCriteria', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    Back
                  </Button>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <p>Total: ${totalMilestoneAmount.toFixed(2)} 
                        {totalBudget && ` / Budget: $${parseFloat(totalBudget).toFixed(2)}`}
                      </p>
                      {totalMilestoneAmount > 0 && totalBudget && totalMilestoneAmount !== parseFloat(totalBudget) && (
                        <p className="text-destructive text-xs">
                          Amounts don't match the project budget!
                        </p>
                      )}
                    </div>
                    <Button type="button" onClick={addMilestone} variant="secondary">
                      <Plus className="h-4 w-4 mr-1" /> Add Milestone
                    </Button>
                    <Button 
                      onClick={goToReviewStep}
                      disabled={totalMilestoneAmount === 0 || (totalBudget && totalMilestoneAmount !== parseFloat(totalBudget))}
                    >
                      Review Project
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium">Review Your Project</h3>
              <p className="text-sm text-muted-foreground">
                Please review all the details before creating your project.
              </p>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{watch('title')}</CardTitle>
                    <CardDescription>
                      <span className="capitalize">{watch('category')}</span> • Budget: ${parseFloat(totalBudget || '0').toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{watch('description')}</p>
                    
                    <h4 className="font-medium mb-2">Milestones:</h4>
                    <div className="space-y-2">
                      {milestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex justify-between items-start p-3 bg-muted rounded-md">
                          <div>
                            <div className="font-medium">{index + 1}. {milestone.title}</div>
                            <div className="text-sm text-muted-foreground">{milestone.description}</div>
                            <div className="text-sm">
                              <span className="font-medium">${milestone.amount}</span> • 
                              <span className="text-muted-foreground"> Due: {milestone.deadline || 'TBD'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between font-medium">
                        <span>Total Budget:</span>
                        <span>${totalMilestoneAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back to Milestones
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={submitProject}>
                    Create Project
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectForm;