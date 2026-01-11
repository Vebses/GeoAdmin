// Case status configuration
export const CASE_STATUS = {
  draft: {
    label: 'დრაფტი',
    labelEn: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-400',
  },
  in_progress: {
    label: 'მიმდინარე',
    labelEn: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  paused: {
    label: 'შეჩერებული',
    labelEn: 'Paused',
    color: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  delayed: {
    label: 'დაგვიანებული',
    labelEn: 'Delayed',
    color: 'bg-orange-100 text-orange-700',
    dotColor: 'bg-orange-500',
  },
  completed: {
    label: 'დასრულებული',
    labelEn: 'Completed',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'გაუქმებული',
    labelEn: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-500',
  },
} as const;

// Invoice status configuration
export const INVOICE_STATUS = {
  draft: {
    label: 'დრაფტი',
    labelEn: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-400',
  },
  unpaid: {
    label: 'გადაუხდელი',
    labelEn: 'Unpaid',
    color: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  paid: {
    label: 'გადახდილი',
    labelEn: 'Paid',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'გაუქმებული',
    labelEn: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-500',
  },
} as const;

// Priority configuration
export const PRIORITY = {
  low: {
    label: 'დაბალი',
    labelEn: 'Low',
    color: 'bg-gray-100 text-gray-700',
  },
  normal: {
    label: 'ჩვეულებრივი',
    labelEn: 'Normal',
    color: 'bg-blue-100 text-blue-700',
  },
  high: {
    label: 'მაღალი',
    labelEn: 'High',
    color: 'bg-orange-100 text-orange-700',
  },
  urgent: {
    label: 'სასწრაფო',
    labelEn: 'Urgent',
    color: 'bg-red-100 text-red-700',
  },
} as const;

// User roles
export const USER_ROLES = {
  manager: {
    label: 'მენეჯერი',
    labelEn: 'Manager',
  },
  assistant: {
    label: 'ასისტენტი',
    labelEn: 'Assistant',
  },
  accountant: {
    label: 'ბუღალტერი',
    labelEn: 'Accountant',
  },
} as const;

// Document types
export const DOCUMENT_TYPES = {
  patient: {
    label: 'პაციენტის დოკუმენტი',
    labelEn: 'Patient Document',
  },
  original: {
    label: 'ორიგინალი',
    labelEn: 'Original',
  },
  medical: {
    label: 'სამედიცინო',
    labelEn: 'Medical',
  },
} as const;

// Currency options
export const CURRENCIES = [
  { value: 'GEL', label: '₾ GEL', symbol: '₾' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
] as const;

// Languages
export const LANGUAGES = [
  { value: 'ka', label: 'ქართული' },
  { value: 'en', label: 'English' },
] as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  CASES: '/cases',
  INVOICES: '/invoices',
  PARTNERS: '/partners',
  CATEGORIES: '/categories',
  OUR_COMPANIES: '/our-companies',
  USERS: '/users',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TRASH: '/trash',
} as const;
