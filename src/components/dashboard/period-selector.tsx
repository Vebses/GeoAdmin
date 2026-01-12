'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type Period = 'week' | 'month' | 'quarter' | 'year';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const periodOptions: { value: Period; label: string }[] = [
  { value: 'week', label: 'ეს კვირა' },
  { value: 'month', label: 'ეს თვე' },
  { value: 'quarter', label: 'ეს კვარტალი' },
  { value: 'year', label: 'ეს წელი' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className="w-[160px] h-9 text-sm">
        <SelectValue placeholder="აირჩიეთ პერიოდი" />
      </SelectTrigger>
      <SelectContent>
        {periodOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-sm">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PeriodSelector;
