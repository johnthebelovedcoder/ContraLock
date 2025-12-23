'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, FileText, CheckCircle, XCircle, AlertCircle, Edit3, Eye, MessageCircle, Download, Upload, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Milestone } from '@/types';

interface MilestoneTrackerProps {
  milestones: Milestone[];
  onEditMilestone?: (milestone: Milestone) => void;
  onSubmitMilestone?: (milestoneId: string) => void;
  onApproveMilestone?: (milestoneId: string) => void;
  onViewDeliverables?: (milestoneId: string) => void;
  onDiscussMilestone?: (milestoneId: string) => void;
  currentUserRole?: 'client' | 'freelancer';
}

export function MilestoneTracker({
  milestones,
  onEditMilestone,
  onSubmitMilestone,
  onApproveMilestone,
  onViewDeliverables,
  onDiscussMilestone,
  currentUserRole = 'freelancer'
}: MilestoneTrackerProps) {
  // Sort milestones by order
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);

  // Calculate progress
  const completedMilestones = sortedMilestones.filter(m => m.status === 'APPROVED' || m.status === 'PAID').length;
  const totalMilestones = sortedMilestones.length;
  const progressPercentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Milestones & Progress</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedMilestones}/{totalMilestones} completed
          </Badge>
        </div>
        <CardDescription>
          Track project milestones, deadlines, and payment releases
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Project Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                progressPercentage === 100 ? 'bg-green-500' :
                progressPercentage > 75 ? 'bg-blue-500' :
                progressPercentage > 25 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Milestones List */}
        <div className="space-y-4">
          {sortedMilestones.map((milestone, index) => {
            // Determine status badge
            let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' = 'outline';
            let statusIcon = null;
            
            switch (milestone.status) {
              case 'COMPLETED':
              case 'APPROVED':
              case 'PAID':
                statusVariant = 'success';
                statusIcon = <CheckCircle className="h-4 w-4" />;
                break;
              case 'IN_PROGRESS':
                statusVariant = 'default';
                statusIcon = <Clock className="h-4 w-4" />;
                break;
              case 'SUBMITTED':
                statusVariant = 'secondary';
                statusIcon = <FileText className="h-4 w-4" />;
                break;
              case 'REVISION_REQUESTED':
                statusVariant = 'destructive';
                statusIcon = <Edit3 className="h-4 w-4" />;
                break;
              case 'PENDING':
              default:
                statusVariant = 'outline';
                statusIcon = <Clock className="h-4 w-4" />;
                break;
            }

            const isPastDue = new Date(milestone.deadline) < new Date() && !['APPROVED', 'PAID'].includes(milestone.status);
            
            return (
              <div key={milestone.id} className="border rounded-lg overflow-hidden">
                <div className={`p-4 border-b ${
                  milestone.status === 'APPROVED' || milestone.status === 'PAID' ? 'bg-green-50 dark:bg-green-950/20' :
                  milestone.status === 'IN_PROGRESS' ? 'bg-blue-50 dark:bg-blue-950/20' :
                  milestone.status === 'SUBMITTED' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500' :
                  milestone.status === 'REVISION_REQUESTED' ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500' :
                  milestone.status === 'PENDING' ? 'bg-gray-50 dark:bg-gray-950/20' : 'bg-gray-50 dark:bg-gray-950/20'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-medium text-lg">{milestone.title}</h3>
                        {isPastDue && (
                          <Badge variant="destructive" className="text-xs">PAST DUE</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                    <Badge
                      variant={statusVariant}
                      className={`text-xs flex items-center gap-1 ${
                        isPastDue && milestone.status !== 'APPROVED' && milestone.status !== 'PAID'
                          ? 'border-destructive text-destructive'
                          : ''
                      }`}
                    >
                      {statusIcon}
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-medium">{milestone.amount?.toLocaleString()} {milestone.currency || 'USD'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="font-medium">{new Date(milestone.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Deliverables</p>
                        <p className="font-medium">{milestone.deliverables?.length || 0}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Criteria</p>
                      <p className="text-sm line-clamp-1">{milestone.acceptanceCriteria}</p>
                    </div>
                  </div>

                  {/* Action Buttons based on role and status */}
                  <div className="flex flex-wrap gap-2">
                    {/* View Deliverables Button and Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        {milestone.deliverables && milestone.deliverables.length > 0 ? (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Deliverables ({milestone.deliverables.length})
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="h-4 w-4 mr-2" />
                            No Deliverables
                          </Button>
                        )}
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Deliverables for {milestone.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {milestone.deliverables && milestone.deliverables.length > 0 ? (
                            <div className="grid gap-4">
                              {milestone.deliverables.map((deliverable: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{deliverable.fileName || `Deliverable ${idx + 1}`}</h4>
                                      <p className="text-sm text-muted-foreground">{deliverable.description || 'No description'}</p>
                                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span>{deliverable.fileSize ? `${(deliverable.fileSize / 1024).toFixed(2)} KB` : 'Size unknown'}</span>
                                        <span className="mx-1">•</span>
                                        <span>{deliverable.fileType || 'Unknown'}</span>
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-medium mb-2">No Deliverables</h3>
                              <p className="text-muted-foreground">
                                No deliverables have been uploaded for this milestone yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {onEditMilestone &&
                      (milestone.status === 'PENDING' ||
                       (currentUserRole === 'freelancer' &&
                        (milestone.status === 'IN_PROGRESS' || milestone.status === 'SUBMITTED'))) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditMilestone(milestone)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {currentUserRole === 'freelancer' ? 'Manage' : 'Edit'}
                      </Button>
                    )}

                    {onApproveMilestone &&
                     currentUserRole === 'client' &&
                     milestone.status === 'SUBMITTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApproveMilestone(milestone.id)}
                        className="text-green-600 border-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}

                    {onSubmitMilestone &&
                     currentUserRole === 'freelancer' &&
                     milestone.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSubmitMilestone(milestone.id)}
                        className="text-blue-600 border-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Review
                      </Button>
                    )}

                    {currentUserRole === 'freelancer' &&
                     milestone.status === 'SUBMITTED' && (
                      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submitted for Review
                      </div>
                    )}

                    {/* Discuss Button with Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDiscussMilestone && onDiscussMilestone(milestone.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Discuss
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Discuss Milestone: {milestone.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium mb-2">Recent Messages</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Client</span>
                                      <span className="text-xs text-muted-foreground">Just now</span>
                                    </div>
                                    <p className="text-sm mt-1">Hi, can you provide an update on this milestone?</p>
                                  </div>
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <div className="flex justify-between">
                                      <span className="font-medium">You</span>
                                      <span className="text-xs text-muted-foreground">2 min ago</span>
                                    </div>
                                    <p className="text-sm mt-1">Sure, I'm working on it and will have an update by tomorrow.</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Textarea
                                placeholder="Type your message..."
                                className="resize-none"
                                rows={3}
                              />
                              <Button size="sm" className="w-full">
                                <Send className="h-4 w-4 mr-2" />
                                Send Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}