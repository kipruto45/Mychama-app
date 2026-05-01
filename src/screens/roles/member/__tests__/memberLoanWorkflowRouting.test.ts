import { resolveMemberLoanNotificationTarget } from '../memberLoanWorkflowRouting';
import {
  buildLoanRepaymentResumeParams,
  buildPendingLoanRepaymentParams,
  filterLoanRepaymentHistory,
  getLoanRepaymentStatusMeta,
  getRepaymentDueStateMeta,
  hasRestorableLoanRepaymentDraft,
  normalizeRepaymentDueState,
} from '../memberLoanRepaymentWorkflowShared';

describe('memberLoanWorkflowRouting', () => {
  it('routes pending review notifications to request details', () => {
    expect(
      resolveMemberLoanNotificationTarget({
        id: 'notification-1',
        user: 'user-1',
        chama_id: 'chama-1',
        chama_name: 'Alpha',
        type: 'loan_under_review',
        category: 'loans',
        title: 'Loan under review',
        message: 'Your request is still under review.',
        data: {
          application_id: 'application-1',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'LoanApplicationDetails',
      params: {
        applicationId: 'application-1',
        chamaId: 'chama-1',
      },
    });
  });

  it('routes approved notifications to the active loan details', () => {
    expect(
      resolveMemberLoanNotificationTarget({
        id: 'notification-2',
        user: 'user-1',
        chama_id: 'chama-2',
        chama_name: 'Beta',
        type: 'loan_approved',
        category: 'loans',
        title: 'Loan approved',
        message: 'Your loan has been approved.',
        data: {
          loan_id: 'loan-2',
          application_id: 'application-2',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'LoanDetail',
      params: {
        loanId: 'loan-2',
        chamaId: 'chama-2',
      },
    });
  });

  it('routes rejected notifications to the rejected request state', () => {
    expect(
      resolveMemberLoanNotificationTarget({
        id: 'notification-3',
        user: 'user-1',
        chama_id: 'chama-3',
        chama_name: 'Gamma',
        type: 'loan_rejected',
        category: 'loans',
        title: 'Loan request update',
        message: 'This request was not approved.',
        data: {
          application_id: 'application-3',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'RejectedApplicationState',
      params: {
        applicationId: 'application-3',
        chamaId: 'chama-3',
      },
    });
  });

  it('routes repayment reminders into the repayment flow', () => {
    expect(
      resolveMemberLoanNotificationTarget({
        id: 'notification-4',
        user: 'user-1',
        chama_id: 'chama-4',
        chama_name: 'Delta',
        type: 'repayment_due',
        category: 'loans',
        title: 'Repayment due',
        message: 'Your repayment is due soon.',
        data: {
          loan_id: 'loan-4',
          installment_id: 'installment-4',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'LoanRepayment',
      params: {
        loanId: 'loan-4',
        chamaId: 'chama-4',
        installmentId: 'installment-4',
        entryPoint: 'notifications',
      },
    });
  });

  it('routes overdue notifications to the overdue repayment state', () => {
    expect(
      resolveMemberLoanNotificationTarget({
        id: 'notification-5',
        user: 'user-1',
        chama_id: 'chama-5',
        chama_name: 'Epsilon',
        type: 'repayment_overdue',
        category: 'loans',
        title: 'Repayment overdue',
        message: 'Your repayment is overdue.',
        data: {
          loan_id: 'loan-5',
          installment_id: 'installment-5',
        },
        is_read: false,
        read_at: null,
        created_at: '2026-04-20T10:00:00Z',
      })
    ).toEqual({
      screen: 'OverdueRepayment',
      params: {
        loanId: 'loan-5',
        chamaId: 'chama-5',
        installmentId: 'installment-5',
      },
    });
  });

  it('maps overdue repayment states into member-friendly repayment meta', () => {
    const meta = getRepaymentDueStateMeta(normalizeRepaymentDueState('overdue'));

    expect(meta.label).toBe('Overdue');
    expect(meta.title).toBe('You have an overdue repayment.');
  });

  it('filters payment history down to loan repayments for one loan', () => {
    expect(
      filterLoanRepaymentHistory(
        [
          { id: '1', purposeType: 'loan_repayment', loanId: 'loan-1' },
          { id: '2', purposeType: 'contribution', loanId: 'loan-1' },
          { id: '3', purposeType: 'loan_repayment', loanId: 'loan-2' },
        ] as any,
        'loan-1'
      )
    ).toEqual([{ id: '1', purposeType: 'loan_repayment', loanId: 'loan-1' }]);
  });

  it('restores a saved repayment draft into loan repayment route params', () => {
    expect(
      buildLoanRepaymentResumeParams({
        draft: {
          chamaId: 'chama-1',
          loanId: 'loan-1',
          installmentId: 'installment-1',
          amount: '2500.00',
          dueDate: '2026-04-30',
          targetLabel: 'Installment due 2026-04-30',
          quickAmountOption: 'next_due',
          sourceEntryPoint: 'wallet',
        },
      })
    ).toEqual({
      chamaId: 'chama-1',
      loanId: 'loan-1',
      installmentId: 'installment-1',
      amount: '2500.00',
      dueDate: '2026-04-30',
      targetLabel: 'Installment due 2026-04-30',
      quickAmountOption: 'next_due',
      entryPoint: 'wallet',
    });
  });

  it('builds pending repayment detail params for interrupted flows', () => {
    expect(
      buildPendingLoanRepaymentParams({
        intentId: 'intent-1',
        chamaId: 'chama-1',
        loanId: 'loan-1',
        installmentId: 'installment-1',
        amount: '2500.00',
        currency: 'KES',
        targetLabel: 'Installment due 2026-04-30',
        paymentMethod: 'mpesa',
      })
    ).toEqual({
      intentId: 'intent-1',
      chamaId: 'chama-1',
      amount: '2500.00',
      currency: 'KES',
      purpose: 'loan_repayment',
      paymentPurposeType: 'loan_repayment',
      paymentPurposeLabel: 'Loan repayment',
      loanId: 'loan-1',
      installmentId: 'installment-1',
      targetLabel: 'Installment due 2026-04-30',
      paymentMethod: 'mpesa',
    });
  });

  it('recognizes a restorable repayment draft for the active chama', () => {
    expect(
      hasRestorableLoanRepaymentDraft(
        { chamaId: 'chama-1', loanId: 'loan-1', amount: '2500.00' },
        'chama-1'
      )
    ).toBe(true);

    expect(
      hasRestorableLoanRepaymentDraft(
        { chamaId: 'chama-2', loanId: 'loan-1', amount: '2500.00' },
        'chama-1'
      )
    ).toBe(false);
  });

  it('uses member-friendly status copy for loan repayments', () => {
    expect(getLoanRepaymentStatusMeta('success').title).toBe(
      'Your repayment was received successfully.'
    );
    expect(getLoanRepaymentStatusMeta('pending').title).toBe(
      'Your repayment is still being processed.'
    );
  });
});
