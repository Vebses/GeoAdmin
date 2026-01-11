import type { CaseDocument, CaseDocumentWithRelations, DocumentType } from '@/types';

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

// Get all documents for a case
export async function getCaseDocuments(
  caseId: string,
  type?: DocumentType
): Promise<CaseDocumentWithRelations[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  
  const url = `${API_BASE}/${caseId}/documents${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);
  const result: ApiResponse<CaseDocumentWithRelations[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'დოკუმენტების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data || [];
}

// Get single document
export async function getCaseDocument(
  caseId: string,
  docId: string
): Promise<CaseDocumentWithRelations> {
  const response = await fetch(`${API_BASE}/${caseId}/documents/${docId}`);
  const result: ApiResponse<CaseDocumentWithRelations> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'დოკუმენტი ვერ მოიძებნა');
  }
  
  return result.data;
}

// Upload document
export async function uploadCaseDocument(
  caseId: string,
  file: File,
  type: DocumentType
): Promise<CaseDocumentWithRelations> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await fetch(`${API_BASE}/${caseId}/documents`, {
    method: 'POST',
    body: formData,
  });
  
  const result: ApiResponse<CaseDocumentWithRelations> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'დოკუმენტის ატვირთვა ვერ მოხერხდა');
  }
  
  return result.data;
}

// Delete document
export async function deleteCaseDocument(caseId: string, docId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${caseId}/documents/${docId}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<null> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'დოკუმენტის წაშლა ვერ მოხერხდა');
  }
}

// Helper to download document
export function downloadDocument(doc: CaseDocument) {
  const link = document.createElement('a');
  link.href = doc.file_url;
  link.download = doc.file_name;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
