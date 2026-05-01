import { authService } from '../authService';

const mockGet = jest.fn();

jest.mock('@/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('authService membership options contracts', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('uses the supported chamas endpoint before the legacy alias', async () => {
    mockGet.mockResolvedValue({
      active_chama: 'chama-1',
      memberships: [{ chama_id: 'chama-1', chama_name: 'Alpha', role: 'member', is_active: true, is_approved: true }],
    });

    await expect(authService.getMembershipOptions()).resolves.toEqual({
      active_chama: 'chama-1',
      memberships: [{ chama_id: 'chama-1', chama_name: 'Alpha', role: 'member', is_active: true, is_approved: true }],
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/v1/auth/chamas');
  });

  it('unwraps nested membership payloads from backend envelopes', async () => {
    mockGet.mockResolvedValue({
      data: {
        active_chama: 'chama-2',
        memberships: [{ chama_id: 'chama-2', chama_name: 'Beta', role: 'treasurer', is_active: true, is_approved: true }],
      },
    });

    await expect(authService.getMembershipOptions()).resolves.toEqual({
      active_chama: 'chama-2',
      memberships: [{ chama_id: 'chama-2', chama_name: 'Beta', role: 'treasurer', is_active: true, is_approved: true }],
    });
  });
});
