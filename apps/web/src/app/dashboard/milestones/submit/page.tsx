'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import MilestoneSubmissionForm from '@/components/milestones/MilestoneSubmissionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/lib/store/projectStore'; // Assuming we have a project store
import { Milestone } from '@/types/project';

export default function SubmitMilestonePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getMilestoneById } = useProjectStore(); // Assuming this store method exists
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get milestone ID from URL params (we'll simulate this for now)
  const milestoneId = '1'; // This would typically come from router params

  useEffect(() => {
    // Check if user is a freelancer
    if (user?.role !== 'freelancer') {
      setError('Only freelancers can submit milestones');
      setLoading(false);
      return;
    }

    // Fetch milestone data (simulated for now)
    const mockMilestone: Milestone = {
      id: '1',
      projectId: '1',
      title: 'Homepage Design',
      description: 'Design the main homepage with responsive layout',
      amount: 500,
      deadline: '2023-12-15',
      acceptanceCriteria: 'Design matches approved mockups and is responsive on all devices',
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMilestone(mockMilestone);
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading milestone...</p>
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'Milestone not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMilestoneSubmit = (data: any, files: File[]) => {
    // Here we would typically submit the milestone to the API
    console.log('Submitting milestone with data:', data, 'and files:', files);

    // For now, just redirect back to dashboard after a mock submission
    setTimeout(() => {
      router.push('/dashboard/milestones');
    }, 1000);
  };

  return (
    <div className="w-full p-2">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Submit Milestone</h1>
            <p className="text-sm text-muted-foreground">
              Submit your completed milestone for client review
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-xs mt-1 font-medium">Prepare</span>
              </div>
              <div className="h-px w-12 bg-muted"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-xs mt-1 font-medium">Submit</span>
              </div>
              <div className="h-px w-12 bg-muted"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-xs mt-1 text-muted-foreground">Review</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step 2 of 3
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Submit "{milestone.title}"
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneSubmissionForm
            milestone={milestone}
            onSubmit={handleMilestoneSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}