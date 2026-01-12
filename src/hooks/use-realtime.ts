'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type TableName = 'cases' | 'invoices' | 'partners' | 'our_companies' | 'categories';

interface RealtimeOptions {
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
  onDelete?: (payload: unknown) => void;
  showToasts?: boolean;
}

// Subscribe to table changes
export function useRealtimeTable(
  table: TableName,
  options: RealtimeOptions = {}
) {
  const queryClient = useQueryClient();
  const { onInsert, onUpdate, onDelete, showToasts = false } = options;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          const eventType = payload.eventType;

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: [table] });

          // Call specific handlers
          if (eventType === 'INSERT') {
            onInsert?.(payload.new);
            if (showToasts) {
              toast.info(`ახალი ჩანაწერი დაემატა`);
            }
          } else if (eventType === 'UPDATE') {
            onUpdate?.(payload.new);
          } else if (eventType === 'DELETE') {
            onDelete?.(payload.old);
            if (showToasts) {
              toast.info(`ჩანაწერი წაიშალა`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient, onInsert, onUpdate, onDelete, showToasts]);
}

// Subscribe to cases changes
export function useRealtimeCases() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('cases_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
        },
        (payload) => {
          // Invalidate all case queries
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          
          // Update single case cache if it exists
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as { id: string };
            queryClient.setQueryData(['case', newData.id], payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Subscribe to invoices changes
export function useRealtimeInvoices() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('invoices_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as { id: string };
            queryClient.setQueryData(['invoice', newData.id], payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Subscribe to dashboard stats (refresh on any case/invoice change)
export function useRealtimeDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const casesChannel = supabase
      .channel('dashboard_cases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      )
      .subscribe();

    const invoicesChannel = supabase
      .channel('dashboard_invoices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(invoicesChannel);
    };
  }, [queryClient]);
}

export default useRealtimeTable;
