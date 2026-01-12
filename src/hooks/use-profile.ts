'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';

// Types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ka' | 'en';
  date_format: string;
  time_format: '24h' | '12h';
  default_company_id: string | null;
  default_invoice_currency: 'GEL' | 'USD' | 'EUR';
  default_invoice_language: 'en' | 'ka';
  notifications: {
    email_case_assigned: boolean;
    email_invoice_paid: boolean;
    sound_enabled: boolean;
  };
}

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string | null;
  preferences?: Partial<UserPreferences>;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Fetch functions
async function fetchProfile(): Promise<User> {
  const response = await fetch('/api/profile');
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch profile');
  return result.data;
}

async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to update profile');
  return result.data;
}

async function uploadAvatar(file: File): Promise<{ avatar_url: string; user: User }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to upload avatar');
  return result.data;
}

async function deleteAvatar(): Promise<User> {
  const response = await fetch('/api/profile/avatar', {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to delete avatar');
  return result.data;
}

async function changePassword(data: PasswordChangeData): Promise<void> {
  const response = await fetch('/api/profile/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_password: data.current_password,
      new_password: data.new_password,
    }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to change password');
}

// Hooks
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
