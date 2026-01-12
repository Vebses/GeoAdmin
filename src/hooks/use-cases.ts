import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getCases, 
  getCase,
  createCase, 
  updateCase, 
  deleteCase 
} from '@/lib/api/cases';
import type { CaseFormData } from '@/types';

interface UseCasesParams {
  status?: string;
  assigned_to?: string;
  client_id?: string;
  insurance_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  my_cases?: boolean;
}

export const CASES_QUERY_KEY = ['cases'];

export function useCases(params: UseCasesParams = {}) {
  return useQuery({
    queryKey: [...CASES_QUERY_KEY, params],
    queryFn: () => getCases(params),
  });
}

export function useCase(id: string | null) {
  return useQuery({
    queryKey: [...CASES_QUERY_KEY, id],
    queryFn: () => getCase(id!),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CaseFormData) => createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
      toast.success('ქეისი შეიქმნა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CaseFormData }) => 
      updateCase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
      toast.success('ქეისი განახლდა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_QUERY_KEY });
      toast.success('ქეისი წაიშალა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
