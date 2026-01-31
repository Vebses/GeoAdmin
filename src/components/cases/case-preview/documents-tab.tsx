'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Image,
  File,
  Eye,
  Download,
  Loader2,
  User as UserIcon,
  FileBox,
  Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/format';
import { DocumentPreviewModal } from '../document-preview-modal';
import type { CaseWithRelations, CaseDocument, CaseDocumentWithRelations } from '@/types';

interface DocumentsTabProps {
  caseData: CaseWithRelations;
}

type DocumentType = 'patient' | 'original' | 'medical';

const documentTypeConfig: Record<DocumentType, {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}> = {
  patient: {
    label: 'პაციენტის დოკუმენტები',
    icon: UserIcon,
    bgColor: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-500'
  },
  original: {
    label: 'ორიგინალი დოკუმენტები',
    icon: FileBox,
    bgColor: 'bg-purple-50 border-purple-100',
    iconColor: 'text-purple-500'
  },
  medical: {
    label: 'სამედიცინო დოკუმენტები',
    icon: Stethoscope,
    bgColor: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-500'
  }
};

// Get file icon based on extension/mime type
function getFileIcon(fileName: string, mimeType?: string | null) {
  if (mimeType?.startsWith('image/')) {
    return { icon: Image, color: 'text-pink-500' };
  }
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-red-500' };
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['doc', 'docx'].includes(ext || '')) {
    return { icon: FileText, color: 'text-blue-500' };
  }
  return { icon: File, color: 'text-gray-500' };
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Document item component
function DocumentItem({
  document,
  onPreview
}: {
  document: CaseDocumentWithRelations;
  onPreview: () => void;
}) {
  const isImage = document.mime_type?.startsWith('image/');
  const isPdf = document.mime_type === 'application/pdf';
  const canPreview = isImage || isPdf;
  const { icon: FileIcon, color } = getFileIcon(document.file_name, document.mime_type);

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group">
      {/* Thumbnail or icon */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
        {isImage && document.file_url ? (
          <img
            src={document.file_url}
            alt={document.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className={cn('w-6 h-6', color)} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{document.file_name}</p>
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
          {document.file_size && (
            <span>{formatFileSize(document.file_size)}</span>
          )}
          {document.uploader && (
            <>
              <span>•</span>
              <span>{document.uploader.full_name}</span>
            </>
          )}
          {document.created_at && (
            <>
              <span>•</span>
              <span>{formatDate(document.created_at)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onPreview}
            title="პრევიუ"
          >
            <Eye size={14} className="text-gray-500" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDownload}
          title="ჩამოტვირთვა"
        >
          <Download size={14} className="text-gray-500" />
        </Button>
      </div>
    </div>
  );
}

// Document section component
function DocumentSection({
  type,
  documents,
  onPreview
}: {
  type: DocumentType;
  documents: CaseDocumentWithRelations[];
  onPreview: (doc: CaseDocumentWithRelations) => void;
}) {
  const config = documentTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Section header */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', config.bgColor)}>
        <div className="flex items-center gap-2">
          <Icon size={14} className={config.iconColor} />
          <span className="text-xs font-medium text-gray-700">{config.label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-white/80">
          {documents.length}
        </Badge>
      </div>

      {/* Documents list */}
      {documents.length > 0 ? (
        <div className="p-3 space-y-2 bg-gray-50/50">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onPreview={() => onPreview(doc)}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-gray-50/50">
          <p className="text-xs text-gray-400">დოკუმენტები არ არის</p>
        </div>
      )}
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText size={24} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">დოკუმენტები არ არის</h3>
      <p className="text-xs text-gray-500">ამ ქეისში ჯერ არ ატვირთულა დოკუმენტები</p>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={24} className="text-blue-500 animate-spin mb-3" />
      <p className="text-xs text-gray-500">იტვირთება...</p>
    </div>
  );
}

export function DocumentsTab({ caseData }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<CaseDocumentWithRelations[]>(caseData.documents || []);
  const [loading, setLoading] = useState(!caseData.documents);
  const [previewDoc, setPreviewDoc] = useState<CaseDocumentWithRelations | null>(null);

  useEffect(() => {
    // If documents are already loaded, use them
    if (caseData.documents) {
      setDocuments(caseData.documents);
      setLoading(false);
      return;
    }

    // Fetch documents if not loaded but count > 0
    if (caseData.documents_count && caseData.documents_count > 0) {
      setLoading(true);
      fetch(`/api/cases/${caseData.id}/documents`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setDocuments(data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load documents:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [caseData.id, caseData.documents, caseData.documents_count]);

  if (loading) {
    return <LoadingState />;
  }

  const totalDocs = documents.length;

  if (totalDocs === 0) {
    return <EmptyState />;
  }

  // Group documents by type
  const patientDocs = documents.filter((d) => d.type === 'patient');
  const originalDocs = documents.filter((d) => d.type === 'original');
  const medicalDocs = documents.filter((d) => d.type === 'medical');

  return (
    <>
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            სულ <span className="font-medium text-gray-700">{totalDocs}</span> დოკუმენტი
          </p>
        </div>

        {/* Document sections */}
        <DocumentSection
          type="patient"
          documents={patientDocs}
          onPreview={setPreviewDoc}
        />
        <DocumentSection
          type="original"
          documents={originalDocs}
          onPreview={setPreviewDoc}
        />
        <DocumentSection
          type="medical"
          documents={medicalDocs}
          onPreview={setPreviewDoc}
        />
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  );
}
