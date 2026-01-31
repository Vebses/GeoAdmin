'use client';

import {
  User,
  Briefcase,
  Phone,
  Mail,
  Building2,
  Shield,
  FileText,
  Activity,
  Receipt
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { CaseWithRelations } from '@/types';

interface OverviewTabProps {
  caseData: CaseWithRelations;
}

// Info card wrapper
function InfoCard({
  icon: Icon,
  title,
  children,
  className
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
        <Icon size={12} className="text-gray-400" />
        {title}
      </h3>
      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        {children}
      </div>
    </div>
  );
}

// Data row component
function DataRow({
  label,
  value,
  icon: Icon,
  bold = false
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ElementType;
  bold?: boolean;
}) {
  if (!value) return null;

  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-gray-400 flex-shrink-0" />}
        <p className={`text-sm ${bold ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Multi-currency stat card component
function MultiCurrencyStatCard({
  label,
  totals,
  color,
  highlight = false
}: {
  label: string;
  totals: { GEL: number; USD: number; EUR: number };
  color: 'blue' | 'emerald' | 'purple' | 'gray';
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: highlight ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
  };

  const currencies = (['GEL', 'USD', 'EUR'] as const).filter(c => totals[c] > 0);
  const hasValue = currencies.length > 0;

  return (
    <div className={`p-4 rounded-xl text-center transition-transform hover:scale-[1.02] ${colorClasses[color]}`}>
      <div className="font-bold">
        {!hasValue ? (
          <span className="text-xl">0</span>
        ) : currencies.length === 1 ? (
          <span className="text-xl">{formatCurrency(totals[currencies[0]], currencies[0])}</span>
        ) : (
          <div className="space-y-0.5">
            {currencies.map(c => (
              <div key={c} className="text-sm">
                {formatCurrency(totals[c], c)}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className={`text-[10px] mt-1 ${color === 'gray' && highlight ? 'text-gray-400' : 'opacity-70'}`}>
        {label}
      </p>
    </div>
  );
}

// Count badge component
function CountBadge({
  icon: Icon,
  count,
  label
}: {
  icon: React.ElementType;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
        <Icon size={12} className="text-gray-500" />
      </div>
      <span>
        <span className="font-medium text-gray-700">{count}</span> {label}
      </span>
    </div>
  );
}

export function OverviewTab({ caseData }: OverviewTabProps) {
  // Calculate multi-currency totals from actions
  const serviceTotals = { GEL: 0, USD: 0, EUR: 0 };
  const assistanceTotals = { GEL: 0, USD: 0, EUR: 0 };
  const commissionTotals = { GEL: 0, USD: 0, EUR: 0 };
  const grandTotals = { GEL: 0, USD: 0, EUR: 0 };

  if (caseData.actions && caseData.actions.length > 0) {
    caseData.actions.forEach(action => {
      // Service costs
      const serviceCurrency = (action.service_currency || 'GEL') as 'GEL' | 'USD' | 'EUR';
      serviceTotals[serviceCurrency] += action.service_cost || 0;
      grandTotals[serviceCurrency] += action.service_cost || 0;

      // Assistance costs
      const assistanceCurrency = (action.assistance_currency || 'GEL') as 'GEL' | 'USD' | 'EUR';
      assistanceTotals[assistanceCurrency] += action.assistance_cost || 0;
      grandTotals[assistanceCurrency] += action.assistance_cost || 0;

      // Commission costs
      const commissionCurrency = (action.commission_currency || 'GEL') as 'GEL' | 'USD' | 'EUR';
      commissionTotals[commissionCurrency] += action.commission_cost || 0;
      grandTotals[commissionCurrency] += action.commission_cost || 0;
    });
  } else {
    // Fallback to case totals (assume GEL for backwards compatibility)
    serviceTotals.GEL = caseData.total_service_cost || 0;
    assistanceTotals.GEL = caseData.total_assistance_cost || 0;
    commissionTotals.GEL = caseData.total_commission_cost || 0;
    grandTotals.GEL = (caseData.total_service_cost || 0) +
      (caseData.total_assistance_cost || 0) +
      (caseData.total_commission_cost || 0);
  }

  return (
    <div className="space-y-6">
      {/* Two-column grid: Patient Info + Case Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Patient Info */}
        <InfoCard icon={User} title="პაციენტის მონაცემები">
          <DataRow label="სრული სახელი" value={caseData.patient_name} bold />

          <div className="grid grid-cols-2 gap-3">
            <DataRow label="პირადი ნომერი" value={caseData.patient_id} />
            <DataRow label="დაბადების თარიღი" value={caseData.patient_dob ? formatDate(caseData.patient_dob) : null} />
          </div>

          {(caseData.patient_phone || caseData.patient_email) && (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              {caseData.patient_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={12} className="text-gray-400" />
                  <a href={`tel:${caseData.patient_phone}`} className="hover:text-blue-600 transition-colors">
                    {caseData.patient_phone}
                  </a>
                </div>
              )}
              {caseData.patient_email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={12} className="text-gray-400" />
                  <a href={`mailto:${caseData.patient_email}`} className="hover:text-blue-600 transition-colors">
                    {caseData.patient_email}
                  </a>
                </div>
              )}
            </div>
          )}
        </InfoCard>

        {/* Case Details */}
        <InfoCard icon={Briefcase} title="ქეისის დეტალები">
          {caseData.client && (
            <DataRow label="დამკვეთი" value={caseData.client.name} icon={Building2} bold />
          )}

          {caseData.insurance && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">სადაზღვევო</p>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{caseData.insurance.name}</span>
                {caseData.insurance_policy_number && (
                  <span className="text-xs text-gray-400 ml-1">({caseData.insurance_policy_number})</span>
                )}
              </div>
            </div>
          )}

          <DataRow label="ასისტანტი" value={caseData.assigned_user?.full_name || '—'} />

          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">პრიორიტეტი</p>
            <Badge
              variant={
                caseData.priority === 'urgent' ? 'danger' :
                caseData.priority === 'high' ? 'warning' :
                'secondary'
              }
              className="text-[10px]"
            >
              {caseData.priority === 'low' ? 'დაბალი' :
               caseData.priority === 'normal' ? 'ჩვეულებრივი' :
               caseData.priority === 'high' ? 'მაღალი' : 'სასწრაფო'}
            </Badge>
          </div>
        </InfoCard>
      </div>

      {/* Medical Info */}
      {caseData.is_medical && (caseData.complaints || caseData.needs || caseData.diagnosis) && (
        <InfoCard icon={FileText} title="სამედიცინო ინფორმაცია">
          <div className="grid grid-cols-3 gap-4">
            {caseData.complaints && (
              <div className="p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">ჩივილები</p>
                <p className="text-xs text-gray-700 leading-relaxed">{caseData.complaints}</p>
              </div>
            )}
            {caseData.needs && (
              <div className="p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">საჭიროება</p>
                <p className="text-xs text-gray-700 leading-relaxed">{caseData.needs}</p>
              </div>
            )}
            {caseData.diagnosis && (
              <div className="p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">დიაგნოზი</p>
                <p className="text-xs text-gray-700 leading-relaxed">{caseData.diagnosis}</p>
              </div>
            )}
          </div>

          {caseData.treatment_notes && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">მკურნალობის ჩანაწერები</p>
              <p className="text-xs text-gray-700 leading-relaxed">{caseData.treatment_notes}</p>
            </div>
          )}
        </InfoCard>
      )}

      {/* Financial Summary */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-3">ფინანსური შეჯამება</h3>
        <div className="grid grid-cols-4 gap-3">
          <MultiCurrencyStatCard
            label="სერვისი"
            totals={serviceTotals}
            color="blue"
          />
          <MultiCurrencyStatCard
            label="ასისტანსი"
            totals={assistanceTotals}
            color="emerald"
          />
          <MultiCurrencyStatCard
            label="საკომისიო"
            totals={commissionTotals}
            color="purple"
          />
          <MultiCurrencyStatCard
            label="სულ"
            totals={grandTotals}
            color="gray"
            highlight
          />
        </div>
      </div>

      {/* Quick counts */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
        <CountBadge icon={Activity} count={caseData.actions_count || 0} label="მოქმედება" />
        <CountBadge icon={FileText} count={caseData.documents_count || 0} label="დოკუმენტი" />
        <CountBadge icon={Receipt} count={caseData.invoices_count || 0} label="ინვოისი" />
      </div>
    </div>
  );
}
