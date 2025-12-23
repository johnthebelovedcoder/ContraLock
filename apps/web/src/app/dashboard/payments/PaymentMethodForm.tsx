import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { Bitcoin, CreditCard, DollarSign } from 'lucide-react';

interface PaymentMethodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentMethodForm({ open, onOpenChange }: PaymentMethodFormProps) {
  const { addPaymentMethod } = usePaymentStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'card', // Change default to card
    token: '',
    default: false
  });

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add a payment method',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare payment method data based on type
      let paymentMethodData: any = {
        userId: user._id,
        default: formData.default
      };

      if (formData.type === 'crypto') {
        // For crypto, we expect the token field to contain the wallet address
        paymentMethodData.type = 'crypto';
        paymentMethodData.walletAddress = formData.token;
        paymentMethodData.currency = 'BTC'; // Default to BTC, could be expanded to select currency
      } else if (formData.type === 'card') {
        paymentMethodData.type = 'card';
        paymentMethodData.last4 = formData.token?.slice(-4) || '****'; // Store last 4 digits
        paymentMethodData.brand = 'Visa'; // Default brand
      } else if (formData.type === 'bank_account') {
        paymentMethodData.type = 'bank';
        paymentMethodData.bankName = formData.token; // Could be account details
      } else if (formData.type === 'paypal') {
        paymentMethodData.type = 'paypal';
        paymentMethodData.email = formData.token; // PayPal email
      }

      await addPaymentMethod(paymentMethodData);

      toast({
        title: 'Success',
        description: 'Payment method added successfully'
      });

      onOpenChange(false);
      setFormData({
        type: 'card',
        token: '',
        default: false
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment method',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method for deposits and withdrawals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="type">Payment Method Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit/Debit Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="bank_account">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Bank Account</span>
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>PayPal</span>
                  </div>
                </SelectItem>
                <SelectItem value="crypto">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4" />
                    <span>Cryptocurrency</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="token">
              {formData.type === 'card' ? 'Card Details' :
               formData.type === 'bank_account' ? 'Bank Account Details' :
               formData.type === 'paypal' ? 'PayPal Email' :
               'Wallet Address or Crypto Details'}
            </Label>
            <Input
              id="token"
              value={formData.token}
              onChange={(e) => setFormData({...formData, token: e.target.value})}
              placeholder={
                formData.type === 'card' ? 'Card number' :
                formData.type === 'bank_account' ? 'Account number' :
                formData.type === 'paypal' ? 'PayPal email address' :
                'Enter wallet address or crypto details'
              }
            />
            {formData.type === 'card' && (
              <p className="text-xs text-muted-foreground mt-1">
                For demo purposes, use Stripe test card numbers
              </p>
            )}
            {formData.type === 'crypto' && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter your cryptocurrency wallet details or public address
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="default"
              checked={formData.default}
              onChange={(e) => setFormData({...formData, default: e.target.checked})}
              className="h-4 w-4"
            />
            <Label htmlFor="default">Set as default payment method</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Payment Method'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}