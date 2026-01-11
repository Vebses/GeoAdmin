import type { CaseWithRelations, CaseFormData, PaginatedResponse } from '@/types';

interface CasesParams {
  status?: string;
  assigned_to?: string;
  client_id?: string;
  insurance_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

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

export async function getCases(params: CasesParams = {}): Promise<PaginatedResponse<CaseWithRelations>> {
  const searchParams = new URLSearchParams();
  
  if (params.status) searchParams.set('status', params.status);
  if (params.assigned_to) searchParams.set('assigned_to', params.assigned_to);
  if (params.client_id) searchParams.set('client_id', params.client_id);
  if (params.insurance_id) searchParams.set('insurance_id', params.insurance_id);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`/api/cases?${searchParams.toString()}`);
  const result: ApiResponse<CaseWithRelations[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ქეისების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return {
    data: result.data || [],
    total: result.total || 0,
    page: result.page || 1,
    limit: result.limit || 10,
    totalPages: result.totalPages || 1,
  };
}

export async function getCase(id: string): Promise<CaseWithRelations> {
  const response = await fetch(`/api/cases/${id}`);
  const result: ApiResponse<CaseWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ქეისის ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function createCase(data: CaseFormData): Promise<CaseWithRelations> {
  const response = await fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<CaseWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ქეისის შექმნა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function updateCase(id: string, data: CaseFormData): Promise<CaseWithRelations> {
  const response = await fetch(`/api/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<CaseWithRelations> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ქეისის განახლება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function deleteCase(id: string): Promise<void> {
  const response = await fetch(`/api/cases/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<void> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'ქეისის წაშლა ვერ მოხერხდა');
  }
}
