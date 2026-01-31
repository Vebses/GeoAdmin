'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Schema allows all roles - actual role availability is controlled by currentUserRole prop
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'ელ-ფოსტა აუცილებელია')
    .email('არასწორი ელ-ფოსტის ფორმატი'),
  full_name: z.string().optional(),
  role: z.enum(['super_admin', 'manager', 'assistant', 'accountant']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserRole?: string; // Role of the logged-in user
}

const roleDescriptions: Record<string, string> = {
  super_admin: 'სრული წვდომა + მენეჯერების მართვა',
  manager: 'სრული წვდომა სისტემაზე',
  assistant: 'ქეისების მართვა',
  accountant: 'ინვოისების მართვა',
};

export function InviteUserDialog({ isOpen, onClose, onSuccess, currentUserRole }: InviteUserDialogProps) {
  // Determine which roles the current user can assign
  const isSuperAdmin = currentUserRole === 'super_admin';
  const availableRoles = isSuperAdmin
    ? ['super_admin', 'manager', 'assistant', 'accountant'] as const
    : ['assistant', 'accountant'] as const; // Managers can only invite non-admin roles
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'assistant',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'მოწვევა ვერ მოხერხდა');
      }

      toast.success('მოწვევა გაიგზავნა', {
        description: `მოწვევა გაეგზავნა ${data.email}-ზე`,
      });

      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'მოწვევა ვერ მოხერხდა');
      console.error('Invite error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ახალი მომხმარებლის მოწვევა</DialogTitle>
          <DialogDescription>
            მოწვევა გაეგზავნება მითითებულ ელ-ფოსტაზე. მომხმარებელი თვითონ დააყენებს პაროლს.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs">ელ-ფოსტა *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                {...register('email')}
                type="email"
                placeholder="example@company.ge"
                className="pl-10 h-9"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">სახელი და გვარი</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                {...register('full_name')}
                type="text"
                placeholder="არასავალდებულო"
                className="pl-10 h-9"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs">როლი *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as 'super_admin' | 'manager' | 'assistant' | 'accountant')}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && (
                  <SelectItem value="super_admin">
                    <div className="flex flex-col">
                      <span>სუპერ ადმინი</span>
                    </div>
                  </SelectItem>
                )}
                {isSuperAdmin && (
                  <SelectItem value="manager">
                    <div className="flex flex-col">
                      <span>მენეჯერი</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="assistant">
                  <div className="flex flex-col">
                    <span>ასისტენტი</span>
                  </div>
                </SelectItem>
                <SelectItem value="accountant">
                  <div className="flex flex-col">
                    <span>ბუღალტერი</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-gray-500">
              {roleDescriptions[selectedRole]}
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              გაუქმება
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              მოწვევის გაგზავნა
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
