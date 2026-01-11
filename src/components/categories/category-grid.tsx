'use client';

import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import { CategoryCard } from './category-card';
import { CategoryEditDialog } from './category-edit-dialog';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '@/hooks/use-categories';
import type { Category, CategoryFormData } from '@/types';

export function CategoryGrid() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const systemCategories = categories?.filter(c => c.is_system) || [];
  const customCategories = categories?.filter(c => !c.is_system) || [];

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateMutation.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (deleteCategory) {
      await deleteMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          სისტემური კატეგორიების წაშლა შეუძლებელია
        </p>
        <Button size="sm" onClick={handleCreate}>
          <Plus size={14} className="mr-1" />
          ახალი კატეგორია
        </Button>
      </div>

      {/* System Categories */}
      {systemCategories.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            სისტემური კატეგორიები
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {systemCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={setDeleteCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Categories */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          მომხმარებლის კატეგორიები
        </h3>
        {customCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={setDeleteCategory}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100">
            <EmptyState
              icon={FolderOpen}
              title="კატეგორიები არ არის"
              description="შექმენით პირველი მომხმარებლის კატეგორია"
              action={
                <Button size="sm" onClick={handleCreate}>
                  <Plus size={14} className="mr-1" />
                  ახალი კატეგორია
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <CategoryEditDialog
        category={editingCategory}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title="კატეგორიის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteCategory?.name}" კატეგორიის წაშლა?`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
