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
  FileText,
  Mail,
  Send,
  Eye,
  Download
} from 'lucide-react';
import { useProjects } from '@/lib/api';

export default function PendingAgreementsPage() {
  const { data: projectsResponse, isLoading } = useProjects('', { status: 'PENDING_ACCEPTANCE' }, { page: 1, limit: 10 });
  const [agreements, setAgreements] = useState([]);

  useEffect(() => {
    if (projectsResponse?.items) {
      // Convert project data to agreement format for this page
      const pendingAgreements = projectsResponse.items.map(project => ({
        id: project.id,
        projectName: project.title,
        client: project.client?.name || project.owner || 'Unknown Client',
        agreementType: 'Contract',
        submissionDate: new Date(project.createdAt),
        approvalDeadline: new Date(project.updatedAt), // This might need to come from a different field
        lastFollowUp: new Date(project.updatedAt), // Last updated time
        statusNotes: `Awaiting ${project.client?.name} Approval`,
        status: project.status.toLowerCase() === 'pending' ? 'pending' : project.status.toLowerCase(),
        documentLink: '#'
      }));
      setAgreements(pendingAgreements);
    }
  }, [projectsResponse]);
  
  const getAgreementStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-gray-100 text-gray-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendReminder = (id: string) => {
    // In a real app, this would trigger an API call
    console.log(`Reminder sent for agreement ID: ${id}`);
    alert(`Reminder sent for project: ${agreements.find(a => a.id === id)?.projectName}`);
  };

  const handleConvertToActive = (id: string) => {
    // In a real app, this would update the agreement status
    console.log(`Converting agreement ID: ${id} to active project`);
    alert(`Project ${agreements.find(a => a.id === id)?.projectName} converted to active project`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading pending agreements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Agreements</h1>
        <p className="text-muted-foreground">
          Projects waiting for client approval, internal sign-off, or contract agreement before work begins.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Agreement Document
        </Button>
      </div>

      {/* Pending Agreements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agreement Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Follow-up</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.id} className="border-b last:border-b-0 hover:bg-muted/10">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/client/projects/${agreement.id}`} className="hover:underline">
                        <div className="font-medium">{agreement.projectName}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {agreement.client}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {agreement.agreementType}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(agreement.submissionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(agreement.approvalDeadline).toLocaleDateString()}
                      </div>
                      {new Date(agreement.approvalDeadline) < new Date() && (
                        <Badge variant="destructive" className="mt-1">Overdue</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {agreement.lastFollowUp ?
                        new Date(agreement.lastFollowUp).toLocaleDateString() :
                        'None'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getAgreementStatusColor(agreement.status)}>
                        {agreement.statusNotes}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(agreement.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Reminder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvertToActive(agreement.id)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Viewing', agreement.documentLink)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Downloading', agreement.documentLink)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agreements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending agreements
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agreement Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Approval</span>
                <span className="font-medium">
                  {agreements.filter(a => a.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Under Review</span>
                <span className="font-medium">
                  {agreements.filter(a => a.status === 'under_review').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sent - No Response</span>
                <span className="font-medium">
                  {agreements.filter(a => a.status === 'sent').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Returned with Comments</span>
                <span className="font-medium">
                  {agreements.filter(a => a.status === 'returned').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agreements
                .filter(a => new Date(a.approvalDeadline) >= new Date())
                .sort((a, b) => new Date(a.approvalDeadline).getTime() - new Date(b.approvalDeadline).getTime())
                .slice(0, 3)
                .map((agreement) => (
                  <div key={agreement.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{agreement.projectName}</div>
                      <div className="text-sm text-muted-foreground">{agreement.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Date(agreement.approvalDeadline).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.ceil(
                          (new Date(agreement.approvalDeadline).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                        )} days left
                      </div>
                    </div>
                  </div>
                ))}

              {agreements.filter(a => new Date(a.approvalDeadline) >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}