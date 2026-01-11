'use client';

import { useState } from 'react';
import { Plus, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import { CompanyCard } from './company-card';
import { CompanyEditPanel } from './company-edit-panel';
import {
  useOurCompanies,
  useCreateOurCompany,
  useUpdateOurCompany,
  useDeleteOurCompany,
} from '@/hooks/use-our-companies';
import type { OurCompany, OurCompanyFormData } from '@/types';

export function CompanyList() {
  const [editingCompany, setEditingCompany] = useState<OurCompany | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [deleteCompany, setDeleteCompany] = useState<OurCompany | null>(null);

  const { data: companies, isLoading } = useOurCompanies();
  const createMutation = useCreateOurCompany();
  const updateMutation = useUpdateOurCompany();
  const deleteMutation = useDeleteOurCompany();

  const handleCreate = () => {
    setEditingCompany(null);
    setIsEditPanelOpen(true);
  };

  const handleEdit = (company: OurCompany) => {
    setEditingCompany(company);
    setIsEditPanelOpen(true);
  };

  const handleSave = async (formData: OurCompanyFormData) => {
    if (editingCompany) {
      await updateMutation.mutateAsync({ id: editingCompany.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsEditPanelOpen(false);
    setEditingCompany(null);
  };

  const handleDelete = async () => {
    if (deleteCompany) {
      await deleteMutation.mutateAsync(deleteCompany.id);
      setDeleteCompany(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
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
          კომპანიის მონაცემები გამოიყენება ინვოისებში
        </p>
        <Button size="sm" onClick={handleCreate}>
          <Plus size={14} className="mr-1" />
          ახალი კომპანია
        </Button>
      </div>

      {/* Companies Grid */}
      {companies && companies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onEdit={handleEdit}
              onDelete={setDeleteCompany}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={Building}
            title="კომპანიები არ არის"
            description="დაამატეთ პირველი კომპანია ინვოისების გასაგზავნად"
            action={
              <Button size="sm" onClick={handleCreate}>
                <Plus size={14} className="mr-1" />
                ახალი კომპანია
              </Button>
            }
          />
        </div>
      )}

      {/* Edit Panel */}
      <CompanyEditPanel
        company={editingCompany}
        isOpen={isEditPanelOpen}
        onClose={() => {
          setIsEditPanelOpen(false);
          setEditingCompany(null);
        }}
        onSave={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCompany}
        onClose={() => setDeleteCompany(null)}
        onConfirm={handleDelete}
        title="კომპანიის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteCompany?.name}" წაშლა? არსებული ინვოისები შეინახავს ამ კომპანიის მონაცემებს.`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
