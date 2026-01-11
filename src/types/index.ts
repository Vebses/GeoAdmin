export * from './database';

import type { Tables, Enums } from './database';

// Entity types
export type User = Tables<'users'>;
export type Category = Tables<'categories'>;
export type Partner = Tables<'partners'>;
export type OurCompany = Tables<'our_companies'>;
export type Case = Tables<'cases'>;
export type CaseAction = Tables<'case_actions'>;
export type CaseDocument = Tables<'case_documents'>;
export type Invoice = Tables<'invoices'>;
export type InvoiceService = Tables<'invoice_services'>;
export type InvoiceSend = Tables<'invoice_sends'>;
export type Notification = Tables<'notifications'>;
export type ActivityLog = Tables<'activity_logs'>;
export type Setting = Tables<'settings'>;
export type UserSession = Tables<'user_sessions'>;

// Enum types
export type UserRole = Enums<'user_role'>;
export type CaseStatus = Enums<'case_status'>;
export type InvoiceStatus = Enums<'invoice_status'>;
export type CurrencyCode = Enums<'currency_code'>;
export type DocumentType = Enums<'document_type'>;
export type InvoiceLanguage = Enums<'invoice_language'>;
export type NotificationType = Enums<'notification_type'>;

// Extended types with relations
export interface CaseWithRelations extends Case {
  insurance?: Partner | null;
  client?: Partner | null;
  assigned_user?: User | null;
  creator?: User | null;
  actions?: CaseAction[];
  documents?: CaseDocument[];
  invoices?: Invoice[];
}

export interface InvoiceWithRelations extends Invoice {
  case?: Case | null;
  sender?: OurCompany | null;
  recipient?: Partner | null;
  creator?: User | null;
  services?: InvoiceService[];
  sends?: InvoiceSend[];
}

export interface PartnerWithRelations extends Partner {
  category?: Category | null;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Filter types
export interface CaseFilters {
  status?: CaseStatus;
  assigned_to?: string;
  client_id?: string;
  insurance_id?: string;
  is_medical?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  opened_from?: string;
  opened_to?: string;
  search?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  case_id?: string;
  sender_id?: string;
  recipient_id?: string;
  currency?: CurrencyCode;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface PartnerFilters {
  category_id?: string;
  search?: string;
}

// Sort types
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ka' | 'en';
  date_format: string;
  time_format: '24h' | '12h';
  notifications: {
    email_case_assigned: boolean;
    email_invoice_paid: boolean;
    push_enabled: boolean;
    sound_enabled: boolean;
  };
  default_company_id: string | null;
}

// Dashboard stats
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedThisMonth: number;
  unpaidInvoices: number;
  comparison: {
    totalCases: number;
    activeCases: number;
    completedThisMonth: number;
    unpaidInvoices: number;
  };
}

// Chart data
export interface ChartDataPoint {
  date: string;
  opened: number;
  completed: number;
}

export interface StatusBreakdown {
  status: CaseStatus;
  count: number;
  percentage: number;
}
