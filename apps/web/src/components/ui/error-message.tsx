// apps/web/src/components/ui/error-message.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = 'Error', 
  message, 
  details, 
  className = '' 
}) => {
  return (
    <Alert variant="destructive" className={`p-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-sm">
        {message}
        {details && (
          <details className="mt-2 text-xs text-destructive/80">
            <summary className="cursor-pointer">More details</summary>
            <p className="mt-1">{details}</p>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorMessage;