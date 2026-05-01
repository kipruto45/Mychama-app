import type {
  MemberLoanApplicationState,
  MemberLoanEligibilityState,
  MemberLoanState,
} from '@/services/memberLoanService';
import { colors } from '@/theme';

export const getLoanEligibilityMeta = (state: MemberLoanEligibilityState) => {
  switch (state) {
    case 'eligible':
      return {
        label: 'Eligible',
        accent: colors.success,
        tone: 'success' as const,
        icon: 'check-decagram',
      };
    case 'partially_eligible':
      return {
        label: 'Needs attention',
        accent: colors.warning,
        tone: 'warning' as const,
        icon: 'progress-alert',
      };
    case 'not_eligible':
      return {
        label: 'Not eligible',
        accent: colors.error,
        tone: 'error' as const,
        icon: 'close-octagon',
      };
    default:
      return {
        label: 'Checking',
        accent: colors.info,
        tone: 'info' as const,
        icon: 'progress-clock',
      };
  }
};

export const getLoanApplicationMeta = (state: MemberLoanApplicationState) => {
  switch (state) {
    case 'submitted_pending_review':
      return {
        label: 'Pending review',
        accent: colors.warning,
        tone: 'warning' as const,
        icon: 'progress-clock',
      };
    case 'approved':
      return {
        label: 'Approved',
        accent: colors.success,
        tone: 'success' as const,
        icon: 'check-circle',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        accent: colors.error,
        tone: 'error' as const,
        icon: 'close-circle',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        accent: colors.neutral[500],
        tone: 'info' as const,
        icon: 'close-octagon-outline',
      };
    default:
      return {
        label: 'Draft',
        accent: colors.info,
        tone: 'info' as const,
        icon: 'file-document-edit-outline',
      };
  }
};

export const getLoanStateMeta = (state: MemberLoanState) => {
  switch (state) {
    case 'active':
      return {
        label: 'Active loan',
        accent: colors.success,
        tone: 'success' as const,
        icon: 'bank-check',
      };
    case 'pending_application':
      return {
        label: 'Pending application',
        accent: colors.warning,
        tone: 'warning' as const,
        icon: 'progress-clock',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        accent: colors.error,
        tone: 'error' as const,
        icon: 'alert-circle',
      };
    case 'completed':
      return {
        label: 'Completed',
        accent: colors.success,
        tone: 'success' as const,
        icon: 'check-all',
      };
    default:
      return {
        label: 'No active loan',
        accent: colors.neutral[500],
        tone: 'info' as const,
        icon: 'bank-off-outline',
      };
  }
};

export const getLoanStatusTone = (status: string) => {
  const lowered = String(status || '').toLowerCase();
  if (['approved', 'active', 'disbursed', 'paid', 'cleared', 'closed'].includes(lowered)) {
    return 'success' as const;
  }
  if (['rejected', 'overdue', 'defaulted', 'written_off'].includes(lowered)) {
    return 'error' as const;
  }
  if (['submitted', 'in_review', 'treasurer_approved', 'committee_approved', 'due_soon'].includes(lowered)) {
    return 'warning' as const;
  }
  return 'info' as const;
};

export const formatLoanPurposeLabel = (value?: string | null) => {
  const trimmed = String(value || '').trim();
  return trimmed || 'General purpose';
};

export const sanitizeLoanAmountInput = (value: string) => value.replace(/[^0-9.]/g, '');

export const buildDurationOptions = (minMonths: number, maxMonths: number) => {
  const min = Math.max(1, Number(minMonths || 1));
  const max = Math.max(min, Number(maxMonths || min));
  const range = max - min;

  if (range <= 6) {
    return Array.from({ length: range + 1 }, (_, index) => min + index);
  }

  const step = range <= 12 ? 2 : 3;
  const options: number[] = [];
  for (let month = min; month <= max; month += step) {
    options.push(month);
  }

  if (!options.includes(max)) {
    options.push(max);
  }

  return Array.from(new Set(options)).sort((left, right) => left - right);
};

export const purposeSuggestions = [
  'Business boost',
  'School fees',
  'Emergency support',
  'Household need',
  'Development plan',
];

export const splitPurposeAndNote = (value?: string | null) => {
  const raw = String(value || '');
  const [purpose, ...rest] = raw.split('\n\n');
  return {
    purpose: purpose.trim(),
    note: rest.join('\n\n').trim(),
  };
};
