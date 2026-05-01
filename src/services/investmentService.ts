import { apiClient } from './api';
import {
  InvestmentDistribution,
  InvestmentHistoryResponse,
  InvestmentOverview,
  InvestmentPortfolioAnalytics,
  InvestmentPortfolioSummary,
  InvestmentProduct,
  InvestmentProjection,
  InvestmentRecord,
  InvestmentRedemptionRecord,
  InvestmentUtilizationActionRecord,
  MemberInvestmentPosition,
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

const buildQuery = (params: Record<string, string | undefined | null>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const investmentService = {
  async getOverview(chamaId: string): Promise<InvestmentOverview> {
    return apiClient.get<InvestmentOverview>(`/v1/investments/overview/?chama_id=${chamaId}`);
  },

  async getInvestments(chamaId: string, status?: string): Promise<InvestmentRecord[]> {
    const response = await apiClient.get<unknown>(
      `/v1/investments/${buildQuery({ chama_id: chamaId, status })}`
    );
    return unwrapList<InvestmentRecord>(response, ['results']);
  },

  async getDistributions(chamaId: string): Promise<InvestmentDistribution[]> {
    const response = await apiClient.get<unknown>(
      `/v1/investments/distributions/${buildQuery({ chama_id: chamaId })}`
    );
    return unwrapList<InvestmentDistribution>(response, ['results']);
  },

  async getProducts(params: {
    chamaId: string;
    search?: string;
    category?: string;
    risk?: string;
    status?: string;
  }): Promise<InvestmentProduct[]> {
    return apiClient.get<InvestmentProduct[]>(
      `/v1/investments/products/${buildQuery({
        chama_id: params.chamaId,
        search: params.search,
        category: params.category,
        risk: params.risk,
        status: params.status,
      })}`
    );
  },

  async getProduct(productId: string): Promise<InvestmentProduct> {
    return apiClient.get<InvestmentProduct>(`/v1/investments/products/${productId}/`);
  },

  async simulateProduct(productId: string, amount: string): Promise<InvestmentProjection> {
    return apiClient.post<InvestmentProjection>(`/v1/investments/products/${productId}/simulate/`, {
      amount,
    });
  },

  async getPortfolioSummary(chamaId: string): Promise<InvestmentPortfolioSummary> {
    return apiClient.get<InvestmentPortfolioSummary>(
      `/v1/investments/member/portfolio/summary/${buildQuery({ chama_id: chamaId })}`
    );
  },

  async getPortfolioAnalytics(chamaId: string): Promise<InvestmentPortfolioAnalytics> {
    return apiClient.get<InvestmentPortfolioAnalytics>(
      `/v1/investments/member/portfolio/analytics/${buildQuery({ chama_id: chamaId })}`
    );
  },

  async createInvestment(payload: {
    chamaId: string;
    productId: string;
    amount: string;
    fundingSource: 'wallet' | 'mpesa' | 'hybrid';
    walletAmount?: string;
    mpesaAmount?: string;
    phone?: string;
    autoReinvest?: boolean;
    idempotencyKey?: string;
  }): Promise<MemberInvestmentPosition> {
    return apiClient.post<MemberInvestmentPosition>('/v1/investments/member/positions/', {
      chama_id: payload.chamaId,
      product_id: payload.productId,
      amount: payload.amount,
      funding_source: payload.fundingSource,
      wallet_amount: payload.walletAmount ?? '0.00',
      mpesa_amount: payload.mpesaAmount ?? '0.00',
      phone: payload.phone ?? '',
      auto_reinvest: payload.autoReinvest ?? false,
      idempotency_key: payload.idempotencyKey ?? '',
    });
  },

  async getMemberInvestments(params: {
    chamaId?: string;
    status?: string;
    productId?: string;
    risk?: string;
  }): Promise<MemberInvestmentPosition[]> {
    const response = await apiClient.get<unknown>(
      `/v1/investments/member/positions/${buildQuery({
        chama_id: params.chamaId,
        status: params.status,
        product_id: params.productId,
        risk: params.risk,
      })}`
    );
    return unwrapList<MemberInvestmentPosition>(response, ['results']);
  },

  async getInvestmentDetail(investmentId: string, chamaId?: string): Promise<MemberInvestmentPosition> {
    return apiClient.get<MemberInvestmentPosition>(
      `/v1/investments/member/positions/${investmentId}/${buildQuery({ chama_id: chamaId })}`
    );
  },

  async refreshInvestment(investmentId: string, chamaId?: string): Promise<MemberInvestmentPosition> {
    return apiClient.post<MemberInvestmentPosition>(
      `/v1/investments/member/positions/${investmentId}/refresh/${buildQuery({ chama_id: chamaId })}`,
      {}
    );
  },

  async utilizeReturns(payload: {
    investmentId: string;
    amount: string;
    actionType: 'wallet' | 'mpesa' | 'reinvest';
    beneficiaryPhone?: string;
  }): Promise<InvestmentUtilizationActionRecord> {
    return apiClient.post<InvestmentUtilizationActionRecord>(
      `/v1/investments/member/positions/${payload.investmentId}/utilize/`,
      {
        amount: payload.amount,
        action_type: payload.actionType,
        beneficiary_phone: payload.beneficiaryPhone ?? '',
      }
    );
  },

  async redeemInvestment(payload: {
    investmentId: string;
    redemptionType: 'returns_only' | 'partial' | 'full';
    amount?: string;
    destination: 'wallet' | 'mpesa';
    beneficiaryPhone?: string;
    reason?: string;
  }): Promise<InvestmentRedemptionRecord> {
    return apiClient.post<InvestmentRedemptionRecord>(
      `/v1/investments/member/positions/${payload.investmentId}/redeem/`,
      {
        redemption_type: payload.redemptionType,
        amount: payload.amount ?? null,
        destination: payload.destination,
        beneficiary_phone: payload.beneficiaryPhone ?? '',
        reason: payload.reason ?? '',
      }
    );
  },

  async getInvestmentHistory(chamaId: string): Promise<InvestmentHistoryResponse> {
    return apiClient.get<InvestmentHistoryResponse>(
      `/v1/investments/member/history/${buildQuery({ chama_id: chamaId })}`
    );
  },

  async getInvestmentEducation(chamaId?: string): Promise<{
    sections: Array<{ title: string; body: string }>;
    faq: Array<{ question: string; answer: string }>;
  }> {
    return apiClient.get(`/v1/investments/member/education/${buildQuery({ chama_id: chamaId })}`);
  },
};
