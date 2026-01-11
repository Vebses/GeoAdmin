'use client';

import { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { UserMenu } from './user-menu';
import { NotificationPanel } from './notification-panel';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface HeaderProps {
  user: User | null;
  title?: string;
  subtitle?: string;
}

export function Header({ user, title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { setSidebarOpen } = useUIStore();

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu + Title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>

          {/* Page title */}
          {title && (
            <div>
              <h1 className="text-sm font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Right side - Search, Notifications, User */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ძიება..."
              className={cn(
                'w-48 pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs',
                'focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                'transition-all duration-150 placeholder:text-gray-400'
              )}
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell size={18} />
              {/* Notification dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
