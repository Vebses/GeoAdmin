import type { InvoiceWithRelations, InvoiceFormData, PaginatedResponse, InvoiceFilters } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

interface InvoicesParams extends InvoiceFilters {
  page?: number;
  limit?: number;
}

export async function getInvoices(params: InvoicesParams = {}): Promise<PaginatedResponse<InvoiceWithRelations>> {
  const searchParams = new URLSearchParams();
  
  if (params.status) searchParams.set('status', params.status);
  if (params.case_id) searchParams.set('case_id', params.case_id);
  if (params.sender_id) searchParams.set('sender_id', params.sender_id);
  if (params.recipient_id) searchParams.set('recipient_id', params.recipient_id);
  if (params.currency) searchParams.set('currency', params.currency);
  if (params.created_from) searchParams.set('created_from', params.created_from);
  if (params.created_to) searchParams.set('created_to', params.created_to);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`/api/invoices?${searchParams.toString()}`);
  const result: ApiResponse<InvoiceWithRelations[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return {
    data: result.data || [],
    total: result.total || 0,
    page: result.page || 1,
    limit: result.limit || 10,
    totalPages: result.totalPages || 1,
  };
}

export async function getInvoice(id: string): Promise<InvoiceWithRelations> {
  const response = await fetch(`/api/invoices/${id}`);
  const result: ApiResponse<InvoiceWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function createInvoice(data: InvoiceFormData): Promise<InvoiceWithRelations> {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<InvoiceWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის შექმნა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function updateInvoice(id: string, data: Partial<InvoiceFormData>): Promise<InvoiceWithRelations> {
  const response = await fetch(`/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<InvoiceWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის განახლება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`/api/invoices/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<void> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის წაშლა ვერ მოხერხდა');
  }
}

export interface MarkPaidData {
  paid_at?: string;
  paid_amount?: number;
  payment_reference?: string;
  payment_notes?: string;
}

export async function markInvoicePaid(id: string, data: MarkPaidData = {}): Promise<InvoiceWithRelations> {
  const response = await fetch(`/api/invoices/${id}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<InvoiceWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის დადასტურება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function duplicateInvoice(id: string): Promise<InvoiceWithRelations> {
  const response = await fetch(`/api/invoices/${id}/duplicate`, {
    method: 'POST',
  });
  
  const result: ApiResponse<InvoiceWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ინვოისის დუბლირება ვერ მოხერხდა');
  }
  
  return result.data!;
}
