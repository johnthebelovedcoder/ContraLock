import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { Project } from '@/types';
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onClick?: (projectId: string) => void;
  onInvite?: (projectId: string) => void;
  onStart?: (projectId: string) => void;
  onView?: (projectId: string) => void;
  showActions?: boolean;
  isClient?: boolean;
  isFreelancer?: boolean;
}

export default function ProjectCard({
  project,
  onClick,
  onInvite,
  onStart,
  onView,
  showActions = true,
  isClient = false,
  isFreelancer = false,
}: ProjectCardProps) {
  // Determine status badge variant based on project status
  const getStatusVariant = () => {
    switch (project.status) {
      case 'DRAFT':
        return 'secondary';
      case 'PENDING_ACCEPTANCE':
        return 'default';
      case 'AWAITING_DEPOSIT':
        return 'warning';
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
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

  // Calculate progress based on milestones if available
  const calculateProgress = () => {
    // This would typically come from the project data, calculating completed milestones
    // For now, we'll use a placeholder calculation
    return 45; // Placeholder
  };

  return (
    <Card 
      className={`w-full cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:bg-accent/50' : ''}`}
      onClick={() => onClick && onClick(project.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg truncate">{project.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {project.category} • Created {formatRelativeDate(project.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant()}>
            {formatStatus(project.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="mb-3">
          <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{formatCurrency(project.totalBudget)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(project.deadline, 'MMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {project.freelancerId ? 'Freelancer assigned' : 'No freelancer yet'}
          </span>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-wrap gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView(project.id); }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}

          {isClient && project.status === 'DRAFT' && onInvite && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onInvite(project.id); }}>
              <Users className="h-4 w-4 mr-2" />
              Invite Freelancer
            </Button>
          )}

          {isFreelancer && project.status === 'PENDING_ACCEPTANCE' && onClick && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onClick(project.id); }}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Project
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}