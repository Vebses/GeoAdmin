'use client';

import { useState, useMemo } from 'react';
import { Plus, Building2, MoreVertical, Pencil, Trash2, ExternalLink, Mail, Phone, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PartnerFilters } from './partner-filters';
import { PartnerEditPanel } from './partner-edit-panel';
import { PartnerImportDialog } from './partner-import-dialog';
import { PartnerViewModal } from './partner-view-modal';
import {
  usePartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
} from '@/hooks/use-partners';
import { useCategories } from '@/hooks/use-categories';
import { useDebounce } from '@/hooks/use-debounce';
import type { Partner, PartnerFormData, PartnerWithRelations } from '@/types';

export function PartnerList() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [deletePartner, setDeletePartner] = useState<Partner | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingPartner, setViewingPartner] = useState<PartnerWithRelations | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = usePartners({
    search: debouncedSearch,
    category_id: categoryId,
    page,
    limit: 20,
  });

  const { data: categories = [] } = useCategories();

  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const deleteMutation = useDeletePartner();

  const partners = data?.data || [];
  const meta = data?.meta;

  const handleCreate = () => {
    setEditingPartner(null);
    setIsEditPanelOpen(true);
  };

  const handleView = (partner: PartnerWithRelations) => {
    setViewingPartner(partner);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setIsEditPanelOpen(true);
  };

  const handleEditFromView = (partner: PartnerWithRelations) => {
    setViewingPartner(null);
    setEditingPartner(partner);
    setIsEditPanelOpen(true);
  };

  const handleSave = async (formData: PartnerFormData) => {
    if (editingPartner) {
      await updateMutation.mutateAsync({ id: editingPartner.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsEditPanelOpen(false);
    setEditingPartner(null);
  };

  const handleDelete = async () => {
    if (deletePartner) {
      await deleteMutation.mutateAsync(deletePartner.id);
      setDeletePartner(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PartnerFilters
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload size={14} className="mr-1" />
            იმპორტი
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus size={14} className="mr-1" />
            ახალი პარტნიორი
          </Button>
        </div>
      </div>

      {/* Partners List */}
      {partners.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {partners.map((partner) => (
            <PartnerRow
              key={partner.id}
              partner={partner as PartnerWithRelations}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={setDeletePartner}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={Building2}
            title="პარტნიორები არ მოიძებნა"
            description={
              search || categoryId
                ? 'შეცვალეთ ფილტრები ან ძიების პირობები'
                : 'დაამატეთ პირველი პარტნიორი'
            }
            action={
              !search && !categoryId && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus size={14} className="mr-1" />
                  ახალი პარტნიორი
                </Button>
              )
            }
          />
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            სულ {meta.total} პარტნიორი
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              წინა
            </Button>
            <span className="text-xs text-gray-600">
              {page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              შემდეგი
            </Button>
          </div>
        </div>
      )}

      {/* Edit Panel */}
      <PartnerEditPanel
        partner={editingPartner}
        isOpen={isEditPanelOpen}
        onClose={() => {
          setIsEditPanelOpen(false);
          setEditingPartner(null);
        }}
        onSave={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletePartner}
        onClose={() => setDeletePartner(null)}
        onConfirm={handleDelete}
        title="პარტნიორის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deletePartner?.name}" წაშლა? ეს მოხვდება ნაგავში.`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      {/* Import Dialog */}
      <PartnerImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        categories={categories}
      />

      {/* View Modal */}
      <PartnerViewModal
        partner={viewingPartner}
        isOpen={!!viewingPartner}
        onClose={() => setViewingPartner(null)}
        onEdit={handleEditFromView}
      />
    </div>
  );
}

interface PartnerRowProps {
  partner: PartnerWithRelations;
  onView: (partner: PartnerWithRelations) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

function PartnerRow({ partner, onView, onEdit, onDelete }: PartnerRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors group cursor-pointer"
      onClick={() => onView(partner)}
    >
      {/* Icon/Avatar */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${partner.category?.color || '#6366f1'}15` }}
      >
        <Building2
          size={18}
          style={{ color: partner.category?.color || '#6366f1' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {partner.name}
          </h4>
          {partner.category && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5"
              style={{ 
                borderColor: partner.category.color || '#6366f1',
                color: partner.category.color || '#6366f1' 
              }}
            >
              {partner.category.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {partner.id_code && (
            <span className="text-xs text-gray-500">{partner.id_code}</span>
          )}
          {partner.city && (
            <span className="text-xs text-gray-400">{partner.city}</span>
          )}
        </div>
      </div>

      {/* Quick Contact */}
      <div className="hidden sm:flex items-center gap-2">
        {partner.email && (
          <a
            href={`mailto:${partner.email}`}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail size={14} />
          </a>
        )}
        {partner.phone && (
          <a
            href={`tel:${partner.phone}`}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone size={14} />
          </a>
        )}
        {partner.website && (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(partner)}>
            <Eye size={14} className="mr-2" />
            ნახვა
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(partner)}>
            <Pencil size={14} className="mr-2" />
            რედაქტირება
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(partner)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 size={14} className="mr-2" />
            წაშლა
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
