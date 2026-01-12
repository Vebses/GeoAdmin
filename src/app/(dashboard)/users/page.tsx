'use client';

import { useState } from 'react';
import { Plus, Users, Pencil, Trash2, Mail, Phone, Shield, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsers } from '@/hooks/use-users';
import { toast } from 'sonner';
import type { User } from '@/types';

const roleLabels: Record<string, { label: string; color: string }> = {
  manager: { label: 'მენეჯერი', color: 'bg-blue-100 text-blue-700' },
  assistant: { label: 'ასისტენტი', color: 'bg-green-100 text-green-700' },
  accountant: { label: 'ბუღალტერი', color: 'bg-purple-100 text-purple-700' },
};

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter users
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          role: editingUser.role,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      toast.success('მომხმარებელი განახლდა');
      setIsEditOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error('განახლება ვერ მოხერხდა');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    
    try {
      const response = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('მომხმარებელი წაიშალა');
      setDeleteUser(null);
    } catch (error) {
      toast.error('წაშლა ვერ მოხერხდა');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Input
          placeholder="ძიება სახელით, ელ-ფოსტით..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
        <Button size="sm" disabled>
          <Plus size={14} className="mr-1" />
          ახალი მომხმარებელი
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>შენიშვნა:</strong> ახალი მომხმარებლების დამატება ხდება Supabase Auth-ის მეშვეობით. 
        აქ შეგიძლიათ არსებული მომხმარებლების როლების და ინფორმაციის რედაქტირება.
      </div>

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || ''} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-blue-700">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name || 'უსახელო'}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Role */}
              <Badge className={roleLabels[user.role || 'assistant'].color}>
                <Shield size={12} className="mr-1" />
                {roleLabels[user.role || 'assistant'].label}
              </Badge>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                    <Pencil size={14} className="mr-2" />
                    რედაქტირება
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteUser(user)}
                    className="text-red-600"
                  >
                    <Trash2 size={14} className="mr-2" />
                    წაშლა
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={Users}
            title="მომხმარებლები არ მოიძებნა"
            description={search ? 'სცადეთ სხვა საძიებო სიტყვა' : 'სისტემაში მომხმარებლები არ არის'}
          />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>მომხმარებლის რედაქტირება</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs">სახელი და გვარი</Label>
                <Input
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">ელ-ფოსტა</Label>
                <Input
                  value={editingUser.email || ''}
                  disabled
                  className="h-9 bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">ტელეფონი</Label>
                <Input
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">როლი</Label>
                <Select
                  value={editingUser.role || 'assistant'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value as 'manager' | 'assistant' | 'accountant' })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">მენეჯერი</SelectItem>
                    <SelectItem value="assistant">ასისტენტი</SelectItem>
                    <SelectItem value="accountant">ბუღალტერი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              გაუქმება
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              შენახვა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="მომხმარებლის წაშლა?"
        description={`დარწმუნებული ხართ, რომ გსურთ "${deleteUser?.full_name || deleteUser?.email}" წაშლა?`}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="destructive"
      />
    </div>
  );
}
