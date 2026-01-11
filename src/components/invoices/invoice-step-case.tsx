'use client';

import { useState } from 'react';
import { Search, Info, FileText, Building2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseStatusBadge } from '@/components/cases/case-status-badge';
import { cn } from '@/lib/utils/cn';
import type { CaseWithRelations, Partner, OurCompany } from '@/types';

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
              onValueChange={(value) => onCaseChange(value === '__none__' ? null : value)}
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
                  <p className="text-gray-700">{selectedCase.actions_count || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              რომელ კომპანიას უგზავნით ინვოისს? *
            </label>
            <Select
              value={selectedRecipientId || '__none__'}
              onValueChange={(value) => onRecipientChange(value === '__none__' ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="აირჩიეთ ადრესატი..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-gray-400">
                  -- აირჩიეთ ადრესატი --
                </SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{partner.name}</span>
                      {partner.legal_name && (
                        <span className="text-gray-400 text-[10px]">{partner.legal_name}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <span className="text-gray-400 text-[10px]">{company.legal_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          {selectedCase && selectedRecipientId && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-900">
                სერვისები (ავტომატური)
              </h4>
              {(selectedCase.actions?.length || 0) > 0 ? (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {selectedCase.actions?.slice(0, 5).map((action) => (
                    <div key={action.id} className="p-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{action.service_name}</p>
                        <p className="text-[10px] text-gray-500">
                          {action.executor?.name || 'შემსრულებელი არ არის'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        €{(action.assistance_cost || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {(selectedCase.actions?.length || 0) > 5 && (
                    <div className="p-2 text-center text-[10px] text-gray-500">
                      +{(selectedCase.actions?.length || 0) - 5} სერვისი
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center">
                  <p className="text-xs text-gray-500">
                    ქეისს არ აქვს ქმედებები
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    სერვისები ხელით დაამატეთ შემდეგ ეტაპზე
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Summary Cards */}
          {(selectedRecipient || selectedSender) && (
            <div className="space-y-3">
              {selectedSender && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-medium mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    გამგზავნი
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedSender.name}</p>
                  <p className="text-xs text-gray-600">{selectedSender.legal_name}</p>
                </div>
              )}

              {selectedRecipient && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-1">
                    <User className="h-3.5 w-3.5" />
                    მიმღები
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedRecipient.name}</p>
                  {selectedRecipient.legal_name && (
                    <p className="text-xs text-gray-600">{selectedRecipient.legal_name}</p>
                  )}
                  {selectedRecipient.email && (
                    <p className="text-xs text-gray-500 mt-1">{selectedRecipient.email}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
