import type { MainStackParamList } from '@/navigation/types';
import type { Notification } from '@/types';

type LoanNavigationTarget =
  | { screen: 'MemberLoans'; params?: MainStackParamList['MemberLoans'] }
  | { screen: 'LoanEligibility'; params?: MainStackParamList['LoanEligibility'] }
  | { screen: 'RequestLoan'; params?: MainStackParamList['RequestLoan'] }
  | { screen: 'LoanApplicationDetails'; params: MainStackParamList['LoanApplicationDetails'] }
  | { screen: 'RejectedApplicationState'; params: MainStackParamList['RejectedApplicationState'] }
  | { screen: 'LoanDetail'; params: MainStackParamList['LoanDetail'] }
  | { screen: 'RepaymentSchedule'; params: NonNullable<MainStackParamList['RepaymentSchedule']> }
  | { screen: 'LoanRepayment'; params: MainStackParamList['LoanRepayment'] }
  | { screen: 'OverdueRepayment'; params: MainStackParamList['OverdueRepayment'] }
  | { screen: 'LoanApplications'; params?: MainStackParamList['LoanApplications'] };

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

export const resolveMemberLoanNotificationTarget = (
  notification: Notification
): LoanNavigationTarget | null => {
  const payload = notification.data || {};
  const type = String(notification.type || '').toLowerCase();
  const chamaId = pickString(notification.chama_id, payload.chama_id, payload.chamaId);
  const applicationId = pickString(
    payload.application_id,
    payload.applicationId,
    payload.loan_application_id,
    payload.loanApplicationId,
    payload.request_id,
    payload.requestId
  );
  const loanId = pickString(payload.loan_id, payload.loanId, payload.created_loan_id, payload.createdLoanId);
  const installmentId = pickString(payload.installment_id, payload.installmentId);

  if (
    [
      'loan_request_submitted',
      'loan_application_submitted',
      'loan_under_review',
      'loan_pending_review',
      'loan_request_pending',
      'loan_request_received',
      'loan_status_update',
    ].includes(type)
  ) {
    if (applicationId) {
      return {
        screen: 'LoanApplicationDetails',
        params: { applicationId, chamaId },
      };
    }

    return {
      screen: 'MemberLoans',
      params: { chamaId },
    };
  }

  if (['loan_approved', 'loan_disbursed', 'loan_activated'].includes(type)) {
    if (loanId) {
      return {
        screen: 'LoanDetail',
        params: { loanId, chamaId },
      };
    }

    if (applicationId) {
      return {
        screen: 'LoanApplicationDetails',
        params: { applicationId, chamaId },
      };
    }

    return {
      screen: 'MemberLoans',
      params: { chamaId },
    };
  }

  if (['loan_rejected', 'loan_declined', 'loan_request_rejected'].includes(type)) {
    if (applicationId) {
      return {
        screen: 'RejectedApplicationState',
        params: { applicationId, chamaId },
      };
    }

    return {
      screen: 'LoanApplications',
      params: { chamaId },
    };
  }

  if (['repayment_due', 'repayment_due_soon', 'loan_due_soon'].includes(type)) {
    if (loanId) {
      return {
        screen: 'LoanRepayment',
        params: {
          loanId,
          chamaId,
          installmentId,
          entryPoint: 'notifications',
        },
      };
    }

    return {
      screen: 'MemberLoans',
      params: { chamaId },
    };
  }

  if (['repayment_overdue', 'loan_overdue'].includes(type)) {
    if (loanId) {
      return {
        screen: 'OverdueRepayment',
        params: { loanId, chamaId, installmentId },
      };
    }

    return {
      screen: 'MemberLoans',
      params: { chamaId },
    };
  }

  if (['loan_eligibility_update', 'loan_eligibility_ready'].includes(type)) {
    return {
      screen: 'LoanEligibility',
      params: { chamaId },
    };
  }

  if (type === 'loan_request_draft_ready') {
    return {
      screen: 'RequestLoan',
      params: { chamaId },
    };
  }

  if (installmentId && loanId) {
    return {
      screen: 'RepaymentSchedule',
      params: { loanId, chamaId },
    };
  }

  if (loanId && type.includes('loan')) {
    return {
      screen: 'LoanDetail',
      params: { loanId, chamaId },
    };
  }

  if (applicationId && type.includes('loan')) {
    return {
      screen: 'LoanApplicationDetails',
      params: { applicationId, chamaId },
    };
  }

  return null;
};
