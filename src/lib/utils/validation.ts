import { z } from 'zod';
import { parsePhoneNumber, validatePhoneDigits } from './phone-config';

/**
 * Phone validation helper - validates international phone numbers
 * Accepts format like "+995 555 12 34 56" or "+49 151 12345678"
 */
const phoneValidation = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(''))
  .refine(
    (val) => {
      // Explicit check for all falsy values and non-strings
      if (val === undefined || val === null || val === '' || typeof val !== 'string') {
        return true; // Optional field - allow empty
      }
      const parsed = parsePhoneNumber(val);
      if (!parsed) return false;
      return validatePhoneDigits(parsed.countryCode, parsed.digits);
    },
    { message: 'არასწორი ტელეფონის ნომერი' }
  );

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'ელ-ფოსტა აუცილებელია')
    .email('არასწორი ელ-ფოსტის ფორმატი'),
  password: z
    .string()
    .min(1, 'პაროლი აუცილებელია')
    .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'ელ-ფოსტა აუცილებელია')
    .email('არასწორი ელ-ფოსტის ფორმატი'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო')
      .max(72, 'პაროლი ძალიან გრძელია')
      .regex(/[A-Z]/, 'პაროლი უნდა შეიცავდეს დიდ ასოს')
      .regex(/[a-z]/, 'პაროლი უნდა შეიცავდეს პატარა ასოს')
      .regex(/[0-9]/, 'პაროლი უნდა შეიცავდეს ციფრს'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'პაროლები არ ემთხვევა',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'მიმდინარე პაროლი აუცილებელია'),
    newPassword: z
      .string()
      .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო')
      .max(72, 'პაროლი ძალიან გრძელია')
      .regex(/[A-Z]/, 'პაროლი უნდა შეიცავდეს დიდ ასოს')
      .regex(/[a-z]/, 'პაროლი უნდა შეიცავდეს პატარა ასოს')
      .regex(/[0-9]/, 'პაროლი უნდა შეიცავდეს ციფრს'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'პაროლები არ ემთხვევა',
    path: ['confirmPassword'],
  });

// ============================================
// USER SCHEMAS
// ============================================

export const userProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'სახელი ძალიან გრძელია'),
  phone: phoneValidation,
});

export const createUserSchema = z.object({
  email: z.string().email('არასწორი ელ-ფოსტის ფორმატი'),
  full_name: z
    .string()
    .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'სახელი ძალიან გრძელია'),
  role: z.enum(['super_admin', 'manager', 'assistant', 'accountant']),
  is_active: z.boolean().default(true),
  phone: phoneValidation,
  password: z
    .string()
    .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო')
    .max(72, 'პაროლი ძალიან გრძელია')
    .regex(/[A-Z]/, 'პაროლი უნდა შეიცავდეს დიდ ასოს')
    .regex(/[a-z]/, 'პაროლი უნდა შეიცავდეს პატარა ასოს')
    .regex(/[0-9]/, 'პაროლი უნდა შეიცავდეს ციფრს'),
});

// ============================================
// PARTNER SCHEMAS
// ============================================

export const partnerSchema = z.object({
  name: z
    .string()
    .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'სახელი ძალიან გრძელია')
    .trim(),
  legal_name: z.string().max(200, 'იურიდიული სახელი ძალიან გრძელია').optional().nullable(),
  id_code: z
    .string()
    .regex(/^\d{9,11}$/, 'საიდენტიფიკაციო კოდი უნდა იყოს 9-11 ციფრი')
    .optional()
    .nullable()
    .or(z.literal('')),
  category_id: z.string().uuid().optional().nullable(),
  country: z.string().max(100).default('საქართველო'),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  email: z.string().email('არასწორი ელ-ფოსტა').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('არასწორი URL').optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
});

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'სახელი ძალიან გრძელია'),
  name_en: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'არასწორი ფერის კოდი').default('#6366f1'),
  icon: z.string().max(50).default('folder'),
});

// ============================================
// OUR COMPANY SCHEMAS
// ============================================

export const ourCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'სახელი ძალიან გრძელია'),
  legal_name: z
    .string()
    .min(2, 'იურიდიული სახელი აუცილებელია')
    .max(200, 'იურიდიული სახელი ძალიან გრძელია'),
  id_code: z
    .string()
    .min(9, 'საიდენტიფიკაციო კოდი აუცილებელია')
    .max(11, 'საიდენტიფიკაციო კოდი ძალიან გრძელია'),
  country: z.string().max(100).default('საქართველო'),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  email: z.string().email('არასწორი ელ-ფოსტა').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('არასწორი URL').optional().nullable().or(z.literal('')),
  bank_name: z.string().max(100).optional().nullable(),
  bank_code: z.string().max(20).optional().nullable(),
  account_gel: z.string().max(50).optional().nullable(),
  account_usd: z.string().max(50).optional().nullable(),
  account_eur: z.string().max(50).optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  signature_url: z.string().url().optional().nullable().or(z.literal('')),
  stamp_url: z.string().url().optional().nullable().or(z.literal('')),
  invoice_prefix: z.string().max(10).default('INV'),
  invoice_footer_text: z.string().max(1000).optional().nullable(),
  is_default: z.boolean().default(false),
});

// ============================================
// CASE SCHEMAS
// ============================================

export const caseSchema = z.object({
  case_number: z
    .string()
    .max(20, 'ქეისის ნომერი ძალიან გრძელია')
    .refine(
      (val) => !val || val.length === 0 || (val.length >= 3 && /^[A-Z0-9-]+$/.test(val)),
      'ქეისის ნომერი უნდა იყოს მინიმუმ 3 სიმბოლო (მხოლოდ დიდი ასოები, ციფრები და ტირე)'
    )
    .optional()
    .or(z.literal('')),
  status: z.enum(['draft', 'in_progress', 'paused', 'delayed', 'completed', 'cancelled']),
  patient_name: z
    .string()
    .min(2, 'პაციენტის სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
    .max(100, 'პაციენტის სახელი ძალიან გრძელია')
    .trim(),
  patient_id: z
    .string()
    .max(30, 'პირადი ნომერი ძალიან გრძელია')
    .optional()
    .nullable()
    .or(z.literal('')),
  patient_dob: z.coerce.date().max(new Date(), 'დაბადების თარიღი არ შეიძლება იყოს მომავალში').optional().nullable(),
  patient_phone: phoneValidation,
  patient_email: z.string().email('არასწორი ელ-ფოსტა').optional().nullable().or(z.literal('')),
  client_id: z.string().uuid().optional().nullable(),
  insurance_id: z.string().uuid().optional().nullable(),
  insurance_policy_number: z.string().max(50).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  is_medical: z.boolean().default(true),
  is_documented: z.boolean().default(false),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  complaints: z.string().max(5000, 'ტექსტი ძალიან გრძელია').optional().nullable(),
  needs: z.string().max(5000, 'ტექსტი ძალიან გრძელია').optional().nullable(),
  diagnosis: z.string().max(5000, 'ტექსტი ძალიან გრძელია').optional().nullable(),
  treatment_notes: z.string().max(5000, 'ტექსტი ძალიან გრძელია').optional().nullable(),
  opened_at: z.coerce.date().default(() => new Date()),
});

// ============================================
// INVOICE SCHEMAS
// ============================================
// CASE ACTION SCHEMAS
// ============================================

export const caseActionSchema = z.object({
  case_id: z.string().uuid('ქეისი აუცილებელია'),
  executor_id: z.string().uuid().optional().nullable(),
  service_name: z.string().min(1, 'სერვისის სახელი აუცილებელია').max(200, 'სერვისის სახელი ძალიან გრძელია'),
  service_description: z.string().max(1000, 'აღწერა ძალიან გრძელია').optional().nullable(),
  service_cost: z.coerce.number().min(0, 'ფასი არ შეიძლება იყოს უარყოფითი').default(0),
  service_currency: z.enum(['GEL', 'USD', 'EUR']).default('GEL'),
  assistance_cost: z.coerce.number().min(0, 'ფასი არ შეიძლება იყოს უარყოფითი').default(0),
  assistance_currency: z.enum(['GEL', 'USD', 'EUR']).default('GEL'),
  commission_cost: z.coerce.number().min(0, 'ფასი არ შეიძლება იყოს უარყოფითი').default(0),
  commission_currency: z.enum(['GEL', 'USD', 'EUR']).default('GEL'),
  service_date: z.coerce.date().optional().nullable(),
  comment: z.string().max(500, 'კომენტარი ძალიან გრძელია').optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const reorderActionsSchema = z.object({
  actions: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  })).min(1, 'მინიმუმ ერთი მოქმედება აუცილებელია'),
});

// ============================================
// CASE DOCUMENT SCHEMAS
// ============================================

export const caseDocumentSchema = z.object({
  case_id: z.string().uuid('ქეისი აუცილებელია'),
  type: z.enum(['patient', 'original', 'medical']),
  file_name: z.string().min(1, 'ფაილის სახელი აუცილებელია').max(255, 'ფაილის სახელი ძალიან გრძელია'),
  file_url: z.string().url('არასწორი URL'),
  file_size: z.coerce.number().int().min(0).optional().nullable(),
  mime_type: z.string().max(100).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
});

// ============================================

export const invoiceServiceSchema = z.object({
  description: z.string().min(1, 'სერვისის აღწერა აუცილებელია'),
  quantity: z.coerce.number().int().min(1, 'მინიმუმ 1').default(1),
  unit_price: z.coerce.number().min(0, 'ფასი არ შეიძლება იყოს უარყოფითი'),
  total: z.coerce.number(),
});

export const invoiceSchema = z.object({
  invoice_number: z
    .string()
    .max(30, 'ინვოისის ნომერი ძალიან გრძელია')
    .optional()
    .or(z.literal('')),
  case_id: z.string().uuid('აირჩიეთ ქეისი'),
  recipient_id: z.string().uuid('აირჩიეთ მიმღები'),
  sender_id: z.string().uuid('აირჩიეთ გამგზავნი'),
  status: z.enum(['draft', 'unpaid', 'paid', 'cancelled']).default('draft'),
  currency: z.enum(['GEL', 'USD', 'EUR']).default('EUR'),
  franchise_amount: z.coerce.number().min(0, 'ფრანშიზა არ შეიძლება იყოს უარყოფითი').max(999999.99, 'ფრანშიზა ძალიან დიდია').default(0),
  franchise_type: z.enum(['fixed', 'percentage']).default('fixed'),
  franchise_value: z.coerce.number().min(0).default(0),
  language: z.enum(['en', 'ka']).default('en'),
  recipient_email: z.string().email('არასწორი ელ-ფოსტა').optional().nullable(),
  cc_emails: z.array(z.string().email('არასწორი CC ელ-ფოსტა')).max(5, 'მაქსიმუმ 5 CC ელ-ფოსტა').optional(),
  email_subject: z.string().max(200, 'თემა ძალიან გრძელია').optional().nullable(),
  email_body: z.string().max(5000, 'ტექსტი ძალიან გრძელია').optional().nullable(),
  attach_patient_docs: z.boolean().default(false),
  attach_original_docs: z.boolean().default(false),
  attach_medical_docs: z.boolean().default(false),
  notes: z.string().max(2000, 'შენიშვნა ძალიან გრძელია').optional().nullable(),
  services: z.array(invoiceServiceSchema).min(1, 'მინიმუმ 1 სერვისი აუცილებელია'),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type PartnerFormData = z.infer<typeof partnerSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type OurCompanyFormData = z.infer<typeof ourCompanySchema>;
export type CaseFormData = z.infer<typeof caseSchema>;
export type CaseActionFormData = z.infer<typeof caseActionSchema>;
export type CaseDocumentFormData = z.infer<typeof caseDocumentSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type InvoiceServiceFormData = z.infer<typeof invoiceServiceSchema>;
