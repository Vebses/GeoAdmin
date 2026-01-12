'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { TrashItem } from './trash-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { useRestoreItem, usePermanentDelete } from '@/hooks/use-trash';
import type { TrashedItem as TrashedItemType } from '@/hooks/use-trash';

interface TrashListProps {
  items: TrashedItemType[];
}

export function TrashList({ items }: TrashListProps) {
  const [confirmDelete, setConfirmDelete] = useState<TrashedItemType | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const restoreItem = useRestoreItem();
  const permanentDelete = usePermanentDelete();

  const handleRestore = async (item: TrashedItemType) => {
    setActioningId(item.id);
    try {
      await restoreItem.mutateAsync({ id: item.id, entityType: item.entity_type });
      toast.success('წარმატებით აღდგა');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'აღდგენა ვერ მოხერხდა');
    } finally {
      setActioningId(null);
    }
  };

  const handlePermanentDelete = async (item: TrashedItemType) => {
    setActioningId(item.id);
    try {
      await permanentDelete.mutateAsync({ id: item.id, entityType: item.entity_type });
      toast.success('სამუდამოდ წაიშალა');
      setConfirmDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'წაშლა ვერ მოხერხდა');
    } finally {
      setActioningId(null);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="ნაგავი ცარიელია"
        description="წაშლილი ელემენტები აქ გამოჩნდება"
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <TrashItem
            key={`${item.entity_type}-${item.id}`}
            item={item}
            onRestore={() => handleRestore(item)}
            onPermanentDelete={() => setConfirmDelete(item)}
            isRestoring={actioningId === item.id && restoreItem.isPending}
            isDeleting={actioningId === item.id && permanentDelete.isPending}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handlePermanentDelete(confirmDelete)}
        title="სამუდამოდ წაშლა?"
        description={`${confirmDelete?.name} სამუდამოდ წაიშლება და ვეღარ აღდგება. დარწმუნებული ხართ?`}
        confirmText="წაშლა"
        variant="destructive"
        loading={permanentDelete.isPending}
      />
    </>
  );
}

export default TrashList;
