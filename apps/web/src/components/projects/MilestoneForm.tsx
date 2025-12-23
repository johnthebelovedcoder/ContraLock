import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Milestone } from '@/types';

interface MilestoneFormProps {
  onAddMilestone: (milestone: Milestone) => void;
  projectStartDate: Date;
  projectEndDate: Date;
  remainingBudget: number;
}

export function MilestoneForm({ onAddMilestone, projectStartDate, projectEndDate, remainingBudget }: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    deadline: new Date(projectEndDate).toISOString().split('T')[0], // Default to project deadline
    acceptanceCriteria: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (formData.amount > remainingBudget) {
      newErrors.amount = `Amount exceeds remaining budget of $${remainingBudget}`;
    }
    
    if (!formData.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = 'Acceptance criteria is required';
    }
    
    if (newErrors.title || newErrors.description || newErrors.amount || newErrors.acceptanceCriteria) {
      setErrors(newErrors);
      return;
    }
    
    // Create milestone object
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`, // Temporary ID, will be replaced by backend
      projectId: '', // Will be set when project is created
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      deadline: new Date(formData.deadline),
      acceptanceCriteria: formData.acceptanceCriteria,
      status: 'PENDING', // Default status
      order: 0, // Will be set based on order in form
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to parent form
    onAddMilestone(newMilestone);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      amount: 0,
      deadline: projectEndDate.toISOString().split('T')[0],
      acceptanceCriteria: '',
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Add New Milestone</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Milestone Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Design Phase"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what needs to be accomplished in this milestone..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                min="0"
                max={remainingBudget}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Remaining budget: ${remainingBudget.toFixed(2)}
              </p>
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
            </div>
            
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                min={projectStartDate.toISOString().split('T')[0]}
                max={projectEndDate.toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              value={formData.acceptanceCriteria}
              onChange={(e) => setFormData({...formData, acceptanceCriteria: e.target.value})}
              placeholder="Define the criteria that must be met for this milestone to be considered complete..."
              rows={2}
            />
            {errors.acceptanceCriteria && <p className="text-sm text-red-500 mt-1">{errors.acceptanceCriteria}</p>}
          </div>
          
          <Button type="submit" className="w-full">
            Add Milestone
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}