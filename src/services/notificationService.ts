import { apiClient } from './api';
import { Notification, NotificationPreferences } from '@/types';

interface BackendNotification {
  id: string;
  chama_id?: string;
  chama_name?: string;
  type: Notification['type'];
  category?: string;
  subject: string;
  message: string;
  action_url?: string | null;
  metadata?: Record<string, any>;
  inbox_status: 'unread' | 'read' | string;
  created_at: string;
  read_at: string | null;
}

interface NotificationListResponse {
  notifications: BackendNotification[];
  results?: BackendNotification[];
  unread_count: number;
  total_count: number;
  count?: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface NotificationQuery {
  unread?: boolean;
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  chamaId?: string;
  search?: string;
}

export interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface PushRegistrationPayload {
  platform?: 'android' | 'ios';
  deviceName?: string;
  appVersion?: string;
}

interface BackendNotificationPreferences {
  sms_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  critical_only_mode: boolean;
  email_contribution_reminders: boolean;
  email_meeting_notifications: boolean;
  email_payment_confirmations: boolean;
  email_loan_updates: boolean;
  email_general_announcements: boolean;
  sms_contribution_reminders: boolean;
  sms_meeting_notifications: boolean;
  sms_payment_confirmations: boolean;
  sms_loan_updates: boolean;
  sms_general_announcements: boolean;
}

const mapNotification = (notification: BackendNotification): Notification => ({
  id: notification.id,
  user: '',
  chama_id: notification.chama_id || null,
  chama_name: notification.chama_name || null,
  type: notification.type,
  category: notification.category || null,
  title: notification.subject,
  message: notification.message,
  data: {
    ...(notification.metadata || {}),
    action_url: notification.action_url || null,
    category: notification.category || null,
  },
  is_read: notification.inbox_status.toLowerCase() === 'read',
  read_at: notification.read_at,
  created_at: notification.created_at,
});

const buildNotificationQuery = (params: NotificationQuery = {}) => {
  const query = new URLSearchParams();

  if (params.unread) {
    query.append('unread', 'true');
  }
  if (params.page) {
    query.append('page', String(params.page));
  }
  if (params.pageSize) {
    query.append('page_size', String(params.pageSize));
  }
  if (params.type) {
    query.append('type', params.type);
  }
  if (params.category) {
    query.append('category', params.category);
  }
  if (params.chamaId) {
    query.append('chama_id', params.chamaId);
  }
  if (params.search) {
    query.append('search', params.search);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

const mapPreferences = (
  preferences: BackendNotificationPreferences
): NotificationPreferences => ({
  push_enabled: preferences.in_app_enabled,
  email_enabled: preferences.email_enabled,
  sms_enabled: preferences.sms_enabled,
  contribution_reminders:
    preferences.email_contribution_reminders || preferences.sms_contribution_reminders,
  meeting_reminders:
    preferences.email_meeting_notifications || preferences.sms_meeting_notifications,
  announcements: preferences.sms_general_announcements,
  payment_notifications:
    preferences.email_payment_confirmations || preferences.sms_payment_confirmations,
});

const toBackendPreferences = (preferences: Partial<NotificationPreferences>) => ({
  in_app_enabled: preferences.push_enabled,
  email_enabled: preferences.email_enabled,
  sms_enabled: preferences.sms_enabled,
  email_contribution_reminders: preferences.contribution_reminders,
  sms_contribution_reminders: preferences.contribution_reminders,
  email_meeting_notifications: preferences.meeting_reminders,
  sms_meeting_notifications: preferences.meeting_reminders,
  sms_general_announcements: preferences.announcements,
  email_payment_confirmations: preferences.payment_notifications,
  sms_payment_confirmations: preferences.payment_notifications,
}).valueOf();

export const notificationService = {
  async getNotifications(params: NotificationQuery = {}): Promise<NotificationFeed> {
    const response = await apiClient.get<NotificationListResponse | BackendNotification[]>(
      `/v1/notifications/mobile${buildNotificationQuery(params)}`
    );

    if (Array.isArray(response)) {
      return {
        notifications: response.map(mapNotification),
        unreadCount: response.filter((item) => item.inbox_status.toLowerCase() !== 'read').length,
        totalCount: response.length,
        page: 1,
        pageSize: response.length,
        hasNext: false,
      };
    }

    const rows = response.notifications || response.results || [];
    return {
      notifications: rows.map(mapNotification),
      unreadCount: response.unread_count ?? 0,
      totalCount: response.total_count ?? response.count ?? rows.length,
      page: response.page ?? 1,
      pageSize: response.page_size ?? rows.length,
      hasNext: Boolean(response.has_next),
    };
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unread_count?: number; count?: number }>('/v1/notifications/mobile/unread-count');
    return response.unread_count ?? response.count ?? 0;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.post('/v1/notifications/mobile/mark-read', {
      id,
      notification_id: id,
    });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/v1/notifications/mobile/mark-all-read');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.post(`/v1/notifications/${id}/archive`, { archive: true });
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<BackendNotificationPreferences | { preferences: BackendNotificationPreferences }>(
      '/v1/notifications/preferences'
    );
    const preferences = 'preferences' in (response as Record<string, unknown>)
      ? (response as { preferences: BackendNotificationPreferences }).preferences
      : (response as BackendNotificationPreferences);
    return mapPreferences(preferences);
  },

  async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const payload = Object.fromEntries(
      Object.entries(toBackendPreferences(data)).filter(([, value]) => value !== undefined)
    );
    const response = await apiClient.put<BackendNotificationPreferences | { preferences: BackendNotificationPreferences }>(
      '/v1/notifications/preferences',
      payload
    );
    const preferences = 'preferences' in (response as Record<string, unknown>)
      ? (response as { preferences: BackendNotificationPreferences }).preferences
      : (response as BackendNotificationPreferences);
    return mapPreferences(preferences);
  },

  async registerPushToken(token: string, payload: PushRegistrationPayload = {}): Promise<void> {
    await apiClient.post('/v1/notifications/devices/register', {
      token,
      platform: payload.platform || 'android',
      device_name: payload.deviceName || '',
      app_version: payload.appVersion || '',
    });
  },

  async unregisterPushToken(token: string): Promise<void> {
    await apiClient.post('/v1/notifications/devices/unregister', {
      token,
    });
  },
};
