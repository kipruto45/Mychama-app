import type { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme';
import type {
  MemberWalletActivityItem,
  WalletDepositState,
  WalletActivityFilterKey,
  WalletActivityType,
  WalletBalanceState,
  WalletWithdrawalState,
  WalletTransactionState,
} from '@/services/memberWalletService';

export const WALLET_ACTIVITY_FILTERS: Array<{
  key: WalletActivityFilterKey;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'loan_repayments', label: 'Loan Repayments' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

export const getWalletBalanceStateMeta = (state: WalletBalanceState) => {
  switch (state) {
    case 'pending_update':
      return {
        title: 'Your wallet is updating.',
        description: 'Some payments are still being confirmed.',
        icon: 'progress-clock',
        tint: colors.warning,
      };
    case 'zero_balance':
      return {
        title: 'Your available balance is zero.',
        description: 'Track inflows, outflows, and upcoming obligations from here.',
        icon: 'wallet-outline',
        tint: colors.neutral[500],
      };
    case 'temporarily_unavailable':
      return {
        title: 'We couldn’t load your wallet right now. Please try again.',
        description: 'Your wallet details will appear once the connection is restored.',
        icon: 'cloud-alert-outline',
        tint: colors.error,
      };
    default:
      return {
        title: 'Your wallet balance at a glance.',
        description: 'Track inflows, outflows, and recent activity.',
        icon: 'wallet-bifold',
        tint: colors.success,
      };
  }
};

export const getWalletActivityIcon = (type: WalletActivityType, direction: 'inflow' | 'outflow') => {
  switch (type) {
    case 'wallet_deposit':
      return 'arrow-bottom-left-bold-box';
    case 'wallet_withdrawal':
      return 'arrow-top-right-bold-box';
    case 'wallet_transfer':
      return direction === 'inflow' ? 'account-arrow-left' : 'account-arrow-right';
    case 'payout':
      return 'gift-outline';
    case 'contribution_payment':
      return 'cash-minus';
    case 'loan_repayment':
      return 'cash-sync';
    case 'loan_disbursement':
      return 'bank-check';
    case 'fine_payment':
      return 'shield-alert-outline';
    case 'pending_transaction':
      return 'progress-clock';
    default:
      return direction === 'inflow' ? 'arrow-bottom-left' : 'arrow-top-right';
  }
};

export const getWalletActivityTypeSupportingText = (type: WalletActivityType) => {
  switch (type) {
    case 'wallet_deposit':
      return 'Wallet deposit';
    case 'wallet_withdrawal':
      return 'Wallet withdrawal';
    case 'wallet_transfer':
      return 'Wallet transfer';
    case 'payout':
      return 'Payout';
    case 'contribution_payment':
      return 'Contribution payment';
    case 'loan_repayment':
      return 'Loan repayment';
    case 'loan_disbursement':
      return 'Loan disbursement';
    case 'fine_payment':
      return 'Fine payment';
    case 'pending_transaction':
      return 'Pending payment';
    default:
      return 'Wallet movement';
  }
};

export const getWalletTransactionStateMeta = (state: WalletTransactionState) => {
  switch (state) {
    case 'success':
      return {
        chipVariant: 'success' as const,
        chipLabel: 'Successful',
        icon: 'check-decagram',
        tint: colors.success,
      };
    case 'pending':
      return {
        chipVariant: 'warning' as const,
        chipLabel: 'Pending',
        icon: 'progress-clock',
        tint: colors.warning,
      };
    case 'failed':
      return {
        chipVariant: 'error' as const,
        chipLabel: 'Failed',
        icon: 'close-circle-outline',
        tint: colors.error,
      };
    case 'reversed':
      return {
        chipVariant: 'secondary' as const,
        chipLabel: 'Reversed',
        icon: 'backup-restore',
        tint: colors.info,
      };
    default:
      return {
        chipVariant: 'secondary' as const,
        chipLabel: 'Cancelled',
        icon: 'cancel',
        tint: colors.neutral[500],
      };
  }
};

export const getWalletDepositStateMeta = (state: WalletDepositState) => {
  switch (state) {
    case 'success':
      return {
        title: 'Your deposit was received successfully.',
        description: 'Your wallet balance will reflect the new funds right away.',
        icon: 'check-decagram',
        tint: colors.success,
        chipVariant: 'success' as const,
        chipLabel: 'Successful',
      };
    case 'failed':
      return {
        title: 'We couldn’t complete this deposit.',
        description: 'Try again when you are ready or choose a different funding method.',
        icon: 'close-circle-outline',
        tint: colors.error,
        chipVariant: 'error' as const,
        chipLabel: 'Failed',
      };
    case 'cancelled':
      return {
        title: 'This deposit was cancelled.',
        description: 'You can restart the deposit whenever you are ready.',
        icon: 'cancel',
        tint: colors.neutral[500],
        chipVariant: 'secondary' as const,
        chipLabel: 'Cancelled',
      };
    default:
      return {
        title: 'This transaction is still being processed.',
        description: 'We are still confirming the transaction with the payment provider.',
        icon: 'progress-clock',
        tint: colors.warning,
        chipVariant: 'warning' as const,
        chipLabel: 'Pending',
      };
  }
};

export const getWalletWithdrawalStateMeta = (state: WalletWithdrawalState) => {
  switch (state) {
    case 'approved_completed':
      return {
        title: 'Your withdrawal was completed successfully.',
        description: 'Your wallet balance has been updated to reflect the payout.',
        icon: 'check-decagram',
        tint: colors.success,
        chipVariant: 'success' as const,
        chipLabel: 'Completed',
      };
    case 'failed':
      return {
        title: 'We couldn’t complete this withdrawal.',
        description: 'Your funds will remain safe in your wallet while we retry or review the request.',
        icon: 'close-circle-outline',
        tint: colors.error,
        chipVariant: 'error' as const,
        chipLabel: 'Failed',
      };
    case 'rejected':
      return {
        title: 'This withdrawal request was not approved.',
        description: 'Review the latest status message for more context before trying again.',
        icon: 'alert-circle-outline',
        tint: colors.error,
        chipVariant: 'error' as const,
        chipLabel: 'Rejected',
      };
    case 'cancelled':
      return {
        title: 'This withdrawal request was cancelled.',
        description: 'You can create a new request whenever you are ready.',
        icon: 'cancel',
        tint: colors.neutral[500],
        chipVariant: 'secondary' as const,
        chipLabel: 'Cancelled',
      };
    case 'submitted':
    case 'pending_processing':
    default:
      return {
        title: 'Your withdrawal request has been submitted.',
        description: 'This transaction is still being processed.',
        icon: 'progress-clock',
        tint: colors.warning,
        chipVariant: 'warning' as const,
        chipLabel: 'Pending',
      };
  }
};

export type MemberWalletLinkedTarget =
  | { screen: 'ContributionDetails'; params: MainStackParamList['ContributionDetails'] }
  | { screen: 'LoanDetail'; params: MainStackParamList['LoanDetail'] }
  | { screen: 'Penalties'; params: MainStackParamList['Penalties'] };

export const resolveWalletLinkedTarget = (item: {
  chamaId?: string | null;
  contributionId?: string | null;
  loanId?: string | null;
  penaltyId?: string | null;
  type?: WalletActivityType | null;
}) => {
  if (item.loanId) {
    return {
      screen: 'LoanDetail',
      params: { loanId: item.loanId, chamaId: item.chamaId || undefined },
    } satisfies MemberWalletLinkedTarget;
  }

  if (item.contributionId) {
    return {
      screen: 'ContributionDetails',
      params: { contributionId: item.contributionId, chamaId: item.chamaId || undefined },
    } satisfies MemberWalletLinkedTarget;
  }

  if (item.penaltyId || item.type === 'fine_payment') {
    return {
      screen: 'Penalties',
      params: { chamaId: item.chamaId || undefined },
    } satisfies MemberWalletLinkedTarget;
  }

  return null;
};

export const matchesWalletFilter = (
  item: MemberWalletActivityItem,
  filter: WalletActivityFilterKey
) => {
  switch (filter) {
    case 'deposits':
      return item.type === 'wallet_deposit';
    case 'withdrawals':
      return item.type === 'wallet_withdrawal';
    case 'transfers':
      return item.type === 'wallet_transfer';
    case 'contributions':
      return item.type === 'contribution_payment' || item.type === 'fine_payment';
    case 'loan_repayments':
      return item.type === 'loan_repayment';
    case 'pending':
      return item.status === 'pending';
    case 'failed':
      return ['failed', 'reversed', 'cancelled'].includes(item.status);
    default:
      return true;
  }
};
