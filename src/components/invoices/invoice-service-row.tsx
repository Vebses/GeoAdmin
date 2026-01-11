'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { InvoiceServiceFormData } from '@/types';

interface InvoiceServiceRowProps {
  service: InvoiceServiceFormData;
  index: number;
  onChange: (index: number, data: Partial<InvoiceServiceFormData>) => void;
  onRemove: (index: number) => void;
  readOnly?: boolean;
}

export function InvoiceServiceRow({
  service,
  index,
  onChange,
  onRemove,
  readOnly = false,
}: InvoiceServiceRowProps) {
  const handleQuantityChange = (quantity: number) => {
    const amount = quantity * service.unit_price;
    onChange(index, { quantity, amount });
  };

  const handleUnitPriceChange = (unit_price: number) => {
    const amount = service.quantity * unit_price;
    onChange(index, { unit_price, amount });
  };

  if (readOnly) {
    return (
      <tr className="border-b border-gray-100 last:border-b-0">
        <td className="py-2 pr-3">
          <div>
            <p className="text-xs font-medium text-gray-900">{service.name}</p>
            {service.description && (
              <p className="text-[10px] text-gray-500 mt-0.5">{service.description}</p>
            )}
          </div>
        </td>
        <td className="py-2 px-3 text-center">
          <span className="text-xs text-gray-700">{service.quantity}</span>
        </td>
        <td className="py-2 px-3 text-right">
          <span className="text-xs text-gray-700">{service.unit_price.toFixed(2)}</span>
        </td>
        <td className="py-2 pl-3 text-right">
          <span className="text-xs font-medium text-gray-900">{service.amount.toFixed(2)}</span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
      <td className="py-2 pr-3">
        <div className="space-y-1">
          <Input
            value={service.name}
            onChange={(e) => onChange(index, { name: e.target.value })}
            placeholder="სერვისის სახელი"
            className="h-8 text-xs"
          />
          <Input
            value={service.description || ''}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="აღწერა (არჩევითი)"
            className="h-7 text-[10px] text-gray-500"
          />
        </div>
      </td>
      <td className="py-2 px-3">
        <Input
          type="number"
          value={service.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          min={1}
          className="h-8 text-xs text-center w-16"
        />
      </td>
      <td className="py-2 px-3">
        <Input
          type="number"
          value={service.unit_price || ''}
          onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
          min={0}
          step="0.01"
          placeholder="0.00"
          className="h-8 text-xs text-right w-24"
        />
      </td>
      <td className="py-2 px-3">
        <span className={cn(
          'block text-xs text-right font-medium',
          service.amount > 0 ? 'text-gray-900' : 'text-gray-400'
        )}>
          {service.amount.toFixed(2)}
        </span>
      </td>
      <td className="py-2 pl-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}
