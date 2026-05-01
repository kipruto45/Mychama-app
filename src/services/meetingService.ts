import { apiClient } from './api';
import { Meeting, MeetingAgenda, MeetingMinutes, MeetingAttendance, MeetingResolution } from '@/types';

interface MeetingApiResponse {
  id: string;
  chama: string;
  title: string;
  description?: string;
  location?: string;
  location_type?: 'physical' | 'online' | 'hybrid';
  meeting_link?: string | null;
  date: string;
  agenda: MeetingAgenda[] | string;
  minutes_text: string;
  minutes_file: string | null;
  attendance_qr_token: string;
  quorum_percentage: number;
  minutes_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  minutes_approved_by: string | null;
  minutes_approved_at: string | null;
  cancelled_at?: string | null;
  cancelled_by_id?: string | null;
  cancellation_reason?: string;
  attendance?: MeetingAttendance[];
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

interface MeetingSummary {
  meeting_id: string;
  title: string;
  date: string;
  total_members: number;
  attendance_marked: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
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

const formatMeetingTime = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const deriveMeetingStatus = (
  dateString: string,
  cancelledAt?: string | null
): Meeting['status'] => {
  if (cancelledAt) {
    return 'cancelled';
  }

  const scheduledDate = new Date(dateString);

  if (Number.isNaN(scheduledDate.getTime())) {
    return 'scheduled';
  }

  return scheduledDate.getTime() <= Date.now() ? 'completed' : 'scheduled';
};

const parseMeetingAgenda = (agenda: MeetingAgenda[] | string, meetingId: string) => {
  if (!agenda) {
    return [];
  }

  if (Array.isArray(agenda)) {
    return agenda.map((item: any, index: number) => ({
      id: item.id || `agenda-${index}`,
      meeting: item.meeting || meetingId,
      proposed_by: item.proposed_by || '',
      proposed_by_name: item.proposed_by_name || '',
      title: item.title || item.name || `Agenda item ${index + 1}`,
      description: item.description || '',
      order: item.order ?? index + 1,
      duration_minutes: item.duration_minutes ?? 0,
      status: item.status || 'proposed',
      approved_by: item.approved_by || null,
      approved_by_name: item.approved_by_name || null,
      approved_at: item.approved_at || null,
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
    }));
  }

  try {
    const parsed = JSON.parse(agenda);
    return Array.isArray(parsed)
      ? parsed.map((item: any, index: number) => ({
          id: item.id || `agenda-${index}`,
          meeting: item.meeting || meetingId,
          proposed_by: item.proposed_by || '',
          proposed_by_name: item.proposed_by_name || '',
          title: item.title || item.name || `Agenda item ${index + 1}`,
          description: item.description || '',
          order: item.order ?? index + 1,
          duration_minutes: item.duration_minutes ?? 0,
          status: item.status || 'proposed',
          approved_by: item.approved_by || null,
          approved_by_name: item.approved_by_name || null,
          approved_at: item.approved_at || null,
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
        }))
      : [];
  } catch {
    return agenda
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `agenda-${index}`,
        meeting: meetingId,
        proposed_by: '',
        proposed_by_name: '',
        title: line,
        description: '',
        order: index + 1,
        duration_minutes: 0,
        status: 'proposed',
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        created_at: '',
        updated_at: '',
      }));
  }
};

const mapMeeting = (meeting: MeetingApiResponse): Meeting => ({
  id: meeting.id,
  chama: meeting.chama,
  title: meeting.title,
  description: meeting.description || '',
  location: meeting.location || '',
  location_type: meeting.location_type || 'physical',
  meeting_link: meeting.meeting_link || null,
  date: meeting.date,
  time: formatMeetingTime(meeting.date),
  status: deriveMeetingStatus(meeting.date, meeting.cancelled_at || null),
  agenda: parseMeetingAgenda(meeting.agenda, meeting.id),
  attendance: meeting.attendance || [],
  attendance_qr_token: meeting.attendance_qr_token,
  quorum_percentage: meeting.quorum_percentage,
  minutes_status: meeting.minutes_status,
  minutes_approved_by: meeting.minutes_approved_by,
  minutes_approved_at: meeting.minutes_approved_at,
  cancelled_at: meeting.cancelled_at || null,
  cancelled_by_id: meeting.cancelled_by_id || null,
  cancellation_reason: meeting.cancellation_reason || '',
  created_by: {
    id: meeting.created_by_id,
    phone: '',
    phone_verified: false,
    phone_verified_at: null,
    email: '',
    full_name: '',
    avatar: null,
    profile_completed: false,
    active_chama_id: meeting.chama,
    is_active: true,
    two_factor_enabled: false,
    two_factor_method: null,
    date_joined: '',
    last_login_at: null,
    role: null,
    referral_code: '',
    referral_count: 0,
  },
  created_at: meeting.created_at,
  minutes: {
    meeting: meeting.id,
    content: meeting.minutes_text || '',
    status: meeting.minutes_status,
    recorded_at: meeting.minutes_approved_at || meeting.updated_at,
  },
  updated_at: meeting.updated_at,
});

const buildAgendaText = (data: {
  description: string;
  location: string;
  location_type: 'physical' | 'online' | 'hybrid';
  meeting_link?: string;
  agenda: Array<{
    title: string;
    description: string;
  }>;
}) => {
  const sections: string[] = [];

  if (data.description.trim()) {
    sections.push(data.description.trim());
  }

  if (data.location.trim()) {
    sections.push(`Location (${data.location_type}): ${data.location.trim()}`);
  }

  if (data.meeting_link?.trim()) {
    sections.push(`Meeting Link: ${data.meeting_link.trim()}`);
  }

  const agendaLines = data.agenda
    .filter((item) => item.title.trim())
    .map((item, index) =>
      `${index + 1}. ${item.title.trim()}${item.description.trim() ? ` - ${item.description.trim()}` : ''}`
    );

  if (agendaLines.length > 0) {
    sections.push(`Agenda Overview:\n${agendaLines.join('\n')}`);
  }

  return sections.join('\n\n');
};

export const meetingService = {
  async getMeetings(chamaId: string): Promise<Meeting[]> {
    const response = await apiClient.get<MeetingApiResponse[] | { meetings?: MeetingApiResponse[]; results?: MeetingApiResponse[] }>(
      `/v1/meetings/?chama_id=${chamaId}`
    );
    return unwrapList<MeetingApiResponse>(response, ['meetings', 'results']).map(mapMeeting);
  },

  async getMeeting(id: string): Promise<Meeting> {
    const response = await apiClient.get<MeetingApiResponse>(`/v1/meetings/${id}/`);
    return mapMeeting(response);
  },

  async createMeeting(data: {
    chama: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    location_type: 'physical' | 'online' | 'hybrid';
    meeting_link?: string;
    agenda: Array<{
      title: string;
      description: string;
      order: number;
      duration_minutes: number;
    }>;
  }): Promise<Meeting> {
    const dateTime = new Date(`${data.date}T${data.time}`);    const payload = {
      chama_id: data.chama,
      title: data.title,
      description: data.description,
      location: data.location,
      location_type: data.location_type,
      meeting_link: data.meeting_link || '',
      date: Number.isNaN(dateTime.getTime()) ? `${data.date}T${data.time}:00` : dateTime.toISOString(),
      agenda: data.agenda.map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        order: item.order,
        duration_minutes: item.duration_minutes,
      })),
      quorum_percentage: 50,
    };

    const createdMeeting = await apiClient.post<MeetingApiResponse>('/v1/meetings/', payload);

    return this.getMeeting(createdMeeting.id);
  },

  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    await apiClient.patch(`/v1/meetings/${id}/`, {
      title: data.title,
      description: data.description,
      location: data.location,
      location_type: data.location_type,
      meeting_link: data.meeting_link,
      date: data.date,
      quorum_percentage: data.quorum_percentage,
    });
    return this.getMeeting(id);
  },

  async cancelMeeting(id: string, cancellationReason?: string): Promise<Meeting> {
    await apiClient.post(`/v1/meetings/${id}/cancel`, {
      cancellation_reason: cancellationReason || '',
    });
    return this.getMeeting(id);
  },

  async getAttendance(meetingId: string): Promise<MeetingAttendance[]> {
    return apiClient.get<MeetingAttendance[]>(`/v1/meetings/${meetingId}/attendance`);
  },

  async markAttendance(meetingId: string, data: {
    member_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }): Promise<MeetingAttendance> {
    const response = await apiClient.post<{ records: MeetingAttendance[] }>(
      `/v1/meetings/${meetingId}/attendance/mark`,
      { records: [data] }
    );

    return response.records[0];
  },

  async getMinutes(meetingId: string): Promise<MeetingMinutes> {
    const meeting = await this.getMeeting(meetingId);
    return meeting.minutes as MeetingMinutes;
  },

  async createMinutes(meetingId: string, data: {
    content: string;
    resolutions: Array<{
      title: string;
      description: string;
    }>;
  }): Promise<MeetingMinutes> {
    const meeting = await apiClient.post<MeetingApiResponse>(`/v1/meetings/${meetingId}/minutes/upload`, {
      minutes_text: data.content,
    });

    return {
      meeting: meeting.id,
      content: meeting.minutes_text || '',
      status: meeting.minutes_status,
      recorded_at: meeting.updated_at,
    };
  },

  async getAgendaItems(meetingId: string): Promise<MeetingAgenda[]> {
    const response = await apiClient.get<MeetingAgenda[] | { agenda?: MeetingAgenda[]; results?: MeetingAgenda[] }>(
      `/v1/meetings/${meetingId}/agenda`
    );
    return unwrapList<MeetingAgenda>(response, ['agenda', 'results']);
  },

  async getMeetingSummary(meetingId: string): Promise<MeetingSummary> {
    return apiClient.get<MeetingSummary>(`/v1/meetings/${meetingId}/summary`);
  },

  async getMinutesArchive(chamaId?: string): Promise<Meeting[]> {
    const query = chamaId ? `?chama_id=${chamaId}` : '';
    const response = await apiClient.get<
      MeetingApiResponse[] | { meetings?: MeetingApiResponse[]; minutes?: MeetingApiResponse[]; results?: MeetingApiResponse[] }
    >(`/v1/meetings/minutes/archive${query}`);
    return unwrapList<MeetingApiResponse>(response, ['meetings', 'minutes', 'results']).map(mapMeeting);
  },

  async getResolutions(meetingId: string): Promise<MeetingResolution[]> {
    const response = await apiClient.get<
      MeetingResolution[] | { resolutions?: MeetingResolution[]; results?: MeetingResolution[] }
    >(`/v1/meetings/${meetingId}/resolutions`);
    return unwrapList<MeetingResolution>(response, ['resolutions', 'results']);
  },
};
