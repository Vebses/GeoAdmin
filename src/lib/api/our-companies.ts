import type { OurCompany, OurCompanyFormData } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export async function getOurCompanies(): Promise<OurCompany[]> {
  const response = await fetch('/api/our-companies');
  const result: ApiResponse<OurCompany[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კომპანიების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data || [];
}

export async function getOurCompany(id: string): Promise<OurCompany> {
  const response = await fetch(`/api/our-companies/${id}`);
  const result: ApiResponse<OurCompany> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კომპანიის ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function createOurCompany(data: OurCompanyFormData): Promise<OurCompany> {
  const response = await fetch('/api/our-companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<OurCompany> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კომპანიის შექმნა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function updateOurCompany(id: string, data: OurCompanyFormData): Promise<OurCompany> {
  const response = await fetch(`/api/our-companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<OurCompany> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კომპანიის განახლება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function deleteOurCompany(id: string): Promise<void> {
  const response = await fetch(`/api/our-companies/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<void> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კომპანიის წაშლა ვერ მოხერხდა');
  }
}
