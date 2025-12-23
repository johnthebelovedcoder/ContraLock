import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, FileDown, Send } from 'lucide-react';
import { Milestone } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
  userRole: 'client' | 'freelancer';
}

export function MilestoneCard({ milestone, userRole }: MilestoneCardProps) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    SUBMITTED: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    DISPUTED: 'bg-red-500',
    REVISION_REQUESTED: 'bg-orange-500'
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    DISPUTED: 'Disputed',
    REVISION_REQUESTED: 'Revision Requested'
  };

  const canTakeAction = () => {
    if (userRole === 'freelancer') {
      return milestone.status === 'PENDING' || milestone.status === 'REVISION_REQUESTED';
    } else if (userRole === 'client') {
      return milestone.status === 'SUBMITTED';
    }
    return false;
  };

  const getActionLabel = () => {
    if (userRole === 'freelancer') {
      if (milestone.status === 'PENDING') return 'Start Work';
      if (milestone.status === 'REVISION_REQUESTED') return 'Revise & Resubmit';
    } else if (userRole === 'client') {
      if (milestone.status === 'SUBMITTED') return 'Review & Approve';
    }
    return '';
  };

  const handleAction = () => {
    // Navigate to the specific milestone page or action modal
    // Implementation would depend on specific action needed
    console.log('Handle action for milestone:', milestone._id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="truncate">{milestone.title}</CardTitle>
              <Badge className={`${statusColors[milestone.status]} text-white`} variant="secondary">
                {statusLabels[milestone.status]}
              </Badge>
            </div>
            <CardDescription className="truncate">
              {milestone.description}
            </CardDescription>
          </div>
          <div className="text-right whitespace-nowrap">
            <div className="text-lg font-semibold">{formatCurrency(milestone.amount)}</div>
            <div className="text-sm text-muted-foreground">
              Due: {formatDate(milestone.deadline)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Acceptance Criteria
          </h4>
          <p className="text-sm text-muted-foreground">
            {milestone.acceptanceCriteria}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>50%</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>
        
        {milestone.deliverables && milestone.deliverables.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Deliverables</h4>
            <div className="flex flex-wrap gap-2">
              {milestone.deliverables.map((deliverable, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer">
                  <FileDown className="h-3 w-3 mr-1" />
                  {deliverable.filename || `Deliverable ${idx + 1}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2">
        <div className="flex items-center text-sm text-muted-foreground mr-4">
          <Calendar className="h-4 w-4 mr-1" />
          Created: {formatDate(milestone.createdAt)}
        </div>
        {milestone.submittedAt && (
          <div className="flex items-center text-sm text-muted-foreground mr-4">
            <Send className="h-4 w-4 mr-1" />
            Submitted: {formatDate(milestone.submittedAt)}
          </div>
        )}
        {milestone.approvedAt && (
          <div className="flex items-center text-sm text-muted-foreground mr-4">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved: {formatDate(milestone.approvedAt)}
          </div>
        )}
        {milestone.status === 'DISPUTED' && (
          <div className="flex items-center text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mr-1" />
            In Dispute
          </div>
        )}
        
        {canTakeAction() && (
          <Button 
            className="ml-auto" 
            onClick={handleAction}
          >
            {getActionLabel()}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}