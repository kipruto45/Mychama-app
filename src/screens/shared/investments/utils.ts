/**
 * Investment utilities and formatters
 */

import {
  InvestmentProduct,
  MemberInvestmentPosition,
  InvestmentPortfolioSummary,
  InvestmentPortfolioAnalytics,
} from '@/types';
import { PortfolioDisplayState, InvestmentDisplayCard } from './types';

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

export function formatPercentage(value: number | string, decimals = 1): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function formatCurrencyWithTrend(
  value: string | number,
  currency = 'KES'
): { formatted: string; trend: 'up' | 'down' | 'neutral' } {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = `${currency} ${formatCurrency(num)}`;
  const trend = num > 0 ? 'up' : num < 0 ? 'down' : 'neutral';
  return { formatted, trend };
}

export function formatCurrency(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDays(days: number): string {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

export function formatDaysShort(days: number): string {
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  return `${Math.floor(days / 365)}y`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateWithTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateProgressPercentage(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  const totalDays = end.getTime() - start.getTime();
  const elapsedDays = now.getTime() - start.getTime();
  
  const percentage = (elapsedDays / totalDays) * 100;
  return Math.min(100, Math.max(0, percentage));
}

export function getRiskColor(risk?: string): string {
  const riskLevel = String(risk || '').toLowerCase();
  if (riskLevel === 'low') return '#10B981'; // green
  if (riskLevel === 'high') return '#EF4444'; // red
  return '#F59E0B'; // amber (medium)
}

export function getStatusColor(status?: string): string {
  const normalized = String(status || '').toLowerCase();
  if (['active', 'completed'].includes(normalized)) return '#10B981';
  if (['matured', 'processing', 'pending'].includes(normalized)) return '#F59E0B';
  if (['failed', 'rejected', 'cancelled'].includes(normalized)) return '#EF4444';
  return '#3B82F6';
}

// ============================================================================
// PORTFOLIO COMPUTATION
// ============================================================================

export function computePortfolioDisplayState(
  portfolio: InvestmentPortfolioSummary,
  investments: MemberInvestmentPosition[]
): PortfolioDisplayState {
  const totalInvested = portfolio.total_invested || '0';
  const currentValue = portfolio.current_value || '0';
  // Backend exposes `total_returns`; treat this as "gains" for display.
  const totalGains = portfolio.total_returns || '0';
  const totalGainsNum = parseFloat(totalGains);
  const totalInvestedNum = parseFloat(totalInvested);
  const gainsPercentage =
    totalInvestedNum > 0 ? (totalGainsNum / totalInvestedNum) * 100 : 0;

  const availableReturns = portfolio.available_returns || '0';
  const nextMaturityDate = portfolio.next_maturity?.maturity_date || undefined;
  const nextPayoutDate = undefined;
  
  const maturedCount = investments.filter((inv) => inv.status === 'matured').length;
  const hasAvailableReturnsFlag = parseFloat(availableReturns) > 0;

  return {
    totalInvested,
    currentValue,
    totalGains,
    gainsPercentage,
    gainsTrend: totalGainsNum >= 0 ? 'up' : 'down',
    availableReturns,
    nextMaturityDate,
    nextPayoutDate,
    hasMaturedInvestments: maturedCount > 0,
    hasAvailableReturns: hasAvailableReturnsFlag,
    recentActivity: [], // Populated from transactions
  };
}

export function computeInvestmentDisplayCards(
  investments: MemberInvestmentPosition[]
): InvestmentDisplayCard[] {
  return investments.map((inv) => {
    const principal = parseFloat(inv.principal_amount || '0');
    const current = parseFloat(inv.current_value || '0');
    const returns = current - principal;
    const progress = calculateProgressPercentage(
      inv.investment_date || new Date().toISOString(),
      inv.maturity_date || new Date().toISOString()
    );
    const daysRemaining = inv.maturity_date
      ? calculateDaysRemaining(inv.maturity_date)
      : undefined;

    return {
      id: inv.id,
      productName: typeof inv.product === 'string' ? inv.product : inv.product?.name || 'Unknown',
      investedAmount: formatCurrency(principal),
      currentValue: formatCurrency(current),
      returnsEarned: formatCurrency(returns),
      status: (inv.status as any) || 'active',
      riskLevel: (typeof inv.product === 'object' ? inv.product?.risk_level : 'medium') as any,
      nextPayout: inv.next_payout_date ? formatDate(inv.next_payout_date) : undefined,
      daysToMaturity: daysRemaining,
      progressPercentage: progress,
    };
  });
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export function validateInvestmentAmount(
  amount: string,
  product: InvestmentProduct,
  walletBalance: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const amountNum = parseFloat(amount);

  if (!amount || isNaN(amountNum)) {
    errors.push({ field: 'amount', message: 'Enter a valid amount' });
    return errors;
  }

  const minNum = parseFloat(product.minimum_investment || product.minimum_amount || '0');
  if (amountNum < minNum) {
    errors.push({
      field: 'amount',
      message: `Minimum investment is ${formatCurrency(minNum)}`,
    });
  }

  const maxNum = parseFloat(product.maximum_amount || '999999999');
  if (amountNum > maxNum) {
    errors.push({
      field: 'amount',
      message: `Maximum investment is ${formatCurrency(maxNum)}`,
    });
  }

  const walletNum = parseFloat(walletBalance);
  if (amountNum > walletNum) {
    errors.push({
      field: 'amount',
      message: `Insufficient wallet balance. Available: ${formatCurrency(walletNum)}`,
    });
  }

  return errors;
}

export function validatePhone(phone: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!phone) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
    return errors;
  }

  // Kenyan phone number validation (should start with +254 or 07)
  const phoneRegex = /^(?:\+254|0)[1-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    errors.push({ field: 'phone', message: 'Enter a valid phone number' });
  }

  return errors;
}

export function validateRedemptionAmount(
  amount: string,
  availableAmount: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const amountNum = parseFloat(amount);
  const availableNum = parseFloat(availableAmount);

  if (!amount || isNaN(amountNum)) {
    errors.push({ field: 'amount', message: 'Enter a valid amount' });
    return errors;
  }

  if (amountNum <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than zero' });
  }

  if (amountNum > availableNum) {
    errors.push({
      field: 'amount',
      message: `Maximum available: ${formatCurrency(availableNum)}`,
    });
  }

  return errors;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateTotalWithFee(
  amount: string,
  feePercentage: number
): { gross: string; fee: string; net: string } {
  const amountNum = parseFloat(amount);
  const feeNum = amountNum * (feePercentage / 100);
  const netNum = amountNum - feeNum;

  return {
    gross: formatCurrency(amountNum),
    fee: formatCurrency(feeNum),
    net: formatCurrency(netNum),
  };
}

export function calculateProjectedReturn(
  principal: string,
  ratePercentage: number,
  months: number
): string {
  const principalNum = parseFloat(principal);
  const monthlyRate = ratePercentage / 12 / 100;
  const compounded = principalNum * Math.pow(1 + monthlyRate, months);
  return formatCurrency(compounded - principalNum);
}

export function calculateMaturityDate(investmentDate: string, terms: number): Date {
  const date = new Date(investmentDate);
  date.setDate(date.getDate() + terms);
  return date;
}

// ============================================================================
// STATUS/LABEL FUNCTIONS
// ============================================================================

export function getInvestmentStatusLabel(status?: string): string {
  const normalized = String(status || '').toLowerCase();
  const labels: Record<string, string> = {
    active: 'Actively Growing',
    matured: 'Matured',
    redeemed: 'Redeemed',
    utilized: 'Returns Used',
    locked: 'Locked',
    pending: 'Pending',
    processing: 'Processing',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return labels[normalized] || status || 'Unknown';
}

export function getRiskLabel(risk?: string): string {
  const normalized = String(risk || '').toLowerCase();
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return labels[normalized] || 'Medium Risk';
}

export function getTransactionTypeLabel(type?: string): string {
  const normalized = String(type || '').toLowerCase();
  const labels: Record<string, string> = {
    created: 'Investment Created',
    funded: 'Funded',
    returns_credited: 'Returns Credited',
    returns_utilized: 'Returns Used',
    reinvested: 'Reinvested',
    redeemed: 'Redeemed',
    withdrawn: 'Withdrawn',
    failed: 'Failed',
    reversed: 'Reversed',
  };
  return labels[normalized] || type || 'Transaction';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function sortInvestmentsByDate(
  investments: MemberInvestmentPosition[],
  order: 'asc' | 'desc' = 'desc'
): MemberInvestmentPosition[] {
  return [...investments].sort((a, b) => {
    const dateA = new Date(a.investment_date || 0).getTime();
    const dateB = new Date(b.investment_date || 0).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortInvestmentsByValue(
  investments: MemberInvestmentPosition[],
  order: 'asc' | 'desc' = 'desc'
): MemberInvestmentPosition[] {
  return [...investments].sort((a, b) => {
    const valueA = parseFloat(a.current_value || '0');
    const valueB = parseFloat(b.current_value || '0');
    return order === 'desc' ? valueB - valueA : valueA - valueB;
  });
}

export function filterInvestmentsByStatus(
  investments: MemberInvestmentPosition[],
  status: string | string[]
): MemberInvestmentPosition[] {
  const statuses = Array.isArray(status) ? status : [status];
  return investments.filter((inv) => statuses.includes(inv.status || ''));
}

export function filterInvestmentsByRisk(
  investments: MemberInvestmentPosition[],
  riskLevel: string
): MemberInvestmentPosition[] {
  return investments.filter((inv) => {
    const risk = typeof inv.product === 'object' ? inv.product?.risk_level : 'medium';
    return risk === riskLevel;
  });
}

export function getInvestmentSummary(
  investments: MemberInvestmentPosition[]
): {
  activeCount: number;
  maturCount: number;
  redeemedCount: number;
  totalInvested: string;
  totalReturns: string;
} {
  const activeCount = investments.filter((i) => i.status === 'active').length;
  const maturCount = investments.filter((i) => i.status === 'matured').length;
  const redeemedCount = investments.filter((i) => i.status === 'redeemed').length;

  const totalInvestedNum = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.principal_amount || '0'),
    0
  );
  const totalCurrentNum = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.current_value || '0'),
    0
  );
  const totalReturnsNum = totalCurrentNum - totalInvestedNum;

  return {
    activeCount,
    maturCount,
    redeemedCount,
    totalInvested: formatCurrency(totalInvestedNum),
    totalReturns: formatCurrency(totalReturnsNum),
  };
}
