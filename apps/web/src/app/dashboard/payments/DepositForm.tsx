'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePaymentStore } from '@/lib/store';
import { EnhancedDepositForm } from '@/components/payments/EnhancedDepositForm';
import { Wallet, Coins, ArrowRight, Loader2 } from 'lucide-react';

interface DepositFormProps {
  projectId: string;
  projectTitle: string;
  projectBudget: number; // in cents
  currency?: string;
  onDepositComplete?: () => void;
}

export function DepositForm({
  projectId,
  projectTitle,
  projectBudget,
  currency = 'USD',
  onDepositComplete
}: DepositFormProps) {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deposit Funds to Escrow
          </CardTitle>
          <CardDescription>
            Deposit the project budget to escrow to begin work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedDepositForm
            projectId={projectId}
            projectTitle={projectTitle}
            projectBudget={projectBudget}
            onDepositComplete={onDepositComplete || (() => {})}
          />
        </CardContent>
      </Card>
    </div>
  );
}