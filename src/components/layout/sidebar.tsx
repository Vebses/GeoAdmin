'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { mainNavItems, bottomNavItems, isNavItem, filterNavByRole, type NavEntry } from '@/lib/config/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useSidebarCounts } from '@/hooks/use-sidebar-counts';
import type { User } from '@/types';

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: counts } = useSidebarCounts();
  
  const userRole = user?.role || 'assistant';
  const filteredMainItems = filterNavByRole(mainNavItems, userRole);
  const filteredBottomItems = filterNavByRole(bottomNavItems, userRole);

  // Map counts to navigation items
  const badgeCounts: Record<string, number> = {
    '/cases': counts?.activeCases || 0,
    '/invoices': counts?.unpaidInvoices || 0,
    '/trash': counts?.trashedItems || 0,
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 sticky top-0',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-gray-100 h-16',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-gray-900">GeoAdmin</h1>
                <p className="text-[10px] text-gray-400">მენეჯერი</p>
              </div>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-0.5">
            {filteredMainItems.map((item, index) => (
              <NavItemComponent
                key={index}
                item={item}
                pathname={pathname}
                collapsed={sidebarCollapsed}
                badgeCounts={badgeCounts}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-100 py-2 px-2 space-y-0.5">
          {filteredBottomItems.map((item, index) => (
            <NavItemComponent
              key={index}
              item={item}
              pathname={pathname}
              collapsed={sidebarCollapsed}
              badgeCounts={badgeCounts}
            />
          ))}
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>აკეცვა</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface NavItemComponentProps {
  item: NavEntry;
  pathname: string;
  collapsed: boolean;
  badgeCounts: Record<string, number>;
}

function NavItemComponent({ item, pathname, collapsed, badgeCounts }: NavItemComponentProps) {
  if (!isNavItem(item)) {
    return <div className="my-2 h-px bg-gray-100" />;
  }

  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;
  const count = badgeCounts[item.href] || 0;

  const content = (
    <Link
      href={item.href}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150',
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        collapsed && 'justify-center'
      )}
    >
      <Icon
        size={16}
        className={cn(
          isActive ? 'text-blue-500' : 'text-gray-400',
          'flex-shrink-0'
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge && count > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
                item.badge.variant === 'primary' && 'bg-blue-500 text-white',
                item.badge.variant === 'warning' && 'bg-amber-500 text-white',
                item.badge.variant === 'danger' && 'bg-red-500 text-white',
                item.badge.variant === 'muted' && 'bg-gray-200 text-gray-600'
              )}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.name}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
