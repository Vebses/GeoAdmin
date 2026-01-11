'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Phone, Building2, Truck, Pill, Stethoscope, Briefcase, Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { categorySchema, type CategoryFormData } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryEditDialogProps {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => void;
  loading?: boolean;
}

const colorPresets = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const iconOptions = [
  { value: 'folder', label: 'საქაღალდე', icon: Folder },
  { value: 'shield', label: 'ფარი', icon: Shield },
  { value: 'phone-call', label: 'ტელეფონი', icon: Phone },
  { value: 'building-2', label: 'შენობა', icon: Building2 },
  { value: 'truck', label: 'ტრანსპორტი', icon: Truck },
  { value: 'pill', label: 'აფთიაქი', icon: Pill },
  { value: 'stethoscope', label: 'სტეტოსკოპი', icon: Stethoscope },
  { value: 'briefcase', label: 'პორტფელი', icon: Briefcase },
];

export function CategoryEditDialog({
  category,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: CategoryEditDialogProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      name_en: '',
      description: '',
      color: '#6366f1',
      icon: 'folder',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          name_en: category.name_en || '',
          description: category.description || '',
          color: category.color || '#6366f1',
          icon: category.icon || 'folder',
        });
      } else {
        reset({
          name: '',
          name_en: '',
          description: '',
          color: '#6366f1',
          icon: 'folder',
        });
      }
    }
  }, [isOpen, category, reset]);

  const onSubmit = (data: CategoryFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'კატეგორიის რედაქტირება' : 'ახალი კატეგორია'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" required>სახელი (ქართული)</Label>
            <Input
              id="name"
              {...register('name')}
              error={!!errors.name}
              placeholder="კატეგორიის სახელი"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Name EN */}
          <div className="space-y-1.5">
            <Label htmlFor="name_en">სახელი (ინგლისური)</Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder="Category name"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="მოკლე აღწერა..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>ფერი</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label>აიკონი</Label>
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                    selectedIcon === value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                  onClick={() => setValue('icon', value)}
                >
                  <Icon size={18} />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              გაუქმება
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'შენახვა' : 'შექმნა'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
