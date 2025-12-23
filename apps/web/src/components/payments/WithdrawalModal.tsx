'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/authStore';
import { WithdrawalService, PaymentMethod } from '@/lib/services/withdrawalService';
import { toast } from 'sonner';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawalRequested: () => void;
  availableBalance: number; // in dollars
}

export function WithdrawalModal({
  isOpen,
  onClose,
  onWithdrawalRequested,
  availableBalance,
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && user) {
      loadPaymentMethods();
    }
  }, [isOpen, user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

    try {
      const withdrawalService = WithdrawalService.getInstance();
      const methods = withdrawalService.getUserPaymentMethods(user.id);
      setPaymentMethods(methods);
      
      // Set default payment method if available
      const defaultMethod = methods.find(pm => pm.isDefault);
      if (defaultMethod) {
        setPaymentMethodId(defaultMethod.id);
      } else if (methods.length > 0) {
        setPaymentMethodId(methods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to make a withdrawal');
      return;
    }

    const amountInCents = parseFloat(amount) * 100; // Convert to cents

    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountInCents > availableBalance * 100) {
      toast.error('Amount exceeds available balance');
      return;
    }

    if (!paymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);

    try {
      const withdrawalService = WithdrawalService.getInstance();
      
      await withdrawalService.requestWithdrawal(
        user.id,
        amountInCents,
        paymentMethodId
      );

      toast.success('Withdrawal request submitted successfully');
      onWithdrawalRequested();
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Withdraw funds from your wallet to your linked payment method.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="pl-8"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available balance: ${availableBalance.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={isSubmitting || paymentMethods.length === 0}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder={paymentMethods.length > 0 ? "Select payment method" : "No payment methods"} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.type === 'BANK_ACCOUNT' 
                      ? `${method.bankName} ****${method.accountNumber?.slice(-4)}`
                      : `${method.cardBrand} ****${method.cardLast4}`
                    }
                    {method.isDefault && ' (Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !paymentMethodId}>
              {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}