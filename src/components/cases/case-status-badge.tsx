'use client';

import { 
  FileText, 
  PlayCircle, 
  PauseCircle, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseStatus } from '@/types';

interface CaseStatusBadgeProps {
  status: CaseStatus;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<CaseStatus, {
  label: string;
  labelEn: string;
  bg: string;
  text: string;
  icon: React.ElementType;
}> = {
  draft: {
    label: 'დრაფტი',
    labelEn: 'Draft',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: FileText,
  },
  in_progress: {
    label: 'მიმდინარე',
    labelEn: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: PlayCircle,
  },
  paused: {
    label: 'შეჩერებული',
    labelEn: 'Paused',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: PauseCircle,
  },
  delayed: {
    label: 'შეფერხებული',
    labelEn: 'Delayed',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: AlertTriangle,
  },
  completed: {
    label: 'დასრულებული',
    labelEn: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'გაუქმებული',
    labelEn: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-500',
    icon: XCircle,
  },
};

export function CaseStatusBadge({ status, size = 'sm', showIcon = true }: CaseStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    xs: 10,
    sm: 11,
    md: 14,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.text,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export function getStatusConfig(status: CaseStatus) {
  return statusConfig[status] || statusConfig.draft;
}

export const caseStatusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value: value as CaseStatus,
  label: config.label,
  labelEn: config.labelEn,
}));
