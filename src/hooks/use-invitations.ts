'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PendingInvitation {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  expires_at: string;
}

async function fetchInvitations(): Promise<PendingInvitation[]> {
  const response = await fetch('/api/users/invite');
  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }
  const result = await response.json();
  return result.data || [];
}

async function cancelInvitation(id: string): Promise<void> {
  const response = await fetch(`/api/users/invite/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to cancel invitation');
  }
}

async function resendInvitation(id: string): Promise<void> {
  const response = await fetch(`/api/users/invite/${id}/resend`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to resend invitation');
  }
}

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: fetchInvitations,
    staleTime: 30000,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
