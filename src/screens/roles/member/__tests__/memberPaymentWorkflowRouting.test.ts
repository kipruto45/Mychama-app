import {
  resolveMemberPaymentHistoryTarget,
  resolveMemberPaymentNotificationTarget,
} from '../memberPaymentWorkflowRouting';
import {
  matchesPaymentHistoryFilter,
  resolveLinkedPaymentTarget,
} from '../memberPaymentsWorkflowShared';

const baseHistoryItem = {
  id: 'payment-1',
  intentId: 'payment-1',
  chamaId: 'chama-1',
  purpose: 'contribution',
  purposeType: 'contribution' as const,
  purposeLabel: 'Monthly contribution',
  amount: '2500',
  currency: 'KES',
  status: 'success',
  processingState: 'success' as const,
  paymentMethod: 'mpesa',
  reference: 'REF-001',
  targetLabel: 'April contribution',
  date: '2026-04-20T10:00:00Z',
  receiptAvailable: true,
  contributionId: 'contribution-1',
};

describe('memberPaymentWorkflowRouting', () => {
  it('routes successful history items to the receipt screen', () => {
    expect(resolveMemberPaymentHistoryTarget(baseHistoryItem)).toEqual({
      screen: 'Receipt',
      params: {
        intentId: 'payment-1',
        chamaId: 'chama-1',
        paymentPurposeType: 'contribution',
        paymentPurposeLabel: 'Monthly contribution',
        contributionTypeName: undefined,
        contributionId: 'contribution-1',
        loanId: undefined,
        installmentId: undefined,
        targetLabel: 'April contribution',
      },
    });
  });

  it('routes pending history items to pending payment detail', () => {
    expect(
      resolveMemberPaymentHistoryTarget({
        ...baseHistoryItem,
        status: 'pending',
        processingState: 'pending',
        receiptAvailable: false,
      })
    ).toEqual({
      screen: 'PendingPaymentDetail',
      params: {
        intentId: 'payment-1',
        chamaId: 'chama-1',
        amount: '2500',
        currency: 'KES',
        purpose: 'contribution',
        paymentPurposeType: 'contribution',
        paymentPurposeLabel: 'Monthly contribution',
        contributionId: 'contribution-1',
        loanId: undefined,
        installmentId: undefined,
        penaltyId: undefined,
        targetLabel: 'April contribution',
        paymentMethod: 'mpesa',
      },
    });
  });

  it('routes failed notifications to payment status with context', () => {
    expect(
      resolveMemberPaymentNotificationTarget({
        id: 'notification-1',
        user: 'user-1',
        chama_id: 'chama-7',
        chama_name: 'Alpha',
        type: 'payment_failed',
        category: 'payments',
        title: 'Payment failed',
        message: 'We could not complete your payment.',
        data: {
          intent_id: 'intent-7',
          amount: '1900',
          currency: 'KES',
          purpose: 'loan_repayment',
          payment_method: 'mpesa',
          target_label: 'Loan installment',
          failure_reason: 'Timed out',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'PaymentStatus',
      params: {
        intentId: 'intent-7',
        chamaId: 'chama-7',
        amount: '1900',
        currency: 'KES',
        purpose: 'loan_repayment',
        paymentPurposeType: 'loan_repayment',
        paymentPurposeLabel: 'Loan repayment',
        contributionId: undefined,
        loanId: undefined,
        installmentId: undefined,
        penaltyId: undefined,
        targetLabel: 'Loan installment',
        paymentMethod: 'mpesa',
        failureReason: 'Timed out',
      },
    });
  });

  it('routes loan reminders into the payments workflow with a preselected purpose', () => {
    expect(
      resolveMemberPaymentNotificationTarget({
        id: 'notification-2',
        user: 'user-1',
        chama_id: 'chama-9',
        chama_name: 'Beta',
        type: 'loan_repayment_due',
        category: 'payments',
        title: 'Loan repayment due',
        message: 'Your installment is due.',
        data: {
          loan_id: 'loan-9',
          installment_id: 'installment-9',
          amount: '4200',
          due_date: '2026-04-30',
          target_label: 'April installment',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'Payments',
      params: {
        chamaId: 'chama-9',
        entryPoint: 'notifications',
        preselectedPurpose: 'loan_repayment',
        contributionId: undefined,
        loanId: 'loan-9',
        installmentId: 'installment-9',
        amount: '4200',
        dueDate: '2026-04-30',
        targetLabel: 'April installment',
      },
    });
  });
});

describe('memberPaymentsWorkflowShared', () => {
  it('filters history rows by purpose and status', () => {
    expect(matchesPaymentHistoryFilter(baseHistoryItem, 'contributions')).toBe(true);
    expect(matchesPaymentHistoryFilter(baseHistoryItem, 'successful')).toBe(true);
    expect(matchesPaymentHistoryFilter(baseHistoryItem, 'loan_repayments')).toBe(false);
  });

  it('resolves linked targets to contribution details and loan details', () => {
    expect(
      resolveLinkedPaymentTarget({
        chamaId: 'chama-1',
        purposeType: 'contribution',
        contributionId: 'contribution-1',
      })
    ).toEqual({
      screen: 'ContributionDetails',
      params: {
        contributionId: 'contribution-1',
        chamaId: 'chama-1',
      },
    });

    expect(
      resolveLinkedPaymentTarget({
        chamaId: 'chama-1',
        purposeType: 'loan_repayment',
        loanId: 'loan-1',
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
