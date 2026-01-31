'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
      params.set('format', 'json'); // Always fetch JSON for client-side processing
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

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        toast.info('ექსპორტისთვის მონაცემები არ არის');
        return;
      }

      const data = result.data;
      const filename = `${entity}_${new Date().toISOString().split('T')[0]}`;

      if (format === 'xlsx') {
        // Create Excel file with ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(
          entity === 'cases' ? 'Cases' : 'Invoices'
        );

        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };

        // Add data rows
        data.forEach((row: Record<string, unknown>) => {
          worksheet.addRow(headers.map((h) => row[h] ?? ''));
        });

        // Auto-size columns
        worksheet.columns.forEach((column, index) => {
          const header = headers[index];
          let maxLength = header.length;
          data.forEach((row: Record<string, unknown>) => {
            const cellValue = String(row[header] ?? '');
            maxLength = Math.max(maxLength, cellValue.length);
          });
          column.width = Math.min(maxLength + 2, 50); // Cap at 50
        });

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, `${filename}.xlsx`);
        toast.success('Excel ფაილი გადმოწერილია');
      } else {
        // Generate CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map((row: Record<string, unknown>) =>
            headers.map((h) => {
              const val = String(row[h] || '');
              if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            }).join(',')
          ),
        ];
        const csvContent = csvRows.join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('CSV ფაილი გადმოწერილია');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ექსპორტი ვერ მოხერხდა');
    } finally {
      setIsExporting(false);
    }
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
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV ფაილი
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
