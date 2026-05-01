import { apiClient } from './api';
import {
  Chama,
  CreateChamaPayload,
  Invite,
  InviteLink,
  InvitePreview,
  Membership,
  MembershipRequest,
  RoleDelegation,
} from '@/types';

export interface ChamaJoinSettings {
  join_code: string;
  join_enabled: boolean;
  join_code_expires_at: string | null;
  join_mode: 'auto_join' | 'approval_required';
  allow_public_join: boolean;
  require_approval: boolean;
  max_members?: number | null;
  current_member_count?: number;
  members_remaining?: number | null;
  billing_member_limit?: number | null;
}

const unwrapList = <T>(response: unknown, keys: string[]): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    for (const key of keys) {
      const value = (response as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
};

export const chamaService = {
  async getChamas(): Promise<Chama[]> {
    const response = await apiClient.get<unknown>('/v1/chamas/');
    return unwrapList<Chama>(response, ['chamas', 'results']);
  },

  async getChama(id: string): Promise<Chama> {
    return apiClient.get<Chama>(`/v1/chamas/${id}/`, {
      headers: {
        'X-CHAMA-ID': id,
      },
    });
  },

  async createChama(data: {
    name: string;
    description: string;
    county: string;
    subcounty: string;
    currency: string;
  } | CreateChamaPayload): Promise<Chama> {
    const payload =
      'contribution_setup' in data
        ? data
        : {
            name: data.name,
            description: data.description,
            category: 'savings' as const,
            location: {
              county: data.county,
              subcounty: data.subcounty,
            },
            privacy: 'invite_only' as const,
            contribution_setup: {
              amount: '0.00',
              frequency: 'monthly' as const,
              due_day: 1,
              grace_period_days: 0,
              late_fine_amount: '0.00',
            },
            finance_settings: {
              currency: data.currency,
              payment_methods: ['mpesa'],
              loans_enabled: true,
              fines_enabled: true,
              approval_rule: 'maker_checker',
            },
            meeting_settings: {
              meeting_frequency: 'monthly' as const,
              quorum_percentage: 50,
              voting_enabled: true,
            },
            membership_rules: {
              invite_only: true,
              approval_required: true,
              max_members: 100,
            },
          };
    return apiClient.post<Chama>('/v1/chamas/', payload);
  },

  buildInviteLink(token: string): string {
    return `mychama://invite/${token}`;
  },

  async getInvites(): Promise<Invite[]> {
    const response = await apiClient.get<unknown>('/v1/invites/');
    return unwrapList<Invite>(response, ['invites', 'results']);
  },

  async createInvite(
    chamaId: string,
    data: {
      invitee_phone?: string;
      invitee_email?: string;
      invitee_user_id?: string;
      role_to_assign: string;
      expires_in_days?: number;
      max_uses?: number;
    }
  ): Promise<Invite> {
    return apiClient.post<Invite>(`/v1/chamas/${chamaId}/invites/`, data);
  },

  async lookupSecureInvite(token: string): Promise<InvitePreview> {
    return apiClient.get<InvitePreview>(`/v1/invites/${token}/`);
  },

  async acceptSecureInvite(token: string): Promise<{ invite: Invite; membership: Membership }> {
    return apiClient.post<{ invite: Invite; membership: Membership }>(`/v1/invites/${token}/accept/`);
  },

  async declineSecureInvite(
    token: string,
    reason?: string
  ): Promise<Invite> {
    return apiClient.post<Invite>(`/v1/invites/${token}/decline/`, { reason });
  },

  async revokeSecureInvite(
    inviteId: string,
    reason?: string
  ): Promise<Invite> {
    return apiClient.post<Invite>(`/v1/invites/${inviteId}/revoke/`, { reason });
  },

  async resendSecureInvite(inviteId: string): Promise<Invite> {
    return apiClient.post<Invite>(`/v1/invites/${inviteId}/resend/`);
  },

  async validateInviteCode(code: string): Promise<InvitePreview> {
    return apiClient.post<InvitePreview>('/v1/invites/code/validate/', { code });
  },

  async acceptInviteCode(code: string): Promise<{ invite: Invite; membership: Membership }> {
    return apiClient.post<{ invite: Invite; membership: Membership }>('/v1/invites/code/accept/', { code });
  },

  async createChamaLegacy(data: {
    name: string;
    description: string;
    county: string;
    subcounty: string;
    currency: string;
  }): Promise<Chama> {
    return apiClient.post<Chama>('/v1/chamas/', data);
  },

  async updateChama(id: string, data: Partial<Chama>): Promise<Chama> {
    return apiClient.patch<Chama>(`/v1/chamas/${id}/`, data);
  },

  async getJoinSettings(chamaId: string): Promise<ChamaJoinSettings> {
    return apiClient.get<ChamaJoinSettings>(`/v1/chamas/${chamaId}/join-code/settings/`);
  },

  async updateJoinSettings(
    chamaId: string,
    data: Partial<Pick<ChamaJoinSettings, 'allow_public_join' | 'require_approval' | 'max_members' | 'join_mode'>>
  ): Promise<ChamaJoinSettings> {
    return apiClient.patch<ChamaJoinSettings>(`/v1/chamas/${chamaId}/join-code/settings/`, data);
  },

  async rotateJoinCode(chamaId: string): Promise<{
    detail: string;
    join_code: string;
    expires_at: string | null;
  }> {
    return apiClient.post(`/v1/chamas/${chamaId}/join-code/rotate/`);
  },

  async enableJoinCode(chamaId: string): Promise<{
    detail: string;
    join_code: string;
    join_enabled: boolean;
    join_mode: 'auto_join' | 'approval_required';
    join_code_expires_at: string | null;
  }> {
    return apiClient.post(`/v1/chamas/${chamaId}/join-code/`);
  },

  async disableJoinCode(chamaId: string): Promise<{
    detail: string;
    join_enabled: boolean;
    join_code: string;
  }> {
    return apiClient.delete(`/v1/chamas/${chamaId}/join-code/`);
  },

  async deleteChama(id: string): Promise<void> {
    return apiClient.delete(`/v1/chamas/${id}/`);
  },

  async getMembers(chamaId: string): Promise<Membership[]> {
    const candidates = [
      `/v1/chamas/${chamaId}/members/`,
      `/v1/chamas/${chamaId}/members`,
      // Compatibility: some deployments/clients used `memberships` wording.
      `/v1/chamas/${chamaId}/memberships/`,
      `/v1/chamas/${chamaId}/memberships`,
    ];

    let lastError: unknown = null;

    for (const url of candidates) {
      try {
        const response = await apiClient.get<unknown>(url, {
          headers: {
            'X-CHAMA-ID': chamaId,
          },
        });
        return unwrapList<Membership>(response, ['members', 'results']);
      } catch (error) {
        lastError = error;
        const status = (error as any)?.status;
        if (status === 404) {
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to load members');
  },

  async getMember(chamaId: string, memberId: string): Promise<Membership> {
    try {
      return await apiClient.get<Membership>(`/v1/chamas/${chamaId}/members/${memberId}/`);
    } catch {
      const members = await this.getMembers(chamaId);
      const member = members.find((item) => item.id === memberId);
      if (!member) {
        throw new Error('Member not found');
      }
      return member;
    }
  },

  async updateMemberRole(chamaId: string, memberId: string, role: string): Promise<Membership> {
    return apiClient.patch<Membership>(`/v1/chamas/${chamaId}/members/${memberId}/role/`, { role });
  },

  async approveMember(chamaId: string, memberId: string): Promise<Membership> {
    return apiClient.post<Membership>(`/v1/chamas/${chamaId}/members/${memberId}/approve/`);
  },

  async rejectMember(chamaId: string, memberId: string, reason?: string): Promise<void> {
    return apiClient.post(`/v1/chamas/${chamaId}/members/${memberId}/reject/`, { reason });
  },

  async removeMember(chamaId: string, memberId: string, reason?: string): Promise<void> {
    await apiClient.post(`/v1/chamas/${chamaId}/members/${memberId}/reject/`, {
      reason,
    });
  },

  async requestJoin(chamaId: string, data: {
    request_note?: string;
    invite_token?: string;
    join_code?: string;
  }): Promise<MembershipRequest> {
    return apiClient.post<MembershipRequest>(`/v1/chamas/${chamaId}/request-join/`, data);
  },

  async getMembershipRequests(chamaId: string): Promise<MembershipRequest[]> {
    const response = await apiClient.get<unknown>(`/v1/chamas/${chamaId}/membership-requests/`);
    return unwrapList<MembershipRequest>(response, ['requests', 'results']);
  },

  async getMyMembershipRequests(): Promise<MembershipRequest[]> {
    const response = await apiClient.get<unknown>('/v1/chamas/my/membership-requests/');
    return unwrapList<MembershipRequest>(response, ['requests', 'results']);
  },

  async approveMembershipRequest(chamaId: string, requestId: string, note?: string): Promise<MembershipRequest> {
    return apiClient.post<MembershipRequest>(`/v1/chamas/${chamaId}/membership-requests/${requestId}/approve/`, { note });
  },

  async rejectMembershipRequest(chamaId: string, requestId: string, note?: string): Promise<MembershipRequest> {
    return apiClient.post<MembershipRequest>(`/v1/chamas/${chamaId}/membership-requests/${requestId}/reject/`, { note });
  },

  async cancelJoinRequest(requestId: string): Promise<void> {
    await apiClient.post(`/v1/join-requests/${requestId}/cancel/`, {});
  },

  async getRoleDelegations(chamaId: string): Promise<RoleDelegation[]> {
    const response = await apiClient.get<unknown>(`/v1/chamas/${chamaId}/role-delegations`);
    return unwrapList<RoleDelegation>(response, ['delegations', 'results']);
  },

  async createRoleDelegation(
    chamaId: string,
    data: {
      delegate_id: string;
      role: string;
      expires_at: string;
      notes?: string;
    }
  ): Promise<RoleDelegation> {
    return apiClient.post<RoleDelegation>(`/v1/chamas/${chamaId}/role-delegations`, data);
  },

  async revokeRoleDelegation(chamaId: string, delegationId: string): Promise<{ detail: string }> {
    return apiClient.post<{ detail: string }>(`/v1/chamas/${chamaId}/role-delegations/${delegationId}/revoke`);
  },

  async createInviteLink(chamaId: string, data: {
    expires_in_days?: number;
    max_uses?: number;
    restricted_phone?: string;
    preassigned_role?: string;
    approval_required?: boolean;
  }): Promise<InviteLink> {
    return apiClient.post<InviteLink>(`/v1/chamas/${chamaId}/invite-links/`, data);
  },

  async getInviteLinks(chamaId: string): Promise<InviteLink[]> {
    const response = await apiClient.get<unknown>(`/v1/chamas/${chamaId}/invite-links/`);
    return unwrapList<InviteLink>(response, ['links', 'invite_links', 'results']);
  },

  async resendInviteLink(chamaId: string, linkId: string, extendDays = 7): Promise<{ detail: string; invite_link: InviteLink }> {
    return apiClient.post<{ detail: string; invite_link: InviteLink }>(
      `/v1/chamas/${chamaId}/invite-links/${linkId}/resend/`,
      { extend_days: extendDays }
    );
  },

  async revokeInviteLink(chamaId: string, linkId: string, reason?: string): Promise<InviteLink> {
    return apiClient.post<InviteLink>(`/v1/chamas/${chamaId}/invite-links/${linkId}/revoke/`, { reason });
  },

  async lookupInvite(token: string): Promise<InviteLink> {
    return apiClient.get<InviteLink>(`/v1/invites/lookup?token=${token}`);
  },

  async acceptInvite(token: string): Promise<Membership> {
    return apiClient.post<Membership>('/v1/invites/accept/', { token });
  },
};
