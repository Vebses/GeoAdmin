import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getPartners, 
  getPartner,
  createPartner, 
  updatePartner, 
  deletePartner,
  type GetPartnersParams,
} from '@/lib/api/partners';
import type { PartnerFormData } from '@/types';

// Use string key - will be used as first element in query key array
export const PARTNERS_KEY = 'partners';

export function usePartners(params: GetPartnersParams = {}) {
  return useQuery({
    queryKey: [PARTNERS_KEY, 'list', params],
    queryFn: () => getPartners(params),
  });
}

export function usePartner(id: string | null) {
  return useQuery({
    queryKey: [PARTNERS_KEY, 'detail', id],
    queryFn: () => getPartner(id!),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PartnerFormData) => createPartner(data),
    onSuccess: () => {
      // Invalidate all partner queries
      queryClient.invalidateQueries({ queryKey: [PARTNERS_KEY] });
      toast.success('პარტნიორი შეიქმნა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartnerFormData }) => 
      updatePartner(id, data),
    onSuccess: () => {
      // Invalidate all partner queries
      queryClient.invalidateQueries({ queryKey: [PARTNERS_KEY] });
      toast.success('პარტნიორი განახლდა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: () => {
      // Invalidate all partner queries
      queryClient.invalidateQueries({ queryKey: [PARTNERS_KEY] });
      toast.success('პარტნიორი წაიშალა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
