'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  type: 'case_assigned' | 'invoice_paid' | 'case_completed' | 'system';
  title: string;
  message: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Fetch functions
async function fetchNotifications(limit: number = 20): Promise<NotificationsResponse> {
  const response = await fetch(`/api/notifications?limit=${limit}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch notifications');
  return result.data;
}

async function markAsRead(notificationIds?: string[], markAll?: boolean): Promise<void> {
  const response = await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification_ids: notificationIds, mark_all: markAll }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to mark as read');
}

// Hook
export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch notifications
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(20),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: ({ ids, all }: { ids?: string[]; all?: boolean }) => markAsRead(ids, all),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      } catch {
        // Ignore errors
      }
    }
  }, [soundEnabled]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Add new notification to cache
          const newNotification = payload.new as Notification;
          
          queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
            if (!old) return { notifications: [newNotification], unreadCount: 1 };
            return {
              notifications: [newNotification, ...old.notifications],
              unreadCount: old.unreadCount + 1,
            };
          });

          // Show toast
          toast(newNotification.title, {
            description: newNotification.message || undefined,
          });

          // Play sound
          playSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, playSound]);

  // Mark single notification as read
  const markOneAsRead = useCallback((id: string) => {
    markReadMutation.mutate({ ids: [id] });
  }, [markReadMutation]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    markReadMutation.mutate({ all: true });
  }, [markReadMutation]);

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    refetch,
    markOneAsRead,
    markAllAsRead,
    soundEnabled,
    setSoundEnabled,
  };
}

export default useNotifications;
