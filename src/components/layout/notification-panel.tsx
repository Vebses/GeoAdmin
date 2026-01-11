'use client';

import { useEffect, useRef } from 'react';
import { Bell, FileText, Receipt, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock notifications - will be replaced with real data
const mockNotifications = [
  {
    id: '1',
    title: 'ახალი ქეისი',
    message: 'მარიამმა შექმნა ახალი ქეისი GEO-2026-0142',
    time: '5 წუთის წინ',
    isRead: false,
    type: 'case',
  },
  {
    id: '2',
    title: 'ინვოისი გაიგზავნა',
    message: 'INV-202601-0022 გაიგზავნა Allianz Partners-ზე',
    time: '1 საათის წინ',
    isRead: false,
    type: 'invoice',
  },
  {
    id: '3',
    title: 'ქეისი დასრულდა',
    message: 'ანამ დაასრულა ქეისი GEO-2026-0141',
    time: '3 საათის წინ',
    isRead: true,
    type: 'case',
  },
];

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return FileText;
      case 'invoice':
        return Receipt;
      default:
        return Bell;
    }
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl',
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
          {mockNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">შეტყობინებები არ არის</p>
            </div>
          ) : (
            mockNotifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        notification.type === 'case' && 'bg-blue-100',
                        notification.type === 'invoice' && 'bg-emerald-100'
                      )}
                    >
                      <Icon
                        size={14}
                        className={cn(
                          notification.type === 'case' && 'text-blue-600',
                          notification.type === 'invoice' && 'text-emerald-600'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.isRead && (
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
      {mockNotifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <Check size={12} className="mr-1" />
            ყველას წაკითხულად მონიშვნა
          </Button>
        </div>
      )}
    </div>
  );
}
