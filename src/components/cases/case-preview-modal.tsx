'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  X,
  Briefcase,
  Calendar,
  Stethoscope,
  FileBox,
  CheckCircle2,
  Edit2,
  Trash2,
  Activity,
  FileText,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CaseStatusBadge } from './case-status-badge';
import { OverviewTab } from './case-preview/overview-tab';
import { ServicesTab } from './case-preview/services-tab';
import { DocumentsTab } from './case-preview/documents-tab';
import { InvoicesTab } from './case-preview/invoices-tab';
import { formatDate } from '@/lib/utils/format';
import type { CaseWithRelations } from '@/types';

interface CasePreviewModalProps {
  caseData: CaseWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (caseData: CaseWithRelations) => void;
  onDelete?: (caseData: CaseWithRelations) => void;
}

const priorityLabels: Record<string, string> = {
  low: 'დაბალი',
  normal: 'ჩვეულებრივი',
  high: 'მაღალი',
  urgent: 'სასწრაფო'
};

const priorityVariants: Record<string, 'secondary' | 'warning' | 'danger'> = {
  low: 'secondary',
  normal: 'secondary',
  high: 'warning',
  urgent: 'danger'
};

// Custom dialog content without built-in close button
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    {/* Backdrop with blur */}
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
        'data-[state=open]:animate-backdrop-enter data-[state=closed]:animate-backdrop-exit'
      )}
    />
    {/* Modal content - positioned from right */}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed right-4 top-4 bottom-4 z-50 w-full max-w-4xl',
        'bg-white rounded-2xl shadow-2xl border border-gray-100',
        'flex flex-col overflow-hidden',
        'data-[state=open]:animate-modal-enter data-[state=closed]:animate-modal-exit',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = 'ModalContent';

export function CasePreviewModal({
  caseData,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: CasePreviewModalProps) {
  if (!caseData) return null;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100',
    in_progress: 'bg-blue-100',
    paused: 'bg-yellow-100',
    delayed: 'bg-orange-100',
    completed: 'bg-emerald-100',
    cancelled: 'bg-red-100'
  };

  const statusIconColors: Record<string, string> = {
    draft: 'text-gray-500',
    in_progress: 'text-blue-600',
    paused: 'text-yellow-600',
    delayed: 'text-orange-600',
    completed: 'text-emerald-600',
    cancelled: 'text-red-600'
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {/* Case Icon */}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              statusColors[caseData.status] || 'bg-gray-100'
            )}>
              <Briefcase
                className={cn(
                  'w-6 h-6',
                  statusIconColors[caseData.status] || 'text-gray-500'
                )}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{caseData.case_number}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{caseData.patient_name}</p>
            </div>
          </div>

          {/* Right side: Status + Close */}
          <div className="flex items-center gap-3">
            <CaseStatusBadge status={caseData.status} />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 -mr-2"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex-wrap">
          {/* Date info */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar size={12} className="text-gray-400" />
            <span>გახსნილი: <span className="font-medium text-gray-700">{formatDate(caseData.opened_at)}</span></span>
            {caseData.closed_at && (
              <>
                <span className="text-gray-300 mx-1">|</span>
                <span>დახურული: <span className="font-medium text-gray-700">{formatDate(caseData.closed_at)}</span></span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Type badges */}
          <div className="flex items-center gap-2">
            {caseData.is_medical ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full">
                <Stethoscope size={10} /> სამედიცინო
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                <FileBox size={10} /> არასამედიცინო
              </span>
            )}
            {caseData.is_documented && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-full">
                <CheckCircle2 size={10} /> დოკუმენტირებული
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Priority */}
          <Badge
            variant={priorityVariants[caseData.priority] || 'secondary'}
            className="text-[10px]"
          >
            {priorityLabels[caseData.priority] || caseData.priority}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5">
                მიმოხილვა
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5">
                <Activity size={12} />
                სერვისები
                {(caseData.actions_count || 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded-full">
                    {caseData.actions_count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5">
                <FileText size={12} />
                დოკუმენტები
                {(caseData.documents_count || 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-medium rounded-full">
                    {caseData.documents_count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-1.5">
                <Receipt size={12} />
                ინვოისები
                {(caseData.invoices_count || 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-medium rounded-full">
                    {caseData.invoices_count}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="mt-0 animate-content-show">
              <OverviewTab caseData={caseData} />
            </TabsContent>
            <TabsContent value="services" className="mt-0 animate-content-show">
              <ServicesTab caseData={caseData} />
            </TabsContent>
            <TabsContent value="documents" className="mt-0 animate-content-show">
              <DocumentsTab caseData={caseData} />
            </TabsContent>
            <TabsContent value="invoices" className="mt-0 animate-content-show">
              <InvoicesTab caseData={caseData} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        {(onEdit || onDelete) && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              შექმნილი: {caseData.creator?.full_name || '—'}
            </p>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(caseData)}
                >
                  <Edit2 size={14} className="mr-1.5" />
                  რედაქტირება
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                  onClick={() => onDelete(caseData)}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        )}
      </ModalContent>
    </DialogPrimitive.Root>
  );
}
