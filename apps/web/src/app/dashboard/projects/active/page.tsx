'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Flag,
  AlertTriangle,
  CalendarCheck,
  FileText
} from 'lucide-react';
import { Project } from '@/types/project'; // Assuming this type exists

import { useProjects } from '@/lib/api';

export default function ActiveProjectsPage() {
  const { data: projectsResponse, isLoading } = useProjects('', { status: 'ACTIVE' }, { page: 1, limit: 10 });
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (projectsResponse?.items) {
      setProjects(projectsResponse.items);
    }
  }, [projectsResponse]);

  // Calculate overdue projects from actual project data
  const overdueProjects = projects.filter(project =>
    new Date(project.dueDate) < new Date() && project.progress < 100
  );

  // For tasks due this week, we would need to get from the API in the real application
  // For now, we'll calculate based on project milestones
  const tasksDueThisWeek = [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Projects</h1>
        <p className="text-muted-foreground">
          Projects currently in progress.
        </p>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Total active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Overdue Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projects past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-500" />
              Tasks Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueThisWeek.length}</div>
            <p className="text-xs text-muted-foreground">Critical tasks requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
        <Button variant="outline">
          Add Task
        </Button>
        <Button variant="outline">
          Update Status
        </Button>
      </div>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Milestones
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Milestones due in the next 7 days
          </p>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => {
                // Get upcoming milestones for each project - this would come from actual API
                const upcomingMilestones = project.milestones?.filter(milestone =>
                  milestone.status === 'PENDING' &&
                  new Date(milestone.dueDate) >= new Date() &&
                  new Date(milestone.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                );

                return upcomingMilestones?.map((milestone) => (
                  <div key={`${project.id}-${milestone.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-sm text-muted-foreground">
                        For: {project.title}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ));
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming milestones in the next 7 days
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Updated</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b last:border-b-0 hover:bg-muted/10">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/client/projects/${project.id}`} className="hover:underline">
                        <div className="font-medium">{project.title}</div>
                      </Link>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {project.owner}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                      {new Date(project.dueDate) < new Date() && project.progress < 100 && (
                        <Badge variant="destructive" className="mt-1">Overdue</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Flag className={`h-4 w-4 ${getPriorityColor(project.priority)}`} />
                        <span className="capitalize">{project.priority}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active projects
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}