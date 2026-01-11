'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCaseActions,
  getCaseAction,
  createCaseAction,
  updateCaseAction,
  deleteCaseAction,
  reorderCaseActions,
} from '@/lib/api/case-actions';
import type { CaseAction, CaseActionWithRelations } from '@/types';

// Query keys
export const caseActionsKeys = {
  all: ['case-actions'] as const,
  lists: () => [...caseActionsKeys.all, 'list'] as const,
  list: (caseId: string) => [...caseActionsKeys.lists(), caseId] as const,
  details: () => [...caseActionsKeys.all, 'detail'] as const,
  detail: (caseId: string, actionId: string) => [...caseActionsKeys.details(), caseId, actionId] as const,
};

// Get all actions for a case
export function useCaseActions(caseId: string) {
  return useQuery({
    queryKey: caseActionsKeys.list(caseId),
    queryFn: () => getCaseActions(caseId),
    enabled: !!caseId,
  });
}

// Get single action
export function useCaseAction(caseId: string, actionId: string) {
  return useQuery({
    queryKey: caseActionsKeys.detail(caseId, actionId),
    queryFn: () => getCaseAction(caseId, actionId),
    enabled: !!caseId && !!actionId,
  });
}

// Create action mutation
export function useCreateCaseAction(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<CaseAction, 'id' | 'case_id' | 'created_at' | 'updated_at'>) =>
      createCaseAction(caseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseActionsKeys.list(caseId) });
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      toast.success('მოქმედება დაემატა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'მოქმედების დამატება ვერ მოხერხდა');
    },
  });
}

// Update action mutation
export function useUpdateCaseAction(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ actionId, data }: { actionId: string; data: Partial<CaseAction> }) =>
      updateCaseAction(caseId, actionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caseActionsKeys.list(caseId) });
      queryClient.invalidateQueries({ queryKey: caseActionsKeys.detail(caseId, variables.actionId) });
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      toast.success('მოქმედება განახლდა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'მოქმედების განახლება ვერ მოხერხდა');
    },
  });
}

// Delete action mutation
export function useDeleteCaseAction(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (actionId: string) => deleteCaseAction(caseId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseActionsKeys.list(caseId) });
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      toast.success('მოქმედება წაიშალა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'მოქმედების წაშლა ვერ მოხერხდა');
    },
  });
}

// Reorder actions mutation
export function useReorderCaseActions(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (actions: { id: string; sort_order: number }[]) =>
      reorderCaseActions(caseId, actions),
    onSuccess: (data) => {
      queryClient.setQueryData(caseActionsKeys.list(caseId), data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'თანმიმდევრობის შეცვლა ვერ მოხერხდა');
      queryClient.invalidateQueries({ queryKey: caseActionsKeys.list(caseId) });
    },
  });
}
