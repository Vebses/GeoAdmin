import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const ADMIN_ROLES = ['super_admin', 'manager'] as const;
export const FINANCE_ROLES = ['super_admin', 'manager', 'accountant'] as const;
export const ALL_ROLES = ['super_admin', 'manager', 'assistant', 'accountant'] as const;

export type UserRole = typeof ALL_ROLES[number];

interface AuthResult {
  user: { id: string };
  role: UserRole;
}

interface AuthError {
  response: NextResponse;
}

/**
 * Authenticate and authorize the current user.
 * Returns { user, role } on success, or { response } with a NextResponse error on failure.
 */
export async function requireAuth(
  allowedRoles?: readonly string[]
): Promise<AuthResult | AuthError> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      ),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (supabase
    .from('users') as any)
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (userData?.role || '') as UserRole;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'არ გაქვთ წვდომის უფლება' } },
        { status: 403 }
      ),
    };
  }

  return { user: { id: user.id }, role };
}

/**
 * Type guard to check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'response' in result;
}
