'use client';

import { 
  User, 
  Briefcase, 
  Calendar, 
  Phone, 
  Mail, 
  Hash, 
  Building2, 
  Shield,
  Stethoscope,
  FileBox,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CaseStatusBadge } from './case-status-badge';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { CaseWithRelations } from '@/types';

interface CaseViewPanelProps {
  caseData: CaseWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (caseData: CaseWithRelations) => void;
  onDelete?: (caseData: CaseWithRelations) => void;
}

export function CaseViewPanel({ 
  caseData, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: CaseViewPanelProps) {
  if (!caseData) return null;

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={caseData.case_number}
      subtitle={caseData.patient_name}
      width="xl"
    >
      <div className="space-y-5">
        {/* Status Bar */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
          <CaseStatusBadge status={caseData.status} />
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs text-gray-500">
            გახსნილი: <span className="text-gray-700">{formatDate(caseData.opened_at)}</span>
          </span>
          {caseData.closed_at && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs text-gray-500">
                დახურული: <span className="text-gray-700">{formatDate(caseData.closed_at)}</span>
              </span>
            </>
          )}
          <div className="h-4 w-px bg-gray-200" />
          <span className="flex items-center gap-1 text-xs text-gray-600">
            {caseData.is_medical ? (
              <><Stethoscope size={12} className="text-blue-500" /> სამედიცინო</>
            ) : (
              <><FileBox size={12} className="text-gray-400" /> არასამედიცინო</>
            )}
          </span>
          {caseData.is_documented && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded">
                <CheckCircle2 size={10} /> დოკუმენტირებული
              </span>
            </>
          )}
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patient Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
              <User size={12} className="text-gray-400" />
              პაციენტის მონაცემები
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">სრული სახელი</p>
                <p className="text-xs font-medium text-gray-900">{caseData.patient_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {caseData.patient_dob && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">დაბადების თარიღი</p>
                    <p className="text-xs text-gray-700">{formatDate(caseData.patient_dob)}</p>
                  </div>
                )}
                {caseData.patient_id && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">პირადი ნომერი</p>
                    <p className="text-xs text-gray-700">{caseData.patient_id}</p>
                  </div>
                )}
              </div>
              {(caseData.patient_phone || caseData.patient_email) && (
                <div className="grid grid-cols-2 gap-2">
                  {caseData.patient_phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={10} className="text-gray-400" />
                      {caseData.patient_phone}
                    </div>
                  )}
                  {caseData.patient_email && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Mail size={10} className="text-gray-400" />
                      {caseData.patient_email}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Case Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
              <Briefcase size={12} className="text-gray-400" />
              ქეისის დეტალები
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              {caseData.client && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">დამკვეთი</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-900">
                    <Building2 size={10} className="text-gray-400" />
                    {caseData.client.name}
                  </div>
                </div>
              )}
              {caseData.insurance && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">სადაზღვევო</p>
                  <div className="flex items-center gap-1 text-xs text-gray-700">
                    <Shield size={10} className="text-gray-400" />
                    {caseData.insurance.name}
                    {caseData.insurance_policy_number && (
                      <span className="text-gray-400">({caseData.insurance_policy_number})</span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">ასისტანტი</p>
                <p className="text-xs text-gray-700">
                  {caseData.assigned_user?.full_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">პრიორიტეტი</p>
                <Badge variant={
                  caseData.priority === 'urgent' ? 'danger' :
                  caseData.priority === 'high' ? 'warning' :
                  'secondary'
                } className="text-[10px] capitalize">
                  {caseData.priority === 'low' ? 'დაბალი' :
                   caseData.priority === 'normal' ? 'ჩვეულებრივი' :
                   caseData.priority === 'high' ? 'მაღალი' : 'სასწრაფო'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Info */}
        {caseData.is_medical && (caseData.complaints || caseData.needs || caseData.diagnosis) && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
              <FileText size={12} className="text-gray-400" />
              სამედიცინო ინფორმაცია
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {caseData.complaints && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">ჩივილები</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{caseData.complaints}</p>
                </div>
              )}
              {caseData.needs && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">საჭიროება</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{caseData.needs}</p>
                </div>
              )}
              {caseData.diagnosis && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">დიაგნოზი</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{caseData.diagnosis}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-900">შეჯამება</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(caseData.total_service_cost, 'GEL')}
              </p>
              <p className="text-[10px] text-gray-500">სერვისი</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(caseData.total_assistance_cost, 'GEL')}
              </p>
              <p className="text-[10px] text-gray-500">ასისტანსი</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(caseData.total_commission_cost, 'GEL')}
              </p>
              <p className="text-[10px] text-gray-500">საკომისიო</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                <span>{caseData.actions_count || 0} ქმედება</span>
                <span>{caseData.documents_count || 0} დოკ.</span>
                <span>{caseData.invoices_count || 0} ინვ.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(caseData)}
              >
                <Edit2 size={14} className="mr-1" />
                რედაქტირება
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(caseData)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
