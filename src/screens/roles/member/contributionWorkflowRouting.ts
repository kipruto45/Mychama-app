import type { MainStackParamList } from '@/navigation/types';
import type { Notification } from '@/types';

type ContributionRouteName =
  | 'MemberContributions'
  | 'ContributionAlerts'
  | 'ContributionDetails'
  | 'PaymentStatus'
  | 'Receipt'
  | 'Penalties';

export type ContributionNavigationTarget = {
  screen: ContributionRouteName;
  params?:
    | MainStackParamList['MemberContributions']
    | MainStackParamList['ContributionAlerts']
    | MainStackParamList['ContributionDetails']
    | MainStackParamList['PaymentStatus']
    | MainStackParamList['Receipt']
    | MainStackParamList['Penalties'];
};

export interface ContributionPaymentNavigationInput {
  chamaId?: string;
  paymentId: string;
  intentId?: string | null;
  contributionId?: string | null;
  purpose?: string | null;
  status?: string | null;
  amount?: string | null;
  currency?: string | null;
  paymentMethod?: string | null;
  contributionTypeName?: string | null;
  penaltyId?: string | null;
  metadata?: Record<string, unknown> | null;
}

const contributionPurposeValues = ['contribution', 'special_contribution', 'fine', 'penalty'];
const contributionNotificationTypes = [
  'contribution_due',
  'contribution_reminder',
  'contribution_overdue',
  'contribution_payment_pending',
  'contribution_payment_failed',
  'contribution_payment_received',
  'payment_received',
  'payment_failed',
  'payment_pending',
  'fine_added',
  'penalty_added',
  'penalty_due',
  'penalty_overdue',
];

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

const normalizeStatus = (value?: string | null) => String(value || '').toLowerCase();

export const isContributionPurpose = (value?: string | null) => {
  const normalized = String(value || '').toLowerCase();
  return contributionPurposeValues.includes(normalized);
};

export const isContributionNotification = (notification: Notification) => {
  const type = normalizeStatus(notification.type);
  const category = normalizeStatus(notification.category || pickString(notification.data?.category));
  return contributionNotificationTypes.includes(type) || category === 'payments';
};

const buildNotificationStatusTarget = (
  notification: Notification,
  payload: Record<string, unknown>
): ContributionNavigationTarget | null => {
  const intentId = pickString(
    payload.intentId,
    payload.intent_id,
    payload.paymentIntentId,
    payload.payment_intent_id,
    payload.paymentId,
    payload.payment_id
  );

  if (!intentId) {
    return null;
  }

  const isFineLike =
    (isContributionPurpose(pickString(payload.purpose)) &&
      ['fine', 'penalty'].includes(normalizeStatus(pickString(payload.purpose)))) ||
    normalizeStatus(notification.type).includes('fine') ||
    normalizeStatus(notification.type).includes('penalty');

  return {
    screen: 'PaymentStatus',
    params: {
      intentId,
      amount: pickString(payload.amount, payload.payment_amount) || '0',
      currency: pickString(payload.currency) || 'KES',
      purpose: isFineLike ? 'fine' : 'contribution',
      contributionTypeName: pickString(
        payload.contributionTypeName,
        payload.contribution_type_name,
        payload.type_name,
        notification.title
      ),
      paymentMethod: pickString(payload.paymentMethod, payload.payment_method),
      failureReason: pickString(payload.failureReason, payload.failure_reason),
    },
  };
};

export const resolveContributionNotificationTarget = (
  notification: Notification
): ContributionNavigationTarget | null => {
  const payload = notification.data || {};
  const type = normalizeStatus(notification.type);
  const chamaId = pickString(notification.chama_id, payload.chamaId, payload.chama_id);
  const contributionId = pickString(payload.contributionId, payload.contribution_id);
  const penaltyId = pickString(payload.penaltyId, payload.penalty_id);
  const intentId = pickString(
    payload.intentId,
    payload.intent_id,
    payload.paymentIntentId,
    payload.payment_intent_id,
    payload.paymentId,
    payload.payment_id
  );

  switch (type) {
    case 'payment_received':
    case 'contribution_payment_received':
      return {
        screen: 'Receipt',
        params: {
          intentId,
          paymentId: intentId,
          chamaId,
          contributionId,
          contributionTypeName: pickString(
            payload.contributionTypeName,
            payload.contribution_type_name
          ),
        },
      };
    case 'payment_failed':
    case 'contribution_payment_failed':
    case 'payment_pending':
    case 'contribution_payment_pending':
      return buildNotificationStatusTarget(notification, payload);
    case 'fine_added':
    case 'penalty_added':
    case 'penalty_due':
    case 'penalty_overdue':
      return {
        screen: 'Penalties',
        params: {
          chamaId,
          suggestedAmount: pickString(payload.amount, payload.outstanding_amount),
          reason: pickString(payload.reason, payload.message),
          memberId: pickString(payload.memberId, payload.member_id),
        },
      };
    case 'contribution_due':
    case 'contribution_reminder':
    case 'contribution_overdue':
      if (contributionId) {
        return {
          screen: 'ContributionDetails',
          params: { contributionId, chamaId },
        };
      }
      return {
        screen: 'MemberContributions',
        params: { chamaId, entryPoint: 'notifications' },
      };
    default:
      if (penaltyId) {
        return {
          screen: 'Penalties',
          params: { chamaId },
        };
      }

      if (intentId) {
        return buildNotificationStatusTarget(notification, payload);
      }

      if (contributionId) {
        return {
          screen: 'ContributionDetails',
          params: { contributionId, chamaId },
        };
      }

      if (chamaId) {
        return {
          screen: 'MemberContributions',
          params: { chamaId, entryPoint: 'notifications' },
        };
      }

      return null;
  }
};

export const resolveContributionPaymentTarget = (
  payment: ContributionPaymentNavigationInput
): ContributionNavigationTarget | null => {
  if (!isContributionPurpose(payment.purpose)) {
    return null;
  }

  const status = normalizeStatus(payment.status);
  const contributionId = pickString(
    payment.contributionId,
    payment.metadata?.contribution_id,
    payment.metadata?.business_record_id
  );
  const intentId = pickString(payment.intentId, payment.paymentId);
  const chamaId = pickString(payment.chamaId, payment.metadata?.chama_id);

  if (status === 'success' || status === 'completed' || status === 'reconciled') {
    if (contributionId) {
      return {
        screen: 'ContributionDetails',
        params: { contributionId, chamaId },
      };
    }

    if (intentId) {
      return {
        screen: 'Receipt',
        params: {
          intentId,
          paymentId: payment.paymentId,
          chamaId,
          contributionId,
          contributionTypeName: payment.contributionTypeName || undefined,
        },
      };
    }
  }

  if (
    ['pending', 'initiated', 'processing', 'pending_authentication', 'pending_verification', 'failed', 'cancelled', 'expired'].includes(
      status
    ) &&
    intentId
  ) {
    return {
      screen: 'PaymentStatus',
      params: {
        intentId,
        amount: payment.amount || '0',
        currency: payment.currency || 'KES',
        purpose: payment.purpose === 'fine' || payment.purpose === 'penalty' ? 'fine' : 'contribution',
        contributionTypeName: payment.contributionTypeName || 'Contribution',
        paymentMethod: payment.paymentMethod || undefined,
      },
    };
  }

  if (payment.penaltyId || payment.purpose === 'fine' || payment.purpose === 'penalty') {
    return {
      screen: 'Penalties',
      params: { chamaId },
    };
  }

  return {
    screen: 'MemberContributions',
    params: { chamaId, entryPoint: 'payments' },
  };
};
