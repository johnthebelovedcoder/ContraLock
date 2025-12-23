'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FormError } from '@/components/ui/form-error';
import {
  Wallet,
  DollarSign,
  Coins,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { currencyService, SUPPORTED_CURRENCIES } from '@/lib/services/currencyService';
import { walletService, ConnectedWallet } from '@/lib/services/walletService';
import { paymentSchemas } from '@/lib/validation';

interface EnhancedDepositFormProps {
  projectId: string;
  projectTitle: string;
  projectBudget: number; // in cents
  onDepositComplete: () => void;
  className?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'crypto' | 'bank' | 'paypal';
  provider: string;
  details: string;
  isDefault: boolean;
  lastUsed?: Date;
  currency?: string;
}

export function EnhancedDepositForm({
  projectId,
  projectTitle,
  projectBudget,
  onDepositComplete,
  className = ''
}: EnhancedDepositFormProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [depositStep, setDepositStep] = useState<'amount' | 'method' | 'review' | 'processing' | 'success'>('amount');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm({
    resolver: zodResolver(paymentSchemas.enhancedDeposit()),
    defaultValues: {
      amount: projectBudget / 100, // Convert from cents
      currency: 'USD',
      paymentMethodId: null
    }
  });

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');
  const watchedPaymentMethodId = watch('paymentMethodId');

  // Listen for wallet connection changes
  useEffect(() => {
    const unsubscribe = walletService.addWalletListener(setWallet);
    setWallet(walletService.getConnectedWallet());

    // Generate mock payment methods for demo
    const mockMethods: PaymentMethod[] = [
      {
        id: 'card-1',
        type: 'card',
        provider: 'Visa',
        details: '1234',
        isDefault: true,
        lastUsed: new Date(Date.now() - 86400000), // 1 day ago
        currency: 'USD'
      },
      {
        id: 'card-2',
        type: 'card',
        provider: 'Mastercard',
        details: '5678',
        isDefault: false,
        currency: 'USD'
      },
      {
        id: 'paypal-1',
        type: 'paypal',
        provider: 'PayPal',
        details: 'user@example.com',
        isDefault: false,
        currency: 'USD'
      }
    ];

    setAvailableMethods(mockMethods);

    return unsubscribe;
  }, []);

  // Initialize form values
  useEffect(() => {
    setValue('amount', projectBudget / 100);
  }, [projectBudget, setValue]);

  // Update converted amount when currency or amount changes
  useEffect(() => {
    if (watchedAmount > 0) {
      try {
        const converted = currencyService.convert(watchedAmount, watchedCurrency, 'USD');
        setConvertedAmount(converted);
      } catch (err) {
        setError('Failed to convert currency');
        setConvertedAmount(null);
      }
    } else {
      setConvertedAmount(null);
    }
  }, [watchedAmount, watchedCurrency]);

  // Add connected wallet as a payment method
  useEffect(() => {
    if (wallet) {
      const walletMethod: PaymentMethod = {
        id: `wallet-${wallet.account.address}`,
        type: 'crypto',
        provider: wallet.walletType,
        details: `${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(38)}`,
        isDefault: false,
        currency: 'ETH'
      };

      setAvailableMethods(prev => {
        // Remove any existing wallet methods and add the new one
        const filtered = prev.filter(m => !m.id.startsWith('wallet-'));
        return [...filtered, walletMethod];
      });
    }
  }, [wallet]);

  // Update the payment method when selection changes
  useEffect(() => {
    if (watchedPaymentMethodId) {
      setValue('paymentMethodId', watchedPaymentMethodId);
    }
  }, [watchedPaymentMethodId, setValue]);

  const handleContinue = async () => {
    if (depositStep === 'amount') {
      const isValid = await trigger(['amount']);
      if (!isValid) {
        return;
      }
      setDepositStep('method');
      setError(null);
    } else if (depositStep === 'method') {
      const isValid = await trigger(['paymentMethodId']);
      if (!isValid) {
        return;
      }
      setDepositStep('review');
      setError(null);
    }
  };

  const handleDeposit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate all required fields before processing
      const isValid = await trigger();
      if (!isValid) {
        return;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would call the backend API
      // to create the payment intent and process the payment
      if (watchedPaymentMethodId?.startsWith('wallet-')) {
        // Simulate crypto transaction
        setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
      }

      setDepositStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
  const selectedMethodObj = availableMethods.find(m => m.id === selectedMethod);
  const progressValue = depositStep === 'amount' ? 25 : depositStep === 'method' ? 50 : depositStep === 'review' ? 75 : depositStep === 'processing' ? 90 : 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {depositStep === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5" />}
              Deposit Funds to Escrow
            </CardTitle>
            <CardDescription>
              {depositStep === 'amount' && 'Enter the amount you want to deposit'}
              {depositStep === 'method' && 'Select your preferred payment method'}
              {depositStep === 'review' && 'Review your payment details'}
              {depositStep === 'processing' && 'Processing your payment...'}
              {depositStep === 'success' && 'Payment successful!'}
            </CardDescription>
          </div>
          
          {depositStep !== 'success' && (
            <Badge variant="outline" className="text-xs">
              Step {depositStep === 'amount' ? 1 : depositStep === 'method' ? 2 : 3} of 3
            </Badge>
          )}
        </div>
        
        <Progress value={progressValue} className="mt-3" />
      </CardHeader>
      
      <CardContent>
        {error && (
          <FormError message={error} />
        )}
        
        {depositStep === 'amount' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium">Project: {projectTitle}</div>
                <div>Required deposit: {currencyService.formatAmount(projectBudget / 100, 'USD')}</div>
              </div>
            </div>

            <CurrencySelector
              selectedCurrency={watchedCurrency}
              amount={watchedAmount}
              onCurrencyChange={(currency) => setValue('currency', currency)}
              onAmountChange={(amount) => setValue('amount', amount)}
              showConversion={true}
            />
            {errors.amount && (
              <FormError message={errors.amount.message} />
            )}
          </div>
        )}
        
        {depositStep === 'method' && (
          <div className="space-y-4">
            <PaymentMethodSelector
              selectedMethod={watchedPaymentMethodId}
              onMethodSelect={(methodId) => setValue('paymentMethodId', methodId)}
              availableMethods={availableMethods}
            />
            {errors.paymentMethodId && (
              <FormError message={errors.paymentMethodId.message} />
            )}
          </div>
        )}
        
        {depositStep === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {currencyService.formatAmount(watchedAmount, watchedCurrency)}
                </span>
              </div>

              {convertedAmount !== null && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Equivalent in USD</span>
                  <span className="font-medium">
                    {currencyService.formatAmount(convertedAmount, 'USD')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="font-medium">
                  {selectedMethodObj?.provider} {selectedMethodObj?.details && `•••• ${selectedMethodObj.details}`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="font-medium">{projectTitle}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-amber-700 dark:text-amber-300">Escrow Protection</div>
                  <div className="text-amber-600 dark:text-amber-400">
                    Your funds will be held securely in escrow until the project milestone is completed and approved.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {depositStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <p className="text-center font-medium">Processing your payment...</p>
            <p className="text-center text-sm text-muted-foreground mt-1">
              This may take a few moments
            </p>
          </div>
        )}
        
        {depositStep === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your funds have been securely deposited to escrow for project "{projectTitle}".
            </p>
            
            {transactionHash && (
              <div className="w-full max-w-xs p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-xs">{transactionHash.substring(0, 12)}...</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {depositStep !== 'success' && depositStep !== 'processing' && (
          <Button
            variant="outline"
            onClick={() => {
              if (depositStep === 'method') setDepositStep('amount');
              else if (depositStep === 'review') setDepositStep('method');
            }}
            disabled={depositStep === 'amount'}
          >
            Back
          </Button>
        )}

        {depositStep !== 'success' && depositStep !== 'processing' && (
          <div className="flex gap-2">
            {depositStep !== 'review' && (
              <Button onClick={handleContinue}>
                Continue
              </Button>
            )}

            {depositStep === 'review' && (
              <Button onClick={handleDeposit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Pay'
                )}
              </Button>
            )}
          </div>
        )}

        {depositStep === 'success' && (
          <Button onClick={onDepositComplete} className="w-full">
            Continue to Project
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}