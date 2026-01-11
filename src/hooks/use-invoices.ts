import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getInvoices, 
  getInvoice,
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  markInvoicePaid,
  duplicateInvoice,
  type MarkPaidData
} from '@/lib/api/invoices';
import type { InvoiceFormData, InvoiceFilters } from '@/types';

interface UseInvoicesParams extends InvoiceFilters {
  page?: number;
  limit?: number;
}

export const INVOICES_QUERY_KEY = ['invoices'];

export function useInvoices(params: UseInvoicesParams = {}) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, params],
    queryFn: () => getInvoices(params),
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InvoiceFormData) => createInvoice(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      toast.success('ინვოისი შეიქმნა', {
        description: `ინვოისი ${data.invoice_number} წარმატებით შეიქმნა`,
      });
    },
    onError: (error: Error) => {
      toast.error('ინვოისის შექმნა ვერ მოხერხდა', {
        description: error.message,
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => 
      updateInvoice(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      toast.success('ინვოისი განახლდა', {
        description: `ინვოისი ${data.invoice_number} წარმატებით განახლდა`,
      });
    },
    onError: (error: Error) => {
      toast.error('ინვოისის განახლება ვერ მოხერხდა', {
        description: error.message,
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      toast.success('ინვოისი წაიშალა');
    },
    onError: (error: Error) => {
      toast.error('ინვოისის წაშლა ვერ მოხერხდა', {
        description: error.message,
      });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: MarkPaidData }) => 
      markInvoicePaid(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      toast.success('ინვოისი დადასტურდა', {
        description: `ინვოისი ${data.invoice_number} მონიშნულია გადახდილად`,
      });
    },
    onError: (error: Error) => {
      toast.error('ინვოისის დადასტურება ვერ მოხერხდა', {
        description: error.message,
      });
    },
  });
}

export function useDuplicateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => duplicateInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      toast.success('ინვოისი დუბლირდა', {
        description: `შეიქმნა ახალი ინვოისი ${data.invoice_number}`,
      });
    },
    onError: (error: Error) => {
      toast.error('ინვოისის დუბლირება ვერ მოხერხდა', {
        description: error.message,
      });
    },
  });
}
