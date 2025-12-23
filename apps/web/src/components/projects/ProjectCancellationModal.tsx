'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store/authStore';
import { ProjectCancellationService } from '@/lib/services/projectCancellationService';
import { toast } from 'sonner';

interface ProjectCancellationModalProps {
  projectId: string;
  projectName: string;
  freelancerId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancellationRequested: () => void;
}

export function ProjectCancellationModal({
  projectId,
  projectName,
  freelancerId,
  isOpen,
  onClose,
  onCancellationRequested,
}: ProjectCancellationModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to request project cancellation');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);

    try {
      const cancellationService = ProjectCancellationService.getInstance();
      
      await cancellationService.requestProjectCancellation(
        projectId,
        user.id,
        freelancerId,
        reason
      );

      toast.success('Cancellation request submitted successfully');
      onCancellationRequested();
      onClose();
      setReason('');
    } catch (error) {
      console.error('Error requesting project cancellation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request project cancellation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Project: {projectName}</DialogTitle>
          <DialogDescription>
            This will request to cancel the project. The freelancer will need to approve this request before funds are returned to your wallet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you want to cancel this project..."
              required
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Request Cancellation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}