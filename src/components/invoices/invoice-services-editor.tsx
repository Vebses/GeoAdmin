'use client';

import { Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceServiceRow } from './invoice-service-row';
import { cn } from '@/lib/utils/cn';
import type { InvoiceServiceFormData, CurrencyCode, CaseActionWithRelations } from '@/types';

interface InvoiceServicesEditorProps {
  services: InvoiceServiceFormData[];
  onChange: (services: InvoiceServiceFormData[]) => void;
  currency: CurrencyCode;
  caseActions?: CaseActionWithRelations[];
  recipientId?: string;
  readOnly?: boolean;
}

export function InvoiceServicesEditor({
  services,
  onChange,
  currency,
  caseActions = [],
  recipientId,
  readOnly = false,
}: InvoiceServicesEditorProps) {
  const handleAddService = () => {
    const newService: InvoiceServiceFormData = {
      name: '',
      description: null,
      quantity: 1,
      unit_price: 0,
      amount: 0,
    };
    onChange([...services, newService]);
  };

  const handleUpdateService = (index: number, data: Partial<InvoiceServiceFormData>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...data };
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

    if (!relevantActions.length) {
      // If no actions for this recipient, use all actions
      const allServices = caseActions.map((action) => {
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

        return {
          name: action.service_name,
          description: action.service_description || null,
          quantity: 1,
          unit_price: unitPrice,
          amount: unitPrice,
        };
      });
      onChange(allServices);
      return;
    }

    const newServices = relevantActions.map((action) => {
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

      return {
        name: action.service_name,
        description: action.service_description || null,
        quantity: 1,
        unit_price: unitPrice,
        amount: unitPrice,
      };
    });

    onChange(newServices);
  };

  const subtotal = services.reduce((sum, s) => sum + (s.amount || 0), 0);

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
      {services.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-8 text-center">
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
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2 pr-3 pl-4 text-left text-[10px] font-semibold text-gray-500 uppercase">
                  სერვისი
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-gray-500 uppercase w-20">
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
              {services.map((service, index) => (
                <InvoiceServiceRow
                  key={index}
                  service={service}
                  index={index}
                  onChange={handleUpdateService}
                  onRemove={handleRemoveService}
                  readOnly={readOnly}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={readOnly ? 3 : 4} className="py-2 px-4 text-right">
                  <span className="text-xs font-semibold text-gray-700">სულ:</span>
                </td>
                <td className={cn('py-2 text-right', readOnly ? 'pr-4' : 'pr-3')}>
                  <span className="text-sm font-bold text-gray-900">
                    {currencySymbol}{subtotal.toFixed(2)}
                  </span>
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Help text for auto-populate */}
      {!readOnly && caseActions.length > 0 && services.length === 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          💡 დააჭირეთ "ავტო-შევსება" ქეისის ქმედებების იმპორტისთვის
        </p>
      )}
    </div>
  );
}
