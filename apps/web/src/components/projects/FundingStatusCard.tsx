'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Wallet, Lock, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Project } from '@/types';

interface FundingStatusProps {
  project: Project;
}

export function FundingStatusCard({ project }: FundingStatusProps) {
  // Calculate funding percentage
  const fundingPercentage = project.totalBudget && project.totalBudget > 0 
    ? Math.round((project.escrowAmount! / project.totalBudget) * 100)
    : 0;
    
  // Determine status badge
  let statusBadgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let statusText = 'Not Funded';

  if (project.escrowStatus === 'HELD') {
    statusBadgeVariant = 'default';
    statusText = 'Funds Secured';
  } else if (project.escrowStatus === 'PARTIALLY_RELEASED') {
    statusBadgeVariant = 'secondary';
    statusText = 'Partially Released';
  } else if (project.escrowStatus === 'RELEASED') {
    statusBadgeVariant = 'secondary';
    statusText = 'Fully Released';
  } else if (project.escrowStatus === 'REFUNDED') {
    statusBadgeVariant = 'destructive';
    statusText = 'Refunded';
  } else if (project.escrowStatus === 'NOT_DEPOSITED') {
    statusBadgeVariant = 'destructive';
    statusText = 'Not Deposited';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Funding & Escrow Status</CardTitle>
        </div>
        <CardDescription>
          Financial status of the project funds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Funding Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total Budget
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{project.totalBudget?.toLocaleString()} {project.currency || 'USD'}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <Lock className="h-4 w-4" />
                In Escrow
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{project.escrowAmount?.toLocaleString()} {project.currency || 'USD'}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Funded</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{fundingPercentage}%</p>
            </div>
          </div>

          {/* Funding Progress Bar */}
          <div className="pt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  fundingPercentage === 0 ? 'bg-red-500' :
                  fundingPercentage < 100 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${fundingPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>{fundingPercentage}% Funded</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Escrow Status */}
          <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {project.escrowStatus === 'HELD' ? (
                <Lock className="h-5 w-5 text-green-600" />
              ) : project.escrowStatus === 'NOT_DEPOSITED' ? (
                <Wallet className="h-5 w-5 text-red-600" />
              ) : (
                <DollarSign className="h-5 w-5 text-blue-600" />
              )}
              <h3 className="font-medium">Escrow Status</h3>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Badge variant={statusBadgeVariant} className="text-xs">
                  {statusText}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Funds are securely held in escrow until milestones are completed and approved.
                </p>
              </div>
              <div className="flex gap-1">
                {project.escrowStatus === 'HELD' && (
                  <Lock className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          </div>
          
          {/* Platform Fees */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Platform Fee</p>
              <p className="font-medium">{project.platformFee?.toLocaleString()} {project.currency || 'USD'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Processing</p>
              <p className="font-medium">{project.paymentProcessingFee?.toLocaleString()} {project.currency || 'USD'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}