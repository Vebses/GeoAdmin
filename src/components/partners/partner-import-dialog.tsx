'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/types';

interface PartnerImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

interface ParsedRow {
  name: string;
  legal_name?: string;
  id_code?: string;
  country?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  notes?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

// CSV column name mappings (Georgian -> English)
const columnMappings: Record<string, string> = {
  // Name variations
  'name': 'name',
  'სახელი': 'name',
  'კომპანია': 'name',
  'company': 'name',
  'company_name': 'name',
  
  // Legal name
  'legal_name': 'legal_name',
  'იურიდიული სახელი': 'legal_name',
  'legalname': 'legal_name',
  
  // ID code
  'id_code': 'id_code',
  'საიდენტიფიკაციო კოდი': 'id_code',
  'idcode': 'id_code',
  'id': 'id_code',
  'კოდი': 'id_code',
  
  // Country
  'country': 'country',
  'ქვეყანა': 'country',
  
  // City
  'city': 'city',
  'ქალაქი': 'city',
  
  // Address
  'address': 'address',
  'მისამართი': 'address',
  
  // Email
  'email': 'email',
  'ელ-ფოსტა': 'email',
  'ელფოსტა': 'email',
  'e-mail': 'email',
  
  // Phone
  'phone': 'phone',
  'ტელეფონი': 'phone',
  'tel': 'phone',
  'telephone': 'phone',
  
  // Contact person
  'contact_person': 'contact_person',
  'საკონტაქტო პირი': 'contact_person',
  'contact': 'contact_person',
  
  // Notes
  'notes': 'notes',
  'შენიშვნა': 'notes',
  'შენიშვნები': 'notes',
  'comment': 'notes',
  'comments': 'notes',
};

export function PartnerImportDialog({ isOpen, onClose, categories }: PartnerImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const resetDialog = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setSelectedCategory('');
    setImportResult(null);
  }, []);

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Map headers to field names
    const fieldMap: Record<number, string> = {};
    headers.forEach((header, index) => {
      const mappedField = columnMappings[header];
      if (mappedField) {
        fieldMap[index] = mappedField;
      }
    });

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted values)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Build row object
      const row: Record<string, string> = {};
      values.forEach((value, index) => {
        const field = fieldMap[index];
        if (field) {
          row[field] = value.replace(/^"|"$/g, '');
        }
      });

      if (row.name) {
        rows.push(row as unknown as ParsedRow);
      }
    }

    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('მხოლოდ CSV ფაილები');
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error('ფაილში მონაცემები ვერ მოიძებნა');
        return;
      }

      setParsedData(rows);
      setStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('ფაილის წაკითხვა ვერ მოხერხდა');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch('/api/import/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedData,
          categoryId: selectedCategory || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Import failed');
      }

      setImportResult(result.data);
      setStep('result');
      
      // Refresh partners list
      queryClient.invalidateQueries({ queryKey: ['partners'] });

      if (result.data.success > 0) {
        toast.success(`${result.data.success} პარტნიორი წარმატებით დაემატა`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'იმპორტი ვერ მოხერხდა');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            პარტნიორების იმპორტი
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="mb-4">
                <Label
                  htmlFor="csv-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  აირჩიეთ CSV ფაილი
                </Label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                მხარდაჭერილი სვეტები: სახელი, იურიდიული სახელი, ID კოდი, ქვეყანა, ქალაქი, მისამართი, ელ-ფოსტა, ტელეფონი
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">CSV ფორმატი</h4>
              <p className="text-xs text-blue-700 mb-2">
                პირველი სტრიქონი უნდა შეიცავდეს სვეტების სახელებს:
              </p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                სახელი,იურიდიული სახელი,საიდენტიფიკაციო კოდი,ქვეყანა,ქალაქი,ელ-ფოსტა,ტელეფონი
              </code>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                მოიძებნა <span className="font-semibold">{parsedData.length}</span> ჩანაწერი
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-sm">კატეგორია:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="არ მიუთითო" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">არ მიუთითო</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">სახელი</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">ID კოდი</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">ქალაქი</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">ელ-ფოსტა</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-gray-600">{row.id_code || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.city || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 50 && (
                <p className="p-3 text-center text-sm text-gray-500">
                  ... და კიდევ {parsedData.length - 50} ჩანაწერი
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-700">{importResult.success}</p>
                <p className="text-sm text-green-600">წარმატებით</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                <p className="text-sm text-red-600">შეცდომით</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">შეცდომები:</h4>
                <ScrollArea className="h-[150px]">
                  <ul className="space-y-1 text-xs text-red-700">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>
                        სტრიქონი {err.row}: {err.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              გაუქმება
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                უკან
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                იმპორტი ({parsedData.length})
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose}>
              დახურვა
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PartnerImportDialog;
