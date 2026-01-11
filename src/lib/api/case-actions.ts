import type { CaseAction, CaseActionWithRelations } from '@/types';

const API_BASE = '/api/cases';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Get all actions for a case
export async function getCaseActions(caseId: string): Promise<CaseActionWithRelations[]> {
  const response = await fetch(`${API_BASE}/${caseId}/actions`);
  const result: ApiResponse<CaseActionWithRelations[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'მოქმედებების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data || [];
}

// Get single action
export async function getCaseAction(caseId: string, actionId: string): Promise<CaseActionWithRelations> {
  const response = await fetch(`${API_BASE}/${caseId}/actions/${actionId}`);
  const result: ApiResponse<CaseActionWithRelations> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'მოქმედება ვერ მოიძებნა');
  }
  
  return result.data;
}

// Create action
export async function createCaseAction(
  caseId: string, 
  data: Omit<CaseAction, 'id' | 'case_id' | 'created_at' | 'updated_at'>
): Promise<CaseActionWithRelations> {
  const response = await fetch(`${API_BASE}/${caseId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<CaseActionWithRelations> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'მოქმედების შექმნა ვერ მოხერხდა');
  }
  
  return result.data;
}

// Update action
export async function updateCaseAction(
  caseId: string,
  actionId: string,
  data: Partial<CaseAction>
): Promise<CaseActionWithRelations> {
  const response = await fetch(`${API_BASE}/${caseId}/actions/${actionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result: ApiResponse<CaseActionWithRelations> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'მოქმედების განახლება ვერ მოხერხდა');
  }
  
  return result.data;
}

// Delete action
export async function deleteCaseAction(caseId: string, actionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${caseId}/actions/${actionId}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<null> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'მოქმედების წაშლა ვერ მოხერხდა');
  }
}

// Reorder actions
export async function reorderCaseActions(
  caseId: string,
  actions: { id: string; sort_order: number }[]
): Promise<CaseActionWithRelations[]> {
  const response = await fetch(`${API_BASE}/${caseId}/actions/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actions }),
  });
  
  const result: ApiResponse<CaseActionWithRelations[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'თანმიმდევრობის შეცვლა ვერ მოხერხდა');
  }
  
  return result.data || [];
}
