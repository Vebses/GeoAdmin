import type { Partner, PartnerFormData } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface GetPartnersParams {
  category_id?: string | null;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface GetPartnersResponse {
  data: Partner[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getPartners(params: GetPartnersParams = {}): Promise<GetPartnersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.category_id) searchParams.set('category_id', params.category_id);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  
  const url = `/api/partners${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);
  const result: ApiResponse<Partner[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'პარტნიორების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return {
    data: result.data || [],
    meta: result.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

export async function getPartner(id: string): Promise<Partner> {
  const response = await fetch(`/api/partners/${id}`);
  const result: ApiResponse<Partner> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'პარტნიორის ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function createPartner(data: PartnerFormData): Promise<Partner> {
  const response = await fetch('/api/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Partner> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'პარტნიორის შექმნა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function updatePartner(id: string, data: PartnerFormData): Promise<Partner> {
  const response = await fetch(`/api/partners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Partner> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'პარტნიორის განახლება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function deletePartner(id: string): Promise<void> {
  const response = await fetch(`/api/partners/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<void> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'პარტნიორის წაშლა ვერ მოხერხდა');
  }
}
