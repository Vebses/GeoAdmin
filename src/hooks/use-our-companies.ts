import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getOurCompanies, 
  getOurCompany,
  createOurCompany, 
  updateOurCompany, 
  deleteOurCompany,
} from '@/lib/api/our-companies';
import type { OurCompanyFormData } from '@/types';

export const OUR_COMPANIES_QUERY_KEY = ['our-companies'];

export function useOurCompanies() {
  return useQuery({
    queryKey: OUR_COMPANIES_QUERY_KEY,
    queryFn: getOurCompanies,
  });
}

export function useOurCompany(id: string | null) {
  return useQuery({
    queryKey: [OUR_COMPANIES_QUERY_KEY, id],
    queryFn: () => getOurCompany(id!),
    enabled: !!id,
  });
}

export function useCreateOurCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: OurCompanyFormData) => createOurCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUR_COMPANIES_QUERY_KEY });
      toast.success('კომპანია შეიქმნა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOurCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OurCompanyFormData }) => 
      updateOurCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUR_COMPANIES_QUERY_KEY });
      toast.success('კომპანია განახლდა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteOurCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteOurCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUR_COMPANIES_QUERY_KEY });
      toast.success('კომპანია წაიშალა');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
