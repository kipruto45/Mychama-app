/**
 * Custom hooks for Investment management
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentService } from '@/services/investmentService';
import { InvestmentProduct, MemberInvestmentPosition, InvestmentPortfolioSummary } from '@/types';
import { ValidationError, validateInvestmentAmount, validatePhone } from './utils';

// ============================================================================
// 1. useInvestmentProducts - Fetch and cache products
// ============================================================================

export function useInvestmentProducts(chamaId: string | undefined, search?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['investmentProducts', chamaId, search],
    queryFn: async () => {
      if (!chamaId) throw new Error('No chamaId provided');
      return investmentService.getProducts({
        chamaId,
        search,
      });
    },
    enabled: !!chamaId,
  });

  return {
    products: data || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// 2. useInvestmentDetail - Fetch single product details
// ============================================================================

export function useInvestmentProductDetail(productId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['investmentProduct', productId],
    queryFn: async () => {
      if (!productId) throw new Error('No productId provided');
      return investmentService.getProduct(productId);
    },
    enabled: !!productId,
  });

  return {
    product: data,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// 3. useInvestmentPortfolio - Fetch portfolio summary and analytics
// ============================================================================

export function useInvestmentPortfolio(chamaId: string | undefined) {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['portfolioSummary', chamaId],
    queryFn: async () => {
      if (!chamaId) throw new Error('No chamaId provided');
      return investmentService.getPortfolioSummary(chamaId);
    },
    enabled: !!chamaId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['portfolioAnalytics', chamaId],
    queryFn: async () => {
      if (!chamaId) throw new Error('No chamaId provided');
      return investmentService.getPortfolioAnalytics(chamaId);
    },
    enabled: !!chamaId,
  });

  return {
    summary: summary,
    analytics: analytics,
    isLoading: summaryLoading || analyticsLoading,
  };
}

// ============================================================================
// 4. useMyInvestments - Fetch member's investments
// ============================================================================

export function useMyInvestments(
  chamaId: string | undefined,
  status?: string,
  productId?: string
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myInvestments', chamaId, status, productId],
    queryFn: async () => {
      if (!chamaId) throw new Error('No chamaId provided');
      return investmentService.getMemberInvestments({
        chamaId,
        status,
        productId,
      });
    },
    enabled: !!chamaId,
  });

  return {
    investments: data || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// 5. useInvestmentDetail - Fetch single investment detail
// ============================================================================

export function useInvestmentDetail(investmentId: string | undefined, chamaId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['investmentDetail', investmentId],
    queryFn: async () => {
      if (!investmentId) throw new Error('No investmentId provided');
      return investmentService.getInvestmentDetail(investmentId, chamaId);
    },
    enabled: !!investmentId,
  });

  return {
    investment: data,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// 6. useCreateInvestment - Create new investment
// ============================================================================

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof investmentService.createInvestment>[0]) => {
      return investmentService.createInvestment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary'] });
      setErrors([]);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to create investment';
      setErrors([{ field: 'form', message: errorMessage }]);
    },
  });

  return {
    createInvestment: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
    validationErrors: errors,
    success: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// ============================================================================
// 7. useUtilizeReturns - Utilize investment returns
// ============================================================================

export function useUtilizeReturns() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof investmentService.utilizeReturns>[0]) => {
      return investmentService.utilizeReturns(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary'] });
    },
  });

  return {
    utilizeReturns: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
    success: mutation.isSuccess,
    result: mutation.data,
  };
}

// ============================================================================
// 8. useRedeemInvestment - Redeem investment
// ============================================================================

export function useRedeemInvestment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof investmentService.redeemInvestment>[0]) => {
      return investmentService.redeemInvestment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary'] });
    },
  });

  return {
    redeem: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
    success: mutation.isSuccess,
    result: mutation.data,
  };
}

// ============================================================================
// 9. useInvestmentHistory - Fetch investment history
// ============================================================================

export function useInvestmentHistory(chamaId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['investmentHistory', chamaId],
    queryFn: async () => {
      if (!chamaId) throw new Error('No chamaId provided');
      return investmentService.getInvestmentHistory(chamaId);
    },
    enabled: !!chamaId,
  });

  return {
    history: data,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// 10. useInvestmentForm - Form state management for investment creation
// ============================================================================

export interface InvestmentFormData {
  productId: string;
  amount: string;
  fundingSource: 'wallet' | 'mpesa' | 'hybrid';
  walletAmount?: string;
  mpesaAmount?: string;
  phone?: string;
  autoReinvest?: boolean;
}

export function useInvestmentForm(product: InvestmentProduct | undefined) {
  const [form, setForm] = useState<InvestmentFormData>({
    productId: '',
    amount: '',
    fundingSource: 'wallet',
    autoReinvest: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProjection, setShowProjection] = useState(false);

  const validateForm = useCallback((walletBalance: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.amount) {
      newErrors.amount = 'Amount is required';
    } else if (product) {
      const validationErrors = validateInvestmentAmount(form.amount, product, walletBalance);
      validationErrors.forEach((err) => {
        newErrors[err.field] = err.message;
      });
    }

    if (form.fundingSource === 'mpesa' || form.fundingSource === 'hybrid') {
      if (!form.phone) {
        newErrors.phone = 'Phone number is required';
      } else {
        const phoneErrors = validatePhone(form.phone);
        phoneErrors.forEach((err) => {
          newErrors[err.field] = err.message;
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, product]);

  return {
    form,
    setForm,
    errors,
    setErrors,
    validateForm,
    updateField: (field: keyof InvestmentFormData, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    showProjection,
    setShowProjection,
    reset: () => {
      setForm({
        productId: '',
        amount: '',
        fundingSource: 'wallet',
        autoReinvest: false,
      });
      setErrors({});
      setShowProjection(false);
    },
  };
}

// ============================================================================
// 11. useSimulateInvestment - Simulate investment returns
// ============================================================================

export function useSimulateInvestment(productId: string | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['simulateInvestment', productId],
    queryFn: async () => {
      if (!productId) throw new Error('No productId provided');
      // We'll use a dummy amount; this is called with specific amount
      return investmentService.simulateProduct(productId, '10000');
    },
    enabled: false, // Manual call only
  });

  const simulate = useCallback(
    async (amount: string) => {
      if (!productId) throw new Error('No productId provided');
      return investmentService.simulateProduct(productId, amount);
    },
    [productId]
  );

  return {
    projection: data,
    isLoading,
    simulate,
    refetch,
  };
}

// ============================================================================
// 12. useInvestmentRefresh - Refresh single investment
// ============================================================================

export function useInvestmentRefresh(investmentId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!investmentId) throw new Error('No investmentId provided');
      return investmentService.refreshInvestment(investmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentDetail', investmentId] });
    },
  });

  return {
    refresh: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
  };
}
