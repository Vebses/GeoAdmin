'use client';

import { useState, useMemo } from 'react';
import { Search, Info, AlertTriangle, Building2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import type { CaseWithRelations, Partner, OurCompany, CurrencyCode } from '@/types';

// Currency symbol helper
const getCurrencySymbol = (currency: CurrencyCode | string): string => {
  const symbols: Record<string, string> = { GEL: '₾', EUR: '€', USD: '$' };
  return symbols[currency] || '€';
};

interface InvoiceStepCaseProps {
  cases: CaseWithRelations[];
  partners: Partner[];
  ourCompanies: OurCompany[];
  selectedCaseId: string | null;
  selectedRecipientId: string | null;
  selectedSenderId: string | null;
  onCaseChange: (caseId: string | null) => void;
  onRecipientChange: (recipientId: string | null) => void;
  onSenderChange: (senderId: string | null) => void;
  loading?: boolean;
}

export function InvoiceStepCase({
  cases,
  partners,
  ourCompanies,
  selectedCaseId,
  selectedRecipientId,
  selectedSenderId,
  onCaseChange,
  onRecipientChange,
  onSenderChange,
  loading = false,
}: InvoiceStepCaseProps) {
  const [caseSearch, setCaseSearch] = useState('');

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const selectedRecipient = partners.find((p) => p.id === selectedRecipientId);
  const selectedSender = ourCompanies.find((c) => c.id === selectedSenderId);

  // Filter cases by search
  const filteredCases = cases.filter((c) => {
    if (!caseSearch) return true;
    const search = caseSearch.toLowerCase();
    return (
      c.case_number.toLowerCase().includes(search) ||
      c.patient_name.toLowerCase().includes(search) ||
      c.patient_id?.toLowerCase().includes(search)
    );
  });

  // Get unique executor IDs from case actions - FILTER RECIPIENTS TO ONLY CASE-RELATED COMPANIES
  const caseExecutorIds = useMemo(() => {
    if (!selectedCase?.actions?.length) return new Set<string>();
    return new Set(selectedCase.actions.map((a) => a.executor_id).filter(Boolean));
  }, [selectedCase]);

  // Filter partners to only those that are executors in the selected case
  const availableRecipients = useMemo(() => {
    if (!selectedCaseId || caseExecutorIds.size === 0) {
      // No case selected or no actions - show all partners
      return partners;
    }
    // Only show partners that appear as executors in case actions
    return partners.filter((p) => caseExecutorIds.has(p.id));
  }, [partners, selectedCaseId, caseExecutorIds]);

  // Get services for selected recipient from case actions
  const servicesForRecipient = useMemo(() => {
    if (!selectedCase?.actions?.length || !selectedRecipientId) return [];
    return selectedCase.actions.filter((a) => a.executor_id === selectedRecipientId);
  }, [selectedCase, selectedRecipientId]);

  // Determine currency from actions
  const detectedCurrency = useMemo(() => {
    if (servicesForRecipient.length === 0) return null;
    // Use assistance_currency from first action, fallback to EUR
    return servicesForRecipient[0]?.assistance_currency || 
           servicesForRecipient[0]?.service_currency || 
           'EUR';
  }, [servicesForRecipient]);

  // Handle case change - reset recipient if they're not in new case
  const handleCaseChange = (caseId: string | null) => {
    onCaseChange(caseId);
    // Reset recipient selection when case changes
    onRecipientChange(null);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Info Banner */}
      <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">აირჩიეთ ქეისი, ადრესატი და გამგზავნი კომპანია.</p>
          <p className="text-blue-600 mt-0.5">
            სერვისები და თანხები ავტომატურად შეივსება არჩეული ქეისის ქმედებებიდან.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Left Column - Selections */}
        <div className="space-y-4">
          {/* Case Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              რომელ ქეისს ეხება ინვოისი? *
            </label>
            <Select
              value={selectedCaseId || '__none__'}
              onValueChange={(value) => handleCaseChange(value === '__none__' ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="აირჩიეთ ქეისი..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                    <Input
                      placeholder="ძიება..."
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
                <SelectItem value="__none__" className="text-xs text-gray-400">
                  -- აირჩიეთ ქეისი --
                </SelectItem>
                {filteredCases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">{caseItem.case_number}</span>
                      <span className="text-gray-500">•</span>
                      <span>{caseItem.patient_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Case Preview */}
          {selectedCase && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">{selectedCase.case_number}</span>
                <CaseStatusBadge status={selectedCase.status} size="xs" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-gray-400">პაციენტი</p>
                  <p className="text-gray-700">{selectedCase.patient_name}</p>
                </div>
                {selectedCase.patient_id && (
                  <div>
                    <p className="text-gray-400">პ/ნ</p>
                    <p className="text-gray-700">{selectedCase.patient_id}</p>
                  </div>
                )}
                {selectedCase.client && (
                  <div>
                    <p className="text-gray-400">დამკვეთი</p>
                    <p className="text-gray-700">{selectedCase.client.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400">ქმედებები</p>
                  <p className="text-gray-700">{selectedCase.actions?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Selection - FILTERED BY CASE ACTIONS */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              რომელ კომპანიას უგზავნით ინვოისს? *
            </label>
            <Select
              value={selectedRecipientId || '__none__'}
              onValueChange={(value) => onRecipientChange(value === '__none__' ? null : value)}
              disabled={!selectedCaseId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={selectedCaseId ? "აირჩიეთ ადრესატი..." : "ჯერ აირჩიეთ ქეისი"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-gray-400">
                  -- აირჩიეთ ადრესატი --
                </SelectItem>
                {availableRecipients.length === 0 && selectedCaseId ? (
                  <div className="px-2 py-3 text-xs text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>ამ ქეისს არ აქვს ქმედებები შემსრულებლებით</span>
                  </div>
                ) : (
                  availableRecipients.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id} className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium">{partner.name}</span>
                        {partner.legal_name && (
                          <span className="text-gray-400 text-[10px]">{partner.legal_name}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCaseId && availableRecipients.length > 0 && (
              <p className="text-[10px] text-gray-500">
                ნაჩვენებია მხოლოდ კომპანიები ქეისის ქმედებებიდან ({availableRecipients.length})
              </p>
            )}
          </div>

          {/* Sender Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              რომელი კომპანიით აგზავნით ინვოისს? *
            </label>
            <Select
              value={selectedSenderId || '__none__'}
              onValueChange={(value) => onSenderChange(value === '__none__' ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="აირჩიეთ გამგზავნი..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-gray-400">
                  -- აირჩიეთ გამგზავნი --
                </SelectItem>
                {ourCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{company.name}</span>
                      {company.legal_name && (
                        <span className="text-gray-400 text-[10px]">{company.legal_name}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          {/* Services Preview (Auto-populated) */}
          {selectedCase && selectedRecipientId && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-500" />
                სერვისები (ავტომატური)
              </h4>
              {servicesForRecipient.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {servicesForRecipient.map((action, i) => {
                    const cost = action.assistance_cost || action.service_cost || 0;
                    const currency = action.assistance_currency || action.service_currency || 'EUR';
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 bg-white"
                      >
                        <span className="text-xs text-gray-700">{action.service_name}</span>
                        <span className="text-xs font-medium text-gray-900">
                          {cost} {getCurrencySymbol(currency)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 font-medium">
                    <span className="text-xs text-gray-700">ჯამი</span>
                    <span className="text-xs text-blue-600">
                      {servicesForRecipient.reduce((s, a) => s + (a.assistance_cost || a.service_cost || 0), 0)} {getCurrencySymbol(detectedCurrency || 'EUR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>ამ ადრესატისთვის ქეისში ქმედებები არ მოიძებნა</span>
                </div>
              )}
              {detectedCurrency && (
                <p className="text-[10px] text-gray-500">
                  💱 ვალუტა: <span className="font-medium">{detectedCurrency}</span> (ქმედებებიდან)
                </p>
              )}
            </div>
          )}

          {/* Sender Company Preview */}
          {selectedSender && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-900">გამგზავნი კომპანია</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {selectedSender.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{selectedSender.legal_name || selectedSender.name}</p>
                    {selectedSender.id_code && (
                      <p className="text-[10px] text-gray-500">ს/კ: {selectedSender.id_code}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {selectedSender.bank_name && (
                    <div>
                      <p className="text-gray-400">ბანკი</p>
                      <p className="text-gray-700">{selectedSender.bank_name}</p>
                    </div>
                  )}
                  {selectedSender.bank_code && (
                    <div>
                      <p className="text-gray-400">კოდი</p>
                      <p className="text-gray-700">{selectedSender.bank_code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No selection state */}
          {!selectedCase && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Building2 className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">აირჩიეთ ქეისი სერვისების სანახავად</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
