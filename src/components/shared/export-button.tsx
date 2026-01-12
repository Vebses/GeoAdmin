'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type ExportEntity = 'cases' | 'invoices';
type ExportFormat = 'csv' | 'xlsx';

interface ExportButtonProps {
  entity: ExportEntity;
  filters?: Record<string, string>;
  disabled?: boolean;
}

export function ExportButton({ entity, filters, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      params.set('format', format);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
      }

      const response = await fetch(`/api/export/${entity}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (response.status === 204) {
        toast.info('ექსპორტისთვის მონაცემები არ არის');
        return;
      }

      // Download the file
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') 
        || `${entity}_export.${format}`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('ექსპორტი დასრულდა');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ექსპორტი ვერ მოხერხდა');
    } finally {
      setIsExporting(false);
    }
  };

  const entityLabels: Record<ExportEntity, string> = {
    cases: 'ქეისები',
    invoices: 'ინვოისები',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} size="sm">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          ექსპორტი
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV ფაილი
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
          <span className="ml-2 text-xs text-gray-400">მალე</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
