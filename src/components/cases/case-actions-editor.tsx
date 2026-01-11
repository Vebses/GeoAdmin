'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput, CurrencyDisplay } from '@/components/ui/currency-input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCaseActions, useCreateCaseAction, useUpdateCaseAction, useDeleteCaseAction, useReorderCaseActions } from '@/hooks/use-case-actions';
import { usePartners } from '@/hooks/use-partners';
import { cn } from '@/lib/utils/cn';
import type { CaseActionWithRelations, CurrencyCode } from '@/types';

interface CaseActionsEditorProps {
  caseId: string;
  readOnly?: boolean;
}

export function CaseActionsEditor({ caseId, readOnly = false }: CaseActionsEditorProps) {
  const { data: actions, isLoading } = useCaseActions(caseId);
  const { data: partnersData } = usePartners({ limit: 100 });
  const partners = partnersData?.data || [];
  
  const createMutation = useCreateCaseAction(caseId);
  const updateMutation = useUpdateCaseAction(caseId);
  const deleteMutation = useDeleteCaseAction(caseId);
  const reorderMutation = useReorderCaseActions(caseId);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Partial<CaseActionWithRelations> | null>(null);

  const handleAddAction = () => {
    setNewAction({
      service_name: '',
      service_cost: 0,
      service_currency: 'GEL' as CurrencyCode,
      assistance_cost: 0,
      assistance_currency: 'GEL' as CurrencyCode,
      commission_cost: 0,
      commission_currency: 'GEL' as CurrencyCode,
    });
  };

  const handleSaveNewAction = async () => {
    if (!newAction?.service_name) return;
    
    await createMutation.mutateAsync({
      service_name: newAction.service_name,
      service_description: newAction.service_description || null,
      executor_id: newAction.executor_id || null,
      service_cost: newAction.service_cost || 0,
      service_currency: newAction.service_currency || 'GEL',
      assistance_cost: newAction.assistance_cost || 0,
      assistance_currency: newAction.assistance_currency || 'GEL',
      commission_cost: newAction.commission_cost || 0,
      commission_currency: newAction.commission_currency || 'GEL',
      service_date: newAction.service_date || null,
      comment: newAction.comment || null,
      sort_order: actions?.length || 0,
    });
    
    setNewAction(null);
  };

  const handleUpdateAction = async (actionId: string, data: Partial<CaseActionWithRelations>) => {
    await updateMutation.mutateAsync({ actionId, data });
    setEditingId(null);
  };

  const handleDeleteAction = async (actionId: string) => {
    await deleteMutation.mutateAsync(actionId);
    setDeleteId(null);
  };

  // Calculate totals
  const totals = (actions || []).reduce(
    (acc, action) => ({
      service: acc.service + (action.service_cost || 0),
      assistance: acc.assistance + (action.assistance_cost || 0),
      commission: acc.commission + (action.commission_cost || 0),
    }),
    { service: 0, assistance: 0, commission: 0 }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">მოქმედებები ({actions?.length || 0})</h3>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={handleAddAction} disabled={!!newAction}>
            <Plus className="h-4 w-4 mr-1" />
            დამატება
          </Button>
        )}
      </div>

      {/* Actions Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
          <div className="col-span-1"></div>
          <div className="col-span-3">სერვისი</div>
          <div className="col-span-2">შემსრულებელი</div>
          <div className="col-span-2 text-right">სერვ. ღირ.</div>
          <div className="col-span-2 text-right">დახმ. ღირ.</div>
          <div className="col-span-1 text-right">საკომ.</div>
          <div className="col-span-1"></div>
        </div>

        {/* Action Rows */}
        <div className="divide-y">
          {actions?.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              partners={partners}
              isEditing={editingId === action.id}
              readOnly={readOnly}
              onEdit={() => setEditingId(action.id)}
              onSave={(data) => handleUpdateAction(action.id, data)}
              onCancel={() => setEditingId(null)}
              onDelete={() => setDeleteId(action.id)}
            />
          ))}

          {/* New Action Row */}
          {newAction && (
            <NewActionRow
              action={newAction}
              partners={partners}
              onChange={setNewAction}
              onSave={handleSaveNewAction}
              onCancel={() => setNewAction(null)}
              isSaving={createMutation.isPending}
            />
          )}

          {/* Empty State */}
          {!actions?.length && !newAction && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              მოქმედებები არ არის დამატებული
            </div>
          )}
        </div>

        {/* Totals Row */}
        {(actions?.length || 0) > 0 && (
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-t text-xs font-medium">
            <div className="col-span-6 text-gray-600">ჯამი:</div>
            <div className="col-span-2 text-right">
              <CurrencyDisplay value={totals.service} currency="GEL" />
            </div>
            <div className="col-span-2 text-right">
              <CurrencyDisplay value={totals.assistance} currency="GEL" />
            </div>
            <div className="col-span-2 text-right">
              <CurrencyDisplay value={totals.commission} currency="GEL" />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteAction(deleteId)}
        title="მოქმედების წაშლა"
        description="დარწმუნებული ხართ, რომ გსურთ ამ მოქმედების წაშლა? ეს მოქმედება შეუქცევადია."
        confirmText="წაშლა"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// Action Row Component
interface ActionRowProps {
  action: CaseActionWithRelations;
  partners: { id: string; name: string }[];
  isEditing: boolean;
  readOnly: boolean;
  onEdit: () => void;
  onSave: (data: Partial<CaseActionWithRelations>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ActionRow({
  action,
  partners,
  isEditing,
  readOnly,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: ActionRowProps) {
  const [editData, setEditData] = useState<Partial<CaseActionWithRelations>>({});

  if (isEditing) {
    return (
      <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center bg-blue-50">
        <div className="col-span-1">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="col-span-3">
          <Input
            value={editData.service_name ?? action.service_name}
            onChange={(e) => setEditData({ ...editData, service_name: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="col-span-2">
          <Select
            value={editData.executor_id ?? action.executor_id ?? ''}
            onValueChange={(val) => setEditData({ ...editData, executor_id: val || null })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="აირჩიეთ" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <CurrencyInput
            value={editData.service_cost ?? action.service_cost ?? 0}
            currency={(editData.service_currency ?? action.service_currency ?? 'GEL') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, service_cost: val })}
            showCurrencySelect={false}
            className="text-xs"
          />
        </div>
        <div className="col-span-2">
          <CurrencyInput
            value={editData.assistance_cost ?? action.assistance_cost ?? 0}
            currency={(editData.assistance_currency ?? action.assistance_currency ?? 'GEL') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, assistance_cost: val })}
            showCurrencySelect={false}
            className="text-xs"
          />
        </div>
        <div className="col-span-1">
          <CurrencyInput
            value={editData.commission_cost ?? action.commission_cost ?? 0}
            currency={(editData.commission_currency ?? action.commission_currency ?? 'GEL') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, commission_cost: val })}
            showCurrencySelect={false}
            className="text-xs"
          />
        </div>
        <div className="col-span-1 flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onSave({ ...action, ...editData })}>
            ✓
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
            ✕
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-gray-50 transition-colors',
        !readOnly && 'cursor-pointer'
      )}
      onClick={!readOnly ? onEdit : undefined}
    >
      <div className="col-span-1">
        {!readOnly && <GripVertical className="h-4 w-4 text-gray-400" />}
      </div>
      <div className="col-span-3 text-sm truncate">{action.service_name}</div>
      <div className="col-span-2 text-xs text-gray-600 truncate">
        {action.executor?.name || '-'}
      </div>
      <div className="col-span-2 text-xs text-right">
        <CurrencyDisplay value={action.service_cost || 0} currency={action.service_currency as CurrencyCode || 'GEL'} />
      </div>
      <div className="col-span-2 text-xs text-right">
        <CurrencyDisplay value={action.assistance_cost || 0} currency={action.assistance_currency as CurrencyCode || 'GEL'} />
      </div>
      <div className="col-span-1 text-xs text-right">
        <CurrencyDisplay value={action.commission_cost || 0} currency={action.commission_currency as CurrencyCode || 'GEL'} />
      </div>
      <div className="col-span-1 flex justify-end">
        {!readOnly && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// New Action Row Component
interface NewActionRowProps {
  action: Partial<CaseActionWithRelations>;
  partners: { id: string; name: string }[];
  onChange: (data: Partial<CaseActionWithRelations>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function NewActionRow({ action, partners, onChange, onSave, onCancel, isSaving }: NewActionRowProps) {
  return (
    <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center bg-green-50">
      <div className="col-span-1">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="col-span-3">
        <Input
          value={action.service_name || ''}
          onChange={(e) => onChange({ ...action, service_name: e.target.value })}
          placeholder="სერვისის სახელი"
          className="h-8 text-xs"
          autoFocus
        />
      </div>
      <div className="col-span-2">
        <Select
          value={action.executor_id || ''}
          onValueChange={(val) => onChange({ ...action, executor_id: val || null })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="აირჩიეთ" />
          </SelectTrigger>
          <SelectContent>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2">
        <CurrencyInput
          value={action.service_cost || 0}
          currency={(action.service_currency || 'GEL') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, service_cost: val })}
          showCurrencySelect={false}
          className="text-xs"
        />
      </div>
      <div className="col-span-2">
        <CurrencyInput
          value={action.assistance_cost || 0}
          currency={(action.assistance_currency || 'GEL') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, assistance_cost: val })}
          showCurrencySelect={false}
          className="text-xs"
        />
      </div>
      <div className="col-span-1">
        <CurrencyInput
          value={action.commission_cost || 0}
          currency={(action.commission_currency || 'GEL') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, commission_cost: val })}
          showCurrencySelect={false}
          className="text-xs"
        />
      </div>
      <div className="col-span-1 flex gap-1">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onSave} disabled={isSaving || !action.service_name}>
          ✓
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </div>
  );
}
