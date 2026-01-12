'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { TrashList } from '@/components/trash';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTrashedItems, useEmptyTrash } from '@/hooks/use-trash';

const RETENTION_DAYS = 30;

export default function TrashPage() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const { data: items, isLoading } = useTrashedItems(
    entityFilter === 'all' ? undefined : entityFilter
  );
  const emptyTrash = useEmptyTrash();

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash.mutateAsync();
      toast.success('ნაგავი დაცარიელდა');
      setShowEmptyConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'შეცდომა');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ნაგავი</h1>
            <p className="text-sm text-gray-500">
              ელემენტები {RETENTION_DAYS} დღის შემდეგ ავტომატურად წაიშლება
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="ყველა" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა</SelectItem>
              <SelectItem value="case">ქეისები</SelectItem>
              <SelectItem value="invoice">ინვოისები</SelectItem>
              <SelectItem value="partner">პარტნიორები</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:border-red-200"
            onClick={() => setShowEmptyConfirm(true)}
            disabled={!items || items.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            დაცარიელება
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            ყურადღება
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            სამუდამოდ წაშლილი ელემენტების აღდგენა შეუძლებელია. 
            ელემენტები ავტომატურად იშლება {RETENTION_DAYS} დღის შემდეგ.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TrashList items={items || []} />
      )}

      {/* Empty Trash Confirmation */}
      <ConfirmDialog
        isOpen={showEmptyConfirm}
        onClose={() => setShowEmptyConfirm(false)}
        onConfirm={handleEmptyTrash}
        title="ნაგვის დაცარიელება?"
        description="ყველა ელემენტი სამუდამოდ წაიშლება. ეს მოქმედება შეუქცევადია."
        confirmText="დაცარიელება"
        variant="destructive"
        loading={emptyTrash.isPending}
      />
    </div>
  );
}
