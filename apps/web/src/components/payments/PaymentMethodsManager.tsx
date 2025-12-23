'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { usePaymentStore } from '@/lib/store';
import { toast } from 'sonner';

interface PaymentMethodsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodAdded: () => void;
}

export function PaymentMethodsManager({
  isOpen,
  onClose,
  onPaymentMethodAdded,
}: PaymentMethodsManagerProps) {
  const { addPaymentMethod } = usePaymentStore();
  const [methodType, setMethodType] = useState<'BANK_ACCOUNT' | 'CARD' | 'CRYPTO'>('BANK_ACCOUNT');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('BTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to add a payment method');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payment method data based on type
      let paymentMethodData: any = {
        userId: user.id,
        default: false // Will be set as default if it's the first one
      };

      if (methodType === 'BANK_ACCOUNT') {
        if (!bankName || !accountNumber || !routingNumber) {
          toast.error('Please fill in all bank account details');
          return;
        }

        paymentMethodData = {
          ...paymentMethodData,
          type: 'bank',
          bankName,
          accountNumber,
          routingNumber,
        };
      } else if (methodType === 'CARD') {
        if (!cardNumber || !cardExpiry || !cardCvc) {
          toast.error('Please fill in all card details');
          return;
        }

        // In a real app, we would tokenize the card details securely
        // For mock implementation, we'll just store the last 4 digits
        const last4 = cardNumber.slice(-4);

        paymentMethodData = {
          ...paymentMethodData,
          type: 'card',
          last4,
          brand: 'Visa', // In a real app, this would be detected from the card number
          expMonth: parseInt(cardExpiry.split('/')[0]) || 12,
          expYear: 2000 + parseInt(cardExpiry.split('/')[1]) || 2025,
        };
      } else if (methodType === 'CRYPTO') {
        if (!cryptoWalletAddress) {
          toast.error('Please enter a wallet address');
          return;
        }

        paymentMethodData = {
          ...paymentMethodData,
          type: 'crypto',
          walletAddress: cryptoWalletAddress,
          currency: cryptoCurrency,
        };
      }

      await addPaymentMethod(paymentMethodData);

      toast.success('Payment method added successfully');
      onPaymentMethodAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBankName('');
    setAccountNumber('');
    setRoutingNumber('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCryptoWalletAddress('');
    setCryptoCurrency('BTC');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a bank account, card, or cryptocurrency wallet for deposits and withdrawals.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="methodType">Method Type</Label>
            <Select value={methodType} onValueChange={(value: 'BANK_ACCOUNT' | 'CARD' | 'CRYPTO') => setMethodType(value)}>
              <SelectTrigger id="methodType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_ACCOUNT">Bank Account</SelectItem>
                <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {methodType === 'BANK_ACCOUNT' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Chase Bank"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                  type="password"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="Routing number"
                  type="password"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : methodType === 'CARD' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
                  placeholder="1234 5678 9012 3456"
                  required
                  disabled={isSubmitting}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input
                    id="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      setCardExpiry(value);
                    }}
                    placeholder="MM/YY"
                    required
                    disabled={isSubmitting}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardCvc">CVC</Label>
                  <Input
                    id="cardCvc"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="CVC"
                    type="password"
                    required
                    disabled={isSubmitting}
                    maxLength={4}
                  />
                </div>
              </div>
            </>
          ) : (
            // Crypto section
            <>
              <div className="space-y-2">
                <Label htmlFor="cryptoCurrency">Cryptocurrency</Label>
                <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                  <SelectTrigger id="cryptoCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="BNB">BNB (BNB)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                    <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                    <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    <SelectItem value="DOGE">Dogecoin (DOGE)</SelectItem>
                    <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cryptoWalletAddress">Wallet Address</Label>
                <Input
                  id="cryptoWalletAddress"
                  value={cryptoWalletAddress}
                  onChange={(e) => setCryptoWalletAddress(e.target.value)}
                  placeholder="Enter your cryptocurrency wallet address"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Make sure this is a valid wallet address for {cryptoCurrency}
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}