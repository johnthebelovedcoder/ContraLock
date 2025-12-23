import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { Wallet, ArrowRight, Loader2 } from 'lucide-react';

interface CryptoPaymentFormProps {
  amount: number;
  projectId: string;
  onSubmit: (data: any) => Promise<void>;
  defaultCurrency?: string;
}

export function CryptoPaymentForm({ amount, projectId, onSubmit, defaultCurrency = 'USD' }: CryptoPaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'traditional' | 'crypto'>('traditional');
  const [cryptoAmount, setCryptoAmount] = useState(amount.toString());
  const [currency, setCurrency] = useState(defaultCurrency);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const paymentData = {
        projectId,
        paymentMethodType: paymentMethod,
        ...(paymentMethod === 'traditional' && { 
          paymentMethodId: '' // Will be obtained from payment form
        }),
        ...(paymentMethod === 'crypto' && { 
          amount: Number(cryptoAmount),
          currency: currency
        })
      };
      
      await onSubmit(paymentData);
      
      toast({
        title: 'Payment Initiated',
        description: paymentMethod === 'crypto' 
          ? 'You will be redirected to complete your crypto payment' 
          : 'Your payment is being processed'
      });
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Select how you would like to make your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span>Total Amount:</span>
              <span className="font-medium">${Number(cryptoAmount).toFixed(2)} {currency}</span>
            </div>
            {/* Display fee breakdown if needed */}
            <div className="text-sm text-muted-foreground mt-2">
              <p>Fee breakdown:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Client fee: 1.9% (added to contract value)</li>
                <li>Platform fee: 1.9% + 3.6% = 5.5% total</li>
              </ul>
            </div>
          </div>
          
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            setPaymentMethod={(method) => setPaymentMethod(method as any)}
            cryptoAmount={cryptoAmount}
            setCryptoAmount={setCryptoAmount}
            currency={currency}
            setCurrency={setCurrency}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue with Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}