export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'manager' | 'assistant' | 'accountant';
          is_active: boolean;
          avatar_url: string | null;
          phone: string | null;
          preferences: Json;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'manager' | 'assistant' | 'accountant';
          is_active?: boolean;
          avatar_url?: string | null;
          phone?: string | null;
          preferences?: Json;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'manager' | 'assistant' | 'accountant';
          is_active?: boolean;
          avatar_url?: string | null;
          phone?: string | null;
          preferences?: Json;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          color: string;
          icon: string;
          is_system: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          description?: string | null;
          color?: string;
          icon?: string;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          description?: string | null;
          color?: string;
          icon?: string;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          id_code: string | null;
          category_id: string | null;
          country: string;
          city: string | null;
          address: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          notes: string | null;
          cases_count: number;
          invoices_count: number;
          total_amount: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          id_code?: string | null;
          category_id?: string | null;
          country?: string;
          city?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          cases_count?: number;
          invoices_count?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          legal_name?: string | null;
          id_code?: string | null;
          category_id?: string | null;
          country?: string;
          city?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          cases_count?: number;
          invoices_count?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      our_companies: {
        Row: {
          id: string;
          name: string;
          legal_name: string;
          id_code: string;
          country: string;
          city: string | null;
          address: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          bank_name: string | null;
          bank_code: string | null;
          account_gel: string | null;
          account_usd: string | null;
          account_eur: string | null;
          logo_url: string | null;
          signature_url: string | null;
          stamp_url: string | null;
          invoice_prefix: string;
          invoice_footer_text: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name: string;
          id_code: string;
          country?: string;
          city?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          bank_name?: string | null;
          bank_code?: string | null;
          account_gel?: string | null;
          account_usd?: string | null;
          account_eur?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          stamp_url?: string | null;
          invoice_prefix?: string;
          invoice_footer_text?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          legal_name?: string;
          id_code?: string;
          country?: string;
          city?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          bank_name?: string | null;
          bank_code?: string | null;
          account_gel?: string | null;
          account_usd?: string | null;
          account_eur?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          stamp_url?: string | null;
          invoice_prefix?: string;
          invoice_footer_text?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          status: 'draft' | 'in_progress' | 'paused' | 'delayed' | 'completed' | 'cancelled';
          patient_name: string;
          patient_id: string | null;
          patient_dob: string | null;
          patient_phone: string | null;
          patient_email: string | null;
          insurance_id: string | null;
          insurance_policy_number: string | null;
          client_id: string | null;
          assigned_to: string | null;
          is_medical: boolean;
          is_documented: boolean;
          priority: 'low' | 'normal' | 'high' | 'urgent';
          complaints: string | null;
          needs: string | null;
          diagnosis: string | null;
          treatment_notes: string | null;
          opened_at: string;
          closed_at: string | null;
          total_service_cost: number;
          total_assistance_cost: number;
          total_commission_cost: number;
          actions_count: number;
          documents_count: number;
          invoices_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          case_number: string;
          status?: 'draft' | 'in_progress' | 'paused' | 'delayed' | 'completed' | 'cancelled';
          patient_name: string;
          patient_id?: string | null;
          patient_dob?: string | null;
          patient_phone?: string | null;
          patient_email?: string | null;
          insurance_id?: string | null;
          insurance_policy_number?: string | null;
          client_id?: string | null;
          assigned_to?: string | null;
          is_medical?: boolean;
          is_documented?: boolean;
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          complaints?: string | null;
          needs?: string | null;
          diagnosis?: string | null;
          treatment_notes?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          total_service_cost?: number;
          total_assistance_cost?: number;
          total_commission_cost?: number;
          actions_count?: number;
          documents_count?: number;
          invoices_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          case_number?: string;
          status?: 'draft' | 'in_progress' | 'paused' | 'delayed' | 'completed' | 'cancelled';
          patient_name?: string;
          patient_id?: string | null;
          patient_dob?: string | null;
          patient_phone?: string | null;
          patient_email?: string | null;
          insurance_id?: string | null;
          insurance_policy_number?: string | null;
          client_id?: string | null;
          assigned_to?: string | null;
          is_medical?: boolean;
          is_documented?: boolean;
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          complaints?: string | null;
          needs?: string | null;
          diagnosis?: string | null;
          treatment_notes?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          total_service_cost?: number;
          total_assistance_cost?: number;
          total_commission_cost?: number;
          actions_count?: number;
          documents_count?: number;
          invoices_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      case_actions: {
        Row: {
          id: string;
          case_id: string;
          executor_id: string | null;
          service_name: string;
          service_description: string | null;
          service_cost: number;
          service_currency: 'GEL' | 'USD' | 'EUR';
          assistance_cost: number;
          assistance_currency: 'GEL' | 'USD' | 'EUR';
          commission_cost: number;
          commission_currency: 'GEL' | 'USD' | 'EUR';
          service_date: string | null;
          comment: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          executor_id?: string | null;
          service_name: string;
          service_description?: string | null;
          service_cost?: number;
          service_currency?: 'GEL' | 'USD' | 'EUR';
          assistance_cost?: number;
          assistance_currency?: 'GEL' | 'USD' | 'EUR';
          commission_cost?: number;
          commission_currency?: 'GEL' | 'USD' | 'EUR';
          service_date?: string | null;
          comment?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          executor_id?: string | null;
          service_name?: string;
          service_description?: string | null;
          service_cost?: number;
          service_currency?: 'GEL' | 'USD' | 'EUR';
          assistance_cost?: number;
          assistance_currency?: 'GEL' | 'USD' | 'EUR';
          commission_cost?: number;
          commission_currency?: 'GEL' | 'USD' | 'EUR';
          service_date?: string | null;
          comment?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          type: 'patient' | 'original' | 'medical';
          file_name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          thumbnail_url: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          type: 'patient' | 'original' | 'medical';
          file_name: string;
          file_url: string;
          file_size?: number | null;
          mime_type?: string | null;
          thumbnail_url?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          type?: 'patient' | 'original' | 'medical';
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          mime_type?: string | null;
          thumbnail_url?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          status: 'draft' | 'unpaid' | 'paid' | 'cancelled';
          case_id: string;
          sender_id: string;
          recipient_id: string;
          recipient_email: string | null;
          cc_emails: string[] | null;
          language: 'en' | 'ka';
          currency: 'GEL' | 'USD' | 'EUR';
          subtotal: number;
          franchise_amount: number;
          franchise_type: 'fixed' | 'percentage';
          franchise_value: number;
          total: number;
          email_subject: string | null;
          email_body: string | null;
          pdf_url: string | null;
          pdf_generated_at: string | null;
          attach_patient_docs: boolean;
          attach_original_docs: boolean;
          attach_medical_docs: boolean;
          notes: string | null;
          paid_at: string | null;
          payment_reference: string | null;
          send_count: number;
          last_sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          status?: 'draft' | 'unpaid' | 'paid' | 'cancelled';
          case_id: string;
          sender_id: string;
          recipient_id: string;
          recipient_email?: string | null;
          cc_emails?: string[] | null;
          language?: 'en' | 'ka';
          currency?: 'GEL' | 'USD' | 'EUR';
          subtotal?: number;
          franchise_amount?: number;
          franchise_type?: 'fixed' | 'percentage';
          franchise_value?: number;
          total?: number;
          email_subject?: string | null;
          email_body?: string | null;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          attach_patient_docs?: boolean;
          attach_original_docs?: boolean;
          attach_medical_docs?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          payment_reference?: string | null;
          send_count?: number;
          last_sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          status?: 'draft' | 'unpaid' | 'paid' | 'cancelled';
          case_id?: string;
          sender_id?: string;
          recipient_id?: string;
          recipient_email?: string | null;
          cc_emails?: string[] | null;
          language?: 'en' | 'ka';
          currency?: 'GEL' | 'USD' | 'EUR';
          subtotal?: number;
          franchise_amount?: number;
          franchise_type?: 'fixed' | 'percentage';
          franchise_value?: number;
          total?: number;
          email_subject?: string | null;
          email_body?: string | null;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          attach_patient_docs?: boolean;
          attach_original_docs?: boolean;
          attach_medical_docs?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          payment_reference?: string | null;
          send_count?: number;
          last_sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      invoice_services: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
          total: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
      };
      invoice_sends: {
        Row: {
          id: string;
          invoice_id: string;
          sent_by: string | null;
          email: string;
          cc_emails: string[] | null;
          subject: string | null;
          body: string | null;
          status: string;
          resend_id: string | null;
          error_message: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          is_resend: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          sent_by?: string | null;
          email: string;
          cc_emails?: string[] | null;
          subject?: string | null;
          body?: string | null;
          status?: string;
          resend_id?: string | null;
          error_message?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          is_resend?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          sent_by?: string | null;
          email?: string;
          cc_emails?: string[] | null;
          subject?: string | null;
          body?: string | null;
          status?: string;
          resend_id?: string | null;
          error_message?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          is_resend?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          link: string | null;
          metadata: Json | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          link?: string | null;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          link?: string | null;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          entity_name: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          last_active_at: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'manager' | 'assistant' | 'accountant';
      case_status: 'draft' | 'in_progress' | 'paused' | 'delayed' | 'completed' | 'cancelled';
      invoice_status: 'draft' | 'unpaid' | 'paid' | 'cancelled';
      currency_code: 'GEL' | 'USD' | 'EUR';
      document_type: 'patient' | 'original' | 'medical';
      invoice_language: 'en' | 'ka';
      notification_type:
        | 'info'
        | 'success'
        | 'warning'
        | 'error'
        | 'case_assigned'
        | 'invoice_paid'
        | 'invoice_failed'
        | 'case_updated'
        | 'system';
    };
  };
};

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
