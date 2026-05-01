import type { MainStackParamList } from '@/navigation/types';
import type { Notification } from '@/types';

import type { MemberWalletActivityItem } from '@/services/memberWalletService';

type WalletNavigationTarget =
  | { screen: 'Payments'; params?: MainStackParamList['Payments'] }
  | { screen: 'PaymentHistory'; params?: MainStackParamList['PaymentHistory'] }
  | { screen: 'WalletDepositStatus'; params: MainStackParamList['WalletDepositStatus'] }
  | { screen: 'WalletWithdrawalStatus'; params: MainStackParamList['WalletWithdrawalStatus'] }
  | { screen: 'WalletWithdrawalDetail'; params: MainStackParamList['WalletWithdrawalDetail'] }
  | { screen: 'WalletTransactionDetail'; params: MainStackParamList['WalletTransactionDetail'] }
  | { screen: 'PendingPaymentDetail'; params: MainStackParamList['PendingPaymentDetail'] }
  | { screen: 'Receipt'; params: MainStackParamList['Receipt'] }
  | { screen: 'ContributionDetails'; params: MainStackParamList['ContributionDetails'] }
  | { screen: 'LoanDetail'; params: MainStackParamList['LoanDetail'] }
  | { screen: 'Penalties'; params?: MainStackParamList['Penalties'] };

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const buildWalletTransactionId = (payload: Record<string, any>) => {
  const explicit = pickString(
    payload.transactionId,
    payload.transaction_id,
    payload.transactionRef,
    payload.transaction_ref
  );
  if (explicit) {
    return explicit;
  }

  const intentId = pickString(
    payload.intentId,
    payload.intent_id,
    payload.payment_intent_id,
    payload.paymentId,
    payload.payment_id
  );
  if (intentId) {
    return `payment_${intentId}`;
  }

  const ledgerId = pickString(payload.ledgerEntryId, payload.ledger_entry_id);
  if (ledgerId) {
    return `ledger_${ledgerId}`;
  }

  return undefined;
};

export const resolveMemberWalletActivityTarget = (
  item: Pick<MemberWalletActivityItem, 'transactionId' | 'type' | 'intentId'> & {
    chamaId?: string | null;
  },
  source: MainStackParamList['WalletTransactionDetail']['source'] = 'wallet_activity'
): WalletNavigationTarget => {
  if (item.type === 'wallet_deposit' && item.intentId) {
    return {
      screen: 'WalletDepositStatus',
      params: {
        intentId: item.intentId,
        chamaId: item.chamaId || undefined,
        source: source === 'notifications' ? 'notifications' : 'wallet_activity',
      },
    };
  }

  if (item.type === 'wallet_withdrawal' && item.intentId) {
    return {
      screen: 'WalletWithdrawalDetail',
      params: {
        intentId: item.intentId,
        chamaId: item.chamaId || undefined,
        source: source === 'notifications' ? 'notifications' : 'wallet_activity',
      },
    };
  }

  return {
    screen: 'WalletTransactionDetail',
    params: {
      transactionId: item.transactionId,
      chamaId: item.chamaId || undefined,
      source,
    },
  };
};

export const resolveWalletReceiptTarget = (
  item: Pick<
    MemberWalletActivityItem,
    | 'intentId'
    | 'receiptAvailable'
    | 'receiptReady'
    | 'contributionId'
    | 'loanId'
    | 'installmentId'
    | 'targetLabel'
    | 'purposeLabel'
    | 'type'
  > & {
    chamaId?: string | null;
  }
): WalletNavigationTarget | null => {
  if (!item.intentId || !item.receiptAvailable || !item.receiptReady) {
    return null;
  }

  const paymentPurposeType =
    item.type === 'wallet_deposit'
      ? 'wallet_deposit'
      : item.type === 'wallet_withdrawal'
      ? 'wallet_withdrawal'
      :
    item.type === 'loan_repayment'
      ? 'loan_repayment'
      : item.type === 'fine_payment'
      ? 'fine_payment'
      : 'contribution';

  return {
    screen: 'Receipt',
    params: {
      intentId: item.intentId,
      chamaId: item.chamaId || undefined,
      paymentPurposeType,
      paymentPurposeLabel: item.purposeLabel,
      contributionId: item.contributionId || undefined,
      loanId: item.loanId || undefined,
      installmentId: item.installmentId || undefined,
      targetLabel: item.targetLabel || undefined,
    },
  };
};

export const resolveMemberWalletNotificationTarget = (
  notification: Notification
): WalletNavigationTarget | null => {
  const payload = notification.data || {};
  const type = String(notification.type || '').toLowerCase();
  const chamaId = pickString(notification.chama_id, payload.chama_id, payload.chamaId);
  const transactionId = buildWalletTransactionId(payload);
  const intentId = pickString(
    payload.intentId,
    payload.intent_id,
    payload.payment_intent_id,
    payload.paymentId,
    payload.payment_id
  );
  const contributionId = pickString(payload.contributionId, payload.contribution_id);
  const loanId = pickString(payload.loanId, payload.loan_id);
  const installmentId = pickString(payload.installmentId, payload.installment_id);
  const penaltyId = pickString(payload.penaltyId, payload.penalty_id);
  const amount = pickString(payload.amount, payload.total_amount) || '0';
  const currency = pickString(payload.currency) || 'KES';
  const targetLabel = pickString(payload.targetLabel, payload.target_label, payload.reference_label);

  if (
    ['wallet_deposit_success', 'deposit_success', 'wallet_receipt_ready'].includes(type) &&
    intentId
  ) {
    return {
      screen: 'Receipt',
      params: {
        intentId,
        chamaId,
        paymentPurposeType: 'wallet_deposit',
        paymentPurposeLabel: 'Deposit to Wallet',
        targetLabel: 'My wallet',
      },
    };
  }

  if (
    ['wallet_deposit_pending', 'deposit_pending', 'wallet_deposit_failed', 'deposit_failed'].includes(
      type
    ) &&
    intentId
  ) {
    return {
      screen: 'WalletDepositStatus',
      params: {
        intentId,
        chamaId,
        source: 'notifications',
      },
    };
  }

  if (
    [
      'wallet_withdrawal_submitted',
      'withdrawal_submitted',
      'wallet_withdrawal_pending',
      'withdrawal_pending',
      'wallet_withdrawal_completed',
      'withdrawal_completed',
      'wallet_withdrawal_failed',
      'withdrawal_failed',
      'wallet_withdrawal_rejected',
      'withdrawal_rejected',
    ].includes(type) &&
    intentId
  ) {
    return {
      screen: 'WalletWithdrawalDetail',
      params: {
        intentId,
        chamaId,
        source: 'notifications',
      },
    };
  }

  if (
    ['payment_received', 'receipt_ready', 'contribution_payment_received'].includes(type) &&
    intentId
  ) {
    return {
      screen: 'Receipt',
      params: {
        intentId,
        chamaId,
        paymentPurposeType: loanId ? 'loan_repayment' : penaltyId ? 'fine_payment' : 'contribution',
        paymentPurposeLabel: pickString(payload.paymentPurposeLabel, payload.payment_purpose_label),
        contributionId,
        loanId,
        installmentId,
        targetLabel,
      },
    };
  }

  if (
    [
      'payment_pending',
      'pending_payment_updated',
      'contribution_payment_pending',
      'wallet_pending_transaction',
    ].includes(type)
  ) {
    if (transactionId) {
      return {
        screen: 'WalletTransactionDetail',
        params: {
          transactionId,
          chamaId,
          source: 'notifications',
        },
      };
    }

    if (!intentId) {
      return null;
    }

    return {
      screen: 'PendingPaymentDetail',
      params: {
        intentId,
        chamaId,
        amount,
        currency,
        purpose: pickString(payload.purpose) || (loanId ? 'loan_repayment' : 'contribution'),
        paymentPurposeType: loanId ? 'loan_repayment' : penaltyId ? 'fine_payment' : 'contribution',
        paymentPurposeLabel:
          pickString(payload.paymentPurposeLabel, payload.payment_purpose_label) ||
          (loanId ? 'Loan repayment' : penaltyId ? 'Fine payment' : 'Contribution'),
        contributionId,
        loanId,
        installmentId,
        penaltyId,
        targetLabel,
        paymentMethod: pickString(payload.paymentMethod, payload.payment_method),
      },
    };
  }

  if (['contribution_posted', 'contribution_recorded'].includes(type) && contributionId) {
    return {
      screen: 'ContributionDetails',
      params: {
        contributionId,
        chamaId,
      },
    };
  }

  if (
    ['loan_repayment_recorded', 'repayment_recorded', 'loan_disbursement_recorded'].includes(type) &&
    loanId
  ) {
    return {
      screen: 'LoanDetail',
      params: {
        loanId,
        chamaId,
      },
    };
  }

  if (
    [
      'wallet_balance_updated',
      'wallet_activity_posted',
      'wallet_adjustment_posted',
      'payment_failed',
      'failed_payment_notice',
    ].includes(type)
  ) {
    if (transactionId) {
      return {
        screen: 'WalletTransactionDetail',
        params: {
          transactionId,
          chamaId,
          source: 'notifications',
        },
      };
    }

    return {
      screen: 'Payments',
      params: {
        chamaId,
        entryPoint: 'notifications',
      },
    };
  }

  if (
    ['contribution_due', 'contribution_reminder', 'contribution_overdue', 'loan_repayment_due', 'loan_repayment_reminder'].includes(
      type
    )
  ) {
    return {
      screen: 'Payments',
      params: {
        chamaId,
        entryPoint: 'notifications',
        preselectedPurpose: type.startsWith('loan') ? 'loan_repayment' : 'contribution',
        contributionId,
        loanId,
        installmentId,
        amount,
        dueDate: pickString(payload.dueDate, payload.due_date),
        targetLabel,
      },
    };
  }

  return null;
};
