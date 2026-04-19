import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Determine whether a user can access (read or write) a specific case.
 *
 * Rules mirror the API-layer + RLS logic:
 * - super_admin and manager roles can access every case
 * - the user who created the case can always access it
 * - the currently-assigned user can access it
 * - accountant can read cases that have related invoices (for invoice operations)
 *
 * Returns false if the case doesn't exist, is soft-deleted, or the user isn't permitted.
 * Use this BEFORE reading/writing any child resource (actions, documents, invoices).
 */
export async function canAccessCase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string,
  caseId: string,
  options: { includeAccountant?: boolean } = {}
): Promise<boolean> {
  if (!userId || !caseId) return false;

  // Fetch the user's role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('role, is_active')
    .eq('id', userId)
    .single();

  if (!userData || userData.is_active === false) return false;
  const role = userData.role as string;

  // Super admin and manager always have access
  if (role === 'super_admin' || role === 'manager') return true;

  // Accountants get read access for invoice-related operations if opted in
  if (options.includeAccountant && role === 'accountant') return true;

  // Otherwise fetch the case and check ownership/assignment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: caseRow } = await (supabase
    .from('cases') as any)
    .select('id, created_by, assigned_to, deleted_at')
    .eq('id', caseId)
    .single();

  if (!caseRow || caseRow.deleted_at) return false;

  return caseRow.created_by === userId || caseRow.assigned_to === userId;
}

/**
 * Determine whether a user can access a specific invoice.
 * Invoice access = can access the parent case, OR user is admin/accountant.
 */
export async function canAccessInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string,
  invoiceId: string
): Promise<boolean> {
  if (!userId || !invoiceId) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('role, is_active')
    .eq('id', userId)
    .single();

  if (!userData || userData.is_active === false) return false;
  const role = userData.role as string;

  // Finance roles always have access
  if (role === 'super_admin' || role === 'manager' || role === 'accountant') return true;

  // Other roles (assistants) need case access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoiceRow } = await (supabase
    .from('invoices') as any)
    .select('case_id, deleted_at')
    .eq('id', invoiceId)
    .single();

  if (!invoiceRow || invoiceRow.deleted_at) return false;

  return canAccessCase(supabase, userId, invoiceRow.case_id);
}
