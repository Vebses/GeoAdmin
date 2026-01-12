'use client';

import { useQuery } from '@tanstack/react-query';

interface SidebarCounts {
  activeCases: number;
  unpaidInvoices: number;
  trashedItems: number;
}

async function fetchSidebarCounts(): Promise<SidebarCounts> {
  const response = await fetch('/api/sidebar-counts');
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch counts');
  }
  
  return result.data;
}

export function useSidebarCounts() {
  return useQuery({
    queryKey: ['sidebar-counts'],
    queryFn: fetchSidebarCounts,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: true,
  });
}

export default useSidebarCounts;
