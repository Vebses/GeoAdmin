'use client';

import { Plus, Wand2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { InvoiceServiceFormData, CurrencyCode, CaseActionWithRelations } from '@/types';

interface InvoiceServicesEditorProps {
  services: InvoiceServiceFormData[];
  onChange: (services: InvoiceServiceFormData[]) => void;
  currency: CurrencyCode;
  franchiseAmount: number;
  onFranchiseChange: (amount: number) => void;
  caseActions?: CaseActionWithRelations[];
  recipientId?: string;
  readOnly?: boolean;
}

export function InvoiceServicesEditor({
  services,
  onChange,
  currency,
  franchiseAmount,
  onFranchiseChange,
  caseActions = [],
  recipientId,
  readOnly = false,
}: InvoiceServicesEditorProps) {
  const handleAddService = () => {
    const newService: InvoiceServiceFormData = {
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    };
    onChange([...services, newService]);
  };

  const handleUpdateService = (index: number, field: keyof InvoiceServiceFormData, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? Number(value) : updated[index].quantity;
      const unitPrice = field === 'unit_price' ? Number(value) : updated[index].unit_price;
      updated[index].total = quantity * unitPrice;
    }
    
    onChange(updated);
  };

  const handleRemoveService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAutoPopulate = () => {
    if (!caseActions.length) return;

    // Filter actions by recipient (executor) if provided
    const relevantActions = recipientId
      ? caseActions.filter((action) => action.executor_id === recipientId)
      : caseActions;

    const actionsToUse = relevantActions.length > 0 ? relevantActions : caseActions;

    const newServices: InvoiceServiceFormData[] = actionsToUse.map((action) => {
      // Determine which cost to use based on currency
      let unitPrice = 0;
      if (currency === 'GEL' && action.service_currency === 'GEL') {
        unitPrice = action.service_cost || 0;
      } else if (currency === 'EUR' && action.assistance_currency === 'EUR') {
        unitPrice = action.assistance_cost || 0;
      } else if (currency === 'USD' && action.assistance_currency === 'USD') {
        unitPrice = action.assistance_cost || 0;
      } else {
        // Default to assistance cost for EUR
        unitPrice = action.assistance_cost || action.service_cost || 0;
      }

      // Use service_name as description
      const description = action.service_description 
        ? `${action.service_name} - ${action.service_description}`
        : action.service_name;

      return {
        description,
        quantity: 1,
        unit_price: unitPrice,
        total: unitPrice,
      };
    });

    onChange(newServices);
  };

  const subtotal = services.reduce((sum, s) => sum + (s.total || 0), 0);
  const total = Math.max(0, subtotal - franchiseAmount);

  const currencySymbol = {
    GEL: '₾',
    EUR: '€',
    USD: '$',
  }[currency];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-900">
          სერვისები ({services.length})
        </h4>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {caseActions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleAutoPopulate}
              >
                <Wand2 className="h-3 w-3 mr-1" />
                ავტო-შევსება
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddService}
            >
              <Plus className="h-3 w-3 mr-1" />
              დამატება
            </Button>
          </div>
        )}
      </div>

      {/* Services Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 pr-3 pl-4 text-left text-[10px] font-semibold text-gray-500 uppercase">
                სერვისი
              </th>
              <th className="py-2 px-3 text-center text-[10px] font-semibold text-gray-500 uppercase w-16">
                რაოდ.
              </th>
              <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-500 uppercase w-24">
                ფასი
              </th>
              <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-500 uppercase w-24">
                თანხა
              </th>
              {!readOnly && (
                <th className="py-2 pl-3 pr-4 w-10" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="py-6 text-center">
                  <p className="text-xs text-gray-500 mb-2">სერვისები არ არის დამატებული</p>
                  {!readOnly && caseActions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={handleAutoPopulate}
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      შეავსეთ ქეისის ქმედებებიდან
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr key={index} className="group hover:bg-gray-50">
                  <td className="py-2 pr-3 pl-4">
                    {readOnly ? (
                      <span className="text-xs text-gray-700">{service.description}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input
                          value={service.description}
                          onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                          placeholder="სერვისის აღწერა..."
                          className="h-8 text-xs border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white"
                        />
                        {service.description && caseActions.some(a => 
                          service.description.includes(a.service_name)
                        ) && (
                          <Zap className="h-3 w-3 text-blue-500 flex-shrink-0" title="ავტომატურად შევსებული" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {readOnly ? (
                      <span className="text-xs text-gray-700">{service.quantity}</span>
                    ) : (
                      <Input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => handleUpdateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min={1}
                        className="h-8 text-xs text-center border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white w-full"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {readOnly ? (
                      <span className="text-xs text-gray-700">{service.unit_price}</span>
                    ) : (
                      <Input
                        type="number"
                        value={service.unit_price}
                        onChange={(e) => handleUpdateService(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min={0}
                        step="0.01"
                        className="h-8 text-xs text-right border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white w-full"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="text-xs font-medium text-gray-900">
                      {service.total?.toFixed(2)} {currencySymbol}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}

            {/* FRANCHISE ROW - Always visible as static row */}
            <tr className="bg-red-50 border-t border-red-100">
              <td className="py-2 pr-3 pl-4">
                <span className="text-xs font-medium text-red-700">ფრანჩიზა</span>
              </td>
              <td className="py-2 px-3 text-center">
                <span className="text-xs text-red-500">—</span>
              </td>
              <td className="py-2 px-3 text-right">
                <span className="text-xs text-red-500">−</span>
              </td>
              <td className="py-2 px-3 text-right">
                {readOnly ? (
                  <span className="text-xs font-medium text-red-600">
                    -{franchiseAmount?.toFixed(2) || '0.00'} {currencySymbol}
                  </span>
                ) : (
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-red-500 text-xs">-</span>
                    <Input
                      type="number"
                      value={franchiseAmount || ''}
                      onChange={(e) => onFranchiseChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      step="0.01"
                      className="h-8 w-20 text-xs text-right border-red-200 bg-white focus:border-red-400"
                    />
                    <span className="text-xs text-gray-500">{currencySymbol}</span>
                  </div>
                )}
              </td>
              {!readOnly && <td className="py-2 pl-3 pr-4" />}
            </tr>
          </tbody>
          
          {/* Total Footer */}
          <tfoot>
            {/* Subtotal */}
            <tr className="border-t border-gray-200">
              <td colSpan={readOnly ? 3 : 4} className="py-2 px-4 text-right">
                <span className="text-xs text-gray-600">ჯამი:</span>
              </td>
              <td className={cn('py-2 text-right', readOnly ? 'pr-4' : 'pr-3')}>
                <span className="text-xs font-medium text-gray-700">
                  {currencySymbol}{subtotal.toFixed(2)}
                </span>
              </td>
              {!readOnly && <td />}
            </tr>
            
            {/* Franchise Deduction (shown if > 0) */}
            {franchiseAmount > 0 && (
              <tr>
                <td colSpan={readOnly ? 3 : 4} className="py-1 px-4 text-right">
                  <span className="text-xs text-red-600">ფრანჩიზა:</span>
                </td>
                <td className={cn('py-1 text-right', readOnly ? 'pr-4' : 'pr-3')}>
                  <span className="text-xs font-medium text-red-600">
                    -{currencySymbol}{franchiseAmount.toFixed(2)}
                  </span>
                </td>
                {!readOnly && <td />}
              </tr>
            )}
            
            {/* Final Total */}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={readOnly ? 3 : 4} className="py-2.5 px-4 text-right">
                <span className="text-sm font-semibold text-gray-900">სულ გადასახდელი:</span>
              </td>
              <td className={cn('py-2.5 text-right', readOnly ? 'pr-4' : 'pr-3')}>
                <span className="text-lg font-bold text-blue-600">
                  {currencySymbol}{total.toFixed(2)}
                </span>
              </td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Help text for auto-populate */}
      {!readOnly && caseActions.length > 0 && services.length === 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          💡 დააჭირეთ &quot;ავტო-შევსება&quot; ქეისის ქმედებების იმპორტისთვის
        </p>
      )}
    </div>
  );
}
