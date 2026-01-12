'use client';

import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import {
  FileText,
  Receipt,
  Building2,
  Users,
  RotateCcw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TrashedItem } from '@/hooks/use-trash';

interface TrashItemProps {
  item: TrashedItem;
  onRestore: () => void;
  onPermanentDelete: () => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

const entityConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string; label: string }> = {
  case: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'ქეისი' },
  invoice: { icon: Receipt, color: 'text-green-600', bgColor: 'bg-green-100', label: 'ინვოისი' },
  partner: { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'პარტნიორი' },
  our_company: { icon: Building2, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'კომპანია' },
};

export function TrashItem({
  item,
  onRestore,
  onPermanentDelete,
  isRestoring = false,
  isDeleting = false,
}: TrashItemProps) {
  const config = entityConfig[item.entity_type] || entityConfig.case;
  const Icon = config.icon;

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ka,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        
        <div>
          <div className="font-medium text-gray-900">{item.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{config.label}</span>
            {item.description && (
              <>
                <span>•</span>
                <span>{item.description}</span>
              </>
            )}
            <span>•</span>
            <span>წაიშალა {formatTime(item.deleted_at)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={cn(
          'text-sm px-2 py-0.5 rounded',
          item.days_remaining <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        )}>
          {item.days_remaining} დღე დარჩენილია
        </span>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRestore}
            disabled={isRestoring || isDeleting}
          >
            {isRestoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-1" />
                აღდგენა
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPermanentDelete}
            disabled={isRestoring || isDeleting}
            className="text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                სამუდამოდ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TrashItem;
