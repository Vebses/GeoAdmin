import { createClient } from '@/lib/supabase/server';

// Notification types
export const NotificationTypes = {
  // User management
  USER_REGISTERED: 'user_registered',
  
  // Case management
  CASE_ASSIGNED: 'case_assigned',
  CASE_REASSIGNED: 'case_reassigned',
  CASE_UNASSIGNED: 'case_unassigned',
  CASE_STATUS_CHANGED: 'case_status_changed',
  
  // Invoice management
  INVOICE_CREATED: 'invoice_created',
  INVOICE_STATUS_CHANGED: 'invoice_status_changed',
  INVOICE_OVERDUE: 'invoice_overdue',
  
  // Document management
  DOCUMENT_UPLOADED: 'document_uploaded',
  
  // System
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

// Category mapping
export const NotificationCategories: Record<NotificationType, string> = {
  [NotificationTypes.USER_REGISTERED]: 'user',
  [NotificationTypes.CASE_ASSIGNED]: 'case',
  [NotificationTypes.CASE_REASSIGNED]: 'case',
  [NotificationTypes.CASE_UNASSIGNED]: 'case',
  [NotificationTypes.CASE_STATUS_CHANGED]: 'case',
  [NotificationTypes.INVOICE_CREATED]: 'invoice',
  [NotificationTypes.INVOICE_STATUS_CHANGED]: 'invoice',
  [NotificationTypes.INVOICE_OVERDUE]: 'invoice',
  [NotificationTypes.DOCUMENT_UPLOADED]: 'document',
  [NotificationTypes.SYSTEM_ANNOUNCEMENT]: 'system',
};

// Notification templates
export const NotificationTemplates: Record<NotificationType, { title: string; getMessage: (data: Record<string, string>) => string }> = {
  [NotificationTypes.USER_REGISTERED]: {
    title: 'ახალი მომხმარებელი დარეგისტრირდა',
    getMessage: (data) => `${data.userName} დარეგისტრირდა სისტემაში (${data.userRole})`,
  },
  [NotificationTypes.CASE_ASSIGNED]: {
    title: 'ახალი ქეისი დაგენიშნათ',
    getMessage: (data) => `თქვენ დაგენიშნათ ქეისზე: ${data.caseNumber}`,
  },
  [NotificationTypes.CASE_REASSIGNED]: {
    title: 'ქეისი გადმოგეცათ',
    getMessage: (data) => `ქეისი ${data.caseNumber} გადმოგეცათ`,
  },
  [NotificationTypes.CASE_UNASSIGNED]: {
    title: 'ქეისი გადაეცა სხვას',
    getMessage: (data) => `ქეისი ${data.caseNumber} გადაეცა სხვა ასისტენტს`,
  },
  [NotificationTypes.CASE_STATUS_CHANGED]: {
    title: 'ქეისის სტატუსი შეიცვალა',
    getMessage: (data) => `ქეისი ${data.caseNumber}: ${data.oldStatus} → ${data.newStatus}`,
  },
  [NotificationTypes.INVOICE_CREATED]: {
    title: 'ახალი ინვოისი',
    getMessage: (data) => `ინვოისი ${data.invoiceNumber} შეიქმნა ქეისზე ${data.caseNumber}`,
  },
  [NotificationTypes.INVOICE_STATUS_CHANGED]: {
    title: 'ინვოისის სტატუსი',
    getMessage: (data) => `ინვოისი ${data.invoiceNumber}: ${data.status}`,
  },
  [NotificationTypes.INVOICE_OVERDUE]: {
    title: 'ვადაგადაცილებული ინვოისი',
    getMessage: (data) => `ინვოისი ${data.invoiceNumber} ვადაგადაცილებულია`,
  },
  [NotificationTypes.DOCUMENT_UPLOADED]: {
    title: 'ახალი დოკუმენტი',
    getMessage: (data) => `დოკუმენტი აიტვირთა ქეისზე ${data.caseNumber}`,
  },
  [NotificationTypes.SYSTEM_ANNOUNCEMENT]: {
    title: 'სისტემური შეტყობინება',
    getMessage: (data) => data.message,
  },
};

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  data?: Record<string, string>;
  actionUrl?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  data = {},
  actionUrl,
  actorId,
  metadata = {},
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const template = NotificationTemplates[type];
    const category = NotificationCategories[type];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id: userId,
        type,
        title: template.title,
        message: template.getMessage(data),
        category,
        action_url: actionUrl,
        actor_id: actorId,
        metadata,
        is_read: false,
      });

    if (error) {
      console.error('Create notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  data?: Record<string, string>,
  actionUrl?: string,
  actorId?: string,
  metadata?: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const template = NotificationTemplates[type];
    const category = NotificationCategories[type];
    
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title: template.title,
      message: template.getMessage(data || {}),
      category,
      action_url: actionUrl,
      actor_id: actorId,
      metadata: metadata || {},
      is_read: false,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('notifications') as any)
      .insert(notifications);

    if (error) {
      console.error('Create notifications error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Create notifications error:', error);
    return { success: false, error: 'Failed to create notifications' };
  }
}

/**
 * Get all manager user IDs
 */
export async function getManagerIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase
      .from('users') as any)
      .select('id')
      .eq('role', 'manager');
    
    return data?.map((u: any) => u.id) || [];
  } catch (error) {
    console.error('Get manager IDs error:', error);
    return [];
  }
}

// Notification-specific helper functions

/**
 * Notify managers when a new user registers
 */
export async function notifyUserRegistered(
  newUserId: string,
  userName: string,
  userRole: string,
): Promise<void> {
  const managerIds = await getManagerIds();
  
  const roleLabels: Record<string, string> = {
    super_admin: 'სუპერ ადმინი',
    manager: 'მენეჯერი',
    assistant: 'ასისტენტი',
    accountant: 'ბუღალტერი',
  };
  
  await createNotificationsForUsers(
    managerIds,
    NotificationTypes.USER_REGISTERED,
    { userName, userRole: roleLabels[userRole] || userRole },
    '/users',
    newUserId,
    { user_id: newUserId },
  );
}

/**
 * Notify assistant when assigned to a case
 */
export async function notifyCaseAssigned(
  assistantId: string,
  caseId: string,
  caseNumber: string,
  assignedById: string,
): Promise<void> {
  await createNotification({
    userId: assistantId,
    type: NotificationTypes.CASE_ASSIGNED,
    data: { caseNumber },
    actionUrl: `/cases?view=${caseId}`,
    actorId: assignedById,
    metadata: { case_id: caseId },
  });
}

/**
 * Notify assistant when case is reassigned to them
 */
export async function notifyCaseReassigned(
  newAssistantId: string,
  oldAssistantId: string | null,
  caseId: string,
  caseNumber: string,
  assignedById: string,
): Promise<void> {
  // Notify new assistant
  await createNotification({
    userId: newAssistantId,
    type: NotificationTypes.CASE_REASSIGNED,
    data: { caseNumber },
    actionUrl: `/cases?view=${caseId}`,
    actorId: assignedById,
    metadata: { case_id: caseId },
  });
  
  // Notify old assistant if exists
  if (oldAssistantId && oldAssistantId !== newAssistantId) {
    await createNotification({
      userId: oldAssistantId,
      type: NotificationTypes.CASE_UNASSIGNED,
      data: { caseNumber },
      actionUrl: `/cases`,
      actorId: assignedById,
      metadata: { case_id: caseId },
    });
  }
}

/**
 * Notify when case status changes
 */
export async function notifyCaseStatusChanged(
  assistantId: string,
  caseId: string,
  caseNumber: string,
  oldStatus: string,
  newStatus: string,
  changedById: string,
): Promise<void> {
  const statusLabels: Record<string, string> = {
    draft: 'მიმდინარე',
    in_progress: 'შეჩერებული',
    paused: 'შეფერხებული',
    delayed: 'დასრულებული',
    completed: 'გაუქმებული',
    cancelled: 'გაუქმებული',
  };
  
  await createNotification({
    userId: assistantId,
    type: NotificationTypes.CASE_STATUS_CHANGED,
    data: { 
      caseNumber, 
      oldStatus: statusLabels[oldStatus] || oldStatus,
      newStatus: statusLabels[newStatus] || newStatus,
    },
    actionUrl: `/cases?view=${caseId}`,
    actorId: changedById,
    metadata: { case_id: caseId, old_status: oldStatus, new_status: newStatus },
  });
}
