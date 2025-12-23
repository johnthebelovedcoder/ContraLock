import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types';
import {
  CreditCard,
  DollarSign,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { TransactionModal } from '@/components/payments/TransactionModal';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const typeIcons = {
    DEPOSIT: <Upload className="h-4 w-4" />,
    MILESTONE_RELEASE: <Download className="h-4 w-4" />,
    DISPUTE_PAYMENT: <Download className="h-4 w-4" />,
    DISPUTE_REFUND: <Download className="h-4 w-4" />,
    WITHDRAWAL: <Download className="h-4 w-4" />,
    REFUND: <Download className="h-4 w-4" />,
    ADMIN_ADJUSTMENT: <FileText className="h-4 w-4" />,
    FEE: <DollarSign className="h-4 w-4" />
  };

  const typeLabels = {
    DEPOSIT: 'Deposit',
    MILESTONE_RELEASE: 'Milestone Payment',
    DISPUTE_PAYMENT: 'Dispute Resolution',
    DISPUTE_REFUND: 'Dispute Refund',
    WITHDRAWAL: 'Withdrawal',
    REFUND: 'Refund',
    ADMIN_ADJUSTMENT: 'Admin Adjustment',
    FEE: 'Platform Fee'
  };

  const statusColors = {
    PENDING: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    FAILED: 'bg-red-500',
    REFUNDED: 'bg-blue-500'
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>No transactions found</p>
          <p className="text-sm mt-1">Your transaction history will appear here</p>
        </div>
      ) : (
        transactions.map(transaction => (
          <Card
            key={transaction._id}
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => handleTransactionClick(transaction)}
          >
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-muted">
                  {typeIcons[transaction.type as keyof typeof typeIcons] || <CreditCard className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {typeLabels[transaction.type as keyof typeof typeLabels] || transaction.type}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {transaction.description || 'Transaction details'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))} {transaction.currency || 'USD'}
                </div>

                <Badge className={`${statusColors[transaction.status as keyof typeof statusColors]} text-white`}>
                  {transaction.status}
                </Badge>

                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(transaction.createdAt)}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
}