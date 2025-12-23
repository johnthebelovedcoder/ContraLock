import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  loading?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, loading = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          loading && 'opacity-100',
          !loading && 'opacity-0 pointer-events-none',
          className
        )}
        {...props}
      >
        <div className={spinnerVariants({ size, className: 'text-primary' })} />
        {children && (
          <span className="ml-2 text-sm text-muted-foreground">{children}</span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, spinnerVariants };