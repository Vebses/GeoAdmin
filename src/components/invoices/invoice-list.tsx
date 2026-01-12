'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  FileText,
  ChevronLeft, 
  ChevronRight,
  Copy,
  CheckCircle,
  Send,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import { ExportButton } from '@/components/shared/export-button';
import { InvoiceFilters, type InvoiceFiltersState } from './invoice-list-filters';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { InvoiceViewPanel } from './invoice-view-panel';
import { InvoiceEditPanel } from './invoice-edit-panel';
import { InvoiceCreateWizard } from './invoice-create-wizard';
import { InvoicePDFPreview } from './invoice-pdf-preview';
import { InvoiceSendDialog } from './invoice-send-dialog';
import { 
  useInvoices, 
  useCreateInvoice, 
  useUpdateInvoice, 
  useDeleteInvoice,
  useMarkInvoicePaid,
  useDuplicateInvoice
} from '@/hooks/use-invoices';
import { useCases } from '@/hooks/use-cases';
import { usePartners } from '@/hooks/use-partners';
import { useOurCompanies } from '@/hooks/use-our-companies';
import { useRealtimeInvoices } from '@/hooks/use-realtime';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { useDebounce } from '@/hooks/use-debounce';
import type { InvoiceWithRelations, InvoiceFormData, InvoiceStatus } from '@/types';

const ITEMS_PER_PAGE = 10;

export function InvoiceList() {
  // Panel states
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<InvoiceWithRelations | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<InvoiceWithRelations | null>(null);
  
  // Phase 8: PDF Preview & Send Dialog
  const [pdfPreviewInvoice, setPdfPreviewInvoice] = useState<InvoiceWithRelations | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<InvoiceWithRelations | null>(null);

  // Filters
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    status: null,
    sender_id: null,
    recipient_id: null,
    currency: null,
    search: '',
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  // Pagination
  const [page, setPage] = useState(1);

  // Data fetching
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    status: filters.status || undefined,
    sender_id: filters.sender_id || undefined,
    recipient_id: filters.recipient_id || undefined,
    currency: filters.currency || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });
  
  const { data: casesData } = useCases({ limit: 100 });
  const { data: partnersData } = usePartners({ limit: 100 });
  const { data: ourCompaniesData } = useOurCompanies();
  
  const cases = casesData?.data || [];
  const partners = partnersData?.data || [];
  const ourCompanies = ourCompaniesData || [];

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();
  const markPaidMutation = useMarkInvoicePaid();
  const duplicateMutation = useDuplicateInvoice();

  // Enable realtime updates
  useRealtimeInvoices();

  // Compute status counts
  const statusCounts = useMemo(() => {
    return {
      all: invoicesData?.total || 0,
      draft: 0,
      unpaid: 0,
      paid: 0,
      cancelled: 0,
    } as Record<InvoiceStatus | 'all', number>;
  }, [invoicesData]);

  // Handlers
  const handleCreate = () => {
    setIsCreateOpen(true);
  };

  const handleView = (invoice: InvoiceWithRelations) => {
    setViewingInvoice(invoice);
  };

  const handleEdit = (invoice: InvoiceWithRelations) => {
    setViewingInvoice(null);
    setEditingInvoice(invoice);
  };

  const handleSaveNew = async (data: InvoiceFormData) => {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
  };

  const handleSaveEdit = async (data: Partial<InvoiceFormData>) => {
    if (editingInvoice) {
      await updateMutation.mutateAsync({ id: editingInvoice.id, data });
      setEditingInvoice(null);
    }
  };

  const handleDelete = async () => {
    if (deleteInvoice) {
      await deleteMutation.mutateAsync(deleteInvoice.id);
      setDeleteInvoice(null);
      setViewingInvoice(null);
    }
  };

  const handleMarkPaid = async () => {
    if (markPaidInvoice) {
      await markPaidMutation.mutateAsync({ id: markPaidInvoice.id });
      setMarkPaidInvoice(null);
      setViewingInvoice(null);
    }
  };

  const handleDuplicate = async (invoice: InvoiceWithRelations) => {
    await duplicateMutation.mutateAsync(invoice.id);
    setViewingInvoice(null);
  };

  const handleFiltersChange = (newFilters: InvoiceFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const invoices = invoicesData?.data || [];
  const totalPages = Math.ceil((invoicesData?.total || 0) / ITEMS_PER_PAGE);

  if (invoicesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="bg-white rounded-xl border border-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          ინვოისების სია და მართვა
        </p>
        <div className="flex items-center gap-2">
          <ExportButton 
            entity="invoices" 
            filters={filters.status ? { status: filters.status } : undefined}
          />
          <Button size="sm" onClick={handleCreate}>
            <Plus size={14} className="mr-1" />
            ახალი ინვოისი
          </Button>
        </div>
      </div>

      {/* Filters */}
      <InvoiceFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        senders={ourCompanies}
        recipients={partners}
        statusCounts={statusCounts}
      />

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={FileText}
            title="ინვოისები არ მოიძებნა"
            description={filters.search || filters.status ? 'სცადეთ სხვა ფილტრები' : 'შექმენით პირველი ინვოისი'}
            action={
              !filters.search && !filters.status && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus size={14} className="mr-1" />
                  ახალი ინვოისი
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    ინვოისი #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    ქეისი
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    მიმღები
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    თანხა
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    თარიღი
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleView(invoice)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-blue-600">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {invoice.case?.case_number || '—'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {invoice.case?.patient_name || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700">
                        {invoice.recipient?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} size="xs" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-gray-900">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {formatDate(invoice.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleView(invoice)}
                        >
                          <Eye size={14} className="text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Edit2 size={14} className="text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDuplicate(invoice)}
                        >
                          <Copy size={14} className="text-gray-400" />
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setMarkPaidInvoice(invoice)}
                          >
                            <CheckCircle size={14} className="text-emerald-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setDeleteInvoice(invoice)}
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">
              ნაჩვენებია {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, invoicesData?.total || 0)} სულ {invoicesData?.total || 0}-დან
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Panel */}
      <InvoiceViewPanel
        invoice={viewingInvoice}
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        onEdit={handleEdit}
        onDelete={setDeleteInvoice}
        onDuplicate={handleDuplicate}
        onMarkPaid={setMarkPaidInvoice}
        onSend={setSendingInvoice}
        onPreviewPdf={setPdfPreviewInvoice}
      />

      {/* Edit Panel */}
      <InvoiceEditPanel
        invoice={editingInvoice}
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSave={handleSaveEdit}
        partners={partners}
        ourCompanies={ourCompanies}
        loading={updateMutation.isPending}
      />

      {/* Create Wizard */}
      <InvoiceCreateWizard
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveNew}
        cases={cases}
        partners={partners}
        ourCompanies={ourCompanies}
        loading={createMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        onConfirm={handleDelete}
        title="ინვოისის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteInvoice?.invoice_number}" ინვოისის წაშლა? ეს მოქმედება შეუქცევადია.`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      {/* Mark Paid Confirmation */}
      <ConfirmDialog
        isOpen={!!markPaidInvoice}
        onClose={() => setMarkPaidInvoice(null)}
        onConfirm={handleMarkPaid}
        title="გადახდილად მონიშვნა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${markPaidInvoice?.invoice_number}" ინვოისის გადახდილად მონიშვნა?`}
        confirmText="დადასტურება"
        cancelText="გაუქმება"
        variant="default"
        loading={markPaidMutation.isPending}
      />

      {/* PDF Preview */}
      {pdfPreviewInvoice && (
        <InvoicePDFPreview
          invoiceId={pdfPreviewInvoice.id}
          invoiceNumber={pdfPreviewInvoice.invoice_number}
          isOpen={!!pdfPreviewInvoice}
          onClose={() => setPdfPreviewInvoice(null)}
        />
      )}

      {/* Send Dialog */}
      {sendingInvoice && (
        <InvoiceSendDialog
          invoice={sendingInvoice}
          isOpen={!!sendingInvoice}
          onClose={() => setSendingInvoice(null)}
          onSent={() => {
            // Refetch invoices after send
            setSendingInvoice(null);
          }}
        />
      )}
    </div>
  );
}
