'use client';

import { User as UserIcon, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm, AvatarUpload, PasswordChangeForm, PreferencesForm } from '@/components/profile';
import { useProfile } from '@/hooks/use-profile';
import { useOurCompanies } from '@/hooks/use-our-companies';

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: companies } = useOurCompanies();

  if (profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-gray-500">
        პროფილი ვერ მოიძებნა
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <UserIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">პროფილი</h1>
          <p className="text-sm text-gray-500">მართეთ თქვენი ანგარიში და პარამეტრები</p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">პროფილის ფოტო</h3>
        <AvatarUpload user={profile} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="text-sm">
            პროფილი
          </TabsTrigger>
          <TabsTrigger value="password" className="text-sm">
            პაროლი
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-sm">
            პარამეტრები
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">პროფილის ინფორმაცია</h3>
            <ProfileForm user={profile} />
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">პაროლის შეცვლა</h3>
            <p className="text-sm text-gray-500 mb-6">
              უსაფრთხოებისთვის გამოიყენეთ მინიმუმ 8 სიმბოლო, მათ შორის დიდი და პატარა ასოები და ციფრები.
            </p>
            <PasswordChangeForm />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">პარამეტრები</h3>
            <PreferencesForm user={profile} companies={companies || []} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
