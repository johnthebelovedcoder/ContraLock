import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Eye, MessageSquare, Gavel, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminDisputes } from '@/lib/api';

export function DisputeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: disputesData, isLoading, error } = useAdminDisputes({
    page: currentPage,
    limit: 10,
    status: filterStatus !== 'all' ? filterStatus.toUpperCase().replace('-', '_') : undefined,
    search: searchTerm
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Error loading disputes: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const disputes = disputesData?.items || [];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Disputes</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {filterStatus === 'all' ? 'All Statuses' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setFilterStatus('all');
                setCurrentPage(1);
              }}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterStatus('PENDING_REVIEW');
                setCurrentPage(1);
              }}>Pending Review</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterStatus('IN_MEDIATION');
                setCurrentPage(1);
              }}>In Mediation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterStatus('IN_ARBITRATION');
                setCurrentPage(1);
              }}>In Arbitration</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterStatus('RESOLVED');
                setCurrentPage(1);
              }}>Resolved</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.length > 0 ? (
                disputes.map((dispute: any) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-sm">
                      {dispute.id?.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      {dispute.project?.title || dispute.project?.id?.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      {dispute.milestone?.title || dispute.milestone?.id?.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        dispute.status === 'RESOLVED' ? 'default' :
                        dispute.status === 'IN_MEDIATION' ? 'secondary' :
                        dispute.status === 'IN_ARBITRATION' ? 'destructive' :
                        'outline'
                      }>
                        {dispute.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {dispute.reason?.substring(0, 30)}...
                    </TableCell>
                    <TableCell>
                      {dispute.resolutionPhase || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-1">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Gavel className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No disputes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {disputesData?.pagination && disputesData.pagination.total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((disputesData.pagination.page - 1) * disputesData.pagination.limit) + 1} to {Math.min(disputesData.pagination.page * disputesData.pagination.limit, disputesData.pagination.total)} of {disputesData.pagination.total} disputes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={disputesData.pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, disputesData.pagination.totalPages))}
                disabled={disputesData.pagination.page >= disputesData.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}