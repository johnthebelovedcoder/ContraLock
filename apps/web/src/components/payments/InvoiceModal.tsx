import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice } from '@/types';
import {
  CreditCard,
  DollarSign,
  FileText,
  User,
  Calendar,
  Hash,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceModal({ invoice, open, onOpenChange }: InvoiceModalProps) {
  if (!invoice) {
    return null;
  }

  const statusColors = {
    DRAFT: 'bg-gray-500',
    ISSUED: 'bg-yellow-500',
    PAID: 'bg-green-500',
    OVERDUE: 'bg-red-500'
  };

  const paymentMethodLabels = {
    CREDIT_CARD: 'Credit Card',
    BANK_TRANSFER: 'Bank Transfer',
    CRYPTO: 'Cryptocurrency',
    PAYPAL: 'PayPal'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Invoice #{invoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Detailed invoice information
                </DialogDescription>
              </div>
            </div>
            <Badge className={`${statusColors[invoice.status as keyof typeof statusColors]} text-white`}>
              {invoice.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Invoice Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Gross Amount</div>
              <div className="text-xl font-bold">{formatCurrency(invoice.grossAmount)} {invoice.currency}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Platform Fee</div>
              <div className="text-xl font-bold">{formatCurrency(invoice.platformFee)} {invoice.currency}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Net Amount</div>
              <div className="text-xl font-bold">{formatCurrency(invoice.netAmount)} {invoice.currency}</div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Client Information</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{invoice.client.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{invoice.client.email}</div>
                  </div>
                </div>
                {invoice.client.address && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{invoice.client.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Freelancer Information</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{invoice.freelancer.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{invoice.freelancer.email}</div>
                  </div>
                </div>
                {invoice.freelancer.taxId && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Tax ID</div>
                      <div className="font-medium">{invoice.freelancer.taxId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">Invoice Details</h3>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Invoice Number</div>
                  <div className="font-medium">{invoice.invoiceNumber}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Project ID</div>
                  <div className="font-medium">#{invoice.projectId}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Milestone ID</div>
                  <div className="font-medium">#{invoice.milestoneId}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">Dates & Payment</h3>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Issued Date</div>
                  <div className="font-medium">{formatDate(invoice.issuedDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Due Date</div>
                  <div className="font-medium">{formatDate(invoice.dueDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Payment Method</div>
                  <div className="font-medium">{paymentMethodLabels[invoice.paymentMethod as keyof typeof paymentMethodLabels] || invoice.paymentMethod}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Currency</div>
                  <div className="font-medium">{invoice.currency}</div>
                </div>
              </div>
              {invoice.exchangeRate && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Exchange Rate</div>
                    <div className="font-medium">1 {invoice.currency} = {invoice.exchangeRate} USD</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">Invoice Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Description</th>
                    <th className="text-right p-3">Quantity</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-muted/30">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">{formatCurrency(item.unitPrice)} {invoice.currency}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.total)} {invoice.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download Section */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => window.open(invoice.pdfUrl, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
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