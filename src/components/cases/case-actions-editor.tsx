'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCaseActions, useCreateCaseAction, useUpdateCaseAction, useDeleteCaseAction } from '@/hooks/use-case-actions';
import { usePartners } from '@/hooks/use-partners';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';
import type { CaseActionWithRelations, CurrencyCode } from '@/types';

const CURRENCIES: CurrencyCode[] = ['GEL', 'EUR', 'USD'];

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
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState<Partial<CaseActionWithRelations> | null>(null);

  const handleAddAction = () => {
    setNewAction({
      service_name: '',
      service_cost: 0,
      service_currency: 'GEL' as CurrencyCode,
      assistance_cost: 0,
      assistance_currency: 'EUR' as CurrencyCode,
      commission_cost: 0,
      commission_currency: 'EUR' as CurrencyCode,
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
      assistance_currency: newAction.assistance_currency || 'EUR',
      commission_cost: newAction.commission_cost || 0,
      commission_currency: newAction.commission_currency || 'EUR',
      service_date: newAction.service_date || null,
      comment: newAction.comment || null,
      sort_order: actions?.length || 0,
    });
    
    // Clear the form but keep it open for adding more
    setNewAction({
      service_name: '',
      service_cost: 0,
      service_currency: 'GEL' as CurrencyCode,
      assistance_cost: 0,
      assistance_currency: 'EUR' as CurrencyCode,
      commission_cost: 0,
      commission_currency: 'EUR' as CurrencyCode,
    });
  };

  const handleUpdateAction = async (actionId: string, data: Partial<CaseActionWithRelations>) => {
    await updateMutation.mutateAsync({ actionId, data });
    setEditingId(null);
  };

  const handleDeleteAction = async (actionId: string) => {
    await deleteMutation.mutateAsync(actionId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
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

      {/* Actions List */}
      <div className="space-y-2">
        {actions?.map((action) => (
          <ActionCard
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

        {/* New Action Card */}
        {newAction && (
          <NewActionCard
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
          <div className="border-2 border-dashed rounded-lg px-4 py-8 text-center text-gray-500 text-sm">
            მოქმედებები არ არის დამატებული
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

// Price Input with Currency Selector
interface PriceInputProps {
  label: string;
  value: number;
  currency: CurrencyCode;
  onValueChange: (value: number) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  className?: string;
}

function PriceInput({ label, value, currency, onValueChange, onCurrencyChange, className }: PriceInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex gap-1">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs flex-1"
          placeholder="0.00"
          step="0.01"
        />
        <Select value={currency} onValueChange={(v) => onCurrencyChange(v as CurrencyCode)}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Price Display
interface PriceDisplayProps {
  label: string;
  value: number;
  currency: CurrencyCode;
}

function PriceDisplay({ label, value, currency }: PriceDisplayProps) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{formatCurrency(value, currency)}</div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  action: CaseActionWithRelations;
  partners: { id: string; name: string }[];
  isEditing: boolean;
  readOnly: boolean;
  onEdit: () => void;
  onSave: (data: Partial<CaseActionWithRelations>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ActionCard({
  action,
  partners,
  isEditing,
  readOnly,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: ActionCardProps) {
  const [editData, setEditData] = useState<Partial<CaseActionWithRelations>>({});

  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-blue-50 space-y-3">
        {/* Row 1: Service Name & Executor */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">სერვისი</label>
            <Input
              value={editData.service_name ?? action.service_name}
              onChange={(e) => setEditData({ ...editData, service_name: e.target.value })}
              className="h-8 text-sm"
              placeholder="სერვისის სახელი"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">შემსრულებელი</label>
            <Select
              value={editData.executor_id ?? action.executor_id ?? ''}
              onValueChange={(val) => setEditData({ ...editData, executor_id: val || null })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="აირჩიეთ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs">-- არ არის --</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Prices with Currency Selectors */}
        <div className="grid grid-cols-3 gap-3">
          <PriceInput
            label="სერვისის ღირებულება"
            value={editData.service_cost ?? action.service_cost ?? 0}
            currency={(editData.service_currency ?? action.service_currency ?? 'GEL') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, service_cost: val })}
            onCurrencyChange={(val) => setEditData({ ...editData, service_currency: val })}
          />
          <PriceInput
            label="დახმარების ღირებულება"
            value={editData.assistance_cost ?? action.assistance_cost ?? 0}
            currency={(editData.assistance_currency ?? action.assistance_currency ?? 'EUR') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, assistance_cost: val })}
            onCurrencyChange={(val) => setEditData({ ...editData, assistance_currency: val })}
          />
          <PriceInput
            label="საკომისიო"
            value={editData.commission_cost ?? action.commission_cost ?? 0}
            currency={(editData.commission_currency ?? action.commission_currency ?? 'EUR') as CurrencyCode}
            onValueChange={(val) => setEditData({ ...editData, commission_cost: val })}
            onCurrencyChange={(val) => setEditData({ ...editData, commission_currency: val })}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            გაუქმება
          </Button>
          <Button size="sm" onClick={() => onSave({ ...action, ...editData })}>
            <Check className="h-4 w-4 mr-1" />
            შენახვა
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-3 hover:bg-gray-50 transition-colors',
        !readOnly && 'cursor-pointer'
      )}
      onClick={!readOnly ? onEdit : undefined}
    >
      {/* Row 1: Service Name & Executor */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {!readOnly && <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />}
          <div>
            <div className="font-medium text-sm">{action.service_name}</div>
            <div className="text-xs text-gray-500">{action.executor?.name || 'შემსრულებელი არ არის'}</div>
          </div>
        </div>
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

      {/* Row 2: Prices */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <PriceDisplay
          label="სერვისი"
          value={action.service_cost || 0}
          currency={(action.service_currency || 'GEL') as CurrencyCode}
        />
        <PriceDisplay
          label="დახმარება"
          value={action.assistance_cost || 0}
          currency={(action.assistance_currency || 'EUR') as CurrencyCode}
        />
        <PriceDisplay
          label="საკომისიო"
          value={action.commission_cost || 0}
          currency={(action.commission_currency || 'EUR') as CurrencyCode}
        />
      </div>
    </div>
  );
}

// New Action Card Component
interface NewActionCardProps {
  action: Partial<CaseActionWithRelations>;
  partners: { id: string; name: string }[];
  onChange: (data: Partial<CaseActionWithRelations>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function NewActionCard({ action, partners, onChange, onSave, onCancel, isSaving }: NewActionCardProps) {
  return (
    <div className="border-2 border-dashed border-green-300 rounded-lg p-3 bg-green-50 space-y-3">
      {/* Row 1: Service Name & Executor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">სერვისი *</label>
          <Input
            value={action.service_name || ''}
            onChange={(e) => onChange({ ...action, service_name: e.target.value })}
            className="h-8 text-sm"
            placeholder="სერვისის სახელი"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">შემსრულებელი</label>
          <Select
            value={action.executor_id || ''}
            onValueChange={(val) => onChange({ ...action, executor_id: val || null })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="აირჩიეთ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">-- არ არის --</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Prices with Currency Selectors */}
      <div className="grid grid-cols-3 gap-3">
        <PriceInput
          label="სერვისის ღირებულება"
          value={action.service_cost || 0}
          currency={(action.service_currency || 'GEL') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, service_cost: val })}
          onCurrencyChange={(val) => onChange({ ...action, service_currency: val })}
        />
        <PriceInput
          label="დახმარების ღირებულება"
          value={action.assistance_cost || 0}
          currency={(action.assistance_currency || 'EUR') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, assistance_cost: val })}
          onCurrencyChange={(val) => onChange({ ...action, assistance_currency: val })}
        />
        <PriceInput
          label="საკომისიო"
          value={action.commission_cost || 0}
          currency={(action.commission_currency || 'EUR') as CurrencyCode}
          onValueChange={(val) => onChange({ ...action, commission_cost: val })}
          onCurrencyChange={(val) => onChange({ ...action, commission_currency: val })}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          გაუქმება
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving || !action.service_name}>
          <Check className="h-4 w-4 mr-1" />
          {isSaving ? 'ინახება...' : 'დამატება'}
        </Button>
      </div>
    </div>
  );
}
