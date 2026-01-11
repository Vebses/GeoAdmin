'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCaseDocuments,
  getCaseDocument,
  uploadCaseDocument,
  deleteCaseDocument,
} from '@/lib/api/case-documents';
import type { DocumentType } from '@/types';

// Query keys
export const caseDocumentsKeys = {
  all: ['case-documents'] as const,
  lists: () => [...caseDocumentsKeys.all, 'list'] as const,
  list: (caseId: string, type?: DocumentType) => [...caseDocumentsKeys.lists(), caseId, type] as const,
  details: () => [...caseDocumentsKeys.all, 'detail'] as const,
  detail: (caseId: string, docId: string) => [...caseDocumentsKeys.details(), caseId, docId] as const,
};

// Get all documents for a case
export function useCaseDocuments(caseId: string, type?: DocumentType) {
  return useQuery({
    queryKey: caseDocumentsKeys.list(caseId, type),
    queryFn: () => getCaseDocuments(caseId, type),
    enabled: !!caseId,
  });
}

// Get single document
export function useCaseDocument(caseId: string, docId: string) {
  return useQuery({
    queryKey: caseDocumentsKeys.detail(caseId, docId),
    queryFn: () => getCaseDocument(caseId, docId),
    enabled: !!caseId && !!docId,
  });
}

// Upload document mutation
export function useUploadCaseDocument(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: DocumentType }) =>
      uploadCaseDocument(caseId, file, type),
    onSuccess: () => {
      // Invalidate all document lists for this case
      queryClient.invalidateQueries({ queryKey: caseDocumentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      toast.success('დოკუმენტი აიტვირთა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'დოკუმენტის ატვირთვა ვერ მოხერხდა');
    },
  });
}

// Delete document mutation
export function useDeleteCaseDocument(caseId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (docId: string) => deleteCaseDocument(caseId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseDocumentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      toast.success('დოკუმენტი წაიშალა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'დოკუმენტის წაშლა ვერ მოხერხდა');
    },
  });
}
