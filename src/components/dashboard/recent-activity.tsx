'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import {
  FileText,
  CheckCircle,
  Send,
  CreditCard,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/hooks/use-dashboard';

interface RecentActivityProps {
  activities: ActivityItem[] | undefined;
  loading?: boolean;
  onRefresh?: () => void;
}

const activityConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  case_created: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  case_completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  case_updated: { icon: RefreshCw, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  invoice_sent: { icon: Send, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  invoice_paid: { icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-100' },
};

export function RecentActivity({ activities, loading = false, onRefresh }: RecentActivityProps) {
  const router = useRouter();

  const handleClick = (activity: ActivityItem) => {
    if (activity.entityType === 'case') {
      router.push(`/cases?id=${activity.entityId}`);
    } else if (activity.entityType === 'invoice') {
      router.push(`/invoices?id=${activity.entityId}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ka,
      });
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          ბოლო აქტივობა
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="განახლება"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {!activities || activities.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 text-sm">
          <Clock className="h-8 w-8 mb-2" />
          <p>აქტივობა არ მოიძებნა</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.case_updated;
            const Icon = config.icon;

            return (
              <button
                key={activity.id}
                onClick={() => handleClick(activity)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {activity.userAvatar ? (
                    <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                  ) : null}
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                    {getInitials(activity.userName)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}
                    <span className="text-gray-600">{activity.message}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>

                {/* Icon */}
                <div className={cn('p-1.5 rounded-lg flex-shrink-0', config.bgColor)}>
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
