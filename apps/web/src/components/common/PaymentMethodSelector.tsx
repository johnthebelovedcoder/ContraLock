import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencySelector } from './CurrencySelector';
import { Bitcoin, CreditCard, Wallet } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cryptoAmount: string;
  setCryptoAmount: (amount: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  cryptoAmount,
  setCryptoAmount,
  currency,
  setCurrency
}: PaymentMethodSelectorProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Select Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="traditional" id="traditional" />
            <Label htmlFor="traditional" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Traditional Payment (Credit Card, Bank Transfer)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="crypto" id="crypto" />
            <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
              <Bitcoin className="h-4 w-4" />
              Cryptocurrency Payment
            </Label>
          </div>
        </RadioGroup>

        {paymentMethod === 'crypto' && (
          <div className="mt-6 space-y-4 p-4 bg-muted rounded-md border">
            <div>
              <Label htmlFor="cryptoAmount">Amount to Pay</Label>
              <Input
                id="cryptoAmount"
                type="number"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder="Enter amount"
                step="any"
              />
            </div>
            
            <div>
              <Label htmlFor="cryptoCurrency">Currency</Label>
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Note: When paying with cryptocurrency:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>You will be redirected to a secure payment gateway</li>
                <li>Cryptocurrency will be converted to the project currency at the time of payment</li>
                <li>Transaction fees may apply based on the selected cryptocurrency</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}