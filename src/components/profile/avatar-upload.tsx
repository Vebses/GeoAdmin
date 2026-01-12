'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUploadAvatar, useDeleteAvatar } from '@/hooks/use-profile';
import type { User } from '@/types';

interface AvatarUploadProps {
  user: User;
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('მხარდაჭერილი ფორმატები: JPEG, PNG, WebP');
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 2MB-ს');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('ფოტო განახლდა');
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ატვირთვა ვერ მოხერხდა');
      setPreviewUrl(null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!user.avatar_url) return;

    try {
      await deleteAvatar.mutateAsync();
      toast.success('ფოტო წაიშალა');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'წაშლა ვერ მოხერხდა');
    }
  };

  const isLoading = uploadAvatar.isPending || deleteAvatar.isPending;
  const displayUrl = previewUrl || user.avatar_url;

  return (
    <div className="flex items-center gap-6">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-24 w-24">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt={user.full_name} />
          ) : null}
          <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>

        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4 mr-2" />
          ფოტოს ატვირთვა
        </Button>

        {user.avatar_url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            წაშლა
          </Button>
        )}

        <p className="text-xs text-gray-400 mt-1">
          JPEG, PNG ან WebP, მაქს. 2MB
        </p>
      </div>
    </div>
  );
}

export default AvatarUpload;
