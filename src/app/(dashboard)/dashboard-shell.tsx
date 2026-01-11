'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header, MobileNav } from '@/components/layout';
import type { User } from '@/types';

interface DashboardShellProps {
  user: User | null;
  children: React.ReactNode;
}

// Page titles mapping
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'დეშბორდი', subtitle: 'ზოგადი სტატისტიკა' },
  '/cases': { title: 'ქეისები', subtitle: 'პაციენტების ქეისების მართვა' },
  '/invoices': { title: 'ინვოისები', subtitle: 'ინვოისების მართვა და გაგზავნა' },
  '/partners': { title: 'პარტნიორი კომპანიები', subtitle: 'პარტნიორების ბაზა' },
  '/categories': { title: 'კატეგორიები', subtitle: 'პარტნიორების კატეგორიები' },
  '/our-companies': { title: 'ჩვენი კომპანიები', subtitle: 'კომპანიების მონაცემები' },
  '/users': { title: 'მომხმარებლები', subtitle: 'მომხმარებლების მართვა' },
  '/trash': { title: 'ნაგავი', subtitle: 'წაშლილი ჩანაწერები' },
  '/settings': { title: 'პარამეტრები', subtitle: 'სისტემის კონფიგურაცია' },
  '/profile': { title: 'პროფილი', subtitle: 'პირადი მონაცემები' },
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get page title based on pathname
  const getPageInfo = () => {
    // Check exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    // Check if it starts with any known path
    for (const [path, info] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path + '/')) {
        return info;
      }
    }
    return { title: 'GeoAdmin', subtitle: '' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Mobile Navigation Drawer */}
      <MobileNav user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
