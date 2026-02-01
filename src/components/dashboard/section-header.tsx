'use client';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'success' | 'info';
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  badge,
  badgeVariant = 'default',
  action,
  className
}: SectionHeaderProps) {
  const badgeColors = {
    default: 'bg-gray-100 text-gray-600',
    warning: 'bg-amber-100 text-amber-700',
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        {badge && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            badgeColors[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
