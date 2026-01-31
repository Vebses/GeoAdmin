'use client';

import { useState, useEffect } from 'react';
import { Calendar, Activity, Building2, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { getCaseActions } from '@/lib/api/case-actions';
import type { CaseWithRelations, CaseActionWithRelations } from '@/types';

interface ServicesTabProps {
  caseData: CaseWithRelations;
}

// Service card component
function ServiceCard({
  action,
  index
}: {
  action: CaseActionWithRelations;
  index: number;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Index badge */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
            {index}
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">{action.service_name}</h4>

            {action.service_description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{action.service_description}</p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {action.executor && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Building2 size={10} className="text-gray-400" />
                  {action.executor.name}
                </span>
              )}
              {action.service_date && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Calendar size={10} />
                  {formatDate(action.service_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-100">
        <CostDisplay
          label="სერვისი"
          amount={action.service_cost}
          currency={action.service_currency}
          color="blue"
        />
        <CostDisplay
          label="ასისტანსი"
          amount={action.assistance_cost}
          currency={action.assistance_currency}
          color="emerald"
        />
        <CostDisplay
          label="საკომისიო"
          amount={action.commission_cost}
          currency={action.commission_currency}
          color="purple"
        />
      </div>

      {action.comment && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">კომენტარი</p>
          <p className="text-xs text-gray-600">{action.comment}</p>
        </div>
      )}
    </div>
  );
}

// Cost display component
function CostDisplay({
  label,
  amount,
  currency,
  color
}: {
  label: string;
  amount: number | null;
  currency: string | null | undefined;
  color: 'blue' | 'emerald' | 'purple';
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600'
  };

  const bgClasses = {
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    purple: 'bg-purple-50'
  };

  return (
    <div className={`px-3 py-2 rounded-lg ${bgClasses[color]}`}>
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${colorClasses[color]}`}>
        {formatCurrency(amount || 0, (currency as 'GEL' | 'USD' | 'EUR') || 'GEL')}
      </p>
    </div>
  );
}

// Total item display - shows currency breakdown
function TotalItem({
  label,
  totals,
  color
}: {
  label: string;
  totals: { GEL: number; USD: number; EUR: number };
  color: 'blue' | 'emerald' | 'purple';
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600'
  };

  // Get non-zero currencies
  const currencies = (['GEL', 'USD', 'EUR'] as const).filter(c => totals[c] > 0);

  return (
    <div className="text-right">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <div className={`text-sm font-bold ${colorClasses[color]}`}>
        {currencies.length === 0 ? (
          <span>0</span>
        ) : currencies.length === 1 ? (
          <span>{formatCurrency(totals[currencies[0]], currencies[0])}</span>
        ) : (
          <div className="space-y-0.5">
            {currencies.map(c => (
              <div key={c} className="text-xs">
                {formatCurrency(totals[c], c)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Activity size={24} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">მოქმედებები არ არის</h3>
      <p className="text-xs text-gray-500">ამ ქეისში ჯერ არ დამატებულა მოქმედებები</p>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={24} className="text-blue-500 animate-spin mb-3" />
      <p className="text-xs text-gray-500">იტვირთება...</p>
    </div>
  );
}

export function ServicesTab({ caseData }: ServicesTabProps) {
  const [actions, setActions] = useState<CaseActionWithRelations[]>(caseData.actions || []);
  const [loading, setLoading] = useState(!caseData.actions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If actions are already loaded, don't fetch again
    if (caseData.actions && caseData.actions.length > 0) {
      setActions(caseData.actions);
      setLoading(false);
      return;
    }

    // Fetch actions if not loaded
    if (caseData.actions_count && caseData.actions_count > 0) {
      setLoading(true);
      getCaseActions(caseData.id)
        .then((result) => {
          // getCaseActions returns CaseActionWithRelations[] directly
          if (Array.isArray(result)) {
            setActions(result);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load actions');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [caseData.id, caseData.actions, caseData.actions_count]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return <EmptyState />;
  }

  // Calculate totals by currency
  const serviceTotals = { GEL: 0, USD: 0, EUR: 0 };
  const assistanceTotals = { GEL: 0, USD: 0, EUR: 0 };
  const commissionTotals = { GEL: 0, USD: 0, EUR: 0 };

  actions.forEach(action => {
    const serviceCurrency = (action.service_currency as 'GEL' | 'USD' | 'EUR') || 'GEL';
    const assistanceCurrency = (action.assistance_currency as 'GEL' | 'USD' | 'EUR') || 'GEL';
    const commissionCurrency = (action.commission_currency as 'GEL' | 'USD' | 'EUR') || 'GEL';

    serviceTotals[serviceCurrency] += action.service_cost || 0;
    assistanceTotals[assistanceCurrency] += action.assistance_cost || 0;
    commissionTotals[commissionCurrency] += action.commission_cost || 0;
  });

  return (
    <div className="space-y-4">
      {/* Services list */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <ServiceCard key={action.id} action={action} index={index + 1} />
        ))}
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-gray-200 bg-gray-50 -mx-6 px-6 py-4 -mb-4 rounded-b-lg">
        <span className="text-sm font-semibold text-gray-700">სულ ჯამი:</span>
        <div className="flex items-center gap-8">
          <TotalItem
            label="სერვისი"
            totals={serviceTotals}
            color="blue"
          />
          <TotalItem
            label="ასისტანსი"
            totals={assistanceTotals}
            color="emerald"
          />
          <TotalItem
            label="საკომისიო"
            totals={commissionTotals}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}
