'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { mainNavItems, bottomNavItems, isNavItem, filterNavByRole, type NavEntry } from '@/lib/config/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface MobileNavProps {
  user: User | null;
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  super_admin: 'სუპერ ადმინი',
  manager: 'მენეჯერი',
  assistant: 'ასისტენტი',
  accountant: 'ბუღალტერი',
};

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const userRole = user?.role || 'assistant';
  const filteredMainItems = filterNavByRole(mainNavItems, userRole);
  const filteredBottomItems = filterNavByRole(bottomNavItems, userRole);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white z-50 lg:hidden transition-transform duration-300 ease-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">GeoAdmin</h1>
              <p className="text-[10px] text-gray-400">მენეჯერი</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-0.5">
            {filteredMainItems.map((item, index) => (
              <MobileNavItem key={index} item={item} pathname={pathname} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-100 py-2 px-2 space-y-0.5">
          {filteredBottomItems.map((item, index) => (
            <MobileNavItem key={index} item={item} pathname={pathname} />
          ))}
        </div>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback>
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || 'მომხმარებელი'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.role ? roleLabels[user.role] : 'როლი'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={onLogout}
          >
            <LogOut size={14} className="mr-2" />
            გამოსვლა
          </Button>
        </div>
      </aside>
    </>
  );
}

interface MobileNavItemProps {
  item: NavEntry;
  pathname: string;
}

function MobileNavItem({ item, pathname }: MobileNavItemProps) {
  if (!isNavItem(item)) {
    return <div className="my-2 h-px bg-gray-100" />;
  }

  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon
        size={18}
        className={cn(isActive ? 'text-blue-500' : 'text-gray-400')}
      />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
            item.badge.variant === 'primary' && 'bg-blue-500 text-white',
            item.badge.variant === 'warning' && 'bg-amber-500 text-white',
            item.badge.variant === 'danger' && 'bg-red-500 text-white',
            item.badge.variant === 'muted' && 'bg-gray-200 text-gray-600'
          )}
        >
          {item.badge.variant === 'primary' && '3'}
          {item.badge.variant === 'warning' && '2'}
          {item.badge.variant === 'muted' && '1'}
        </span>
      )}
    </Link>
  );
}
