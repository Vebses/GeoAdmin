import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-50 text-blue-600',
        secondary: 'bg-gray-100 text-gray-600',
        success: 'bg-emerald-50 text-emerald-600',
        warning: 'bg-amber-50 text-amber-600',
        danger: 'bg-red-50 text-red-600',
        outline: 'border border-gray-200 text-gray-700',
        // Status variants
        draft: 'bg-gray-100 text-gray-600',
        in_progress: 'bg-blue-50 text-blue-600',
        paused: 'bg-amber-50 text-amber-600',
        delayed: 'bg-orange-50 text-orange-600',
        completed: 'bg-emerald-50 text-emerald-600',
        cancelled: 'bg-red-50 text-red-500',
        paid: 'bg-emerald-50 text-emerald-600',
        unpaid: 'bg-amber-50 text-amber-600',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-1.5 py-0.5 text-[10px]',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
