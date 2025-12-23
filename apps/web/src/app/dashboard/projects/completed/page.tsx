'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  FileText,
  User,
  Download,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useProjects } from '@/lib/api';

export default function CompletedProjectsPage() {
  const { data: projectsResponse, isLoading } = useProjects('', { status: 'COMPLETED' }, { page: 1, limit: 10 });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (projectsResponse?.items) {
      setProjects(projectsResponse.items);
    }
  }, [projectsResponse]);
  
  const handleReopenProject = (id: string) => {
    // In a real app, this would trigger an API call
    console.log(`Reopening project ID: ${id}`);
    alert(`Project ${projects.find(p => p.id === id)?.title} reopened`);
  };

  const handleExportReports = (id: string) => {
    // In a real app, this would generate and download reports
    console.log(`Exporting reports for project ID: ${id}`);
    alert(`Reports for project ${projects.find(p => p.id === id)?.title} exported`);
  };

  // Calculate insights from projects data
  const completedThisMonth = projects.filter(p => {
    const projectDate = new Date(p.updatedAt);
    const now = new Date();
    return projectDate.getMonth() === now.getMonth() &&
           projectDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate average project duration
  const avgProjectDuration = projects.length > 0
    ? (projects.reduce((sum, project) => {
        const start = new Date(project.startDate);
        const end = new Date(project.updatedAt);
        return sum + (end.getTime() - start.getTime());
      }, 0) / projects.length / (1000 * 60 * 60 * 24 * 30) // in months
    ).toFixed(1) + ' months'
    : '0 months';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading completed projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Completed Projects</h1>
        <p className="text-muted-foreground">
          Projects that have been finished and passed final review.
        </p>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProjectDuration}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">In project history</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Closure Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deliverables</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Summary</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feedback</th>
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
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {project.deliverables?.slice(0, 3).map((file, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {typeof file === 'string' ? file : file.fileName || 'File'}
                          </Badge>
                        )) || (
                          <Badge variant="secondary" className="text-xs">
                            No files
                          </Badge>
                        )}
                        {project.deliverables && project.deliverables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.deliverables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {project.clientFeedback || 'No feedback yet'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReopenProject(project.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reopen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Viewing project history for', project.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportReports(project.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No completed projects
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post-mortems and Additional Insights - placeholder since we don't have this data from current API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Insights</CardTitle>
            <p className="text-sm text-muted-foreground">
              Performance metrics from completed projects
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center py-4 text-muted-foreground">
                Detailed post-mortem data would be available through a dedicated analytics API endpoint
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Performance metrics from completed projects
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Avg. Budget</span>
                <span className="font-medium">${projects.length > 0 ? (projects.reduce((sum, p) => sum + (p.budget || 0), 0) / projects.length / 100).toFixed(0) : '0'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Avg. Completion Time</span>
                <span className="font-medium">{avgProjectDuration}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-medium">${projects.length > 0 ? (projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 100).toLocaleString() : '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}