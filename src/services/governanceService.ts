import { apiClient } from './api';
import {
  ChamaRule,
  GovernanceApprovalRequest,
  GovernanceMotion,
  GovernanceMotionResult,
  GovernanceOverview,
  RoleDelegation,
  RuleAcknowledgment,
} from '@/types';

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

export const governanceService = {
  async getOverview(chamaId: string): Promise<GovernanceOverview> {
    return apiClient.get<GovernanceOverview>(`/v1/governance/overview/?chama_id=${chamaId}`);
  },

  async getRules(chamaId: string, status?: string): Promise<ChamaRule[]> {
    const query = status
      ? `/v1/governance/rules/?chama_id=${chamaId}&status=${status}`
      : `/v1/governance/rules/?chama_id=${chamaId}`;
    const response = await apiClient.get<unknown>(query);
    return unwrapList<ChamaRule>(response, ['results']);
  },

  async getMyAcknowledgments(): Promise<RuleAcknowledgment[]> {
    const response = await apiClient.get<unknown>('/v1/governance/rules/my-acknowledgments/');
    return unwrapList<RuleAcknowledgment>(response, ['results']);
  },

  async acknowledgeRule(ruleId: string): Promise<RuleAcknowledgment> {
    return apiClient.post<RuleAcknowledgment>('/v1/governance/acknowledgments/acknowledge/', {
      rule_id: ruleId,
    });
  },

  async getApprovals(chamaId: string, status?: string): Promise<GovernanceApprovalRequest[]> {
    const query = status
      ? `/v1/governance/approvals/?chama_id=${chamaId}&status=${status}`
      : `/v1/governance/approvals/?chama_id=${chamaId}`;
    const response = await apiClient.get<unknown>(query);
    return unwrapList<GovernanceApprovalRequest>(response, ['results']);
  },

  async decideApproval(
    approvalId: string,
    data: {
      action: 'approve' | 'reject';
      comment?: string;
      conditions?: Record<string, unknown>;
    }
  ): Promise<GovernanceApprovalRequest> {
    return apiClient.post<GovernanceApprovalRequest>(
      `/v1/governance/approvals/${approvalId}/decide/`,
      data
    );
  },

  async getDelegations(chamaId: string): Promise<RoleDelegation[]> {
    const response = await apiClient.get<unknown>(`/v1/governance/delegations/?chama_id=${chamaId}`);
    return unwrapList<RoleDelegation>(response, ['results']);
  },

  async getMotions(chamaId: string, status?: string): Promise<GovernanceMotion[]> {
    const query = status
      ? `/v1/governance/motions/?chama_id=${chamaId}&status=${status}`
      : `/v1/governance/motions/?chama_id=${chamaId}`;
    const response = await apiClient.get<unknown>(query);
    return unwrapList<GovernanceMotion>(response, ['results']);
  },

  async createMotion(
    chamaId: string,
    data: {
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      quorum_percent: number;
      eligible_roles?: string[];
    }
  ): Promise<GovernanceMotion> {
    return apiClient.post<GovernanceMotion>('/v1/governance/motions/', {
      ...data,
      chama: chamaId,
    });
  },

  async voteMotion(motionId: string, vote: 'yes' | 'no' | 'abstain'): Promise<GovernanceMotion> {
    return apiClient.post<GovernanceMotion>(`/v1/governance/motions/${motionId}/cast_vote/`, {
      vote,
    });
  },

  async closeMotion(motionId: string): Promise<{ motion: GovernanceMotion; result: GovernanceMotionResult }> {
    return apiClient.post<{ motion: GovernanceMotion; result: GovernanceMotionResult }>(
      `/v1/governance/motions/${motionId}/close/`
    );
  },

  async getMotionResults(motionId: string): Promise<{ motion: GovernanceMotion; result: GovernanceMotionResult | null }> {
    return apiClient.get<{ motion: GovernanceMotion; result: GovernanceMotionResult | null }>(
      `/v1/governance/motions/${motionId}/results/`
    );
  },
};
