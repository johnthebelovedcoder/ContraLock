'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Link, Mail, Users } from 'lucide-react';
import { Project } from '@/types';

interface ProjectSharingProps {
  project: Project;
  onToggleSharing: (projectId: string, enabled: boolean) => void;
  onInviteByEmail: (projectId: string, email: string) => Promise<void>;
}

export function ProjectSharing({ project, onToggleSharing, onInviteByEmail }: ProjectSharingProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [projectLink, setProjectLink] = useState('');

  useEffect(() => {
    if (project.inviteToken) {
      // In a real app, this would be your domain
      const link = `${window.location.origin}/invitations/${project.inviteToken}`;
      setProjectLink(link);
    }
  }, [project.inviteToken]);

  const handleInviteByEmail = async () => {
    if (!email) {
      setInviteError('Please enter an email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setInviting(true);
    setInviteError(null);

    try {
      // In a real app, this would send an invitation email
      await onInviteByEmail(project.id, email);
      setEmail('');
      setInviteError(null);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const toggleSharing = () => {
    onToggleSharing(project.id, !project.sharingEnabled);
  };

  if (!project.inviteToken) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Project Sharing</CardTitle>
        </div>
        <CardDescription>
          Share this project with team members or clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input 
            value={projectLink} 
            readOnly 
            className="flex-1"
            placeholder="Project link will appear after creation"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            disabled={!projectLink || !project.sharingEnabled}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {copied && (
          <div className="text-sm text-green-600 dark:text-green-400">
            Link copied to clipboard!
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Enter email to invite"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!project.sharingEnabled}
          />
          <Button
            onClick={handleInviteByEmail}
            disabled={!project.sharingEnabled || !email || inviting}
          >
            {inviting ? 'Sending...' : 'Invite'}
          </Button>
        </div>

        {inviteError && (
          <div className="text-sm text-destructive dark:text-destructive-foreground">
            {inviteError}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant={project.sharingEnabled ? "default" : "outline"}>
            {project.sharingEnabled ? "Sharing Enabled" : "Sharing Disabled"}
          </Badge>

          {project.status !== 'PENDING_ACCEPTANCE' && (
            <Badge variant="secondary">
              {project.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {project.status === 'PENDING_ACCEPTANCE' && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSharing}
              disabled={project.status !== 'PENDING_ACCEPTANCE'}
            >
              <Link className="h-4 w-4 mr-2" />
              {project.sharingEnabled ? 'Disable Sharing' : 'Enable Sharing'}
            </Button>
            {project.status !== 'PENDING_ACCEPTANCE' && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mt-2">
                Sharing settings locked after project acceptance
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}