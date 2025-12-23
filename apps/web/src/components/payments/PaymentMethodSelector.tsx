'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Coins, 
  Wallet, 
  Check, 
  ExternalLink,
  Lock,
  Shield,
  Zap
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, Currency } from '@/lib/services/currencyService';
import { walletService, ConnectedWallet } from '@/lib/services/walletService';

interface PaymentMethod {
  id: string;
  type: 'card' | 'crypto' | 'bank' | 'paypal';
  provider: string;
  details: string;
  isDefault: boolean;
  lastUsed?: Date;
  currency?: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodSelect: (methodId: string) => void;
  availableMethods: PaymentMethod[];
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  availableMethods,
  className = ''
}: PaymentMethodSelectorProps) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [cryptoMethods, setCryptoMethods] = useState<PaymentMethod[]>([]);
  const [traditionalMethods, setTraditionalMethods] = useState<PaymentMethod[]>([]);

  // Listen for wallet connection changes
  useEffect(() => {
    const unsubscribe = walletService.addWalletListener(setWallet);
    setWallet(walletService.getConnectedWallet());
    
    // Separate methods by type
    const crypto = availableMethods.filter(m => m.type === 'crypto');
    const traditional = availableMethods.filter(m => m.type !== 'crypto');
    
    setCryptoMethods(crypto);
    setTraditionalMethods(traditional);
    
    return unsubscribe;
  }, [availableMethods]);

  // Get connected crypto wallet as a payment method
  const getConnectedWalletMethod = (): PaymentMethod | null => {
    if (!wallet) return null;
    
    return {
      id: `wallet-${wallet.account.address}`,
      type: 'crypto',
      provider: wallet.walletType,
      details: `${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(38)}`,
      isDefault: false,
      currency: 'ETH' // Default to ETH, but could be configurable
    };
  };

  const connectedWalletMethod = getConnectedWalletMethod();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              Payment Method
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Select how you'd like to pay
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup 
          value={selectedMethod || undefined} 
          onValueChange={onMethodSelect}
          className="space-y-3"
        >
          {/* Traditional Payment Methods */}
          {traditionalMethods.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Traditional Payment Methods
              </Label>
              {traditionalMethods.map((method) => (
                <div 
                  key={method.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedMethod === method.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor={method.id}
                      className="flex items-center gap-3 cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2">
                        {method.type === 'card' && <CreditCard className="h-5 w-5" />}
                        {method.type === 'bank' && <CreditCard className="h-5 w-5" />}
                        {method.type === 'paypal' && <CreditCard className="h-5 w-5" />}
                        
                        <div>
                          <div className="font-medium">
                            {method.provider} {method.type === 'card' && `•••• ${method.details}`}
                            {method.type === 'bank' && `Bank Account •• ${method.details}`}
                            {method.type === 'paypal' && `PayPal •• ${method.details}`}
                          </div>
                          {method.lastUsed && (
                            <div className="text-xs text-muted-foreground">
                              Last used: {method.lastUsed.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Crypto Payment Methods */}
          {(cryptoMethods.length > 0 || connectedWalletMethod) && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3" />
                Cryptocurrency Payment Methods
              </Label>
              
              {/* Connected Wallet */}
              {connectedWalletMethod && (
                <div 
                  key={connectedWalletMethod.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedMethod === connectedWalletMethod.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem 
                      value={connectedWalletMethod.id} 
                      id={connectedWalletMethod.id}
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor={connectedWalletMethod.id}
                      className="flex items-center gap-3 cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-amber-500" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {connectedWalletMethod.provider.charAt(0).toUpperCase() + connectedWalletMethod.provider.slice(1)} Wallet
                            <Badge variant="outline" className="text-xs capitalize">
                              {connectedWalletMethod.currency}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {connectedWalletMethod.details}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`https://${connectedWalletMethod.provider === 'metamask' ? 'etherscan.io' : 'polygonscan.com'}/address/${wallet?.account.address}`, '_blank');
                    }}
                    className="h-8 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </div>
              )}
              
              {/* Other Crypto Methods */}
              {cryptoMethods.map((method) => (
                <div 
                  key={method.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedMethod === method.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor={method.id}
                      className="flex items-center gap-3 cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {method.provider}
                            {method.currency && (
                              <Badge variant="outline" className="text-xs">
                                {method.currency}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {method.details}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Connect New Wallet Option */}
          {!wallet && (
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 h-auto py-3"
              onClick={async () => {
                try {
                  await walletService.connectWallet();
                } catch (error) {
                  console.error('Failed to connect wallet:', error);
                }
              }}
            >
              <Wallet className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Connect Crypto Wallet</div>
                <div className="text-xs text-muted-foreground">Connect MetaMask, Coinbase Wallet, or other Web3 wallet</div>
              </div>
            </Button>
          )}
        </RadioGroup>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-700 dark:text-blue-300">Secure Payment</div>
              <div className="text-blue-600 dark:text-blue-400">
                All transactions are secured with bank-level encryption. 
                {selectedMethod && availableMethods.find(m => m.id === selectedMethod)?.type === 'crypto' && 
                  ' Crypto payments are processed directly on the blockchain.'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}