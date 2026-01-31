'use client';

import { useState, useMemo } from 'react';
import { Plus, Eye, Edit2, Trash2, Briefcase, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import { ExportButton } from '@/components/shared/export-button';
import { CaseFilters, type CaseFiltersState } from './case-filters';
import { CaseStatusBadge } from './case-status-badge';
import { CasePreviewModal } from './case-preview-modal';
import { CaseEditPanel } from './case-edit-panel';
import { 
  useCases, 
  useCreateCase, 
  useUpdateCase, 
  useDeleteCase 
} from '@/hooks/use-cases';
import { usePartners } from '@/hooks/use-partners';
import { useUsers } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeCases } from '@/hooks/use-realtime';
import { formatDate } from '@/lib/utils/format';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CaseWithRelations, CaseFormData, CaseStatus } from '@/types';

const ITEMS_PER_PAGE = 10;

export function CaseList() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isAssistant = currentUser?.role === 'assistant';

  // DEBUG: Remove after fixing
  console.log('[CaseList Debug]', {
    userId: currentUser?.id,
    role: currentUser?.role,
    isManager,
    isAssistant,
    authLoading,
    roleCheck: {
      isManagerRole: currentUser?.role === 'manager',
      isAdminRole: currentUser?.role === 'admin',
      isSuperAdminRole: currentUser?.role === 'super_admin',
    }
  });

  // Panel states
  const [viewingCase, setViewingCase] = useState<CaseWithRelations | null>(null);
  const [editingCase, setEditingCase] = useState<CaseWithRelations | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteCase, setDeleteCase] = useState<CaseWithRelations | null>(null);

  // View mode for assistants: 'my' (default) or 'all'
  const [viewMode, setViewMode] = useState<'my' | 'all'>(isAssistant ? 'my' : 'all');

  // Filters
  const [filters, setFilters] = useState<CaseFiltersState>({
    status: null,
    assigned_to: null,
    client_id: null,
    search: '',
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  // Pagination
  const [page, setPage] = useState(1);

  // Data fetching - include my_cases filter for assistants
  const { data: casesData, isLoading: casesLoading } = useCases({
    status: filters.status || undefined,
    assigned_to: filters.assigned_to || undefined,
    client_id: filters.client_id || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: ITEMS_PER_PAGE,
    my_cases: isAssistant && viewMode === 'my' ? true : undefined,
  });
  const { data: partnersData } = usePartners({});
  const { data: users = [] } = useUsers();
  
  const partners = partnersData?.data || [];

  const createMutation = useCreateCase();
  const updateMutation = useUpdateCase();
  const deleteMutation = useDeleteCase();

  // Enable realtime updates
  useRealtimeCases();

  // Compute status counts
  const statusCounts = useMemo(() => {
    return {
      all: casesData?.total || 0,
      draft: 0,
      in_progress: 0,
      paused: 0,
      delayed: 0,
      completed: 0,
      cancelled: 0,
    } as Record<CaseStatus | 'all', number>;
  }, [casesData]);

  // Permission helpers
  const canEditCase = (caseItem: CaseWithRelations | null): boolean => {
    if (!caseItem) return false;
    if (isManager) return true;
    // Case creator can edit their own cases
    if (caseItem.created_by === currentUser?.id) return true;
    // Assigned assistant can edit
    if (isAssistant && caseItem.assigned_to === currentUser?.id) return true;
    return false;
  };

  const canDeleteCase = (caseItem: CaseWithRelations | null): boolean => {
    if (!caseItem) return false;
    if (isManager) return true;
    // Case creator can delete their own cases
    if (caseItem.created_by === currentUser?.id) return true;
    return false;
  };

  // Handlers
  const handleCreate = () => {
    setEditingCase(null);
    setIsCreateOpen(true);
  };

  const handleView = (caseItem: CaseWithRelations) => {
    setViewingCase(caseItem);
  };

  const handleEdit = (caseItem: CaseWithRelations) => {
    if (!canEditCase(caseItem)) {
      toast.error('თქვენ არ გაქვთ ამ ქეისის რედაქტირების უფლება');
      return;
    }
    setViewingCase(null);
    setEditingCase(caseItem);
    setIsCreateOpen(true);
  };

  const handleSave = async (data: CaseFormData) => {
    if (editingCase) {
      await updateMutation.mutateAsync({ id: editingCase.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsCreateOpen(false);
    setEditingCase(null);
  };

  const handleDelete = async () => {
    if (deleteCase) {
      await deleteMutation.mutateAsync(deleteCase.id);
      setDeleteCase(null);
      setViewingCase(null);
    }
  };

  const handleFiltersChange = (newFilters: CaseFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleViewModeChange = (mode: 'my' | 'all') => {
    setViewMode(mode);
    setPage(1);
  };

  const cases = casesData?.data || [];
  const totalPages = Math.ceil((casesData?.total || 0) / ITEMS_PER_PAGE);

  if (casesLoading) {
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
          ქეისების სია და მართვა
        </p>
        <div className="flex items-center gap-2">
          <ExportButton 
            entity="cases" 
            filters={filters.status ? { status: filters.status } : undefined}
          />
          <Button size="sm" onClick={handleCreate}>
            <Plus size={14} className="mr-1" />
            ახალი ქეისი
          </Button>
        </div>
      </div>

      {/* My Cases / All Cases Toggle for Assistants */}
      {isAssistant && (
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => handleViewModeChange('my')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5',
              viewMode === 'my'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <User size={12} />
            ჩემი ქეისები
          </button>
          <button
            onClick={() => handleViewModeChange('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            ყველა ქეისი
          </button>
        </div>
      )}

      {/* Filters */}
      <CaseFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        partners={partners}
        users={users}
        statusCounts={statusCounts}
      />

      {/* Cases Table */}
      {cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={Briefcase}
            title={viewMode === 'my' ? 'თქვენ არ გაქვთ მინიჭებული ქეისები' : 'ქეისები არ მოიძებნა'}
            description={filters.search || filters.status ? 'სცადეთ სხვა ფილტრები' : 'შექმენით პირველი ქეისი'}
            action={
              !filters.search && !filters.status && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus size={14} className="mr-1" />
                  ახალი ქეისი
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
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    პაციენტი
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    დამკვეთი
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    ასისტანტი
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
                {cases.map((caseItem) => {
                  const canEdit = canEditCase(caseItem);
                  const canDelete = canDeleteCase(caseItem);
                  
                  return (
                    <tr
                      key={caseItem.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => handleView(caseItem)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-blue-600">
                          {caseItem.case_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {caseItem.patient_name}
                          </p>
                          {caseItem.patient_id && (
                            <p className="text-[10px] text-gray-400">
                              {caseItem.patient_id}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">
                          {caseItem.client?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <CaseStatusBadge status={caseItem.status} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        {caseItem.assigned_user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-600">
                              {caseItem.assigned_user.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <span className="text-xs text-gray-700">
                              {caseItem.assigned_user.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {formatDate(caseItem.opened_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleView(caseItem)}
                            title="ნახვა"
                          >
                            <Eye size={14} className="text-gray-400" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(caseItem)}
                              title="რედაქტირება"
                            >
                              <Edit2 size={14} className="text-blue-500" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setDeleteCase(caseItem)}
                              title="წაშლა"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">
              ნაჩვენებია {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, casesData?.total || 0)} სულ {casesData?.total || 0}-დან
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

      {/* View Modal */}
      <CasePreviewModal
        caseData={viewingCase}
        isOpen={!!viewingCase}
        onClose={() => setViewingCase(null)}
        onEdit={canEditCase(viewingCase) ? handleEdit : undefined}
        onDelete={canDeleteCase(viewingCase) ? setDeleteCase : undefined}
      />

      {/* Edit Panel */}
      <CaseEditPanel
        caseData={editingCase}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
        partners={partners}
        users={users}
        currentUser={currentUser}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCase}
        onClose={() => setDeleteCase(null)}
        onConfirm={handleDelete}
        title="ქეისის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteCase?.case_number}" ქეისის წაშლა? ეს მოქმედება შეუქცევადია.`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
