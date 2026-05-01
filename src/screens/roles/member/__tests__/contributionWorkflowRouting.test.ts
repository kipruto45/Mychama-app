import {
  isContributionPurpose,
  resolveContributionNotificationTarget,
  resolveContributionPaymentTarget,
} from '../contributionWorkflowRouting';

describe('contributionWorkflowRouting', () => {
  it('routes contribution due notifications to the member overview', () => {
    const target = resolveContributionNotificationTarget({
      id: 'notification-1',
      user: 'user-1',
      chama_id: 'chama-1',
      chama_name: 'Alpha',
      type: 'contribution_due',
      category: 'payments',
      title: 'Contribution due',
      message: 'Pay your monthly contribution',
      data: {},
      is_read: false,
      read_at: null,
      created_at: '2026-04-20T10:00:00Z',
    });

    expect(target).toEqual({
      screen: 'MemberContributions',
      params: {
        chamaId: 'chama-1',
        entryPoint: 'notifications',
      },
    });
  });

  it('routes successful contribution notifications to the receipt screen', () => {
    const target = resolveContributionNotificationTarget({
      id: 'notification-2',
      user: 'user-1',
      chama_id: 'chama-2',
      chama_name: 'Beta',
      type: 'payment_received',
      category: 'payments',
      title: 'Payment received',
      message: 'Your contribution was received successfully.',
      data: {
        payment_intent_id: 'intent-22',
        contribution_id: 'contribution-22',
        contribution_type_name: 'Monthly',
      },
      is_read: false,
      read_at: null,
      created_at: '2026-04-20T10:00:00Z',
    });

    expect(target).toEqual({
      screen: 'Receipt',
      params: {
        intentId: 'intent-22',
        paymentId: 'intent-22',
        chamaId: 'chama-2',
        contributionId: 'contribution-22',
        contributionTypeName: 'Monthly',
      },
    });
  });

  it('routes failed payment notifications to payment status', () => {
    const target = resolveContributionNotificationTarget({
      id: 'notification-3',
      user: 'user-1',
      chama_id: 'chama-3',
      chama_name: 'Gamma',
      type: 'payment_failed',
      category: 'payments',
      title: 'Payment failed',
      message: 'We could not complete your payment.',
      data: {
        payment_id: 'intent-33',
        amount: '1500',
        currency: 'KES',
        contribution_type_name: 'Welfare',
        payment_method: 'mpesa',
        failure_reason: 'Insufficient balance',
      },
      is_read: false,
      read_at: null,
      created_at: '2026-04-20T10:00:00Z',
    });

    expect(target).toEqual({
      screen: 'PaymentStatus',
      params: {
        intentId: 'intent-33',
        amount: '1500',
        currency: 'KES',
        purpose: 'contribution',
        contributionTypeName: 'Welfare',
        paymentMethod: 'mpesa',
        failureReason: 'Insufficient balance',
      },
    });
  });

  it('routes penalty notifications to the penalties screen', () => {
    const target = resolveContributionNotificationTarget({
      id: 'notification-4',
      user: 'user-1',
      chama_id: 'chama-4',
      chama_name: 'Delta',
      type: 'fine_added',
      category: 'payments',
      title: 'Fine added',
      message: 'A penalty has been added.',
      data: {
        amount: '300',
        reason: 'Late contribution',
      },
      is_read: false,
      read_at: null,
      created_at: '2026-04-20T10:00:00Z',
    });

    expect(target).toEqual({
      screen: 'Penalties',
      params: {
        chamaId: 'chama-4',
        suggestedAmount: '300',
        reason: 'Late contribution',
        memberId: undefined,
      },
    });
  });

  it('routes successful contribution payments to the contribution detail screen', () => {
    const target = resolveContributionPaymentTarget({
      paymentId: 'payment-1',
      chamaId: 'chama-1',
      contributionId: 'contribution-1',
      purpose: 'contribution',
      status: 'completed',
      amount: '2500',
      currency: 'KES',
      paymentMethod: 'mpesa',
      contributionTypeName: 'Monthly',
    });

    expect(target).toEqual({
      screen: 'ContributionDetails',
      params: {
        contributionId: 'contribution-1',
        chamaId: 'chama-1',
      },
    });
  });

  it('routes pending contribution payments to payment status', () => {
    const target = resolveContributionPaymentTarget({
      paymentId: 'payment-2',
      chamaId: 'chama-2',
      purpose: 'contribution',
      status: 'pending',
      amount: '1800',
      currency: 'KES',
      paymentMethod: 'mpesa',
      contributionTypeName: 'Development',
    });

    expect(target).toEqual({
      screen: 'PaymentStatus',
      params: {
        intentId: 'payment-2',
        amount: '1800',
        currency: 'KES',
        purpose: 'contribution',
        contributionTypeName: 'Development',
        paymentMethod: 'mpesa',
      },
    });
  });

  it('treats contribution-like purposes correctly', () => {
    expect(isContributionPurpose('contribution')).toBe(true);
    expect(isContributionPurpose('fine')).toBe(true);
    expect(isContributionPurpose('loan_repayment')).toBe(false);
  });
});
