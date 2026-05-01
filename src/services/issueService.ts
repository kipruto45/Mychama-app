import { apiClient } from './api';
import {
  IssueComment,
  IssueDetail,
  IssueStats,
  IssueSummary,
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

export const issueService = {
  async getIssues(
    chamaId: string,
    filters?: {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
    }
  ): Promise<IssueSummary[]> {
    const params = new URLSearchParams({ chama_id: chamaId });

    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<unknown>(`/v1/issues/?${params.toString()}`);
    return unwrapList<IssueSummary>(response, ['results', 'issues']);
  },

  async getIssue(issueId: string): Promise<IssueDetail> {
    return apiClient.get<IssueDetail>(`/v1/issues/${issueId}/`);
  },

  async getIssueStats(chamaId: string): Promise<IssueStats> {
    return apiClient.get<IssueStats>(`/v1/issues/stats?chama_id=${chamaId}`);
  },

  async createIssue(data: {
    chama_id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    reported_user_id?: string;
    loan_id?: string;
    report_type?: string;
    is_anonymous?: boolean;
    due_at?: string;
  }): Promise<IssueDetail> {
    return apiClient.post<IssueDetail>('/v1/issues/', data);
  },

  async addComment(
    issueId: string,
    data: {
      message: string;
      is_internal?: boolean;
    }
  ): Promise<IssueComment> {
    return apiClient.post<IssueComment>(`/v1/issues/${issueId}/comments`, data);
  },
};
