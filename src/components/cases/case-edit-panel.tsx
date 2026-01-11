'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Check, Calendar, User, Hash } from 'lucide-react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseActionsEditor } from './case-actions-editor';
import { CaseDocuments } from './case-documents';
import { caseSchema, type CaseFormData } from '@/lib/utils/validation';
import { caseStatusOptions } from './case-status-badge';
import type { Case, Partner, User as UserType } from '@/types';

interface CaseEditPanelProps {
  caseData?: Case | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CaseFormData) => void;
  loading?: boolean;
  partners: Partner[];
  users: UserType[];
}

const priorityOptions = [
  { value: 'low', label: 'დაბალი' },
  { value: 'normal', label: 'ჩვეულებრივი' },
  { value: 'high', label: 'მაღალი' },
  { value: 'urgent', label: 'სასწრაფო' },
];

export function CaseEditPanel({
  caseData,
  isOpen,
  onClose,
  onSave,
  loading = false,
  partners,
  users,
}: CaseEditPanelProps) {
  const isEdit = !!caseData;
  
  const assistants = users.filter(u => u.role === 'assistant' || u.role === 'manager');
  const insurancePartners = partners.filter(p => p.category_id); // TODO: Filter by insurance category
  const clientPartners = partners;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      status: 'draft',
      priority: 'normal',
      patient_name: '',
      patient_id: '',
      patient_dob: undefined,
      patient_phone: '',
      patient_email: '',
      client_id: undefined,
      insurance_id: undefined,
      insurance_policy_number: '',
      assigned_to: undefined,
      is_medical: true,
      is_documented: false,
      complaints: '',
      needs: '',
      diagnosis: '',
      treatment_notes: '',
      opened_at: new Date(),
    },
  });

  const isMedical = watch('is_medical');

  useEffect(() => {
    if (isOpen) {
      if (caseData) {
        reset({
          case_number: caseData.case_number,
          status: caseData.status,
          priority: caseData.priority,
          patient_name: caseData.patient_name,
          patient_id: caseData.patient_id || '',
          patient_dob: caseData.patient_dob ? new Date(caseData.patient_dob) : undefined,
          patient_phone: caseData.patient_phone || '',
          patient_email: caseData.patient_email || '',
          client_id: caseData.client_id || undefined,
          insurance_id: caseData.insurance_id || undefined,
          insurance_policy_number: caseData.insurance_policy_number || '',
          assigned_to: caseData.assigned_to || undefined,
          is_medical: caseData.is_medical,
          is_documented: caseData.is_documented,
          complaints: caseData.complaints || '',
          needs: caseData.needs || '',
          diagnosis: caseData.diagnosis || '',
          treatment_notes: caseData.treatment_notes || '',
          opened_at: new Date(caseData.opened_at),
        });
      } else {
        reset({
          status: 'draft',
          priority: 'normal',
          patient_name: '',
          patient_id: '',
          patient_dob: undefined,
          patient_phone: '',
          patient_email: '',
          client_id: undefined,
          insurance_id: undefined,
          insurance_policy_number: '',
          assigned_to: undefined,
          is_medical: true,
          is_documented: false,
          complaints: '',
          needs: '',
          diagnosis: '',
          treatment_notes: '',
          opened_at: new Date(),
        });
      }
    }
  }, [isOpen, caseData, reset]);

  const onSubmit = (data: CaseFormData) => {
    onSave(data);
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `რედაქტირება: ${caseData?.case_number}` : 'ახალი ქეისი'}
      width="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
        <Tabs defaultValue="details" className="flex-1">
          <TabsList>
            <TabsTrigger value="details">ქეისის დეტალები</TabsTrigger>
            <TabsTrigger value="patient">პაციენტი</TabsTrigger>
            <TabsTrigger value="medical">სამედიცინო</TabsTrigger>
            {isEdit && <TabsTrigger value="actions">მოქმედებები</TabsTrigger>}
            {isEdit && <TabsTrigger value="documents">დოკუმენტები</TabsTrigger>}
          </TabsList>

          {/* Tab 1: Case Details */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {isEdit && (
                <div className="space-y-1.5">
                  <Label>ქეისის ნომერი</Label>
                  <Input
                    value={caseData?.case_number || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>სტატუსი</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ სტატუსი" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>პრიორიტეტი</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ პრიორიტეტი" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>გახსნის თარიღი</Label>
                <Controller
                  name="opened_at"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>დამკვეთი</Label>
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || '__none__'} onValueChange={(val) => field.onChange(val === '__none__' ? undefined : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ დამკვეთი..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- არ არის არჩეული --</SelectItem>
                        {clientPartners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>ასისტანტი</Label>
                <Controller
                  name="assigned_to"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || '__none__'} onValueChange={(val) => field.onChange(val === '__none__' ? undefined : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ ასისტანტი..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- არ არის არჩეული --</SelectItem>
                        {assistants.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>სადაზღვევო კომპანია</Label>
                <Controller
                  name="insurance_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || '__none__'} onValueChange={(val) => field.onChange(val === '__none__' ? undefined : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ სადაზღვევო..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- არ არის არჩეული --</SelectItem>
                        {insurancePartners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>პოლისის ნომერი</Label>
                <Input
                  {...register('insurance_policy_number')}
                  placeholder="პოლისის ნომერი"
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_medical')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-gray-700">სამედიცინო ქეისი?</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_documented')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-gray-700">სრული დოკუმენტაცია?</span>
              </label>
            </div>
          </TabsContent>

          {/* Tab 2: Patient Info */}
          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required>სრული სახელი</Label>
                <Input
                  {...register('patient_name')}
                  placeholder="სახელი გვარი"
                  error={!!errors.patient_name}
                />
                {errors.patient_name && (
                  <p className="text-xs text-red-500">{errors.patient_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>დაბადების თარიღი</Label>
                <Controller
                  name="patient_dob"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>პირადი ნომერი</Label>
                <Input
                  {...register('patient_id')}
                  placeholder="00000000000"
                  error={!!errors.patient_id}
                />
                {errors.patient_id && (
                  <p className="text-xs text-red-500">{errors.patient_id.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>ტელეფონი</Label>
                <Input
                  {...register('patient_phone')}
                  placeholder="+995 5XX XXX XXX"
                  error={!!errors.patient_phone}
                />
                {errors.patient_phone && (
                  <p className="text-xs text-red-500">{errors.patient_phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>ელ-ფოსტა</Label>
              <Input
                type="email"
                {...register('patient_email')}
                placeholder="patient@email.com"
                error={!!errors.patient_email}
              />
              {errors.patient_email && (
                <p className="text-xs text-red-500">{errors.patient_email.message}</p>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Medical Info */}
          <TabsContent value="medical" className="space-y-4">
            {!isMedical ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                სამედიცინო ინფორმაცია ხელმისაწვდომია მხოლოდ სამედიცინო ქეისებისთვის.
                <br />
                <span className="text-xs">გააქტიურეთ "სამედიცინო ქეისი" ოფცია პირველ ტაბში.</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>ჩივილები</Label>
                  <Textarea
                    {...register('complaints')}
                    placeholder="პაციენტის ჩივილები..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>საჭიროება</Label>
                  <Textarea
                    {...register('needs')}
                    placeholder="რა სჭირდება პაციენტს..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>დიაგნოზი</Label>
                  <Textarea
                    {...register('diagnosis')}
                    placeholder="დიაგნოზი..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>მკურნალობის ჩანაწერები</Label>
                  <Textarea
                    {...register('treatment_notes')}
                    placeholder="მკურნალობის შენიშვნები..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 4: Actions (only in edit mode) */}
          {isEdit && caseData && (
            <TabsContent value="actions" className="space-y-4">
              <CaseActionsEditor caseId={caseData.id} />
            </TabsContent>
          )}

          {/* Tab 5: Documents (only in edit mode) */}
          {isEdit && caseData && (
            <TabsContent value="documents" className="space-y-4">
              <CaseDocuments caseId={caseData.id} />
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            გაუქმება
          </Button>
          <div className="flex items-center gap-2">
            <Button type="submit" loading={loading}>
              <Check size={14} className="mr-1" />
              {isEdit ? 'შენახვა' : 'შექმნა'}
            </Button>
          </div>
        </div>
      </form>
    </SlidePanel>
  );
}
