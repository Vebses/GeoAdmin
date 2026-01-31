import { createClient } from '@/lib/supabase/server';

// Action types - must match database constraint
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'sent'
  | 'paid'
  | 'cancelled'
  | 'assigned'
  | 'uploaded'
  | 'downloaded'
  | 'exported'
  | 'login'
  | 'logout'
  | 'password_changed';

// Entity types - must match database constraint
export type ActivityEntityType =
  | 'case'
  | 'invoice'
  | 'partner'
  | 'category'
  | 'our_company'
  | 'user'
  | 'document'
  | 'settings';

interface LogActivityParams {
  userId: string;
  userName?: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the activity_logs table
 */
export async function logActivity({
  userId,
  userName,
  action,
  entityType,
  entityId,
  entityName,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('activity_logs') as any)
      .insert({
        user_id: userId,
        user_name: userName,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Log activity error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Log activity error:', error);
    return { success: false, error: 'Failed to log activity' };
  }
}

// Helper functions for specific entity types

/**
 * Log case activity
 */
export async function logCaseActivity(
  userId: string,
  userName: string | undefined,
  action: 'created' | 'updated' | 'deleted' | 'assigned',
  caseId: string,
  caseNumber: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    userName,
    action,
    entityType: 'case',
    entityId: caseId,
    entityName: caseNumber,
    details,
  });
}

/**
 * Log invoice activity
 */
export async function logInvoiceActivity(
  userId: string,
  userName: string | undefined,
  action: 'created' | 'updated' | 'deleted' | 'sent' | 'paid' | 'cancelled',
  invoiceId: string,
  invoiceNumber: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    userName,
    action,
    entityType: 'invoice',
    entityId: invoiceId,
    entityName: invoiceNumber,
    details,
  });
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: string,
  userName: string | undefined,
  action: 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'password_changed',
  targetUserId?: string,
  targetUserName?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    userName,
    action,
    entityType: 'user',
    entityId: targetUserId,
    entityName: targetUserName,
    details,
  });
}

/**
 * Log document activity
 */
export async function logDocumentActivity(
  userId: string,
  userName: string | undefined,
  action: 'uploaded' | 'downloaded' | 'deleted',
  documentId: string,
  documentName: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    userName,
    action,
    entityType: 'document',
    entityId: documentId,
    entityName: documentName,
    details,
  });
}

/**
 * Log partner activity
 */
export async function logPartnerActivity(
  userId: string,
  userName: string | undefined,
  action: 'created' | 'updated' | 'deleted',
  partnerId: string,
  partnerName: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    userId,
    userName,
    action,
    entityType: 'partner',
    entityId: partnerId,
    entityName: partnerName,
    details,
  });
}
