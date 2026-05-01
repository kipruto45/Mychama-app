import { apiClient } from './api';
import {
  ApprovalCenter,
  AuditTrailEntry,
  DashboardOverview,
  MemberProfile,
  RoleWorkspaceResponse,
} from '@/types';

interface PaginatedAuditResponse {
  results: AuditTrailEntry[];
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

interface AuditQuery {
  chamaId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  createdFrom?: string;
  createdTo?: string;
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const appService = {
  async getDashboardOverview(chamaId?: string): Promise<DashboardOverview> {
    const query = buildQueryString({ chama_id: chamaId });
    return apiClient.get<DashboardOverview>(`/v1/app/dashboard/${query}`);
  },

  async getApprovalsCenter(chamaId?: string): Promise<ApprovalCenter> {
    const query = buildQueryString({ chama_id: chamaId });
    return apiClient.get<ApprovalCenter>(`/v1/app/approvals-center/${query}`);
  },

  async getActivityHistory(query: AuditQuery = {}): Promise<PaginatedAuditResponse> {
    return apiClient.get<PaginatedAuditResponse>(
      `/v1/app/activity-history/${buildQueryString({
        chama_id: query.chamaId,
        action: query.action,
        entity_type: query.entityType,
        search: query.search,
        page: query.page,
        page_size: query.pageSize,
        created_from: query.createdFrom,
        created_to: query.createdTo,
      })}`
    );
  },

  async getAuditLogs(query: AuditQuery & { chamaId: string }): Promise<PaginatedAuditResponse> {
    return apiClient.get<PaginatedAuditResponse>(
      `/v1/app/audit-logs/${buildQueryString({
        chama_id: query.chamaId,
        action: query.action,
        entity_type: query.entityType,
        search: query.search,
        page: query.page,
        page_size: query.pageSize,
        created_from: query.createdFrom,
        created_to: query.createdTo,
      })}`
    );
  },

  async getMemberProfile(chamaId?: string): Promise<MemberProfile> {
    const query = buildQueryString({ chama_id: chamaId });
    return apiClient.get<MemberProfile>(`/v1/app/profile/${query}`);
  },

  async getRoleWorkspaces(chamaId?: string): Promise<RoleWorkspaceResponse> {
    const query = buildQueryString({ chama_id: chamaId });
    return apiClient.get<RoleWorkspaceResponse>(`/v1/app/role-workspaces/${query}`);
  },
};
