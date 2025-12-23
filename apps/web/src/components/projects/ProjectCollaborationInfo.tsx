'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, UserPlus, Shield, DollarSign, Clock } from 'lucide-react';
import { Project } from '@/types';

interface ProjectCollaborationInfoProps {
  project: Project;
  currentUserRole?: 'client' | 'freelancer';
}

export function ProjectCollaborationInfo({ project, currentUserRole }: ProjectCollaborationInfoProps) {
  // Determine if sharing is possible based on project status
  const canShare = project.sharingEnabled ?? true;
  const isInProgress = project.status === 'ACTIVE' || project.status === 'PENDING_ACCEPTANCE';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Project Collaboration</CardTitle>
        </div>
        <CardDescription>
          Who is involved and what sharing options are available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Participants */}
          <div className="p-3 bg-muted rounded-lg">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4" />
              Current Participants
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Creator:</span>
                <Badge variant={currentUserRole === 'freelancer' ? 'default' : 'secondary'}>
                  {currentUserRole === 'freelancer' ? 'Freelancer' : 'Client'}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Sharing Status */}
          <div className="p-3 rounded-lg border">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              {canShare ? <Shield className="h-4 w-4 text-green-600" /> : <Shield className="h-4 w-4 text-red-600" />}
              Project Sharing
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={canShare ? 'default' : 'destructive'}>
                  {canShare ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {canShare 
                  ? 'This project can be shared via link or email invitation' 
                  : 'Sharing is disabled because the project is already accepted'}
              </p>
            </div>
          </div>
          
          {/* Project Info */}
          <div className="p-3 rounded-lg border">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              Project Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget:</span>
                <span>${project.totalBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{project.status.replace('_', ' ')}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline:</span>
                <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Sharing Info */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Sharing Guidelines
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {canShare ? (
                <>
                  <li>• Share the project link with your collaborator</li>
                  <li>• Invite via email to grant access</li>
                  <li>• Only one collaborator can accept the project</li>
                  <li>• Sharing disables once accepted</li>
                </>
              ) : (
                <>
                  <li>• Project sharing is disabled</li>
                  <li>• This occurs after project acceptance</li>
                  <li>• To add collaborators, create a new project</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}