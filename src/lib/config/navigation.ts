import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Building2,
  FolderOpen,
  Building,
  Users,
  Trash2,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  name: string;
  nameEn: string;
  href: string;
  icon: LucideIcon;
  badge?: {
    key: string;
    variant: 'primary' | 'warning' | 'danger' | 'muted';
  };
  roles?: UserRole[];
}

export interface NavDivider {
  type: 'divider';
}

export type NavEntry = NavItem | NavDivider;

export const mainNavItems: NavEntry[] = [
  {
    name: 'დეშბორდი',
    nameEn: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'ქეისები',
    nameEn: 'Cases',
    href: '/cases',
    icon: Briefcase,
    badge: {
      key: 'active_cases_count',
      variant: 'primary',
    },
  },
  {
    name: 'ინვოისები',
    nameEn: 'Invoices',
    href: '/invoices',
    icon: FileText,
    badge: {
      key: 'unpaid_invoices_count',
      variant: 'warning',
    },
  },
  {
    name: 'პარტნიორები',
    nameEn: 'Partners',
    href: '/partners',
    icon: Building2,
  },
  { type: 'divider' },
  {
    name: 'კატეგორიები',
    nameEn: 'Categories',
    href: '/categories',
    icon: FolderOpen,
  },
  {
    name: 'ჩვენი კომპანიები',
    nameEn: 'Our Companies',
    href: '/our-companies',
    icon: Building,
  },
  {
    name: 'მომხმარებლები',
    nameEn: 'Users',
    href: '/users',
    icon: Users,
    roles: ['manager'],
  },
];

export const bottomNavItems: NavEntry[] = [
  { type: 'divider' },
  {
    name: 'ნაგავი',
    nameEn: 'Trash',
    href: '/trash',
    icon: Trash2,
    badge: {
      key: 'trash_count',
      variant: 'muted',
    },
    roles: ['manager'],
  },
  {
    name: 'პარამეტრები',
    nameEn: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['manager'],
  },
];

export function isNavItem(entry: NavEntry): entry is NavItem {
  return !('type' in entry);
}

export function filterNavByRole(items: NavEntry[], userRole: UserRole): NavEntry[] {
  return items.filter((item) => {
    if ('type' in item) return true;
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
}
