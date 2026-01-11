'use client';

import { useState, useCallback } from 'react';
import { User, FileText, Heart, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileDropzone, FilePreview, formatFileSize, getFileIcon } from '@/components/ui/file-dropzone';
import { useCaseDocuments, useUploadCaseDocument, useDeleteCaseDocument } from '@/hooks/use-case-documents';
import { downloadDocument } from '@/lib/api/case-documents';
import { cn } from '@/lib/utils/cn';
import type { DocumentType, CaseDocumentWithRelations } from '@/types';

const documentTypeConfig: Record<DocumentType, { label: string; labelEn: string; icon: React.ElementType; color: string }> = {
  patient: {
    label: 'პაციენტის დოკუმენტები',
    labelEn: 'Patient Documents',
    icon: User,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  original: {
    label: 'ორიგინალები',
    labelEn: 'Original Documents',
    icon: FileText,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  medical: {
    label: 'სამედიცინო დოკუმენტები',
    labelEn: 'Medical Documents',
    icon: Heart,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
};

interface CaseDocumentsProps {
  caseId: string;
  readOnly?: boolean;
}

export function CaseDocuments({ caseId, readOnly = false }: CaseDocumentsProps) {
  const { data: documents, isLoading } = useCaseDocuments(caseId);
  const uploadMutation = useUploadCaseDocument(caseId);
  const deleteMutation = useDeleteCaseDocument(caseId);
  
  const [deleteDoc, setDeleteDoc] = useState<CaseDocumentWithRelations | null>(null);

  const handleUpload = useCallback(
    async (files: File[], type: DocumentType) => {
      for (const file of files) {
        await uploadMutation.mutateAsync({ file, type });
      }
    },
    [uploadMutation]
  );

  const handleDelete = async (docId: string) => {
    await deleteMutation.mutateAsync(docId);
    setDeleteDoc(null);
  };

  // Group documents by type
  const documentsByType = (documents || []).reduce<Record<DocumentType, CaseDocumentWithRelations[]>>(
    (acc, doc) => {
      const type = doc.type as DocumentType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    { patient: [], original: [], medical: [] }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {(['patient', 'original', 'medical'] as DocumentType[]).map((type) => (
          <div key={type}>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(['patient', 'original', 'medical'] as DocumentType[]).map((type) => (
        <DocumentTypeSection
          key={type}
          type={type}
          documents={documentsByType[type]}
          readOnly={readOnly}
          isUploading={uploadMutation.isPending}
          onUpload={(files) => handleUpload(files, type)}
          onDelete={setDeleteDoc}
          onDownload={(doc) => downloadDocument(doc)}
        />
      ))}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={() => deleteDoc && handleDelete(deleteDoc.id)}
        title="დოკუმენტის წაშლა"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteDoc?.file_name}" წაშლა? ეს მოქმედება შეუქცევადია.`}
        confirmText="წაშლა"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

interface DocumentTypeSectionProps {
  type: DocumentType;
  documents: CaseDocumentWithRelations[];
  readOnly: boolean;
  isUploading: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (doc: CaseDocumentWithRelations) => void;
  onDownload: (doc: CaseDocumentWithRelations) => void;
}

function DocumentTypeSection({
  type,
  documents,
  readOnly,
  isUploading,
  onUpload,
  onDelete,
  onDownload,
}: DocumentTypeSectionProps) {
  const config = documentTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b', config.color)}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.label}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {documents.length}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Upload Dropzone */}
        {!readOnly && (
          <FileDropzone
            onDrop={onUpload}
            accept={{
              'application/pdf': ['.pdf'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'image/gif': ['.gif'],
              'image/webp': ['.webp'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
            maxFiles={10}
            maxSize={10 * 1024 * 1024}
            loading={isUploading}
            className="mb-4"
          />
        )}

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                readOnly={readOnly}
                onDelete={() => onDelete(doc)}
                onDownload={() => onDownload(doc)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {readOnly ? 'დოკუმენტები არ არის' : 'ატვირთეთ დოკუმენტები ზემოთ'}
          </div>
        )}
      </div>
    </div>
  );
}

interface DocumentItemProps {
  document: CaseDocumentWithRelations;
  readOnly: boolean;
  onDelete: () => void;
  onDownload: () => void;
}

function DocumentItem({ document, readOnly, onDelete, onDownload }: DocumentItemProps) {
  const { icon: Icon, color } = getFileIcon(document.file_name);
  const isImage = document.mime_type?.startsWith('image/');
  const isPdf = document.mime_type === 'application/pdf';

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Icon or Thumbnail */}
      <div className={cn('flex-shrink-0', color)}>
        {isImage && document.file_url ? (
          <img
            src={document.file_url}
            alt={document.file_name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <Icon className="h-10 w-10" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{document.file_name}</p>
        <p className="text-xs text-gray-500">
          {document.file_size && formatFileSize(document.file_size)}
          {document.uploader && ` • ${document.uploader.full_name}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Preview (for images and PDFs) */}
        {(isImage || isPdf) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => window.open(document.file_url, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        
        {/* Download */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Delete */}
        {!readOnly && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export { documentTypeConfig };
