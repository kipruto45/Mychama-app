import { apiClient } from './api';
import { AIMessage, AIInsight, AIAnalysis } from '@/types';

interface AIConversation {
  id: string;
  mode: string;
  title: string;
  created_at: string;
  updated_at: string;
}

type ChatbotEnvelope<T> = {
  success: boolean;
  code: string;
  message: string;
  errors: Record<string, any>;
  data: T;
};

const unwrapEnvelope = <T>(response: ChatbotEnvelope<T>): T => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response from server.');
  }
  if (!response.success) {
    throw new Error(response.message || 'Request failed.');
  }
  return response.data;
};

const unwrapConversations = (
  response: { conversations?: AIConversation[] } | AIConversation[]
): AIConversation[] => {
  if (Array.isArray(response)) {
    return response;
  }

  return response.conversations || [];
};

export const aiService = {
  async chatbotStartConversation(params: {
    chamaId?: string | null;
    title?: string;
    mode?: string;
  }): Promise<{ conversation: AIConversation; suggestions: string[] }> {
    const response = await apiClient.post<ChatbotEnvelope<{ conversation: AIConversation; suggestions: string[] }>>(
      '/v1/ai/chat/start/',
      {
        title: params.title || '',
        chama_id: params.chamaId || null,
        mode: params.mode || '',
      }
    );

    return unwrapEnvelope(response);
  },

  async chatbotListConversations(params?: {
    chamaId?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: AIConversation[]; total: number; has_more: boolean }> {
    const chamaId = params?.chamaId;
    const query = new URLSearchParams();
    if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params?.offset === 'number') query.set('offset', String(params.offset));
    if (chamaId === null) query.set('chama_id', 'none');
    if (typeof chamaId === 'string' && chamaId.trim()) query.set('chama_id', chamaId);

    const response = await apiClient.get<
      ChatbotEnvelope<{ conversations: AIConversation[]; total: number; has_more: boolean }>
    >(`/v1/ai/chatbot/conversations/?${query.toString()}`);
    return unwrapEnvelope(response);
  },

  async chatbotGetHistory(params: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: AIMessage[]; total: number; has_more: boolean }> {
    const query = new URLSearchParams();
    if (typeof params.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params.offset === 'number') query.set('offset', String(params.offset));

    const response = await apiClient.get<
      ChatbotEnvelope<{
        messages: Array<{
          id: string;
          role: 'user' | 'assistant' | 'tool' | 'system';
          content: string;
          tool_name?: string | null;
          tool_payload?: Record<string, any> | null;
          created_at: string;
        }>;
        total: number;
        has_more: boolean;
      }>
    >(`/v1/ai/chat/${params.conversationId}/history/?${query.toString()}`);

    const data = unwrapEnvelope(response);
    return {
      total: data.total,
      has_more: data.has_more,
      messages: (data.messages || [])
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant',
          content: message.content,
          timestamp: message.created_at,
          tool_name: message.tool_name || null,
          tool_payload: message.tool_payload || null,
        })),
    };
  },

  async chatbotSendMessage(params: {
    conversationId: string;
    message: string;
  }): Promise<{
    conversation_id: string;
    message_id: string;
    response: string;
    actions: Array<{ label: string; href: string }>;
    follow_up_suggestions: string[];
  }> {
    const response = await apiClient.post<
      ChatbotEnvelope<{
        conversation_id: string;
        message_id: string;
        response: string;
        actions: Array<{ label: string; href: string }>;
        follow_up_suggestions: string[];
      }>
    >('/v1/ai/chat/message/', {
      conversation_id: params.conversationId,
      message: params.message,
      stream: false,
    });

    return unwrapEnvelope(response);
  },

  async chatbotClearConversation(conversationId: string): Promise<{ archived_at: string }> {
    const response = await apiClient.post<ChatbotEnvelope<{ archived_at: string }>>(
      `/v1/ai/chat/${conversationId}/clear/`,
      {}
    );
    return unwrapEnvelope(response);
  },

  async chatbotSendFeedback(messageId: string, rating: 'thumbs_up' | 'thumbs_down', comment?: string) {
    const response = await apiClient.post<ChatbotEnvelope<{ feedback_id: string }>>('/v1/ai/chat/feedback/', {
      message_id: messageId,
      rating,
      comment: comment || '',
    });
    return unwrapEnvelope(response);
  },

  async getQuickPromptsForChama(chamaId: string): Promise<string[]> {
    const response = await apiClient.get<{ prompts: Array<{ text: string }> }>(
      `/v1/chamas/${chamaId}/ai-quick-prompts/`
    );
    return (response.prompts || []).map((prompt) => prompt.text).filter(Boolean);
  },

  async getRoleSuggestions(chamaId: string): Promise<string[]> {
    const response = await apiClient.get<{
      suggestions: Array<{ id: string; text: string; category?: string }>;
    }>('/v1/ai/suggestions/', {
      headers: {
        'X-CHAMA-ID': chamaId,
      },
    });

    return (response.suggestions || [])
      .map((item) => String(item.text || '').trim())
      .filter(Boolean)
      .slice(0, 6);
  },

  async sendMessage(
    chamaId: string,
    message: string,
    conversationId?: string
  ): Promise<{
    message: string;
    suggestions?: string[];
    conversation_id?: string;
    message_id?: string;
    actions?: Array<{ label: string; href: string }>;
    follow_up_suggestions?: string[];
  }> {
    const response = await apiClient.post<{
      answer?: string;
      message?: string;
      suggestions?: string[];
      conversation_id?: string;
      message_id?: string;
      actions?: Array<{ label: string; href: string }>;
      follow_up_suggestions?: string[];
    }>(
      '/v1/ai/chat/',
      {
        message,
        conversation_id: conversationId,
        chama_id: chamaId,
      },
      {
        headers: {
          'X-CHAMA-ID': chamaId,
        },
      }
    );

    const resolvedMessage = response.answer || response.message;

    if (!resolvedMessage) {
      throw new Error('The AI backend returned an empty response.');
    }

    return {
      message: resolvedMessage,
      suggestions: response.suggestions,
      conversation_id: response.conversation_id,
      message_id: response.message_id,
      actions: response.actions,
      follow_up_suggestions: response.follow_up_suggestions,
    };
  },

  async getConversations(chamaId: string): Promise<AIConversation[]> {
    const response = await apiClient.get<{ conversations?: AIConversation[] } | AIConversation[]>(
      `/v1/ai/conversations/?chama_id=${chamaId}`,
      {
        headers: {
          'X-CHAMA-ID': chamaId,
        },
      }
    );

    return unwrapConversations(response);
  },

  async getChatHistory(chamaId: string): Promise<AIMessage[]> {
    const conversations = await this.getConversations(chamaId);
    const latestConversation = conversations[0];
    if (!latestConversation) {
      return [];
    }

    const response = await apiClient.get<{
      conversation_id: string;
      messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'tool' | 'system';
        content: string;
        tool_name?: string | null;
        tool_payload?: Record<string, any> | null;
        created_at: string;
      }>;
    }>(`/v1/ai/conversations/${latestConversation.id}/messages/`, {
      headers: {
        'X-CHAMA-ID': chamaId,
      },
    });

    return response.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        id: message.id,
        role: message.role as 'user' | 'assistant',
        content: message.content,
        timestamp: message.created_at,
        chama_id: chamaId,
        tool_name: message.tool_name || null,
        tool_payload: message.tool_payload || null,
      }));
  },

  async sendFeedback(messageId: string, rating: 'thumbs_up' | 'thumbs_down', comment?: string) {
    return apiClient.post('/v1/ai/feedback/', {
      message_id: messageId,
      rating,
      comment: comment || '',
    });
  },

  async clearConversation(conversationId: string) {
    return apiClient.post(`/v1/ai/chat/${conversationId}/clear/`, {});
  },

  async getInsights(chamaId: string): Promise<AIInsight[]> {
    const response = await apiClient.get<{ insights: AIInsight[] }>(`/v1/ai/insights/${chamaId}/`);
    return response.insights;
  },

  async getSuggestions(context: string): Promise<AIInsight[]> {
    if (context.startsWith('chama:')) {
      const chamaId = context.replace('chama:', '');
      const prompts = await this.getQuickPromptsForChama(chamaId);
      return prompts.map((suggestion, index) => ({
        id: `chama-suggestion-${index}`,
        type: 'suggestion',
        title: suggestion,
        description: 'Role-aware prompt from your chama workspace',
        priority: 'low',
        data: {},
        created_at: new Date().toISOString(),
      }));
    }

    const response = await apiClient.get<{ suggestions: string[] }>('/v1/ai/public/suggestions/');
    return response.suggestions.map((suggestion, index) => ({
      id: `suggestion-${index}`,
      type: 'suggestion',
      title: suggestion,
      description: context,
      priority: 'low',
      data: {},
      created_at: new Date().toISOString(),
    }));
  },

  async getFinancialAnalysis(chamaId: string): Promise<AIAnalysis> {
    const response = await apiClient.get<any>(`/v1/ai/risk-profile/${chamaId}/`);
    return {
      summary: response.summary || 'Financial analysis generated from backend risk profile.',
      recommendations: response.recommendations || [],
      risk_score: response.risk_score || 0,
      insights: [],
    };
  },

  async getMemberRiskAssessment(chamaId: string, memberId: string): Promise<{
    risk_level: string;
    risk_score: number;
    factors: string[];
    recommendations: string[];
  }> {
    return apiClient.post('/v1/ai/membership-risk-scoring/', { member_id: memberId }, {
      headers: {
        'X-CHAMA-ID': chamaId,
      },
    });
  },

  async getFraudDetection(chamaId: string): Promise<{
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      description: string;
      created_at: string;
    }>;
    risk_score: number;
  }> {
    const response = await apiClient.get<{ flags: Array<{ id: string; flag_type?: string; severity?: string; description?: string; created_at: string }> }>(
      `/v1/ai/fraud-flags/${chamaId}/`
    );
    return {
      alerts: response.flags.map((flag) => ({
        id: flag.id,
        type: flag.flag_type || 'fraud_flag',
        severity: flag.severity || 'medium',
        description: flag.description || 'Potential fraud flagged by backend.',
        created_at: flag.created_at,
      })),
      risk_score: response.flags.length,
    };
  },
};
