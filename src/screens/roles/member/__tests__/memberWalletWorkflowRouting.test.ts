import {
  resolveMemberWalletActivityTarget,
  resolveMemberWalletNotificationTarget,
  resolveWalletReceiptTarget,
} from '../memberWalletWorkflowRouting';
import {
  matchesWalletFilter,
  resolveWalletLinkedTarget,
} from '../memberWalletWorkflowShared';

const baseWalletItem = {
  id: 'payment_txn_1',
  transactionId: 'payment_txn_1',
  sourceType: 'payment' as const,
  intentId: 'txn_1',
  amount: '2450',
  currency: 'KES',
  direction: 'outflow' as const,
  type: 'contribution_payment' as const,
  typeLabel: 'Contribution payment',
  purposeLabel: 'April contribution',
  status: 'success' as const,
  statusLabel: 'Successful',
  reference: 'REF-001',
  date: '2026-04-20T10:00:00Z',
  receiptAvailable: true,
  receiptReady: true,
  refreshSupported: false,
  contributionId: 'contribution-1',
  targetLabel: 'April contribution',
};

describe('memberWalletWorkflowRouting', () => {
  it('routes wallet activity rows into wallet transaction detail', () => {
    expect(
      resolveMemberWalletActivityTarget(
        {
          transactionId: 'payment_txn_1',
          intentId: 'txn_1',
          type: 'contribution_payment',
          chamaId: 'chama-1',
        },
        'wallet_overview'
      )
    ).toEqual({
      screen: 'WalletTransactionDetail',
      params: {
        transactionId: 'payment_txn_1',
        chamaId: 'chama-1',
        source: 'wallet_overview',
      },
    });
  });

  it('routes wallet deposits into deposit status screens', () => {
    expect(
      resolveMemberWalletActivityTarget(
        {
          transactionId: 'payment_txn_2',
          intentId: 'txn_2',
          type: 'wallet_deposit',
          chamaId: 'chama-1',
        },
        'wallet_activity'
      )
    ).toEqual({
      screen: 'WalletDepositStatus',
      params: {
        intentId: 'txn_2',
        chamaId: 'chama-1',
        source: 'wallet_activity',
      },
    });
  });

  it('routes wallet withdrawals into withdrawal detail screens', () => {
    expect(
      resolveMemberWalletActivityTarget(
        {
          transactionId: 'payment_txn_3',
          intentId: 'txn_3',
          type: 'wallet_withdrawal',
          chamaId: 'chama-1',
        },
        'wallet_activity'
      )
    ).toEqual({
      screen: 'WalletWithdrawalDetail',
      params: {
        intentId: 'txn_3',
        chamaId: 'chama-1',
        source: 'wallet_activity',
      },
    });
  });

  it('routes receipt-capable items to the receipt screen', () => {
    expect(
      resolveWalletReceiptTarget({
        ...baseWalletItem,
        chamaId: 'chama-1',
      })
    ).toEqual({
      screen: 'Receipt',
      params: {
        intentId: 'txn_1',
        chamaId: 'chama-1',
        paymentPurposeType: 'contribution',
        paymentPurposeLabel: 'April contribution',
        contributionId: 'contribution-1',
        loanId: undefined,
        installmentId: undefined,
        targetLabel: 'April contribution',
      },
    });
  });

  it('routes pending notifications to wallet transaction detail when a transaction reference exists', () => {
    expect(
      resolveMemberWalletNotificationTarget({
        id: 'notification-1',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'pending_payment_updated',
        category: 'payments',
        title: 'Payment update',
        message: 'Your payment is still pending.',
        data: {
          transaction_id: 'payment_txn_7',
          amount: '1900',
          currency: 'KES',
          target_label: 'Loan installment',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'WalletTransactionDetail',
      params: {
        transactionId: 'payment_txn_7',
        chamaId: 'chama-7',
        source: 'notifications',
      },
    });
  });

  it('routes contribution posted notifications into linked contribution details', () => {
    expect(
      resolveMemberWalletNotificationTarget({
        id: 'notification-2',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'contribution_posted',
        category: 'payments',
        title: 'Contribution posted',
        message: 'Your contribution was posted.',
        data: {
          contribution_id: 'contribution-7',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'ContributionDetails',
      params: {
        contributionId: 'contribution-7',
        chamaId: 'chama-7',
      },
    });
  });

  it('routes wallet deposit notifications into wallet-specific destinations', () => {
    expect(
      resolveMemberWalletNotificationTarget({
        id: 'notification-deposit-success',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'deposit_success',
        category: 'payments',
        title: 'Deposit received',
        message: 'Your deposit was successful.',
        data: {
          intent_id: 'intent-deposit-success',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'Receipt',
      params: {
        intentId: 'intent-deposit-success',
        chamaId: 'chama-7',
        paymentPurposeType: 'wallet_deposit',
        paymentPurposeLabel: 'Deposit to Wallet',
        targetLabel: 'My wallet',
      },
    });

    expect(
      resolveMemberWalletNotificationTarget({
        id: 'notification-deposit-pending',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'deposit_pending',
        category: 'payments',
        title: 'Deposit pending',
        message: 'Your deposit is still being processed.',
        data: {
          intent_id: 'intent-deposit-pending',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'WalletDepositStatus',
      params: {
        intentId: 'intent-deposit-pending',
        chamaId: 'chama-7',
        source: 'notifications',
      },
    });
  });

  it('routes wallet withdrawal notifications into withdrawal detail', () => {
    expect(
      resolveMemberWalletNotificationTarget({
        id: 'notification-withdrawal',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'withdrawal_completed',
        category: 'payments',
        title: 'Withdrawal update',
        message: 'Your withdrawal is complete.',
        data: {
          intent_id: 'intent-withdrawal-1',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'WalletWithdrawalDetail',
      params: {
        intentId: 'intent-withdrawal-1',
        chamaId: 'chama-7',
        source: 'notifications',
      },
    });
  });
});

describe('memberWalletWorkflowShared', () => {
  it('filters wallet rows by required member wallet states', () => {
    expect(matchesWalletFilter(baseWalletItem, 'contributions')).toBe(true);
    expect(matchesWalletFilter(baseWalletItem, 'loan_repayments')).toBe(false);
    expect(matchesWalletFilter({ ...baseWalletItem, status: 'failed' }, 'failed')).toBe(true);
    expect(
      matchesWalletFilter({ ...baseWalletItem, type: 'wallet_deposit', direction: 'inflow' }, 'deposits')
    ).toBe(true);
    expect(
      matchesWalletFilter({ ...baseWalletItem, type: 'wallet_withdrawal' }, 'withdrawals')
    ).toBe(true);
  });

  it('resolves linked contribution and loan targets', () => {
    expect(
      resolveWalletLinkedTarget({
        chamaId: 'chama-1',
        contributionId: 'contribution-1',
        type: 'contribution_payment',
      })
    ).toEqual({
      screen: 'ContributionDetails',
      params: {
        contributionId: 'contribution-1',
        chamaId: 'chama-1',
      },
    });

    expect(
      resolveWalletLinkedTarget({
        chamaId: 'chama-1',
        loanId: 'loan-1',
        type: 'loan_repayment',
      })
    ).toEqual({
      screen: 'LoanDetail',
      params: {
        loanId: 'loan-1',
        chamaId: 'chama-1',
      },
    });
  });
});
