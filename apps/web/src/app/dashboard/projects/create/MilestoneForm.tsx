import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CurrencySelector } from '@/components/common/CurrencySelector';
import { Trash2 } from 'lucide-react';

interface MilestoneFormProps {
  index: number;
  milestone: {
    title: string;
    description: string;
    amount: string;
    deadline: string;
    acceptanceCriteria: string;
  };
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
  projectDeadline: string;
  projectCurrency: string; // Currency inherited from project
}

export function MilestoneForm({ index, milestone, onUpdate, onRemove, projectDeadline, projectCurrency }: MilestoneFormProps) {
  return (
    <div className="border rounded-lg p-4 relative">
      <div className="absolute top-2 right-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <h4 className="font-medium mb-3">Milestone {index + 1}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`title-${index}`}>Title</Label>
          <Input
            id={`title-${index}`}
            value={milestone.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="e.g. Design Phase"
          />
        </div>

        <div>
          <Label htmlFor={`amount-${index}`}>Amount ({projectCurrency})</Label>
          <Input
            id={`amount-${index}`}
            type="number"
            value={milestone.amount}
            onChange={(e) => onUpdate('amount', e.target.value)}
            placeholder="e.g. 1000"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`description-${index}`}>Description</Label>
          <Textarea
            id={`description-${index}`}
            value={milestone.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Describe what will be delivered in this milestone..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor={`deadline-${index}`}>Deadline</Label>
          <Input
            id={`deadline-${index}`}
            type="date"
            value={milestone.deadline}
            onChange={(e) => onUpdate('deadline', e.target.value)}
          />
          {milestone.deadline && projectDeadline && new Date(milestone.deadline) > new Date(projectDeadline) && (
            <p className="text-xs text-destructive mt-1">
              Deadline exceeds project deadline
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`acceptanceCriteria-${index}`}>Acceptance Criteria</Label>
          <Textarea
            id={`acceptanceCriteria-${index}`}
            value={milestone.acceptanceCriteria}
            onChange={(e) => onUpdate('acceptanceCriteria', e.target.value)}
            placeholder="Specific criteria that must be met for approval..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be specific about what constitutes successful completion
          </p>
        </div>
      </div>
    </div>
  );
}