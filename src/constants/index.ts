export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.my-cham-a.app/api';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/auth/register',
    LOGOUT: '/v1/auth/logout',
    OTP_REQUEST: '/v1/auth/otp/request',
    OTP_VERIFY: '/v1/auth/otp/verify',
    PROFILE: '/v1/auth/me',
    PASSWORD_RESET: '/v1/auth/password-reset/request',
    PASSWORD_RESET_CONFIRM: '/v1/auth/password-reset/confirm',
    PASSWORD_CHANGE: '/v1/auth/change-password',
    TOKEN_REFRESH: '/v1/auth/refresh',
  },
  
  // Chamas
  CHAMAS: {
    LIST: '/v1/chamas/',
    DETAIL: (id: string) => `/v1/chamas/${id}/`,
    MEMBERS: (id: string) => `/v1/chamas/${id}/members/`,
    MEMBER: (id: string, memberId: string) => `/v1/chamas/${id}/members/${memberId}/`,
    MEMBER_ROLE: (id: string, memberId: string) => `/v1/chamas/${id}/members/${memberId}/role/`,
    REQUEST_JOIN: (id: string) => `/v1/chamas/${id}/request-join/`,
    MEMBERSHIP_REQUESTS: (id: string) => `/v1/chamas/${id}/membership-requests/`,
    APPROVE_REQUEST: (id: string, requestId: string) => `/v1/chamas/${id}/membership-requests/${requestId}/approve/`,
    REJECT_REQUEST: (id: string, requestId: string) => `/v1/chamas/${id}/membership-requests/${requestId}/reject/`,
    INVITE_LINKS: (id: string) => `/v1/chamas/${id}/invite-links/`,
    REVOKE_INVITE: (id: string, linkId: string) => `/v1/chamas/${id}/invite-links/${linkId}/revoke/`,
  },
  
  // Finance
  FINANCE: {
    CONTRIBUTIONS: (chamaId: string) => `/v1/finance/contributions/?chama_id=${chamaId}`,
    CONTRIBUTION_TYPES: (chamaId: string) => `/v1/finance/contribution-types/?chama_id=${chamaId}`,
    LOANS: (chamaId: string) => `/v1/finance/loans/?chama_id=${chamaId}`,
    LOAN: (_chamaId: string, loanId: string) => `/v1/finance/loans/${loanId}`,
    APPROVE_LOAN: (_chamaId: string, loanId: string) => `/v1/finance/loans/${loanId}/approve`,
    REJECT_LOAN: (_chamaId: string, loanId: string) => `/v1/finance/loans/${loanId}/reject`,
    DISBURSE_LOAN: (_chamaId: string, loanId: string) => `/v1/finance/loans/${loanId}/disburse`,
    WALLET: (chamaId: string) => `/v1/finance/wallet?chama_id=${chamaId}`,
    LEDGER: (chamaId: string) => `/v1/finance/ledger?chama_id=${chamaId}`,
    PENALTIES: (_chamaId: string) => `/v1/finance/statement`,
    RESOLVE_PENALTY: (_chamaId: string, penaltyId: string) => `/v1/finance/penalties/${penaltyId}/mark-paid`,
    SUMMARY: (chamaId: string) => `/v1/finance/dashboard?chama_id=${chamaId}`,
  },
  
  // Payments
  PAYMENTS: {
    LIST: '/v1/payments/my/transactions',
    DETAIL: (id: string) => `/v1/payments/intents/${id}`,
    METHODS: '/v1/payments/allocation-rule',
    MPESA_INITIATE: '/v1/payments/deposit/stk/initiate',
    MPESA_STATUS: '/v1/payments/my/transactions',
  },
  
  // Meetings
  MEETINGS: {
    LIST: '/v1/meetings/',
    DETAIL: (id: string) => `/v1/meetings/${id}/`,
    ATTENDANCE: (id: string) => `/v1/meetings/${id}/attendance/`,
    MINUTES: (id: string) => `/v1/meetings/${id}/minutes/`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/v1/notifications/mobile',
    DETAIL: (id: string) => `/v1/notifications/${id}`,
    MARK_ALL_READ: '/v1/notifications/mobile/mark-all-read',
    PREFERENCES: '/v1/notifications/preferences',
    PUSH_TOKEN: '/v1/notifications/devices/register',
  },
  
  // AI
  AI: {
    CHAT: '/ai/chat/',
    CHAT_HISTORY: '/ai/conversations/',
    INSIGHTS: '/ai/insights/',
    SUGGESTIONS: '/ai/public/suggestions/',
    FINANCIAL_ANALYSIS: '/ai/risk-profile/',
    MEMBER_RISK: '/ai/membership-risk-scoring/',
    FRAUD_DETECTION: '/ai/fraud-flags/',
  },
  
  // Invites
  INVITES: {
    LOOKUP: '/v1/invites/lookup',
    ACCEPT: '/v1/invites/accept/',
    CREATE: '/v1/invites/create',
    REVOKE: '/v1/invites/revoke',
  },
};

export const COLORS = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};

export const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS' },
];

export const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Malindi', 'Kitale', 'Thika', 'Machakos', 'Nyeri',
  'Meru', 'Embu', 'Kakamega', 'Kericho', 'Kisii',
  'Bungoma', 'Busia', 'Siaya', 'Homabay', 'Migori',
  'Nyandarua', 'Nandi', 'Baringo', 'Laikipia', 'Samburu',
  'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'West Pokot',
  'Turkana', 'Marsabit', 'Isiolo', 'Mandera', 'Wajir',
  'Garissa', 'Tana River', 'Lamu', 'Kilifi', 'Kwale',
  'Taita Taveta', 'Kajiado', 'Makueni', 'Kitui', 'Nyamira',
  'Vihiga', 'Bomet', 'Narok',
];

export const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-Pesa', icon: 'phone', color: '#4CAF50' },
  { id: 'cash', name: 'Cash', icon: 'cash', color: '#FF9800' },
];

export const CONTRIBUTION_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

export const MEMBER_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'admin', label: 'Admin' },
];

export const LOAN_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'approved', label: 'Approved', color: '#10B981' },
  { value: 'disbursed', label: 'Disbursed', color: '#3B82F6' },
  { value: 'repaid', label: 'Repaid', color: '#10B981' },
  { value: 'defaulted', label: 'Defaulted', color: '#EF4444' },
];

export const MEETING_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: '#3B82F6' },
  { value: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
];

export const NOTIFICATION_TYPES = [
  { value: 'contribution_due', label: 'Contribution Due', icon: 'cash' },
  { value: 'meeting_reminder', label: 'Meeting Reminder', icon: 'calendar' },
  { value: 'announcement', label: 'Announcement', icon: 'bullhorn' },
  { value: 'payment_received', label: 'Payment Received', icon: 'check-circle' },
  { value: 'loan_approved', label: 'Loan Approved', icon: 'check-circle' },
];
