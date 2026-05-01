import { financeService } from './financeService';
import { memberContributionService, type MemberContributionWorkspace } from './memberContributionService';
import { memberLoanService, type MemberLoanWorkspace } from './memberLoanService';
import { memberWalletService } from './memberWalletService';
import {
  paymentService,
  type PaymentIntentRecord,
  type UnifiedPaymentIntentRecord,
  type UnifiedPaymentReceiptRecord,
  type UnifiedPaymentStatusRecord,
} from './paymentService';

export type MemberPaymentPurposeType =
  | 'contribution'
  | 'loan_repayment'
  | 'fine_payment'
  | 'one_time_charge'
  | 'wallet_deposit'
  | 'wallet_withdrawal';

export type MemberPaymentMethodType =
  | 'mpesa'
  | 'paybill'
  | 'wallet_balance'
  | 'bank_transfer_placeholder';

export type MemberPaymentProcessingState =
  | 'not_started'
  | 'reviewing'
  | 'initiated'
  | 'processing'
  | 'success'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface MemberPaymentHistoryItem {
  id: string;
  intentId: string;
  chamaId?: string;
  purpose: string;
  purposeType: MemberPaymentPurposeType;
  purposeLabel: string;
  amount: string;
  currency: string;
  status: string;
  processingState: MemberPaymentProcessingState;
  paymentMethod: string;
  reference: string;
  targetLabel?: string;
  date: string;
  receiptAvailable: boolean;
  feeAmount?: string;
  totalAmount?: string;
  failureReason?: string | null;
  contributionId?: string | null;
  contributionTypeId?: string | null;
  contributionTypeName?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  penaltyId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface MemberPaymentMethodOption {
  type: MemberPaymentMethodType;
  label: string;
  description: string;
  enabled: boolean;
  badge?: string;
  balance?: string | null;
}

export interface MemberPaymentPurposeOption {
  type: MemberPaymentPurposeType;
  title: string;
  description: string;
  amount?: string;
  currency: string;
  statusLabel?: string;
  targetLabel?: string;
  contributionTypeId?: string;
  contributionTypeName?: string;
  contributionId?: string;
  loanId?: string;
  installmentId?: string;
  penaltyId?: string;
  dueDate?: string | null;
}

export interface MemberPaymentsHub {
  currency: string;
  methods: MemberPaymentMethodOption[];
  recentPayments: MemberPaymentHistoryItem[];
  pendingPayments: MemberPaymentHistoryItem[];
  failedPayments: MemberPaymentHistoryItem[];
  latestSuccessfulPayment: MemberPaymentHistoryItem | null;
  purposeOptions: MemberPaymentPurposeOption[];
  summaries: {
    recentCount: number;
    pendingCount: number;
    pendingTotal: string;
    failedCount: number;
  };
  linked: {
    contributions: MemberContributionWorkspace | null;
    loans: MemberLoanWorkspace | null;
  };
}

export interface InitiateMemberPaymentInput {
  chamaId: string;
  amount: string;
  currency?: string;
  paymentMethod: 'mpesa' | 'wallet_balance';
  purposeType: MemberPaymentPurposeType;
  phone?: string;
  contributionId?: string;
  contributionTypeId?: string;
  contributionTypeName?: string;
  loanId?: string;
  installmentId?: string;
  penaltyId?: string;
  targetLabel?: string;
  description?: string;
}

const normalizePurposeType = (purpose: string): MemberPaymentPurposeType => {
  const lowered = String(purpose || '').toLowerCase();
  if (lowered === 'loan_repayment') return 'loan_repayment';
  if (['fine', 'penalty', 'fine_payment'].includes(lowered)) return 'fine_payment';
  if (['contribution', 'special_contribution'].includes(lowered)) return 'contribution';
  return 'one_time_charge';
};

const normalizeProcessingState = (status: string): MemberPaymentProcessingState => {
  const lowered = String(status || '').toLowerCase();
  if (['success', 'reconciled', 'partially_refunded', 'refunded', 'completed'].includes(lowered)) {
    return 'success';
  }
  if (lowered === 'initiated') return 'initiated';
  if (['pending', 'pending_authentication', 'pending_verification', 'pending_callback'].includes(lowered)) {
    return 'pending';
  }
  if (lowered === 'processing') return 'processing';
  if (['cancelled'].includes(lowered)) return 'cancelled';
  if (['expired'].includes(lowered)) return 'expired';
  if (lowered === 'failed') return 'failed';
  return 'processing';
};

const formatPurposeLabel = (
  purposeType: MemberPaymentPurposeType,
  payment: Pick<MemberPaymentHistoryItem, 'contributionTypeName' | 'targetLabel'>
) => {
  if (purposeType === 'loan_repayment') {
    return payment.targetLabel || 'Loan repayment';
  }
  if (purposeType === 'fine_payment') {
    return payment.targetLabel || 'Fine payment';
  }
  if (purposeType === 'contribution') {
    return payment.contributionTypeName || payment.targetLabel || 'Contribution';
  }
  return payment.targetLabel || 'Payment';
};

const mapUnifiedPayment = (payment: UnifiedPaymentIntentRecord): MemberPaymentHistoryItem => {
  const purposeType = normalizePurposeType(payment.purpose);
  const metadata = (payment.metadata || {}) as Record<string, unknown>;
  const contributionId =
    String(metadata.contribution_id || metadata.business_record_id || payment.contribution || '') || null;
  const contributionTypeId = String(metadata.contribution_type_id || '') || null;
  const contributionTypeName = String(
    payment.contribution_type || metadata.contribution_type_name || metadata.type_name || ''
  ) || null;
  const loanId = String(metadata.loan_id || metadata.loanId || '') || null;
  const installmentId = String(metadata.installment_id || metadata.installmentId || '') || null;
  const penaltyId = String(metadata.penalty_id || metadata.penaltyId || '') || null;
  const targetLabel =
    String(
      metadata.target_label ||
        metadata.installment_label ||
        metadata.loan_reference ||
        metadata.reference_label ||
        ''
    ) || undefined;

  const item: MemberPaymentHistoryItem = {
    id: payment.id,
    intentId: payment.id,
    chamaId: payment.chama,
    purpose: payment.purpose,
    purposeType,
    purposeLabel: '',
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    processingState: normalizeProcessingState(payment.status),
    paymentMethod: payment.payment_method || payment.provider || 'mpesa',
    reference: payment.reference || payment.provider_intent_id || payment.id,
    targetLabel,
    date: payment.completed_at || payment.created_at,
    receiptAvailable: ['success', 'reconciled', 'partially_refunded', 'refunded'].includes(
      String(payment.status || '').toLowerCase()
    ),
    feeAmount: String(metadata.fee_amount || '') || undefined,
    totalAmount: String(metadata.total_amount || '') || undefined,
    failureReason: payment.failure_reason,
    contributionId,
    contributionTypeId,
    contributionTypeName,
    loanId,
    installmentId,
    penaltyId,
    metadata,
  };

  item.purposeLabel = formatPurposeLabel(purposeType, item);
  return item;
};

const buildMethodOptions = async (
  chamaId: string,
  currency: string
): Promise<MemberPaymentMethodOption[]> => {
  const wallet = await financeService.getWallet(chamaId).catch(() => null);
  const walletBalance = wallet ? Number(wallet.available_balance || 0) : 0;
  const walletEnabled = Boolean(wallet && Number.isFinite(walletBalance) && walletBalance > 0);

  return [
    {
      type: 'mpesa',
      label: 'M-Pesa',
      description: 'Pay securely with an STK push to your phone.',
      enabled: true,
    },
    {
      type: 'paybill',
      label: 'Paybill instructions',
      description: 'Reference instructions will be added for direct paybill payments.',
      enabled: false,
      badge: 'Soon',
    },
    {
      type: 'wallet_balance',
      label: 'Wallet balance',
      description: wallet
        ? walletEnabled
          ? `Pay instantly from your wallet. Available ${wallet.available_balance} ${currency}.`
          : `Add funds to your wallet to pay instantly. Available ${wallet.available_balance} ${currency}.`
        : 'Your wallet is not available right now.',
      enabled: walletEnabled,
      balance: wallet?.available_balance || null,
    },
    {
      type: 'bank_transfer_placeholder',
      label: 'Bank transfer',
      description: 'Bank transfer instructions will be added in a future release.',
      enabled: false,
      badge: 'Soon',
    },
  ];
};

const buildContributionPurposeOption = (
  workspace: MemberContributionWorkspace | null,
  currency: string
): MemberPaymentPurposeOption | null => {
  const obligation = workspace?.obligations?.find((item) =>
    ['overdue', 'due', 'partially_paid', 'upcoming'].includes(item.state)
  );

  if (!obligation) {
    return workspace
      ? {
          type: 'contribution',
          title: 'Pay contribution',
          description: 'You’re fully paid for this cycle.',
          amount: workspace.summary.remaining_balance || '0',
          currency,
          statusLabel: 'Up to date',
          targetLabel: workspace.summary.next_due_date || undefined,
        }
      : null;
  }

  return {
    type: 'contribution',
    title: 'Pay contribution',
    description: 'Complete your current contribution securely.',
    amount: obligation.remaining_amount || obligation.required_amount,
    currency,
    statusLabel: obligation.state.replace(/_/g, ' '),
    targetLabel: obligation.contribution_type_name,
    contributionTypeId: obligation.contribution_type_id,
    contributionTypeName: obligation.contribution_type_name,
    contributionId: undefined,
    dueDate: obligation.due_date,
  };
};

const buildLoanPurposeOption = (
  workspace: MemberLoanWorkspace | null,
  currency: string
): MemberPaymentPurposeOption | null => {
  if (!workspace?.active_loan) {
    return null;
  }

  const targetInstallment = workspace.active_loan.next_installment;
  return {
    type: 'loan_repayment',
    title: 'Repay loan',
    description: 'Pay your next installment or outstanding balance.',
    amount: targetInstallment?.expected_amount || workspace.summary.next_repayment_amount || workspace.active_loan.outstanding_balance,
    currency,
    statusLabel: workspace.active_loan.status.replace(/_/g, ' '),
    targetLabel: targetInstallment
      ? `Due ${targetInstallment.due_date}`
      : 'Active loan repayment',
    loanId: workspace.active_loan.id,
    installmentId: targetInstallment?.id,
    dueDate: targetInstallment?.due_date || workspace.active_loan.due_date,
  };
};

const buildFinePurposeOption = (
  workspace: MemberContributionWorkspace | null,
  currency: string
): MemberPaymentPurposeOption | null => {
  const penalty = workspace?.penalties.items?.find(
    (item) => Number(item.outstanding_amount || item.amount || 0) > 0
  );

  if (!penalty) {
    return null;
  }

  return {
    type: 'fine_payment',
    title: 'Pay fine',
    description: 'Clear any member fines without leaving payments.',
    amount: penalty.outstanding_amount || penalty.amount,
    currency,
    statusLabel: penalty.status,
    targetLabel: penalty.reason || penalty.issued_reason || 'Fine / Penalty',
    penaltyId: penalty.id,
    dueDate: penalty.due_date,
  };
};

const toPaymentIntentRecordFromUnified = (intent: UnifiedPaymentIntentRecord): PaymentIntentRecord => ({
  id: String(intent.id),
  chama: String(intent.chama || ''),
  user: intent.user ? String(intent.user) : undefined,
  intent_type: String(intent.payment_method || intent.provider || '').toLowerCase(),
  payment_method: String(intent.payment_method || '').toLowerCase(),
  purpose: String(intent.purpose || '').toLowerCase(),
  reference_type: '',
  reference_id: String(intent.reference || intent.id || ''),
  reference: String(intent.reference || intent.provider_intent_id || intent.id || ''),
  amount: String(intent.amount || '0.00'),
  currency: String(intent.currency || 'KES'),
  phone: undefined,
  status: String(intent.status || '').toLowerCase(),
  failure_reason: intent.failure_reason || null,
  raw_response: null,
  metadata: (intent.metadata || {}) as Record<string, any>,
  created_at: String(intent.created_at || ''),
  updated_at: String(intent.updated_at || ''),
});

export const memberPaymentsService = {
  async getPaymentsHub(chamaId: string): Promise<MemberPaymentsHub> {
    const [history, contributionWorkspace, loanWorkspace] = await Promise.all([
      paymentService.getUnifiedPaymentHistory({ chama_id: chamaId, limit: 100 }),
      memberContributionService.getWorkspace(chamaId).catch(() => null),
      memberLoanService.getWorkspace(chamaId).catch(() => null),
    ]);

    const currency =
      contributionWorkspace?.summary.currency ||
      loanWorkspace?.summary.currency ||
      'KES';
    const mappedHistory = history.map(mapUnifiedPayment).sort((left, right) => {
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });
    const pendingPayments = mappedHistory.filter((item) =>
      ['pending', 'initiated', 'processing'].includes(item.processingState)
    );
    const failedPayments = mappedHistory.filter((item) =>
      ['failed', 'cancelled', 'expired'].includes(item.processingState)
    );
    const latestSuccessfulPayment =
      mappedHistory.find((item) => item.processingState === 'success') || null;

    return {
      currency,
      methods: await buildMethodOptions(chamaId, currency),
      recentPayments: mappedHistory.slice(0, 5),
      pendingPayments,
      failedPayments,
      latestSuccessfulPayment,
      purposeOptions: [
        buildContributionPurposeOption(contributionWorkspace, currency),
        buildLoanPurposeOption(loanWorkspace, currency),
        buildFinePurposeOption(contributionWorkspace, currency),
      ].filter(Boolean) as MemberPaymentPurposeOption[],
      summaries: {
        recentCount: mappedHistory.length,
        pendingCount: pendingPayments.length,
        pendingTotal: pendingPayments
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)
          .toFixed(2),
        failedCount: failedPayments.length,
      },
      linked: {
        contributions: contributionWorkspace,
        loans: loanWorkspace,
      },
    };
  },

  async getPaymentHistory(chamaId: string): Promise<MemberPaymentHistoryItem[]> {
    const rows = await paymentService.getUnifiedPaymentHistory({ chama_id: chamaId, limit: 100 });
    return rows.map(mapUnifiedPayment).sort((left, right) => {
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });
  },

  async getPaymentMethods(chamaId: string, currency = 'KES'): Promise<MemberPaymentMethodOption[]> {
    return buildMethodOptions(chamaId, currency);
  },

  async initiatePayment(input: InitiateMemberPaymentInput): Promise<PaymentIntentRecord> {
    if (input.paymentMethod === 'wallet_balance') {
      if (input.purposeType === 'contribution') {
        if (!input.contributionTypeId) {
          throw new Error('Contribution type is required for wallet payments.');
        }
        const flow = await memberWalletService.createContribution({
          chamaId: input.chamaId,
          contributionTypeId: input.contributionTypeId,
          amount: input.amount,
        });
        const status = await paymentService.getUnifiedPaymentStatus(flow.intentId);
        return toPaymentIntentRecordFromUnified(status.intent);
      }

      throw new Error('Wallet payments are currently available for contributions only.');
    }

    const purpose =
      input.purposeType === 'fine_payment'
        ? 'fine'
        : input.purposeType === 'loan_repayment'
        ? 'loan_repayment'
        : input.purposeType;
    const purposeId =
      input.purposeType === 'loan_repayment'
        ? input.loanId
        : input.purposeType === 'fine_payment'
        ? input.penaltyId
        : input.contributionId || input.contributionTypeId;

    return paymentService.createPaymentIntent({
      chama_id: input.chamaId,
      amount: input.amount,
      currency: input.currency || 'KES',
      payment_method: input.paymentMethod,
      purpose,
      purpose_id: purposeId,
      contribution_id: input.contributionId,
      contribution_type_id: input.contributionTypeId,
      description:
        input.description ||
        (input.purposeType === 'loan_repayment'
          ? `Loan repayment for ${input.targetLabel || 'your active loan'}`
          : input.purposeType === 'fine_payment'
          ? `Fine payment for ${input.targetLabel || 'your chama account'}`
          : `${input.contributionTypeName || 'Contribution'} payment`),
      phone: input.phone || '',
      metadata: {
        payment_purpose_type: input.purposeType,
        contribution_type_id: input.contributionTypeId,
        contribution_type_name: input.contributionTypeName,
        loan_id: input.loanId,
        installment_id: input.installmentId,
        penalty_id: input.penaltyId,
        target_label: input.targetLabel,
        source: 'mobile_member_payments_flow',
      },
    });
  },

  async getPaymentStatus(intentId: string): Promise<UnifiedPaymentStatusRecord> {
    return paymentService.getUnifiedPaymentStatus(intentId);
  },

  async refreshPaymentStatus(intentId: string): Promise<UnifiedPaymentStatusRecord> {
    const status = await paymentService.getUnifiedPaymentStatus(intentId);
    if (
      ['initiated', 'pending', 'pending_authentication', 'pending_verification', 'processing'].includes(
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

  mapPaymentHistoryItem: mapUnifiedPayment,
  normalizePurposeType,
  normalizeProcessingState,
};
