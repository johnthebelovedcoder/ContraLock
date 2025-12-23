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
import { Search, Eye, Download, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminTransactions } from '@/lib/api';

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transactionsData, isLoading, error } = useAdminTransactions({
    page: currentPage,
    limit: 10,
    type: filterType !== 'all' ? filterType : undefined,
    search: searchTerm
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
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
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Error loading transactions: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const transactions = (transactionsData && typeof transactionsData === 'object' && 'items' in transactionsData)
    ? (transactionsData.items as any[])
    : (Array.isArray(transactionsData) ? transactionsData : []);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Transactions</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
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
                {filterType === 'all' ? 'All Types' : filterType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setFilterType('all');
                setCurrentPage(1);
              }}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterType('DEPOSIT');
                setCurrentPage(1);
              }}>Deposits</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterType('MILESTONE_RELEASE');
                setCurrentPage(1);
              }}>Milestone Releases</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterType('DISPUTE_PAYMENT');
                setCurrentPage(1);
              }}>Dispute Payments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setFilterType('DISPUTE_REFUND');
                setCurrentPage(1);
              }}>Dispute Refunds</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.providerTransactionId || transaction.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.type === 'DEPOSIT' ? 'secondary' :
                        transaction.type === 'MILESTONE_RELEASE' ? 'default' :
                        transaction.type === 'DISPUTE_PAYMENT' || transaction.type === 'DISPUTE_REFUND' ? 'destructive' :
                        'outline'
                      }>
                        {transaction.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(transaction.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {transaction.projectId?.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.status === 'COMPLETED' ? 'default' :
                        transaction.status === 'PENDING' ? 'secondary' :
                        'destructive'
                      }>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {transactionsData && typeof transactionsData === 'object' && 'pagination' in transactionsData &&
          transactionsData.pagination &&
          (transactionsData.pagination as any).total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(((transactionsData.pagination as any).page - 1) * (transactionsData.pagination as any).limit) + 1} to {Math.min((transactionsData.pagination as any).page * (transactionsData.pagination as any).limit, (transactionsData.pagination as any).total)} of {(transactionsData.pagination as any).total} transactions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={(transactionsData.pagination as any).page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, (transactionsData.pagination as any).totalPages))}
                disabled={(transactionsData.pagination as any).page >= (transactionsData.pagination as any).totalPages}
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