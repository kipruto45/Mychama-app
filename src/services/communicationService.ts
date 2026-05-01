import { apiClient } from './api';
import {
  CommunicationAnalytics,
  CommunicationCampaign,
  CommunicationDeliveryLog,
  CommunicationEventDefinition,
} from '@/types';

const buildQuery = (params: Record<string, string | number | undefined | null>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const communicationService = {
  async getEventCatalog(): Promise<CommunicationEventDefinition[]> {
    const response = await apiClient.get<{ results: CommunicationEventDefinition[] }>(
      '/v1/notifications/admin/event-catalog'
    );
    return response.results || [];
  },

  async getAnalytics(chamaId: string): Promise<CommunicationAnalytics> {
    return apiClient.get<CommunicationAnalytics>(
      `/v1/notifications/admin/analytics${buildQuery({ chama_id: chamaId })}`
    );
  },

  async getCampaigns(params: {
    chamaId: string;
    status?: string;
    channel?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    results: CommunicationCampaign[];
    count: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  }> {
    const response = await apiClient.get<{
      results: CommunicationCampaign[];
      count: number;
      page: number;
      page_size: number;
      has_next: boolean;
    }>(
      `/v1/notifications/broadcast/history${buildQuery({
        chama_id: params.chamaId,
        status: params.status,
        channel: params.channel,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      })}`
    );

    return {
      results: response.results || [],
      count: response.count || 0,
      page: response.page || 1,
      pageSize: response.page_size || params.pageSize || 20,
      hasNext: Boolean(response.has_next),
    };
  },

  async sendCampaign(payload: {
    chama_id: string;
    title: string;
    message: string;
    target: 'all' | 'role' | 'specific';
    segment?: string;
    target_roles?: string[];
    target_member_ids?: string[];
    channels: Array<'in_app' | 'email' | 'sms'>;
    action_url?: string;
    metadata?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    scheduled_at?: string | null;
  }): Promise<CommunicationCampaign> {
    return apiClient.post<CommunicationCampaign>('/v1/notifications/broadcast', payload);
  },

  async cancelCampaign(campaignId: string): Promise<CommunicationCampaign> {
    return apiClient.post<CommunicationCampaign>(
      `/v1/notifications/admin/broadcasts/${campaignId}/cancel`
    );
  },

  async getDeliveryLogs(params: {
    chamaId: string;
    channel?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    results: CommunicationDeliveryLog[];
    count: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  }> {
    const response = await apiClient.get<{
      results: CommunicationDeliveryLog[];
      count: number;
      page: number;
      page_size: number;
      has_next: boolean;
    }>(
      `/v1/notifications/admin/delivery-logs${buildQuery({
        chama_id: params.chamaId,
        channel: params.channel,
        status: params.status,
        priority: params.priority,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      })}`
    );

    return {
      results: response.results || [],
      count: response.count || 0,
      page: response.page || 1,
      pageSize: response.page_size || params.pageSize || 20,
      hasNext: Boolean(response.has_next),
    };
  },

  async retryDelivery(deliveryId: string): Promise<void> {
    await apiClient.post(`/v1/notifications/admin/delivery-logs/${deliveryId}/retry`);
  },
};
