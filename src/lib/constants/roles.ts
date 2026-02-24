/**
 * ============================================
 * ROLE HIERARCHY & PERMISSIONS
 * ============================================
 *
 * IMPORTANT: super_admin is the HIGHEST role and must ALWAYS have access to ALL features.
 * Never exclude super_admin from any permission check.
 *
 * Role Hierarchy (highest to lowest):
 * 1. super_admin - Full system access, can do everything
 * 2. manager     - Management access, can manage team and most features
 * 3. assistant   - Operational access, can work on assigned cases
 * 4. accountant  - Financial access, can view/manage invoices only
 *
 * NOTE: Database enum user_role has: manager, assistant, accountant, super_admin
 *       There is NO 'admin' role in the database!
 *
 * ============================================
 */

/**
 * All available roles in the system (matches DB enum user_role)
 */
export const ALL_ROLES = ['super_admin', 'manager', 'assistant', 'accountant'] as const;

export type UserRole = (typeof ALL_ROLES)[number];

/**
 * Roles that have full administrative access
 * Use for: user management, system settings, trash operations, company management
 *
 * ALWAYS include super_admin first!
 */
export const SUPER_ADMIN_ROLES = ['super_admin', 'manager'] as const;

/**
 * Roles that can view team performance and alerts
 * Use for: dashboard team section, alerts panel, team workload
 *
 * ALWAYS include super_admin first!
 */
export const ADMIN_ROLES = ['super_admin', 'manager'] as const;

/**
 * Roles that can view financial information
 * Use for: financial stats, revenue, invoice summaries
 *
 * ALWAYS include super_admin first!
 */
export const FINANCIAL_ROLES = ['super_admin', 'manager', 'accountant'] as const;

/**
 * Roles that can be assigned cases
 * Use for: case assignment dropdown
 */
export const ASSIGNABLE_ROLES = ['super_admin', 'manager', 'assistant'] as const;

/**
 * Role display labels in Georgian
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'სუპერ ადმინი',
  manager: 'მენეჯერი',
  assistant: 'ასისტანტი',
  accountant: 'ბუღალტერი',
};

/**
 * Role colors for UI display
 */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  manager: { bg: 'bg-blue-100', text: 'text-blue-700' },
  assistant: { bg: 'bg-amber-100', text: 'text-amber-700' },
  accountant: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

/**
 * Check if a role has super admin privileges
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === 'super_admin';
}

/**
 * Check if a role has admin-level access (super_admin or manager)
 */
export function hasAdminAccess(role: string | undefined | null): boolean {
  if (!role) return false;
  return (SUPER_ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if a role can view team/management features
 */
export function canViewTeam(role: string | undefined | null): boolean {
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if a role can view financial information
 */
export function canViewFinancial(role: string | undefined | null): boolean {
  if (!role) return false;
  return (FINANCIAL_ROLES as readonly string[]).includes(role);
}

/**
 * Check if a role can be assigned cases
 */
export function canBeAssignedCases(role: string | undefined | null): boolean {
  if (!role) return false;
  return (ASSIGNABLE_ROLES as readonly string[]).includes(role);
}

/**
 * Permission matrix for quick reference:
 *
 * Feature                  | super_admin | manager | assistant | accountant
 * -------------------------|-------------|---------|-----------|------------
 * View Dashboard           | ✓           | ✓       | ✓         | ✓
 * View Financial Stats     | ✓           | ✓       | ✗         | ✓
 * View Team Workload       | ✓           | ✓       | ✗         | ✗
 * View Alerts Panel        | ✓           | ✓       | ✗         | ✗
 * Manage Users             | ✓           | ✓       | ✗         | ✗
 * Manage Companies         | ✓           | ✓       | ✗         | ✗
 * Manage Categories        | ✓           | ✓       | ✗         | ✗
 * Empty Trash              | ✓           | ✓       | ✗         | ✗
 * Permanent Delete         | ✓           | ✓       | ✗         | ✗
 * Create/Edit Cases        | ✓           | ✓       | ✓         | ✗
 * Create/Edit Invoices     | ✓           | ✓       | ✗         | ✓
 * Be Assigned Cases        | ✓           | ✓       | ✓         | ✗
 */
