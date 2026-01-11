'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Save, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceStepCase } from './invoice-step-case';
import { InvoiceStepDetails } from './invoice-step-details';
import { cn } from '@/lib/utils/cn';
import type { 
  CaseWithRelations, 
  Partner, 
  OurCompany, 
  CurrencyCode, 
  InvoiceLanguage,
  InvoiceServiceFormData,
  InvoiceFormData
} from '@/types';

interface InvoiceCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InvoiceFormData) => Promise<void>;
  cases: CaseWithRelations[];
  partners: Partner[];
  ourCompanies: OurCompany[];
  loading?: boolean;
}

export function InvoiceCreateWizard({
  isOpen,
  onClose,
  onSave,
  cases,
  partners,
  ourCompanies,
  loading = false,
}: InvoiceCreateWizardProps) {
  const [step, setStep] = useState(1);
  
  // Step 1 state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  
  // Step 2 state
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [language, setLanguage] = useState<InvoiceLanguage>('en');
  const [franchiseAmount, setFranchiseAmount] = useState<number>(0);
  const [services, setServices] = useState<InvoiceServiceFormData[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachPatientDocs, setAttachPatientDocs] = useState(false);
  const [attachOriginalDocs, setAttachOriginalDocs] = useState(false);
  const [attachMedicalDocs, setAttachMedicalDocs] = useState(false);
  const [notes, setNotes] = useState('');

  // Selected entities
  const selectedCase = useMemo(() => 
    cases.find((c) => c.id === selectedCaseId) || null, 
    [cases, selectedCaseId]
  );
  const selectedRecipient = useMemo(() => 
    partners.find((p) => p.id === selectedRecipientId) || null, 
    [partners, selectedRecipientId]
  );
  const selectedSender = useMemo(() => 
    ourCompanies.find((c) => c.id === selectedSenderId) || null, 
    [ourCompanies, selectedSenderId]
  );

  // Get relevant actions for selected recipient
  const relevantActions = useMemo(() => {
    if (!selectedCase?.actions?.length || !selectedRecipientId) return [];
    return selectedCase.actions.filter((a) => a.executor_id === selectedRecipientId);
  }, [selectedCase, selectedRecipientId]);

  // Detect currency from relevant actions - use commission_currency
  const detectedCurrency = useMemo((): CurrencyCode => {
    if (relevantActions.length === 0) return 'EUR';
    const firstAction = relevantActions[0];
    // Use commission_currency (საკომისიო), default to EUR
    return (firstAction.commission_currency || 'EUR') as CurrencyCode;
  }, [relevantActions]);

  // Set default sender if there's only one company or a default company
  useEffect(() => {
    if (ourCompanies.length === 1 && !selectedSenderId) {
      setSelectedSenderId(ourCompanies[0].id);
    }
    const defaultCompany = ourCompanies.find((c) => c.is_default);
    if (defaultCompany && !selectedSenderId) {
      setSelectedSenderId(defaultCompany.id);
    }
  }, [ourCompanies, selectedSenderId]);

  // Pre-fill recipient email when recipient changes
  useEffect(() => {
    if (selectedRecipient?.email) {
      setRecipientEmail(selectedRecipient.email);
    }
  }, [selectedRecipient]);

  // Auto-set currency when recipient changes (from actions)
  useEffect(() => {
    if (selectedRecipientId && detectedCurrency) {
      setCurrency(detectedCurrency);
    }
  }, [selectedRecipientId, detectedCurrency]);

  // Auto-populate services when moving to step 2 or when recipient changes
  useEffect(() => {
    if (step === 2 && relevantActions.length > 0 && services.length === 0) {
      const newServices: InvoiceServiceFormData[] = relevantActions.map((action) => {
        // Use commission_cost (საკომისიო) for invoice pricing
        const unitPrice = action.commission_cost || 0;
        
        // Combine service name and description
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
      
      setServices(newServices);
    }
  }, [step, relevantActions, services.length]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedCaseId(null);
      setSelectedRecipientId(null);
      setSelectedSenderId(null);
      setCurrency('EUR');
      setLanguage('en');
      setFranchiseAmount(0);
      setServices([]);
      setRecipientEmail('');
      setEmailSubject('');
      setEmailBody('');
      setAttachPatientDocs(false);
      setAttachOriginalDocs(false);
      setAttachMedicalDocs(false);
      setNotes('');
    }
  }, [isOpen]);

  // Reset services when case or recipient changes
  const handleRecipientChange = (recipientId: string | null) => {
    setSelectedRecipientId(recipientId);
    setServices([]); // Reset services to trigger re-population
  };

  const canProceedToStep2 = selectedCaseId && selectedRecipientId && selectedSenderId;
  const canSave = canProceedToStep2 && services.length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    const data: InvoiceFormData = {
      case_id: selectedCaseId!,
      recipient_id: selectedRecipientId!,
      sender_id: selectedSenderId!,
      status: 'draft',
      currency,
      franchise_amount: franchiseAmount,
      franchise_type: 'fixed',
      franchise_value: franchiseAmount,
      language,
      recipient_email: recipientEmail || null,
      cc_emails: [],
      email_subject: emailSubject || null,
      email_body: emailBody || null,
      attach_patient_docs: attachPatientDocs,
      attach_original_docs: attachOriginalDocs,
      attach_medical_docs: attachMedicalDocs,
      notes: notes || null,
      services,
    };

    await onSave(data);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-5xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ახალი ინვოისი</h2>
              <p className="text-xs text-gray-500">
                ნაბიჯი {step}: {step === 1 ? 'აირჩიეთ ქეისი და კომპანიები' : 'ინვოისის დეტალები'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            )}>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              ქეისი & კომპანიები
            </div>
            <div className="w-8 h-px bg-gray-200" />
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            )}>
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              )}>2</span>
              დეტალები & სერვისები
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <InvoiceStepCase
              cases={cases}
              partners={partners}
              ourCompanies={ourCompanies}
              selectedCaseId={selectedCaseId}
              selectedRecipientId={selectedRecipientId}
              selectedSenderId={selectedSenderId}
              onCaseChange={setSelectedCaseId}
              onRecipientChange={handleRecipientChange}
              onSenderChange={setSelectedSenderId}
            />
          ) : (
            <InvoiceStepDetails
              currency={currency}
              language={language}
              franchiseAmount={franchiseAmount}
              services={services}
              recipientEmail={recipientEmail}
              emailSubject={emailSubject}
              emailBody={emailBody}
              attachPatientDocs={attachPatientDocs}
              attachOriginalDocs={attachOriginalDocs}
              attachMedicalDocs={attachMedicalDocs}
              notes={notes}
              caseActions={selectedCase?.actions || []}
              recipientId={selectedRecipientId || undefined}
              // Pass entities for live preview
              selectedCase={selectedCase}
              selectedRecipient={selectedRecipient}
              selectedSender={selectedSender}
              // Callbacks
              onCurrencyChange={setCurrency}
              onLanguageChange={setLanguage}
              onFranchiseAmountChange={setFranchiseAmount}
              onServicesChange={setServices}
              onRecipientEmailChange={setRecipientEmail}
              onEmailSubjectChange={setEmailSubject}
              onEmailBodyChange={setEmailBody}
              onAttachPatientDocsChange={setAttachPatientDocs}
              onAttachOriginalDocsChange={setAttachOriginalDocs}
              onAttachMedicalDocsChange={setAttachMedicalDocs}
              onNotesChange={setNotes}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div>
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                უკან
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              გაუქმება
            </Button>
            {step === 1 ? (
              <Button
                size="sm"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
              >
                გაგრძელება
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!canSave || loading}
              >
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'ინახება...' : 'შენახვა'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
