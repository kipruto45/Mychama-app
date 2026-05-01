import { useAuthzStore } from '@/auth/store';
import { authService } from '@/services/authService';
import type { AuthStackParamList } from '@/navigation/types';
import { useOnboardingStore } from '@/store/onboardingStore';
import type { InvitePreview } from '@/types';
import { storage } from '@/utils/storage';

const PENDING_INVITE_CONTEXT_KEY = 'pending_invite_context';
const PENDING_INVITE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export type PendingInviteRoute = 'InvitePreview' | 'JoinViaCode';

export type PendingInviteContext = {
  sourceType: 'link' | 'code';
  intendedRoute: PendingInviteRoute;
  token?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
  preview?: {
    chamaId?: string;
    chamaName?: string;
    chamaDescription?: string;
    invitedByName?: string;
    assignedRole?: string;
    inviteCode?: string;
    expiresAt?: string;
    status?: string;
    isValid?: boolean;
  };
};

type LegacyPendingInviteIntent =
  | {
      type: 'token';
      token: string;
      createdAt: string;
    }
  | {
      type: 'code';
      code: string;
      createdAt: string;
    };

type PendingInviteInput = PendingInviteContext | LegacyPendingInviteIntent;
type OTPNextRoute =
  NonNullable<AuthStackParamList['OTPVerification']>['verificationContext']['nextRoute'];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function isPendingInviteFresh(intent: PendingInviteContext): boolean {
  const createdAt = Date.parse(intent.updatedAt || intent.createdAt);
  if (Number.isNaN(createdAt)) {
    return false;
  }
  return Date.now() - createdAt <= PENDING_INVITE_MAX_AGE_MS;
}

function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizePendingInviteIntent(intent: PendingInviteInput | null | undefined): PendingInviteContext | null {
  if (!intent || typeof intent !== 'object') {
    return null;
  }

  if ('type' in intent) {
    const createdAt = intent.createdAt || new Date().toISOString();
    if (intent.type === 'token' && isNonEmptyString(intent.token)) {
      return {
        sourceType: 'link',
        intendedRoute: 'InvitePreview',
        token: intent.token.trim(),
        createdAt,
        updatedAt: createdAt,
      };
    }

    if (intent.type === 'code' && isNonEmptyString(intent.code)) {
      return {
        sourceType: 'code',
        intendedRoute: 'JoinViaCode',
        code: normalizeInviteCode(intent.code),
        createdAt,
        updatedAt: createdAt,
      };
    }

    return null;
  }

  const createdAt = intent.createdAt || new Date().toISOString();
  const updatedAt = intent.updatedAt || createdAt;

  if (intent.sourceType === 'link' && isNonEmptyString(intent.token)) {
    return {
      ...intent,
      intendedRoute: 'InvitePreview',
      token: intent.token.trim(),
      createdAt,
      updatedAt,
    };
  }

  if (intent.sourceType === 'code' && isNonEmptyString(intent.code)) {
    return {
      ...intent,
      intendedRoute: 'JoinViaCode',
      code: normalizeInviteCode(intent.code),
      createdAt,
      updatedAt,
    };
  }

  return null;
}

export function parsePendingInviteUrl(url: string): PendingInviteContext | null {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) {
    return null;
  }

  const trimmedUrl = rawUrl.replace(/\/+$/, '');
  const patterns: Array<{
    matcher: RegExp;
    sourceType: PendingInviteContext['sourceType'];
    route: PendingInviteRoute;
    param: 'token' | 'code';
    normalize?: (value: string) => string;
  }> = [
    {
      matcher: /^mychama:\/\/invite\/([^/?#]+)/i,
      sourceType: 'link',
      route: 'InvitePreview',
      param: 'token',
    },
    {
      matcher: /^https?:\/\/(?:www\.)?mychama\.app\/invite\/([^/?#]+)/i,
      sourceType: 'link',
      route: 'InvitePreview',
      param: 'token',
    },
    {
      matcher: /^mychama:\/\/join\/code\/([^/?#]+)/i,
      sourceType: 'code',
      route: 'JoinViaCode',
      param: 'code',
      normalize: normalizeInviteCode,
    },
    {
      matcher: /^https?:\/\/(?:www\.)?mychama\.app\/join\/code\/([^/?#]+)/i,
      sourceType: 'code',
      route: 'JoinViaCode',
      param: 'code',
      normalize: normalizeInviteCode,
    },
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern.matcher);
    if (!match?.[1]) {
      continue;
    }

    const rawValue = decodeURIComponent(match[1]);
    const normalizedValue = pattern.normalize ? pattern.normalize(rawValue) : rawValue.trim();
    return {
      sourceType: pattern.sourceType,
      intendedRoute: pattern.route,
      [pattern.param]: normalizedValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as PendingInviteContext;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const path = parsedUrl.pathname.replace(/\/+$/, '');
    if (/^\/join\/code$/i.test(path)) {
      const code = parsedUrl.searchParams.get('code');
      if (isNonEmptyString(code)) {
        return {
          sourceType: 'code',
          intendedRoute: 'JoinViaCode',
          code: normalizeInviteCode(code),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function savePendingInviteIntent(intent: PendingInviteInput): Promise<void> {
  const normalized = normalizePendingInviteIntent(intent);
  if (!normalized) {
    return;
  }

  const existing = await getPendingInviteIntent();
  const merged: PendingInviteContext = {
    ...existing,
    ...normalized,
    preview: normalized.preview || existing?.preview,
    createdAt: existing?.createdAt || normalized.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await storage.setJSON(PENDING_INVITE_CONTEXT_KEY, merged);
}

export async function captureIncomingInviteUrl(url: string): Promise<PendingInviteContext | null> {
  const intent = parsePendingInviteUrl(url);
  if (!intent) {
    return null;
  }
  await savePendingInviteIntent(intent);
  return getPendingInviteIntent();
}

export async function getPendingInviteIntent(): Promise<PendingInviteContext | null> {
  const rawIntent = await storage.getJSON<PendingInviteInput>(PENDING_INVITE_CONTEXT_KEY);
  const normalized = normalizePendingInviteIntent(rawIntent);
  if (!normalized || !isPendingInviteFresh(normalized)) {
    await clearPendingInviteIntent();
    return null;
  }
  return normalized;
}

export async function clearPendingInviteIntent(): Promise<void> {
  await storage.removeItem(PENDING_INVITE_CONTEXT_KEY);
}

export async function savePendingInvitePreview(invite: InvitePreview): Promise<void> {
  const existing = await getPendingInviteIntent();
  if (!existing) {
    return;
  }

  await savePendingInviteIntent({
    ...existing,
    preview: {
      chamaId: invite.chama_id || invite.chama,
      chamaName: invite.chama_name,
      chamaDescription: invite.chama_description,
      invitedByName: invite.invited_by_name,
      assignedRole: invite.assigned_role_display || invite.role_display || invite.assigned_role || invite.role,
      inviteCode: invite.code,
      expiresAt: invite.expires_at,
      status: invite.status,
      isValid: invite.is_valid,
    },
  });
}

export async function getPendingInviteOTPRoute(): Promise<{
  nextRoute: OTPNextRoute;
  nextToken?: string;
  nextCode?: string;
} | null> {
  const intent = await getPendingInviteIntent();
  if (!intent) {
    return null;
  }

  if (intent.intendedRoute === 'InvitePreview' && intent.token) {
    return {
      nextRoute: 'InvitePreview',
      nextToken: intent.token,
    };
  }

  if (intent.intendedRoute === 'JoinViaCode' && intent.code) {
    return {
      nextRoute: 'JoinViaCode',
      nextCode: intent.code,
    };
  }

  return null;
}

export async function resumePendingInviteIntent(navigation: any): Promise<boolean> {
  const intent = await getPendingInviteIntent();
  const rootNavigation = navigation.getParent?.() || navigation;

  if (!intent) {
    return false;
  }

  if (intent.intendedRoute === 'InvitePreview' && intent.token) {
    rootNavigation.navigate('InvitePreview' as never, { token: intent.token } as never);
    return true;
  }

  if (intent.intendedRoute === 'JoinViaCode' && intent.code) {
    rootNavigation.navigate('JoinViaCode' as never, { code: intent.code } as never);
    return true;
  }

  return false;
}

export async function completeInviteJoin(
  navigation: any,
  membership: { chama?: string; role?: string | null } | null | undefined,
  invite?: { chama_name?: string | null } | null | undefined
): Promise<void> {
  const chamaId = typeof membership?.chama === 'string' ? membership.chama : '';
  if (!chamaId) {
    await clearPendingInviteIntent();
    navigation.navigate('MainTabs' as never);
    return;
  }

  await authService.refreshMembershipContext(chamaId);
  useAuthzStore.getState().setActiveChama(chamaId);
  useOnboardingStore.getState().completeJoin(
    chamaId,
    invite?.chama_name || null,
    membership?.role || null
  );
  await clearPendingInviteIntent();
  navigation.navigate('JoinSuccess' as never, {
    chamaId,
    chamaName: invite?.chama_name || undefined,
    role: membership?.role || undefined,
  } as never);
}

export function getInviteStatusCopy(status?: string | null): { title: string; message: string } | null {
  const normalized = String(status || '').toLowerCase();

  switch (normalized) {
    case 'expired':
      return {
        title: 'Invite expired',
        message: 'This invite has expired. Ask for a new invite or join code.',
      };
    case 'revoked':
      return {
        title: 'Invite no longer valid',
        message: 'This invite has been withdrawn and can no longer be used.',
      };
    case 'accepted':
      return {
        title: 'Invite already used',
        message: 'This invite has already been accepted.',
      };
    case 'declined':
      return {
        title: 'Invite declined',
        message: 'This invite was declined. Ask for a new invite if you still want to join.',
      };
    default:
      return null;
  }
}
