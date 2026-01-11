import type { Category, CategoryFormData } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  const result: ApiResponse<Category[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კატეგორიების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data || [];
}

export async function createCategory(data: CategoryFormData): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Category> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კატეგორიის შექმნა ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function updateCategory(id: string, data: CategoryFormData): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<Category> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კატეგორიის განახლება ვერ მოხერხდა');
  }
  
  return result.data!;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<void> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'კატეგორიის წაშლა ვერ მოხერხდა');
  }
}
