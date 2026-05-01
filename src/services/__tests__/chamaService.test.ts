import { chamaService } from '../chamaService';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('chamaService invite contracts', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
  });

  it('builds native invite links for the mobile app', () => {
    expect(chamaService.buildInviteLink('secure-token')).toBe('mychama://invite/secure-token');
  });

  it('uses the secure invite lookup and accept endpoints', async () => {
    mockGet.mockResolvedValue({ status: 'pending' });
    mockPost.mockResolvedValue({ membership: { id: 'member-1' } });

    await expect(chamaService.lookupSecureInvite('token-1')).resolves.toEqual({ status: 'pending' });
    await expect(chamaService.acceptSecureInvite('token-1')).resolves.toEqual({ membership: { id: 'member-1' } });
    await chamaService.declineSecureInvite('token-1', 'wrong account');

    expect(mockGet).toHaveBeenCalledWith('/v1/invites/token-1/');
    expect(mockPost).toHaveBeenNthCalledWith(1, '/v1/invites/token-1/accept/');
    expect(mockPost).toHaveBeenNthCalledWith(2, '/v1/invites/token-1/decline/', {
      reason: 'wrong account',
    });
  });

  it('uses code validation and acceptance endpoints for join-code flows', async () => {
    mockPost.mockResolvedValueOnce({ is_valid: true }).mockResolvedValueOnce({ membership: { id: 'member-2' } });

    await expect(chamaService.validateInviteCode('ABC123')).resolves.toEqual({ is_valid: true });
    await expect(chamaService.acceptInviteCode('ABC123')).resolves.toEqual({ membership: { id: 'member-2' } });

    expect(mockPost).toHaveBeenNthCalledWith(1, '/v1/invites/code/validate/', { code: 'ABC123' });
    expect(mockPost).toHaveBeenNthCalledWith(2, '/v1/invites/code/accept/', { code: 'ABC123' });
  });

  it('removes members through the rejection endpoint with an optional reason payload', async () => {
    mockPost.mockResolvedValue(undefined);

    await chamaService.removeMember('chama-44', 'member-9', 'policy violation');

    expect(mockPost).toHaveBeenCalledWith('/v1/chamas/chama-44/members/member-9/reject/', {
      reason: 'policy violation',
    });
  });

  it('submits full workflow payload for chama creation', async () => {
    mockPost.mockResolvedValue({ id: 'chama-1', name: 'Workflow Chama' });
    const payload = {
      name: 'Workflow Chama',
      description: 'Created from workflow',
      category: 'savings' as const,
      location: { county: 'Nairobi', subcounty: 'Westlands' },
      privacy: 'invite_only' as const,
      contribution_setup: {
        amount: '1000',
        frequency: 'monthly' as const,
        due_day: 5,
        grace_period_days: 3,
        late_fine_amount: '100',
      },
      finance_settings: {
        currency: 'KES',
        payment_methods: ['mpesa'],
        loans_enabled: true,
        fines_enabled: true,
        approval_rule: 'maker_checker',
      },
      meeting_settings: {
        meeting_frequency: 'monthly' as const,
        quorum_percentage: 60,
        voting_enabled: true,
      },
      membership_rules: {
        invite_only: true,
        approval_required: true,
        max_members: 20,
      },
      payout_rules: {
        rotation_order: 'member_join_order' as const,
        trigger_mode: 'manual' as const,
        payout_method: 'mpesa' as const,
      },
      loan_rules: {
        loans_enabled: true,
        max_loan_amount: '20000',
        interest_rate: '10',
        repayment_period_months: 6,
        approval_layers: 2,
      },
      governance_rules: {
        minimum_members_to_start: 4,
        quorum_percentage: 60,
        missed_payment_penalty_amount: '150',
        constitution_summary: 'Founding charter',
      },
    };

    await chamaService.createChama(payload);

    expect(mockPost).toHaveBeenCalledWith('/v1/chamas/', payload);
  });
});
