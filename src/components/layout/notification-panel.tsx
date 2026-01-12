'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { Bell, FileText, Receipt, Check, X, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function NotificationPanel({ isOpen, onClose, userId }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markOneAsRead, 
    markAllAsRead 
  } = useNotifications(userId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'case_assigned':
      case 'case_completed':
        return FileText;
      case 'invoice_paid':
        return Receipt;
      default:
        return Bell;
    }
  };

  const getIconColors = (type: string) => {
    switch (type) {
      case 'case_assigned':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'case_completed':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'invoice_paid':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

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

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markOneAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-50',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">შეტყობინებები</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="max-h-80">
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">შეტყობინებები არ არის</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const colors = getIconColors(notification.type);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                    !notification.is_read && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        colors.bg
                      )}
                    >
                      <Icon size={14} className={colors.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => markAllAsRead()}
          >
            <Check size={12} className="mr-1" />
            ყველას წაკითხულად მონიშვნა
          </Button>
        </div>
      )}
    </div>
  );
}
