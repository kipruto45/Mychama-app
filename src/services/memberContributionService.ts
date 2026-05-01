import { apiClient } from './api';
import { financeService } from './financeService';
import {
  paymentService,
  type PaymentIntentRecord,
  type UnifiedPaymentReceiptRecord,
  type UnifiedPaymentStatusRecord,
  type UnifiedPaymentIntentRecord,
} from './paymentService';
import type { Contribution, ContributionType, Penalty, Wallet } from '@/types';

export type ContributionObligationState =
  | 'not_due_yet'
  | 'upcoming'
  | 'due'
  | 'partially_paid'
  | 'fully_paid'
  | 'overdue';

export type ContributionPaymentState =
  | 'not_started'
  | 'initiated'
  | 'processing'
  | 'success'
  | 'pending'
  | 'failed'
  | 'cancelled';

export type ContributionItemType =
  | 'monthly'
  | 'welfare'
  | 'development'
  | 'special'
  | 'one_time'
  | 'fine_or_penalty';

export interface MemberContributionSummary {
  currency: string;
  total_contributed: string;
  current_cycle_amount: string;
  remaining_balance: string;
  next_due_date: string | null;
  required_amount: string;
  paid_amount: string;
  remaining_amount: string;
}

export interface MemberContributionObligation {
  contribution_type_id: string;
  contribution_type_name: string;
  frequency: string;
  required_amount: string;
  paid_amount: string;
  remaining_amount: string;
  total_paid: string;
  due_date: string | null;
  cycle_start_date: string | null;
  next_due_date: string | null;
  state: ContributionObligationState;
  latest_payment_date: string | null;
  latest_receipt_code: string | null;
}

export interface MemberContributionPreview {
  contribution_type_id: string;
  contribution_type_name: string;
  due_date: string;
  required_amount: string;
  remaining_amount: string;
  state: ContributionObligationState;
}

export interface MemberContributionBreakdownItem {
  contribution_type_id: string;
  contribution_type_name: string;
  paid_total: string;
  current_cycle_due: string;
  current_cycle_paid: string;
  outstanding_amount: string;
  state: ContributionObligationState;
}

export interface MemberContributionScheduleItem {
  id: string;
  contribution_type_id: string;
  contribution_type_name: string;
  frequency: string;
  cycle_label: string;
  due_date: string;
  expected_amount: string;
  paid_amount: string;
  remaining_amount: string;
  status: 'upcoming' | 'paid' | 'overdue' | 'due';
}

export interface MemberContributionPenaltyPreview {
  id: string;
  category: string;
  amount: string;
  status: string;
  due_date: string;
  issued_reason: string;
  reason?: string;
  outstanding_amount: string;
}

export interface MemberContributionWorkspace {
  summary: MemberContributionSummary;
  obligations: MemberContributionObligation[];
  recent_contributions: Array<Record<string, any>>;
  upcoming_preview: MemberContributionPreview[];
  breakdown: MemberContributionBreakdownItem[];
  schedule: MemberContributionScheduleItem[];
  penalties: {
    count: number;
    outstanding_total: string;
    items: MemberContributionPenaltyPreview[];
  };
  pending_payment: UnifiedPaymentIntentRecord | null;
  rules: {
    due_day?: number;
    grace_period_days?: number;
    frequency?: string | null;
    default_amount?: string;
  };
}

export interface MemberContributionDetail {
  contribution: Record<string, any>;
  payment_intent: UnifiedPaymentIntentRecord | null;
  receipt: UnifiedPaymentReceiptRecord | null;
  note: string;
  cycle_month: string;
  status: string;
}

export interface ContributionHistoryItem {
  id: string;
  contributionId?: string | null;
  intentId?: string | null;
  typeName: string;
  itemType: ContributionItemType;
  amount: string;
  currency: string;
  status: string;
  paymentState: ContributionPaymentState;
  date: string;
  reference: string;
  paymentMethod: string;
  failureReason?: string | null;
}

export interface InitiateContributionPaymentInput {
  chamaId: string;
  amount: string;
  contributionTypeId?: string;
  contributionTypeName: string;
  paymentMethod: 'mpesa';
  phone: string;
  penaltyId?: string;
  description?: string;
}

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const normalizeContributionItemType = (label: string): ContributionItemType => {
  const lower = label.toLowerCase();
  if (lower.includes('welfare')) return 'welfare';
  if (lower.includes('development')) return 'development';
  if (lower.includes('special')) return 'special';
  if (lower.includes('penalt') || lower.includes('fine')) return 'fine_or_penalty';
  if (lower.includes('one')) return 'one_time';
  return 'monthly';
};

const normalizePaymentState = (status: string): ContributionPaymentState => {
  if (['success', 'reconciled', 'refunded', 'partially_refunded'].includes(status)) {
    return 'success';
  }
  if (['initiated'].includes(status)) {
    return 'initiated';
  }
  if (['pending', 'pending_authentication', 'pending_verification'].includes(status)) {
    return 'pending';
  }
  if (['cancelled', 'expired'].includes(status)) {
    return 'cancelled';
  }
  if (['failed'].includes(status)) {
    return 'failed';
  }
  return 'processing';
};

const deriveContributionTypeName = (
  payment: UnifiedPaymentIntentRecord,
  contributionTypesById: Record<string, ContributionType>
) => {
  if (payment.contribution_type) {
    return payment.contribution_type;
  }

  const contributionTypeId = String(payment.metadata?.contribution_type_id || '');
  if (contributionTypeId && contributionTypesById[contributionTypeId]) {
    return contributionTypesById[contributionTypeId].name;
  }

  if (payment.purpose === 'fine') {
    return 'Fine / Penalty';
  }

  return payment.description || 'Contribution';
};

export const memberContributionService = {
  async getWorkspace(chamaId: string): Promise<MemberContributionWorkspace> {
    const response = await apiClient.get<unknown>(
      `/v1/finance/member-contributions/workspace?chama_id=${chamaId}`
    );
    return unwrapData<MemberContributionWorkspace>(response);
  },

  async getContributionTypes(chamaId: string): Promise<ContributionType[]> {
    return financeService.getContributionTypes(chamaId);
  },

  async getContributionDetail(contributionId: string): Promise<MemberContributionDetail> {
    const response = await apiClient.get<unknown>(`/v1/finance/contributions/${contributionId}/`);
    return unwrapData<MemberContributionDetail>(response);
  },

  async getContributionSchedule(chamaId: string): Promise<MemberContributionScheduleItem[]> {
    const workspace = await this.getWorkspace(chamaId);
    return workspace.schedule;
  },

  async getContributionBreakdown(chamaId: string): Promise<MemberContributionBreakdownItem[]> {
    const workspace = await this.getWorkspace(chamaId);
    return workspace.breakdown;
  },

  async getPenalties(chamaId: string): Promise<Penalty[]> {
    const response = await apiClient.get<Array<Record<string, any>>>(
      `/v1/finance/member-contributions/penalties?chama_id=${chamaId}`
    );
    return response.map((payload) => ({
      id: String(payload.id),
      chama: chamaId,
      member: null,
      member_id: undefined,
      member_name: undefined,
      category: String(payload.category || 'penalty'),
      category_display: 'Penalty',
      amount: String(payload.amount || '0.00'),
      reason: String(payload.reason || payload.issued_reason || ''),
      issued_reason: payload.issued_reason || payload.reason || '',
      due_date: String(payload.due_date || ''),
      status: String(payload.status || '').toLowerCase(),
      status_display: String(payload.status || '').replace(/_/g, ' '),
      issued_by: null,
      issued_by_name: null,
      resolved_by: null,
      resolved_at: payload.resolved_at || null,
      paid_at: payload.resolved_at || null,
      waived_at: null,
      outstanding_amount: String(payload.outstanding_amount || payload.amount || '0.00'),
      dispute_reason: null,
      dispute_resolution: null,
      payments: undefined,
    }));
  },

  async getWallet(chamaId: string): Promise<Wallet | null> {
    try {
      return await financeService.getWallet(chamaId);
    } catch {
      return null;
    }
  },

  async getContributionHistory(chamaId: string): Promise<ContributionHistoryItem[]> {
    const [payments, contributionTypes, contributions] = await Promise.all([
      paymentService.getUnifiedPaymentHistory({ chama_id: chamaId, limit: 100 }),
      financeService.getContributionTypes(chamaId).catch(() => []),
      financeService.getContributions(chamaId).catch(() => []),
    ]);

    const contributionTypesById = contributionTypes.reduce<Record<string, ContributionType>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

    const paymentRows = payments
      .filter((item) =>
        ['contribution', 'fine', 'special_contribution'].includes(String(item.purpose || '').toLowerCase())
      )
      .map((item) => {
        const typeName = deriveContributionTypeName(item, contributionTypesById);
        return {
          id: item.id,
          contributionId: item.contribution || item.metadata?.business_record_id || null,
          intentId: item.id,
          typeName,
          itemType: normalizeContributionItemType(typeName),
          amount: item.amount,
          currency: item.currency,
          status: item.status,
          paymentState: normalizePaymentState(item.status),
          date: item.completed_at || item.created_at,
          reference: item.reference,
          paymentMethod: item.payment_method,
          failureReason: item.failure_reason,
        };
      });

    const seenContributionIds = new Set(
      paymentRows
        .map((item) => String(item.contributionId || ''))
        .filter(Boolean)
    );

    const contributionRows: ContributionHistoryItem[] = (contributions as Contribution[])
      .filter((item) => !seenContributionIds.has(String(item.id)))
      .map((item) => {
        const typeName = String(item.contribution_type_name || 'Contribution');
        return {
          id: `contribution_${item.id}`,
          contributionId: String(item.id),
          intentId: null,
          typeName,
          itemType: normalizeContributionItemType(typeName),
          amount: String(item.amount || '0.00'),
          currency: 'KES',
          status: 'success',
          paymentState: 'success',
          date: String(item.date_paid || item.created_at || ''),
          reference: String(item.receipt_code || item.id),
          paymentMethod: String(item.method || 'cash'),
          failureReason: null,
        };
      });

    return [...paymentRows, ...contributionRows].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
    );
  },

  async initiateContributionPayment(
    input: InitiateContributionPaymentInput
  ): Promise<PaymentIntentRecord> {
    return paymentService.createPaymentIntent({
      chama_id: input.chamaId,
      amount: input.amount,
      currency: 'KES',
      payment_method: input.paymentMethod,
      purpose: input.penaltyId ? 'fine' : 'contribution',
      purpose_id: input.penaltyId,
      contribution_type_id: input.contributionTypeId,
      description:
        input.description ||
        `${input.penaltyId ? 'Penalty payment' : 'Contribution payment'} for ${input.contributionTypeName}`,
      phone: input.phone,
      metadata: {
        contribution_type_id: input.contributionTypeId,
        contribution_type_name: input.contributionTypeName,
        source: 'mobile_member_contribution_flow',
      },
    });
  },

  async getPaymentStatus(intentId: string): Promise<UnifiedPaymentStatusRecord> {
    return paymentService.getUnifiedPaymentStatus(intentId);
  },

  async refreshPaymentStatus(intentId: string): Promise<UnifiedPaymentStatusRecord> {
    const status = await paymentService.getUnifiedPaymentStatus(intentId);
    if (
      ['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(
        String(status.intent.status || '').toLowerCase()
      )
    ) {
      await paymentService.verifyUnifiedPayment(intentId).catch(() => null);
    }
    return paymentService.getUnifiedPaymentStatus(intentId);
  },

  async getReceipt(intentId: string): Promise<UnifiedPaymentReceiptRecord> {
    return paymentService.getUnifiedPaymentReceipt(intentId);
  },
};
