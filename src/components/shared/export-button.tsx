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
import { ExportDateRangeModal, type DateRange } from './export-date-range-modal';
import { toast } from 'sonner';

type ExportEntity = 'cases' | 'invoices';
type ExportFormat = 'csv' | 'xlsx';

interface ExportButtonProps {
  entity: ExportEntity;
  filters?: Record<string, string>;
  disabled?: boolean;
}

// Georgian column labels for cases
const caseColumns = [
  { key: 'case_number', label: 'ქეისის ნომერი' },
  { key: 'status', label: 'სტატუსი' },
  { key: 'patient_name', label: 'პაციენტის სახელი' },
  { key: 'patient_id', label: 'პაციენტის ID' },
  { key: 'patient_dob', label: 'დაბადების თარიღი' },
  { key: 'patient_phone', label: 'ტელეფონი' },
  { key: 'patient_email', label: 'ელ.ფოსტა' },
  { key: 'insurance_name', label: 'დაზღვევა' },
  { key: 'insurance_policy_number', label: 'პოლისის ნომერი' },
  { key: 'client_name', label: 'დამკვეთი' },
  { key: 'assigned_user', label: 'ასისტანტი' },
  { key: 'is_medical', label: 'სამედიცინო' },
  { key: 'is_documented', label: 'დოკუმენტირებული' },
  { key: 'priority', label: 'პრიორიტეტი' },
  { key: 'complaints', label: 'ჩივილები' },
  { key: 'needs', label: 'საჭიროებები' },
  { key: 'diagnosis', label: 'დიაგნოზი' },
  { key: 'treatment_notes', label: 'მკურნალობის ჩანაწერები' },
  { key: 'opened_at', label: 'გახსნის თარიღი' },
  { key: 'closed_at', label: 'დახურვის თარიღი' },
  { key: 'total_service_cost', label: 'სერვისის ღირებულება' },
  { key: 'total_assistance_cost', label: 'ასისტანსის ღირებულება' },
  { key: 'total_commission_cost', label: 'საკომისიო' },
  { key: 'actions_count', label: 'მოქმედებების რაოდენობა' },
  { key: 'documents_count', label: 'დოკუმენტების რაოდენობა' },
  { key: 'invoices_count', label: 'ინვოისების რაოდენობა' },
  { key: 'creator_name', label: 'შემქმნელი' },
  { key: 'created_at', label: 'შექმნის თარიღი' },
];

const actionColumns = [
  { key: 'case_number', label: 'ქეისის ნომერი' },
  { key: 'service_name', label: 'მომსახურების სახელი' },
  { key: 'service_description', label: 'აღწერა' },
  { key: 'executor_name', label: 'შემსრულებელი' },
  { key: 'service_cost', label: 'სერვისის ღირებულება' },
  { key: 'service_currency', label: 'სერვისის ვალუტა' },
  { key: 'assistance_cost', label: 'ასისტანსის ღირებულება' },
  { key: 'assistance_currency', label: 'ასისტანსის ვალუტა' },
  { key: 'commission_cost', label: 'საკომისიო' },
  { key: 'commission_currency', label: 'საკომისიოს ვალუტა' },
  { key: 'service_date', label: 'მომსახურების თარიღი' },
  { key: 'comment', label: 'კომენტარი' },
  { key: 'created_at', label: 'შექმნის თარიღი' },
];

const documentTypeLabels: Record<string, string> = {
  patient: 'პაციენტის დოკ.',
  original: 'ორიგინალი',
  medical: 'სამედიცინო',
};

const documentColumns = [
  { key: 'case_number', label: 'ქეისის ნომერი' },
  { key: 'type', label: 'დოკუმენტის ტიპი' },
  { key: 'file_name', label: 'ფაილის სახელი' },
  { key: 'file_size', label: 'ფაილის ზომა (bytes)' },
  { key: 'mime_type', label: 'MIME ტიპი' },
  { key: 'created_at', label: 'ატვირთვის თარიღი' },
];

const invoiceStatusLabels: Record<string, string> = {
  draft: 'დრაფტი',
  unpaid: 'გადაუხდელი',
  paid: 'გადახდილი',
  cancelled: 'გაუქმებული',
};

const invoiceColumns = [
  { key: 'case_number', label: 'ქეისის ნომერი' },
  { key: 'invoice_number', label: 'ინვოისის ნომერი' },
  { key: 'status', label: 'სტატუსი' },
  { key: 'recipient_name', label: 'მიმღები' },
  { key: 'sender_name', label: 'გამომგზავნი' },
  { key: 'currency', label: 'ვალუტა' },
  { key: 'subtotal', label: 'ქვეჯამი' },
  { key: 'franchise', label: 'ფრანშიზა' },
  { key: 'total', label: 'სულ' },
  { key: 'paid_amount', label: 'გადახდილი თანხა' },
  { key: 'paid_at', label: 'გადახდის თარიღი' },
  { key: 'created_at', label: 'შექმნის თარიღი' },
];

// Style worksheet headers
function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF374151' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' },
  };
  headerRow.height = 24;
  headerRow.alignment = { vertical: 'middle' };

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? String(cell.value) : '';
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.min(maxLength + 2, 50);
  });
}

// Add data to worksheet with column definitions
function addDataToWorksheet(
  worksheet: ExcelJS.Worksheet,
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  transformers?: Record<string, (val: unknown) => unknown>
) {
  // Add headers
  worksheet.addRow(columns.map((col) => col.label));

  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      let value = row[col.key];
      if (transformers && transformers[col.key]) {
        value = transformers[col.key](value);
      }
      return value ?? '';
    });
    worksheet.addRow(values);
  });

  // Style the worksheet
  styleWorksheet(worksheet);
}

export function ExportButton({ entity, filters, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

  const handleExportClick = (format: ExportFormat) => {
    if (entity === 'cases' && format === 'xlsx') {
      // Show date range modal for comprehensive Excel export
      setPendingFormat(format);
      setShowDateModal(true);
    } else {
      // Direct export for CSV or non-cases entities
      handleExport(format);
    }
  };

  const handleDateRangeExport = async (dateRange: DateRange) => {
    setShowDateModal(false);
    if (pendingFormat) {
      await handleComprehensiveExport(pendingFormat, dateRange);
    }
    setPendingFormat(null);
  };

  const handleComprehensiveExport = async (_format: ExportFormat, dateRange: DateRange) => {
    setIsExporting(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      params.set('format', 'json');
      params.set('comprehensive', 'true');

      if (dateRange.from) {
        params.set('opened_from', dateRange.from);
      }
      if (dateRange.to) {
        params.set('opened_to', dateRange.to);
      }
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

      if (!result.success || !result.data) {
        toast.info('ექსპორტისთვის მონაცემები არ არის');
        return;
      }

      const { cases, actions, documents, invoices } = result.data;

      if (!cases || cases.length === 0) {
        toast.info('ექსპორტისთვის მონაცემები არ არის');
        return;
      }

      // Generate filename with date range
      let filename = 'cases';
      if (dateRange.from && dateRange.to) {
        filename = `cases_${dateRange.from}_${dateRange.to}`;
      } else if (dateRange.from) {
        filename = `cases_from_${dateRange.from}`;
      } else if (dateRange.to) {
        filename = `cases_to_${dateRange.to}`;
      } else {
        filename = `cases_all_${new Date().toISOString().split('T')[0]}`;
      }

      // Create multi-sheet Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GeoAdmin';
      workbook.created = new Date();

      // Sheet 1: Cases
      const casesSheet = workbook.addWorksheet('ქეისები');
      addDataToWorksheet(casesSheet, cases, caseColumns, {
        opened_at: (val) => val ? new Date(String(val)).toLocaleDateString('ka-GE') : '',
        closed_at: (val) => val ? new Date(String(val)).toLocaleDateString('ka-GE') : '',
        created_at: (val) => val ? new Date(String(val)).toLocaleString('ka-GE') : '',
      });

      // Sheet 2: Actions
      const actionsSheet = workbook.addWorksheet('მოქმედებები');
      if (actions && actions.length > 0) {
        addDataToWorksheet(actionsSheet, actions, actionColumns, {
          service_date: (val) => val ? new Date(String(val)).toLocaleDateString('ka-GE') : '',
          created_at: (val) => val ? new Date(String(val)).toLocaleString('ka-GE') : '',
        });
      } else {
        actionsSheet.addRow(['მონაცემები არ მოიძებნა']);
      }

      // Sheet 3: Documents
      const documentsSheet = workbook.addWorksheet('დოკუმენტები');
      if (documents && documents.length > 0) {
        addDataToWorksheet(documentsSheet, documents, documentColumns, {
          type: (val) => documentTypeLabels[String(val)] || val,
          created_at: (val) => val ? new Date(String(val)).toLocaleString('ka-GE') : '',
        });
      } else {
        documentsSheet.addRow(['მონაცემები არ მოიძებნა']);
      }

      // Sheet 4: Invoices
      const invoicesSheet = workbook.addWorksheet('ინვოისები');
      if (invoices && invoices.length > 0) {
        addDataToWorksheet(invoicesSheet, invoices, invoiceColumns, {
          status: (val) => invoiceStatusLabels[String(val)] || val,
          paid_at: (val) => val ? new Date(String(val)).toLocaleString('ka-GE') : '',
          created_at: (val) => val ? new Date(String(val)).toLocaleString('ka-GE') : '',
        });
      } else {
        invoicesSheet.addRow(['მონაცემები არ მოიძებნა']);
      }

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `${filename}.xlsx`);
      toast.success(`Excel ფაილი გადმოწერილია (${cases.length} ქეისი)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ექსპორტი ვერ მოხერხდა');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      params.set('format', 'json');
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
          column.width = Math.min(maxLength + 2, 50);
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
        const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8

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
    <>
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
          <DropdownMenuItem onClick={() => handleExportClick('xlsx')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            CSV ფაილი
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Range Modal for Cases Excel Export */}
      <ExportDateRangeModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setPendingFormat(null);
        }}
        onExport={handleDateRangeExport}
        loading={isExporting}
      />
    </>
  );
}

export default ExportButton;
