import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from './dashboard-shell';
import type { User } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  const user = profileData as User | null;

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
