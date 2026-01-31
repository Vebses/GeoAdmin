'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import type { CaseDocumentWithRelations } from '@/types';

interface DocumentPreviewModalProps {
  document: CaseDocumentWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Document type labels
const documentTypeLabels: Record<string, string> = {
  patient: 'პაციენტის დოკუმენტი',
  original: 'ორიგინალი დოკუმენტი',
  medical: 'სამედიცინო დოკუმენტი'
};

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [pdfLoading, setPdfLoading] = React.useState(true);

  // Reset state when document changes
  React.useEffect(() => {
    setZoom(100);
    setRotation(0);
    setImageLoading(true);
    setPdfLoading(true);
  }, [document?.id]);

  if (!document) return null;

  const isImage = document.mime_type?.startsWith('image/');
  const isPdf = document.mime_type === 'application/pdf';
  const canPreview = isImage || isPdf;

  const handleDownload = () => {
    if (document.file_url) {
      const link = window.document.createElement('a');
      link.href = document.file_url;
      link.download = document.file_name;
      link.click();
    }
  };

  const handleOpenExternal = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[60] bg-black/80 backdrop-blur-md',
            'data-[state=open]:animate-backdrop-enter data-[state=closed]:animate-backdrop-exit'
          )}
        />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-4 z-[60] flex flex-col',
            'bg-gray-900 rounded-2xl overflow-hidden shadow-2xl',
            'data-[state=open]:animate-modal-enter data-[state=closed]:animate-modal-exit'
          )}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-gray-800/50 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-sm font-medium text-white truncate max-w-md">
                  {document.file_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
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
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls (for images) */}
              {isImage && (
                <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-gray-700 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-600"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut size={14} />
                  </Button>
                  <span className="text-xs text-gray-300 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-600"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn size={14} />
                  </Button>
                  <div className="w-px h-4 bg-gray-600 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-600"
                    onClick={handleRotate}
                  >
                    <RotateCw size={14} />
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-gray-300 hover:text-white hover:bg-gray-700 gap-1.5"
                onClick={handleOpenExternal}
              >
                <ExternalLink size={14} />
                ახალ ტაბში
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-gray-300 hover:text-white hover:bg-gray-700 gap-1.5"
                onClick={handleDownload}
              >
                <Download size={14} />
                ჩამოტვირთვა
              </Button>

              <div className="w-px h-6 bg-gray-700 mx-1" />

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={onClose}
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#1a1a1a]">
            {isImage ? (
              <div className="relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={32} className="text-gray-500 animate-spin" />
                  </div>
                )}
                <img
                  src={document.file_url}
                  alt={document.file_name}
                  className={cn(
                    'max-w-full max-h-full object-contain transition-all duration-200',
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  )}
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                  }}
                  onLoad={() => setImageLoading(false)}
                  draggable={false}
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-full flex flex-col">
                {pdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 size={32} className="text-gray-500 animate-spin" />
                  </div>
                )}
                <iframe
                  src={`${document.file_url}#view=FitH&toolbar=0`}
                  className="w-full h-full rounded-lg bg-white"
                  title={document.file_name}
                  onLoad={() => setPdfLoading(false)}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  ამ ფაილის პრევიუ მიუწვდომელია
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink size={14} className="mr-1.5" />
                  გახსნა ახალ ტაბში
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              ტიპი: {documentTypeLabels[document.type] || document.type}
            </span>
            {canPreview && (
              <span className="text-xs text-gray-500">
                {isImage ? 'გამოიყენეთ Ctrl + Scroll ზუმისთვის' : 'გადახვევისთვის გამოიყენეთ მაუსი'}
              </span>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
