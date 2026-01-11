import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-2xl shadow-lg shadow-blue-500/30">
            G
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">GeoAdmin</h1>
          <p className="mt-1 text-sm text-gray-500">
            სამედიცინო დახმარების მართვის სისტემა
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <h2 className="text-sm font-medium text-gray-700">მომხმარებელი</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">სახელი:</span>
              <span className="font-medium text-gray-900">{userProfile?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ელ-ფოსტა:</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">როლი:</span>
              <span className="font-medium text-gray-900">
                {userProfile?.role === 'manager' ? 'მენეჯერი' : 
                 userProfile?.role === 'assistant' ? 'ასისტენტი' : 
                 userProfile?.role === 'accountant' ? 'ბუღალტერი' : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">✓ Phase 2 Complete</p>
            <p className="mt-1 text-xs text-green-600">
              Database & Authentication
            </p>
          </div>

          <LogoutButton />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} GeoAdmin. ყველა უფლება დაცულია.
        </p>
      </div>
    </div>
  );
}
