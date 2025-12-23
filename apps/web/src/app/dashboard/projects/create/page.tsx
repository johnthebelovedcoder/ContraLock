'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MilestoneForm } from './MilestoneForm';
import { CurrencySelector } from '@/components/common/CurrencySelector';
import { useProjectStore } from '@/lib/store/projectStore';
import { Project } from '@/types';
import { Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

type Step = 'basic' | 'milestones' | 'review' | 'ai';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createProject, aiSuggestMilestones } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('basic');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Development',
    budget: '',
    deadline: '',
    currency: 'USD', // Default currency
    autoApproveDays: 7,
    milestones: [] as Array<{
      title: string;
      description: string;
      amount: string;
      deadline: string;
      acceptanceCriteria: string;
    }>
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [useAISuggestions, setUseAISuggestions] = useState(false);

  useEffect(() => {
    if (user?.role !== 'client') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: '',
          description: '',
          amount: '',
          deadline: '',
          acceptanceCriteria: ''
        }
      ]
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const removeMilestone = (index: number) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones.splice(index, 1);
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const handleAIGenerate = async () => {
    if (!formData.description) {
      setError('Please provide a project description to get AI suggestions');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const suggestions = await aiSuggestMilestones(
        formData.description,
        Number(formData.budget) * 100 || 0, // Convert to cents
        formData.category,
        formData.currency // Add currency parameter
      );

      setAiSuggestions(suggestions);
      setStep('ai');
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleUseAISuggestions = () => {
    if (aiSuggestions?.milestones) {
      const convertedMilestones = aiSuggestions.milestones.map((ms: any) => ({
        title: ms.title,
        description: ms.description,
        amount: (ms.amount / 100).toString(), // Convert units back to standard format
        deadline: ms.deadline,
        acceptanceCriteria: ms.acceptanceCriteria
      }));

      setFormData(prev => ({
        ...prev,
        milestones: convertedMilestones
      }));

      setUseAISuggestions(true);
      setStep('milestones');
    }
  };

  const validateBasicStep = () => {
    if (!formData.title.trim()) {
      setError('Project title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Project description is required');
      return false;
    }
    if (!formData.budget) {
      setError('Project budget is required');
      return false;
    }
    if (!formData.currency) {
      setError('Project currency is required');
      return false;
    }
    if (!formData.deadline) {
      setError('Project deadline is required');
      return false;
    }
    if (Number(formData.budget) < 50) {
      setError(`Project budget must be at least 50 ${formData.currency}`);
      return false;
    }
    if (new Date(formData.deadline) < new Date()) {
      setError('Project deadline must be in the future');
      return false;
    }
    return true;
  };

  const validateMilestonesStep = () => {
    if (formData.milestones.length === 0) {
      setError('At least one milestone is required');
      return false;
    }

    let totalAmount = 0;
    for (let i = 0; i < formData.milestones.length; i++) {
      const milestone = formData.milestones[i];
      if (!milestone.title.trim()) {
        setError(`Milestone ${i + 1} title is required`);
        return false;
      }
      if (!milestone.description.trim()) {
        setError(`Milestone ${i + 1} description is required`);
        return false;
      }
      if (!milestone.amount) {
        setError(`Milestone ${i + 1} amount is required`);
        return false;
      }
      if (!milestone.deadline) {
        setError(`Milestone ${i + 1} deadline is required`);
        return false;
      }
      if (Number(milestone.amount) < 50) {
        setError(`Milestone ${i + 1} amount must be at least 50 ${formData.currency}`);
        return false;
      }
      if (new Date(milestone.deadline) > new Date(formData.deadline)) {
        setError(`Milestone ${i + 1} deadline cannot exceed project deadline`);
        return false;
      }
      totalAmount += Number(milestone.amount);
    }

    if (Math.abs(totalAmount - Number(formData.budget)) > 0.01) {
      setError(`Milestone amounts (${totalAmount.toFixed(2)} ${formData.currency}) must equal project budget (${formData.budget} ${formData.currency})`);
      return false;
    }

    setError('');
    return true;
  };

  const handleCreateProject = async () => {
    if (!validateMilestonesStep()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Convert form data to API format
      const projectData: Partial<Project> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: Number(formData.budget) * 100, // Convert to cents for USD, or appropriate units for other currencies
        deadline: new Date(formData.deadline).toISOString(),
        currency: formData.currency, // Add currency to project
        milestones: formData.milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount) * 100, // Convert to cents for USD or appropriate units for other currencies
          deadline: new Date(m.deadline).toISOString(),
          acceptanceCriteria: m.acceptanceCriteria,
          currency: formData.currency // Add currency to milestone as well
        })),
        autoApproveDays: Number(formData.autoApproveDays)
      };
      
      const createdProject = await createProject(projectData);
      router.push(`/dashboard/projects/${createdProject._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const totalMilestoneAmount = formData.milestones.reduce(
    (sum, ms) => sum + (Number(ms.amount) || 0), 0
  );

  return (
    <div className="w-full p-2">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Define your project details and milestones to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-8">
            <Badge variant={step === 'basic' ? 'default' : 'secondary'}>1. Basic Info</Badge>
            <Badge variant={step === 'milestones' ? 'default' : 'secondary'}>2. Milestones</Badge>
            <Badge variant={step === 'ai' ? 'default' : 'secondary'}>3. AI Suggestions</Badge>
            <Badge variant={step === 'review' ? 'default' : 'secondary'}>4. Review</Badge>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {/* Basic Info Step */}
          {step === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project in detail..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <div className="flex gap-2">
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                    />
                    <div className="w-32">
                      <CurrencySelector
                        value={formData.currency}
                        onChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="deadline">Project Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autoApproveDays">Auto-Approve Days</Label>
                  <Input
                    id="autoApproveDays"
                    name="autoApproveDays"
                    type="number"
                    value={formData.autoApproveDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoApproveDays: Number(e.target.value) }))}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Days before milestone is auto-approved if client doesn't respond
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => validateBasicStep() && setStep('milestones')}
                  disabled={loading}
                >
                  Continue to Milestones
                </Button>
              </div>
            </div>
          )}

          {/* Milestones Step */}
          {step === 'milestones' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Milestones</h3>
                <Button type="button" onClick={addMilestone} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              {formData.milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No milestones added yet. Click "Add Milestone" to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.milestones.map((milestone, index) => (
                    <MilestoneForm
                      key={index}
                      index={index}
                      milestone={milestone}
                      onUpdate={(field, value) => updateMilestone(index, field, value)}
                      onRemove={() => removeMilestone(index)}
                      projectDeadline={formData.deadline}
                      projectCurrency={formData.currency}
                    />
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>Total Milestone Amount:</span>
                  <span>{totalMilestoneAmount.toFixed(2)} {formData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Project Budget:</span>
                  <span>{Number(formData.budget).toFixed(2)} {formData.currency}</span>
                </div>
                {Math.abs(totalMilestoneAmount - Number(formData.budget)) > 0.01 && (
                  <div className="text-destructive text-sm mt-1">
                    Milestone amounts must equal project budget
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep('basic')}
                  disabled={loading}
                >
                  Back
                </Button>
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={handleAIGenerate}
                    disabled={loading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Suggestions
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={loading || Math.abs(totalMilestoneAmount - Number(formData.budget)) > 0.01}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions Step */}
          {step === 'ai' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">AI Suggestions</h3>
              
              {aiSuggestions ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Recommended Milestone Structure:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiSuggestions.milestones.map((ms: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-medium">{ms.title}</span> - ${ms.amount / 100} ({ms.percentage}%)
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {aiSuggestions.recommendation}
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleUseAISuggestions} className="mr-2">
                      Use These Suggestions
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('milestones')}
                    >
                      Continue with My Milestones
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg">Generating AI suggestions...</p>
                  <p className="text-muted-foreground text-sm">Describe your project to get smart milestone suggestions</p>
                </div>
              )}
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Project</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Project Details</h4>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Title:</span> {formData.title}</div>
                    <div><span className="font-medium">Category:</span> {formData.category}</div>
                    <div><span className="font-medium">Budget:</span> ${Number(formData.budget).toFixed(2)}</div>
                    <div><span className="font-medium">Deadline:</span> {formData.deadline}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium">Milestones</h4>
                  <div className="mt-2 space-y-2">
                    {formData.milestones.map((milestone, idx) => (
                      <div key={idx} className="border p-3 rounded-md text-sm">
                        <div className="font-medium">{milestone.title}</div>
                        <div>Amount: ${Number(milestone.amount).toFixed(2)}</div>
                        <div>Deadline: {milestone.deadline}</div>
                        <div className="mt-1 text-muted-foreground">{milestone.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateProject}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}