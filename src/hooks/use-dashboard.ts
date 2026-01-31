'use client';

import { useQuery } from '@tanstack/react-query';

// Types
export interface DashboardStats {
  totalCases: number;
  totalCasesChange: number;
  activeCases: number;
  activeCasesChange: number;
  completedThisMonth: number;
  completedChange: number;
  unpaidInvoices: number;
  unpaidInvoicesAmount: number;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  opened: number;
  completed: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface ChartsData {
  casesOverTime: ChartDataPoint[];
  statusBreakdown: StatusBreakdown[];
}

export interface ActivityItem {
  id: string;
  type: 'case_created' | 'case_completed' | 'case_updated' | 'invoice_sent' | 'invoice_paid';
  entityType: 'case' | 'invoice';
  entityId: string;
  entityNumber: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  timestamp: string;
  message: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  assigned: number;
  completed: number;
  avgDays: number | null;
  rate: number;
}

// Enhanced stats types
export interface EnhancedStats {
  operational: {
    totalCases: number;
    totalCasesChange: number;
    activeCases: number;
    activeCasesChange: number;
    delayedCases: number;
    completedThisMonth: number;
    completedChange: number;
    unassignedCases: number;
  };
  financial: {
    revenue: number;
    revenueChange: number;
    outstanding: number;
    outstandingCount: number;
    overdueCount: number;
    avgCaseValue: number;
    collectionRate: number;
  };
}

export interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

export interface DashboardAlerts {
  delayed: {
    count: number;
    items: AlertItem[];
  };
  overdue: {
    count: number;
    items: AlertItem[];
  };
  unassigned: {
    count: number;
    items: AlertItem[];
  };
}

export interface TeamData {
  members: TeamMember[];
}

// Fetch functions
async function fetchStats(period: string): Promise<DashboardStats> {
  const response = await fetch(`/api/dashboard/stats?period=${period}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch stats');
  return result.data;
}

async function fetchCharts(period: string): Promise<ChartsData> {
  const response = await fetch(`/api/dashboard/charts?period=${period}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch charts');
  return result.data;
}

async function fetchActivity(limit: number = 10): Promise<ActivityItem[]> {
  const response = await fetch(`/api/dashboard/activity?limit=${limit}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch activity');
  return result.data;
}

async function fetchEnhancedStats(period: string): Promise<EnhancedStats> {
  const response = await fetch(`/api/dashboard/enhanced?period=${period}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch enhanced stats');
  return result.data;
}

async function fetchAlerts(): Promise<DashboardAlerts> {
  const response = await fetch('/api/dashboard/alerts');
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch alerts');
  return result.data;
}

async function fetchTeam(period: string): Promise<TeamData> {
  const response = await fetch(`/api/dashboard/team?period=${period}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch team data');
  return result.data;
}

// Hooks
export function useDashboardStats(period: string = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => fetchStats(period),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardCharts(period: string = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'charts', period],
    queryFn: () => fetchCharts(period),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDashboardActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () => fetchActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

export function useEnhancedStats(period: string = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'enhanced', period],
    queryFn: () => fetchEnhancedStats(period),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: fetchAlerts,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTeamPerformance(period: string = 'month') {
  return useQuery({
    queryKey: ['dashboard', 'team', period],
    queryFn: () => fetchTeam(period),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Combined hook
export function useDashboard(period: string = 'month') {
  const stats = useDashboardStats(period);
  const charts = useDashboardCharts(period);
  const activity = useDashboardActivity();

  return {
    stats,
    charts,
    activity,
    isLoading: stats.isLoading || charts.isLoading || activity.isLoading,
    isError: stats.isError || charts.isError || activity.isError,
  };
}
