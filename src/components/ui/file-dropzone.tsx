'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Upload, X, File, FileText, Image, Table, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

export interface FileDropzoneProps {
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onDrop: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface FileRejection {
  file: File;
  errors: string[];
}

const fileIcons: Record<string, { icon: React.ElementType; color: string }> = {
  pdf: { icon: FileText, color: 'text-red-500' },
  doc: { icon: FileText, color: 'text-blue-500' },
  docx: { icon: FileText, color: 'text-blue-500' },
  xls: { icon: Table, color: 'text-green-500' },
  xlsx: { icon: Table, color: 'text-green-500' },
  jpg: { icon: Image, color: 'text-purple-500' },
  jpeg: { icon: Image, color: 'text-purple-500' },
  png: { icon: Image, color: 'text-purple-500' },
  gif: { icon: Image, color: 'text-purple-500' },
  webp: { icon: Image, color: 'text-purple-500' },
};

export function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileIcons[ext] || { icon: File, color: 'text-gray-500' };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileDropzone({
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onDrop,
  onReject,
  disabled = false,
  loading = false,
  className,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string[] => {
      const errors: string[] = [];

      // Check file size
      if (file.size > maxSize) {
        errors.push(`ფაილი ძალიან დიდია (მაქს. ${formatFileSize(maxSize)})`);
      }

      // Check file type if accept is specified
      if (accept) {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isValidType = Object.entries(accept).some(([mimeType, extensions]) => {
          if (file.type === mimeType) return true;
          if (mimeType.endsWith('/*') && file.type.startsWith(mimeType.replace('/*', '/')))
            return true;
          return extensions.includes(ext);
        });

        if (!isValidType) {
          errors.push('ფაილის ტიპი არ არის დაშვებული');
        }
      }

      return errors;
    },
    [accept, maxSize]
  );

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled || loading) return;

      const files = Array.from(fileList).slice(0, maxFiles);
      const accepted: File[] = [];
      const rejected: FileRejection[] = [];

      files.forEach((file) => {
        const errors = validateFile(file);
        if (errors.length === 0) {
          accepted.push(file);
        } else {
          rejected.push({ file, errors });
        }
      });

      if (accepted.length > 0) {
        onDrop(accepted);
      }

      if (rejected.length > 0 && onReject) {
        onReject(rejected);
      }
    },
    [disabled, loading, maxFiles, onDrop, onReject, validateFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [processFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !loading && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled, loading]);

  const getAcceptString = () => {
    if (!accept) return undefined;
    return Object.entries(accept)
      .flatMap(([mimeType, extensions]) => [mimeType, ...extensions])
      .join(',');
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
        isDragActive && !disabled && 'border-primary bg-primary/5',
        !isDragActive && !disabled && 'border-gray-300 hover:border-gray-400 bg-gray-50',
        disabled && 'border-gray-200 bg-gray-100 cursor-not-allowed',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxFiles > 1}
        accept={getAcceptString()}
        onChange={handleInputChange}
        disabled={disabled || loading}
      />

      {loading ? (
        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
      ) : (
        <Upload
          className={cn(
            'mx-auto h-8 w-8',
            isDragActive ? 'text-primary' : 'text-gray-400'
          )}
        />
      )}

      <p className={cn('mt-2 text-sm', disabled ? 'text-gray-400' : 'text-gray-600')}>
        {loading
          ? 'იტვირთება...'
          : isDragActive
          ? 'ჩააგდეთ ფაილები აქ'
          : 'ჩააგდეთ ფაილები ან დააჭირეთ'}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        PDF, DOC, JPG, PNG (მაქს. {formatFileSize(maxSize)})
      </p>
    </div>
  );
}

// File preview component for uploaded files
interface FilePreviewProps {
  file: {
    name: string;
    size?: number;
    url?: string;
    type?: string;
  };
  onRemove?: () => void;
  onDownload?: () => void;
  showRemove?: boolean;
  showDownload?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FilePreview({
  file,
  onRemove,
  onDownload,
  showRemove = true,
  showDownload = false,
  isUploading = false,
  uploadProgress = 0,
}: FilePreviewProps) {
  const { icon: Icon, color } = getFileIcon(file.name);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className={cn('flex-shrink-0', color)}>
        <Icon className="h-8 w-8" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        {file.size && (
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        )}
        {isUploading && (
          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {showDownload && file.url && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
