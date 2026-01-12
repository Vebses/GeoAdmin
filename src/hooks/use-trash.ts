'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface TrashedItem {
  id: string;
  entity_type: 'case' | 'invoice' | 'partner' | 'our_company';
  name: string;
  description?: string;
  deleted_at: string;
  days_remaining: number;
}

// Fetch functions
async function fetchTrashedItems(entityType?: string): Promise<TrashedItem[]> {
  const params = entityType ? `?entity_type=${entityType}` : '';
  const response = await fetch(`/api/trash${params}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch trash');
  return result.data;
}

async function restoreItem(id: string, entityType: string): Promise<void> {
  const response = await fetch(`/api/trash/${id}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_type: entityType }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to restore');
}

async function permanentDelete(id: string, entityType: string): Promise<void> {
  const response = await fetch(`/api/trash/${id}/permanent?entity_type=${entityType}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to delete');
}

async function emptyTrash(): Promise<void> {
  const response = await fetch('/api/trash/empty', {
    method: 'POST',
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to empty trash');
}

// Hooks
export function useTrashedItems(entityType?: string) {
  return useQuery({
    queryKey: ['trash', entityType],
    queryFn: () => fetchTrashedItems(entityType),
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entityType }: { id: string; entityType: string }) => 
      restoreItem(id, entityType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

export function usePermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entityType }: { id: string; entityType: string }) => 
      permanentDelete(id, entityType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emptyTrash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}
