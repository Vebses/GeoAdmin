import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InvoiceList } from '@/components/invoices';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if ((profile as { role: string } | null)?.role === 'assistant') {
      redirect('/dashboard');
    }
  }

  return <InvoiceList />;
}
