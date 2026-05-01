import { apiClient } from './api';

export interface AnnouncementFeedItem {
  id: string;
  title: string;
  message: string;
  chama_id?: string | null;
  chama_name?: string;
  created_at: string;
  sent_at?: string | null;
  action_url?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical' | string;
  inbox_status?: 'unread' | 'read' | 'archived' | string;
  read_at?: string | null;
}

interface BackendFeedResponse {
  results: AnnouncementFeedItem[];
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const announcementService = {
  async getFeed(params: {
    chamaId?: string;
    unread?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
    results: AnnouncementFeedItem[];
    count: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  }> {
    const query = new URLSearchParams();
    if (params.chamaId) query.append('chama_id', params.chamaId);
    if (params.unread) query.append('unread', 'true');
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('page_size', String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : '';

    const response = await apiClient.get<BackendFeedResponse>(`/v1/notifications/announcements/feed${suffix}`);
    return {
      results: response.results || [],
      count: response.count || 0,
      page: response.page || 1,
      pageSize: response.page_size || params.pageSize || 20,
      hasNext: Boolean(response.has_next),
    };
  },
};

