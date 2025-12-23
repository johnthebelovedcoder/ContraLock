// apps/web/src/components/ui/form-error.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string;
  errors?: string[];
  className?: string;
  variant?: 'default' | 'warning' | 'error';
}

const FormError: React.FC<FormErrorProps> = ({
  message,
  errors = [],
  className = '',
  variant = 'error'
}) => {
  if (!message && (!errors || errors.length === 0)) {
    return null;
  }

  // Determine alert variant based on the variant prop
  const alertVariant = variant === 'warning' ? 'default' :
                     variant === 'error' ? 'destructive' : 'default';

  const allErrors = message ? [message, ...errors] : errors;

  return (
    <div className={className}>
      {allErrors.map((error, index) => (
        <Alert key={index} variant={alertVariant} className="p-3 mb-2 -mt-2">
          <AlertCircle className={`h-4 w-4 ${variant === 'warning' ? 'text-amber-600' : ''}`} />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default FormError;
export { FormError }; // Named export for compatibility with existing imports