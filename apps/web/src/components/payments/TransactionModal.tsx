import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Wallet,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionModal({ transaction, open, onOpenChange }: TransactionModalProps) {
  if (!transaction) {
    return null;
  }

  const typeIcons = {
    DEPOSIT: <Upload className="h-5 w-5" />,
    MILESTONE_RELEASE: <Download className="h-5 w-5" />,
    DISPUTE_PAYMENT: <Download className="h-5 w-5" />,
    DISPUTE_REFUND: <Download className="h-5 w-5" />,
    WITHDRAWAL: <Download className="h-5 w-5" />,
    REFUND: <Download className="h-5 w-5" />,
    ADMIN_ADJUSTMENT: <FileText className="h-5 w-5" />,
    FEE: <DollarSign className="h-5 w-5" />
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-muted">
              {typeIcons[transaction.type as keyof typeof typeIcons] || <CreditCard className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {typeLabels[transaction.type as keyof typeof typeLabels] || transaction.type}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Transaction Details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className={`text-2xl font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))} {transaction.currency || 'USD'}
              </div>
            </div>
            <Badge className={`${statusColors[transaction.status as keyof typeof statusColors]} text-white`}>
              {transaction.status}
            </Badge>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Transaction ID</div>
                  <div className="font-medium">{transaction.id}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                </div>
              </div>

              {transaction.processedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Processed At</div>
                    <div className="font-medium">{formatDate(transaction.processedAt)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Project</div>
                  <div className="font-medium">#{transaction.projectId || transaction._id}</div>
                </div>
              </div>

              {(transaction.milestoneId || transaction.milestone) && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Milestone</div>
                    <div className="font-medium">#{transaction.milestoneId || transaction.milestone}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Currency</div>
                  <div className="font-medium">{transaction.currency || 'USD'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Payment Details</h3>
            
            {(transaction.paymentMethodId || transaction.providerTransactionId) && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Payment Method ID</div>
                  <div className="font-medium">{transaction.paymentMethodId || transaction.providerTransactionId}</div>
                </div>
              </div>
            )}

            {transaction.stripeIntentId && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Stripe Intent ID</div>
                  <div className="font-medium">{transaction.stripeIntentId}</div>
                </div>
              </div>
            )}

            {transaction.stripeTransferId && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Stripe Transfer ID</div>
                  <div className="font-medium">{transaction.stripeTransferId}</div>
                </div>
              </div>
            )}

            {transaction.cryptoTxHash && (
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Crypto Transaction Hash</div>
                  <div className="font-medium font-mono text-sm">{transaction.cryptoTxHash}</div>
                </div>
              </div>
            )}

            {transaction.cryptoNetwork && (
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Crypto Network</div>
                  <div className="font-medium">{transaction.cryptoNetwork}</div>
                </div>
              </div>
            )}

            {transaction.paymentMethodType && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Payment Method Type</div>
                  <div className="font-medium capitalize">{transaction.paymentMethodType}</div>
                </div>
              </div>
            )}
          </div>

          {/* Fees */}
          {transaction.fees && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Platform Fee</div>
                  <div className="font-medium">{formatCurrency(transaction.fees.platform)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Payment Processor Fee</div>
                  <div className="font-medium">{formatCurrency(transaction.fees.paymentProcessor)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Fees</div>
                  <div className="font-medium">{formatCurrency(transaction.fees.total)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {transaction.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Description</h3>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-foreground">{transaction.description}</p>
              </div>
            </div>
          )}

          {/* Exchange Rate Info */}
          {transaction.exchangeRate && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Exchange Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Exchange Rate</div>
                  <div className="font-medium">{transaction.exchangeRate}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Exchange Rate Timestamp</div>
                  <div className="font-medium">{formatDate(transaction.exchangeRateTimestamp instanceof Date ? transaction.exchangeRateTimestamp : new Date(transaction.createdAt))}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}