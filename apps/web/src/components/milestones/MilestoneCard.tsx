import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Milestone } from '@/types';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  FileTextIcon, 
  UploadIcon,
  EyeIcon,
  MessageCircleIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface MilestoneCardProps {
  milestone: Milestone;
  onApprove?: (milestoneId: string) => void;
  onRequestRevision?: (milestoneId: string) => void;
  onDispute?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  onView?: (milestoneId: string) => void;
  isClient?: boolean; // Whether the current user is a client
  isFreelancer?: boolean; // Whether the current user is a freelancer
}

export default function MilestoneCard({
  milestone,
  onApprove,
  onRequestRevision,
  onDispute,
  onSubmit,
  onView,
  isClient = false,
  isFreelancer = false,
}: MilestoneCardProps) {
  // Determine status badge variant based on milestone status
  const getStatusVariant = () => {
    switch (milestone.status) {
      case 'PENDING':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'SUBMITTED':
        return 'warning';
      case 'REVISION_REQUESTED':
        return 'destructive';
      case 'APPROVED':
        return 'success';
      case 'DISPUTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Format the status text for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Calculate progress based on status
  const getProgress = () => {
    switch (milestone.status) {
      case 'PENDING':
        return 0;
      case 'IN_PROGRESS':
        return 30;
      case 'SUBMITTED':
        return 70;
      case 'REVISION_REQUESTED':
        return 50; // Revisions might set it back a bit
      case 'APPROVED':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{milestone.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              Due: {format(milestone.deadline, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant()}>
            {formatStatus(milestone.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="mb-2">
          <p className="text-muted-foreground text-sm">{milestone.description}</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <FileTextIcon className="h-4 w-4" />
            <span>{formatCurrency(milestone.amount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(milestone.deadline, 'MMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
        
        <div className="text-sm">
          <h4 className="font-medium mb-1">Acceptance Criteria:</h4>
          <p className="text-muted-foreground whitespace-pre-line">{milestone.acceptanceCriteria}</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2">
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(milestone.id)}>
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
        
        {isFreelancer && milestone.status === 'PENDING' && onSubmit && (
          <Button size="sm" onClick={() => onSubmit(milestone.id)}>
            <UploadIcon className="h-4 w-4 mr-2" />
            Submit Work
          </Button>
        )}
        
        {isClient && milestone.status === 'SUBMITTED' && (
          <>
            {onApprove && (
              <Button size="sm" onClick={() => onApprove(milestone.id)}>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {onRequestRevision && (
              <Button variant="outline" size="sm" onClick={() => onRequestRevision(milestone.id)}>
                <MessageCircleIcon className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
            )}
            {onDispute && (
              <Button variant="destructive" size="sm" onClick={() => onDispute(milestone.id)}>
                <ClockIcon className="h-4 w-4 mr-2" />
                Raise Dispute
              </Button>
            )}
          </>
        )}
        
        {milestone.status === 'REVISION_REQUESTED' && isFreelancer && onSubmit && (
          <Button size="sm" onClick={() => onSubmit(milestone.id)}>
            <UploadIcon className="h-4 w-4 mr-2" />
            Resubmit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}