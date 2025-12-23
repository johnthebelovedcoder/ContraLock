'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Coins, 
  Wallet, 
  ArrowUpDown, 
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { currencyService, SUPPORTED_CURRENCIES, Currency } from '@/lib/services/currencyService';
import { walletService, ConnectedWallet } from '@/lib/services/walletService';

interface CurrencySelectorProps {
  selectedCurrency: string;
  amount: number;
  onCurrencyChange: (currency: string) => void;
  onAmountChange: (amount: number) => void;
  targetCurrency?: string;
  showConversion?: boolean;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  amount,
  onCurrencyChange,
  onAmountChange,
  targetCurrency = 'USD',
  showConversion = true,
  className = ''
}: CurrencySelectorProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update converted amount when currency or amount changes
  useEffect(() => {
    if (showConversion && amount > 0) {
      try {
        const converted = currencyService.convert(amount, selectedCurrency, targetCurrency);
        setConvertedAmount(converted);
      } catch (err) {
        setError('Failed to convert currency');
        setConvertedAmount(null);
      }
    } else {
      setConvertedAmount(null);
    }
  }, [amount, selectedCurrency, targetCurrency, showConversion]);

  // Listen for wallet connection changes
  useEffect(() => {
    const unsubscribe = walletService.addWalletListener(setWallet);
    setWallet(walletService.getConnectedWallet());
    return unsubscribe;
  }, []);

  const handleConnectWallet = async () => {
    if (walletService.isConnected()) {
      walletService.disconnectWallet();
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      await walletService.connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency and Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-8"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {selectedCurrencyInfo?.symbol}
              </div>
            </div>
            <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({currency.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversion Display */}
        {showConversion && convertedAmount !== null && (
          <div className="p-3 bg-muted rounded-md text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Equivalent in {targetCurrency}:
              </span>
              <span className="font-medium">
                {currencyService.formatAmount(convertedAmount, targetCurrency)}
              </span>
            </div>
          </div>
        )}

        {/* Wallet Connection for Crypto */}
        {selectedCurrencyInfo?.type === 'crypto' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span className="font-medium">Crypto Wallet</span>
              </div>
              
              {wallet ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                variant={wallet ? "outline" : "default"}
                className="flex-1"
              >
                {isConnecting ? (
                  'Connecting...'
                ) : wallet ? (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connected: {wallet.account.address.substring(0, 6)}...{wallet.account.address.substring(38)}
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>

              {wallet && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Open wallet in browser
                    window.open(`https://etherscan.io/address/${wallet.account.address}`, '_blank');
                  }}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}

            {wallet && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span>
                    {parseFloat(wallet.account.balance) / 1e18} ETH
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Options */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant={selectedCurrencyInfo?.type === 'fiat' ? "default" : "outline"}
              className="flex items-center justify-start gap-2 h-auto py-3"
              onClick={() => {
                if (SUPPORTED_CURRENCIES.some(c => c.type === 'fiat')) {
                  const firstFiat = SUPPORTED_CURRENCIES.find(c => c.type === 'fiat');
                  if (firstFiat) onCurrencyChange(firstFiat.code);
                }
              }}
            >
              <DollarSign className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Traditional</div>
                <div className="text-xs text-muted-foreground">Credit/Debit Card, Bank Transfer</div>
              </div>
            </Button>
            
            <Button
              variant={selectedCurrencyInfo?.type === 'crypto' ? "default" : "outline"}
              className="flex items-center justify-start gap-2 h-auto py-3"
              onClick={() => {
                if (SUPPORTED_CURRENCIES.some(c => c.type === 'crypto')) {
                  const firstCrypto = SUPPORTED_CURRENCIES.find(c => c.type === 'crypto');
                  if (firstCrypto) onCurrencyChange(firstCrypto.code);
                }
              }}
            >
              <Coins className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Cryptocurrency</div>
                <div className="text-xs text-muted-foreground">Bitcoin, Ethereum, Stablecoins</div>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}