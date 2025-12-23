'use client';

import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  pages?: Array<{
    name: string;
    href?: string;
    current?: boolean;
  }>;
}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, pages = [], ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground flex-shrink-0" />
            )}
            {page.href ? (
              <a
                href={page.href}
                className={cn(
                  'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
                  page.current && 'text-foreground pointer-events-none'
                )}
              >
                {page.name}
              </a>
            ) : (
              <span
                className={cn(
                  'text-sm font-medium',
                  page.current ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {page.name}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };