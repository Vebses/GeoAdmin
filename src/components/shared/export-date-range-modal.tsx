'use client';

import { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface DatePreset {
  label: string;
  value: string;
  getRange: () => DateRange;
}

interface ExportDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (dateRange: DateRange) => void;
  loading?: boolean;
  title?: string;
}

// Helper to format date as YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Date presets
const getDatePresets = (): DatePreset[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  return [
    {
      label: 'ეს თვე',
      value: 'this_month',
      getRange: () => ({
        from: formatDateStr(new Date(currentYear, currentMonth, 1)),
        to: formatDateStr(today),
      }),
    },
    {
      label: 'წინა თვე',
      value: 'last_month',
      getRange: () => ({
        from: formatDateStr(new Date(currentYear, currentMonth - 1, 1)),
        to: formatDateStr(new Date(currentYear, currentMonth, 0)), // Last day of prev month
      }),
    },
    {
      label: 'ბოლო 3 თვე',
      value: 'last_3_months',
      getRange: () => ({
        from: formatDateStr(new Date(currentYear, currentMonth - 2, 1)),
        to: formatDateStr(today),
      }),
    },
    {
      label: 'ეს წელი',
      value: 'this_year',
      getRange: () => ({
        from: formatDateStr(new Date(currentYear, 0, 1)),
        to: formatDateStr(today),
      }),
    },
    {
      label: 'ყველა დრო',
      value: 'all_time',
      getRange: () => ({
        from: null,
        to: null,
      }),
    },
  ];
};

export function ExportDateRangeModal({
  isOpen,
  onClose,
  onExport,
  loading = false,
  title = 'ექსპორტის თარიღის არჩევა',
}: ExportDateRangeModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const presets = getDatePresets();

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset.value);
    const range = preset.getRange();
    setStartDate(range.from || '');
    setEndDate(range.to || '');
    setError(null);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setSelectedPreset(null); // Clear preset when custom date is entered
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setError(null);
  };

  const handleExport = () => {
    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('დაწყების თარიღი არ შეიძლება იყოს დასრულების თარიღზე მეტი');
      return;
    }

    onExport({
      from: startDate || null,
      to: endDate || null,
    });
  };

  const handleClose = () => {
    // Reset state on close
    setSelectedPreset(null);
    setStartDate('');
    setEndDate('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">სწრაფი არჩევა</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                    selectedPreset === preset.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">ან</span>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-xs text-gray-500 mb-1.5 block">
                დაწყების თარიღი
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-gray-500 mb-1.5 block">
                დასრულების თარიღი
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Info about selected range */}
          {(startDate || endDate) && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              {startDate && endDate ? (
                <>
                  არჩეული პერიოდი: <span className="font-medium text-gray-700">{startDate}</span> - <span className="font-medium text-gray-700">{endDate}</span>
                </>
              ) : startDate ? (
                <>
                  თარიღიდან: <span className="font-medium text-gray-700">{startDate}</span>
                </>
              ) : (
                <>
                  თარიღამდე: <span className="font-medium text-gray-700">{endDate}</span>
                </>
              )}
            </div>
          )}

          {!startDate && !endDate && selectedPreset === 'all_time' && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              ყველა მონაცემი თარიღის შეზღუდვის გარეშე
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            გაუქმება
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                ექსპორტი...
              </>
            ) : (
              'ექსპორტი'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
