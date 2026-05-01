import {
  captureIncomingInviteUrl,
  clearPendingInviteIntent,
  getInviteStatusCopy,
  getPendingInviteIntent,
  getPendingInviteOTPRoute,
  parsePendingInviteUrl,
  savePendingInviteIntent,
  savePendingInvitePreview,
} from '../inviteFlow';

const mockStorageState = new Map<string, string>();

jest.mock('@/utils/storage', () => ({
  storage: {
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorageState.set(key, value);
    }),
    getItem: jest.fn(async (key: string) => mockStorageState.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      mockStorageState.delete(key);
    }),
    setJSON: jest.fn(async (key: string, value: unknown) => {
      mockStorageState.set(key, JSON.stringify(value));
    }),
    getJSON: jest.fn(async (key: string) => {
      const value = mockStorageState.get(key);
      return value ? JSON.parse(value) : null;
    }),
    clear: jest.fn(async () => {
      mockStorageState.clear();
    }),
  },
}));

jest.mock('@/services/authService', () => ({
  authService: {
    refreshMembershipContext: jest.fn(),
  },
}));

jest.mock('@/auth/store', () => ({
  useAuthzStore: {
    getState: () => ({
      setActiveChama: jest.fn(),
    }),
  },
}));

jest.mock('@/store/onboardingStore', () => ({
  useOnboardingStore: {
    getState: () => ({
      completeJoin: jest.fn(),
    }),
  },
}));

describe('inviteFlow', () => {
  beforeEach(async () => {
    mockStorageState.clear();
    jest.useRealTimers();
    await clearPendingInviteIntent();
  });

  it('parses secure invite deep links', () => {
    expect(parsePendingInviteUrl('mychama://invite/secure-token-123')).toMatchObject({
      sourceType: 'link',
      intendedRoute: 'InvitePreview',
      token: 'secure-token-123',
    });

    expect(parsePendingInviteUrl('https://mychama.app/invite/secure-token-456')).toMatchObject({
      sourceType: 'link',
      intendedRoute: 'InvitePreview',
      token: 'secure-token-456',
    });
  });

  it('parses join code links and normalizes the code', () => {
    expect(parsePendingInviteUrl('mychama://join/code/abc123')).toMatchObject({
      sourceType: 'code',
      intendedRoute: 'JoinViaCode',
      code: 'ABC123',
    });

    expect(parsePendingInviteUrl('https://mychama.app/join/code/xyz789')).toMatchObject({
      sourceType: 'code',
      intendedRoute: 'JoinViaCode',
      code: 'XYZ789',
    });

    expect(parsePendingInviteUrl('https://mychama.app/join/code?code= mixed12 ')).toMatchObject({
      sourceType: 'code',
      intendedRoute: 'JoinViaCode',
      code: 'MIXED12',
    });
  });

  it('returns null for unsupported invite URLs', () => {
    expect(parsePendingInviteUrl('https://example.com/invite/token')).toBeNull();
    expect(parsePendingInviteUrl('not-a-url')).toBeNull();
    expect(parsePendingInviteUrl('')).toBeNull();
  });

  it('captures an incoming invite URL and returns resumable OTP routing context', async () => {
    const intent = await captureIncomingInviteUrl('mychama://invite/test-token');

    expect(intent).toMatchObject({
      sourceType: 'link',
      intendedRoute: 'InvitePreview',
      token: 'test-token',
    });

    await savePendingInvitePreview({
      code: 'ABC123',
      chama_id: 'chama-1',
      chama_name: 'Alpha Chama',
      invited_by_name: 'Jane Admin',
      assigned_role: 'member',
      expires_at: '2026-05-01T10:00:00Z',
      status: 'pending',
      is_valid: true,
    } as any);

    const persisted = await getPendingInviteIntent();
    expect(persisted).toMatchObject({
      token: 'test-token',
      preview: {
        chamaId: 'chama-1',
        chamaName: 'Alpha Chama',
        invitedByName: 'Jane Admin',
        assignedRole: 'member',
        inviteCode: 'ABC123',
        isValid: true,
      },
    });

    await expect(getPendingInviteOTPRoute()).resolves.toEqual({
      nextRoute: 'InvitePreview',
      nextToken: 'test-token',
    });
  });

  it('normalizes legacy code intents and expires stale pending invites', async () => {
    const staleDate = new Date('2026-04-01T00:00:00Z').toISOString();
    jest.useFakeTimers().setSystemTime(new Date('2026-04-20T00:00:01Z'));

    await savePendingInviteIntent({
      type: 'code',
      code: 'ab12cd',
      createdAt: staleDate,
    });

    await expect(getPendingInviteIntent()).resolves.toMatchObject({
      code: 'AB12CD',
      intendedRoute: 'JoinViaCode',
    });

    mockStorageState.set(
      'pending_invite_context',
      JSON.stringify({
        sourceType: 'code',
        intendedRoute: 'JoinViaCode',
        code: 'STALE77',
        createdAt: staleDate,
        updatedAt: staleDate,
      })
    );

    await expect(getPendingInviteIntent()).resolves.toBeNull();
    await expect(getPendingInviteOTPRoute()).resolves.toBeNull();
  });

  it('returns human copy for terminal invite statuses', () => {
    expect(getInviteStatusCopy('expired')).toEqual({
      title: 'Invite expired',
      message: 'This invite has expired. Ask for a new invite or join code.',
    });
    expect(getInviteStatusCopy('accepted')).toEqual({
      title: 'Invite already used',
      message: 'This invite has already been accepted.',
    });
    expect(getInviteStatusCopy('pending')).toBeNull();
  });
});
