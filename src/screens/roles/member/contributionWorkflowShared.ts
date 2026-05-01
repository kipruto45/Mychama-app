import { colors } from '@/theme';
import type {
  ContributionObligationState,
  ContributionPaymentState,
  ContributionItemType,
} from '@/services/memberContributionService';

export const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('254')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `254${digits.slice(1)}`;
  }
  return `254${digits}`;
};

export const amountToDisplay = (value: string) =>
  Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const getObligationStateMeta = (state: ContributionObligationState) => {
  switch (state) {
    case 'fully_paid':
      return {
        label: 'Fully paid',
        variant: 'success' as const,
        tint: colors.success,
      };
    case 'partially_paid':
      return {
        label: 'Partially paid',
        variant: 'warning' as const,
        tint: colors.warning,
      };
    case 'overdue':
      return {
        label: 'Overdue',
        variant: 'error' as const,
        tint: colors.error,
      };
    case 'due':
      return {
        label: 'Due',
        variant: 'warning' as const,
        tint: colors.warning,
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        variant: 'info' as const,
        tint: colors.primary[500],
      };
    default:
      return {
        label: 'Not due yet',
        variant: 'secondary' as const,
        tint: colors.neutral[500],
      };
  }
};

export const getPaymentStateMeta = (state: ContributionPaymentState) => {
  switch (state) {
    case 'success':
      return {
        title: 'Your contribution was received successfully.',
        description: 'Your totals will update as soon as the payment settles on your chama account.',
        icon: 'check-decagram',
        tint: colors.success,
      };
    case 'pending':
    case 'processing':
    case 'initiated':
      return {
        title: 'Your payment is still processing.',
        description: 'We are still confirming the transaction with your provider.',
        icon: 'progress-clock',
        tint: colors.warning,
      };
    case 'cancelled':
      return {
        title: 'This payment was cancelled.',
        description: 'You can restart the contribution flow when you are ready.',
        icon: 'close-circle-outline',
        tint: colors.neutral[500],
      };
    default:
      return {
        title: 'We couldn’t complete your payment. Please try again.',
        description: 'Retry the contribution with the same amount or choose a new amount.',
        icon: 'alert-circle',
        tint: colors.error,
      };
  }
};

export const getContributionTypeIcon = (itemType: ContributionItemType | string) => {
  const normalized = String(itemType || '').toLowerCase();
  if (normalized.includes('welfare')) return 'heart-circle';
  if (normalized.includes('development')) return 'office-building';
  if (normalized.includes('special')) return 'star-circle';
  if (normalized.includes('fine') || normalized.includes('penalt')) return 'alert-octagon';
  if (normalized.includes('one')) return 'cash-fast';
  return 'calendar-month';
};

export const getContributionTypeColor = (itemType: ContributionItemType | string) => {
  const normalized = String(itemType || '').toLowerCase();
  if (normalized.includes('welfare')) return colors.info;
  if (normalized.includes('development')) return colors.primary[600];
  if (normalized.includes('special')) return colors.warning;
  if (normalized.includes('fine') || normalized.includes('penalt')) return colors.error;
  return colors.success;
};
