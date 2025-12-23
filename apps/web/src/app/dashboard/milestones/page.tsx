'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MilestoneCard } from './MilestoneCard';
import { useMilestoneStore } from '@/lib/store/projectStore';
import { useAuthStore } from '@/lib/store';

export default function MilestonesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { milestones, getMilestonesByProject } = useMilestoneStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        await getMilestonesByProject('all'); // Fetch all milestones for user
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMilestones();
    }
  }, [user, getMilestonesByProject]);

  const getMilestoneStats = () => {
    const allMilestones = milestones;
    const pending = allMilestones.filter(m => m.status === 'PENDING').length;
    const inProgress = allMilestones.filter(m => m.status === 'IN_PROGRESS').length;
    const submitted = allMilestones.filter(m => m.status === 'SUBMITTED').length;
    const approved = allMilestones.filter(m => m.status === 'APPROVED').length;
    const disputed = allMilestones.filter(m => m.status === 'DISPUTED').length;
    const revisionRequested = allMilestones.filter(m => m.status === 'REVISION_REQUESTED').length;

    return { pending, inProgress, submitted, approved, disputed, revisionRequested, total: allMilestones.length };
  };

  const stats = getMilestoneStats();
  const completionPercentage = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  const filteredMilestones = milestones.filter(milestone => {
    if (activeTab === 'all') return true;
    return milestone.status.toLowerCase() === activeTab;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Milestones</h1>
        <p className="text-muted-foreground">
          Manage and track the progress of your project milestones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
            <CardDescription>Total Milestones</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">{stats.approved}</CardTitle>
            <CardDescription>Completed</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">{stats.submitted}</CardTitle>
            <CardDescription>Waiting Review</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">{stats.disputed}</CardTitle>
            <CardDescription>In Dispute</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Completion</CardTitle>
          <CardDescription>Overall milestone completion progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{stats.approved} of {stats.total} milestones completed</span>
          </div>
        </CardContent>
      </Card>

      {/* Milestone List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="disputed">Disputed</TabsTrigger>
            <TabsTrigger value="revision_requested">Revisions</TabsTrigger>
          </TabsList>
          <Button onClick={() => router.push('/dashboard/projects/create')}>
            Create New Project
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No milestones found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending milestones</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No milestones in progress</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No submitted milestones</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No approved milestones</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="disputed" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No disputed milestones</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="revision_requested" className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No milestones requiring revision</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                userRole={user?.role as 'client' | 'freelancer'} 
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}