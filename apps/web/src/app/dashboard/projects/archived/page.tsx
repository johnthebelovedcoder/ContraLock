'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  User,
  RotateCcw,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { useProjects } from '@/lib/api';

export default function ArchivedProjectsPage() {
  const { data: projectsResponse, isLoading } = useProjects('', { status: 'ARCHIVED' }, { page: 1, limit: 10 });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (projectsResponse?.items) {
      setProjects(projectsResponse.items);
    }
  }, [projectsResponse]);
  
  const handleRestoreProject = (id: string) => {
    // In a real app, this would trigger an API call to restore the project
    console.log(`Restoring project ID: ${id}`);
    alert(`Project ${projects.find(p => p.id === id)?.title} restored from archive`);
  };

  const handlePermanentlyDelete = (id: string) => {
    // In a real app, this would trigger an API call to permanently delete
    console.log(`Permanently deleting project ID: ${id}`);
    alert(`Project ${projects.find(p => p.id === id)?.title} permanently deleted`);
  };

  const handleViewDeliverables = (id: string) => {
    console.log(`Viewing deliverables for project ID: ${id}`);
    alert(`Opening deliverables for project ${projects.find(p => p.id === id)?.title}`);
  };

  const archiveReasons = [
    'Completed',
    'Cancelled',
    'On Hold',
    'Replaced',
    'Other'
  ];

  // Calculate stats from actual project data
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const cancelledProjects = projects.filter(p => p.status === 'CANCELLED').length;

  // Calculate average archive age (in this case, we'll use how long since project completion)
  const avgArchiveAge = projects.length > 0
    ? (projects.reduce((sum, project) => {
        const completionDate = new Date(project.updatedAt);
        const now = new Date();
        return sum + (now.getTime() - completionDate.getTime());
      }, 0) / projects.length / (1000 * 60 * 60 * 24 * 30) // in months
    ).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading archived projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archived Projects</h1>
        <p className="text-muted-foreground">
          Stores inactive or long-finished projects that users may want to keep for records but don't need in active views.
        </p>
      </div>

      {/* Archive Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Projects in archive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedProjects}
            </div>
            <p className="text-xs text-muted-foreground">Projects completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cancelledProjects}
            </div>
            <p className="text-xs text-muted-foreground">Projects cancelled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Archive Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgArchiveAge}</div>
            <p className="text-xs text-muted-foreground">Months in archive</p>
          </CardContent>
        </Card>
      </div>

      {/* Archived Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Archived Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Archive Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Original Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Original Budget</th>
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
                      <Badge variant="outline">
                        {project.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{project.owner}</td>
                    <td className="py-3 px-4">${(project.budget / 100).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreProject(project.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDeliverables(project.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Files
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentlyDelete(project.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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
              No archived projects
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Project Archiving</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Archived projects are read-only by default and removed from active project views.
              You can restore them to active status if needed, or permanently delete them if no longer needed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Archive Reasons</h3>
                <ul className="space-y-2">
                  {archiveReasons.map((reason, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-sm">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Best Practices</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Archive projects that are completed and no longer need active management</li>
                  <li>Review archived projects periodically for cleanup</li>
                  <li>Keep important deliverables accessible in archived state</li>
                  <li>Consider data retention policies when permanently deleting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}