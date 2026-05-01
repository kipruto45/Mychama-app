/**
 * Investment-specific types and extensions
 * Builds on existing types in @/types/index.ts
 */

import { InvestmentProduct, MemberInvestmentPosition } from '@/types';

// ============================================================================
// UI/Display Models
// ============================================================================

export interface PortfolioDisplayState {
  totalInvested: string;
  currentValue: string;
  totalGains: string;
  gainsPercentage: number;
  gainsTrend: 'up' | 'down' | 'neutral';
  availableReturns: string;
  nextMaturityDate?: string;
  nextPayoutDate?: string;
  hasMaturedInvestments: boolean;
  hasAvailableReturns: boolean;
  recentActivity: Array<{
    type: 'investment' | 'payout' | 'utilization' | 'reinvestment' | 'redemption';
    date: string;
    amount: string;
    status: string;
  }>;
}

export interface InvestmentDisplayCard {
  id: string;
  productName: string;
  productIcon?: string;
  investedAmount: string;
  currentValue: string;
  returnsEarned: string;
  status: 'active' | 'matured' | 'redeemed' | 'utilized' | 'locked';
  riskLevel: 'low' | 'medium' | 'high';
  nextPayout?: string;
  daysToMaturity?: number;
  progressPercentage: number;
}

export interface InvestmentFormState {
  productId: string;
  amount: string;
  fundingSource: 'wallet' | 'mpesa' | 'hybrid';
  walletAmount?: string;
  mpesaAmount?: string;
  phone?: string;
  autoReinvest?: boolean;
  
  // Computed
  totalAmount: string;
  estimatedFees: string;
  netInvestment: string;
  projectedReturns: string;
  maturityDate?: string;
}

export interface RedemptionFormState {
  investmentId: string;
  redemptionType: 'returns_only' | 'partial' | 'full';
  amount?: string;
  destination: 'wallet' | 'mpesa';
  phone?: string;
  reason?: string;
  
  // Computed
  availableAmount: string;
  estimatedFees: string;
  earlyPenalty?: string;
  netPayout: string;
  estimatedTime?: string;
}

export interface UtilizationFormState {
  investmentId: string;
  actionType: 'wallet' | 'mpesa' | 'reinvest';
  amount: string;
  phone?: string;
  productId?: string; // For reinvest
  
  // Computed
  availableReturns: string;
  estimatedFees: string;
  netAmount: string;
}

// ============================================================================
// Analytics & Charts
// ============================================================================

export interface PortfolioChartData {
  dates: string[];
  values: number[];
  investments: Array<{
    date: string;
    value: string;
    returnValue: string;
  }>;
}

export interface AssetAllocationData {
  product: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioInsight {
  type: 'opportunity' | 'milestone' | 'alert' | 'performance' | 'maturity';
  title: string;
  description: string;
  icon: string;
  cta?: {
    label: string;
    action: string;
  };
}

// ============================================================================
// Business Logic Models
// ============================================================================

export interface ProductComparison {
  products: InvestmentProduct[];
  selectedProductId?: string;
}

export interface FeeBreakdown {
  administrationFee: string;
  transactionFee: string;
  earlyRedemptionPenalty?: string;
  totalFees: string;
}

export interface ProjectionBreakdown {
  principal: string;
  monthlyReturns: Array<{
    month: number;
    amount: string;
    cumulative: string;
  }>;
  totalReturns: string;
  maturityValue: string;
  aprRate: string;
}

export interface TimelineEvent {
  date: string;
  label: string;
  description: string;
  icon: string;
  type: 'investment' | 'payout' | 'milestone' | 'maturity';
  isCompleted: boolean;
}

export interface TransactionHistoryEvent {
  id: string;
  type:
    | 'created'
    | 'funded'
    | 'returns_credited'
    | 'returns_utilized'
    | 'reinvested'
    | 'redeemed'
    | 'withdrawn'
    | 'failed'
    | 'reversed';
  date: string;
  amount: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  details?: Record<string, any>;
  reference?: string;
}

// ============================================================================
// Validation & Business Rules
// ============================================================================

export interface InvestmentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface InvestmentEligibility {
  canInvest: boolean;
  canUtilizeReturns: boolean;
  canReinvest: boolean;
  canRedeemPartial: boolean;
  canRedeemFull: boolean;
  restrictions: string[];
  minimumInvestment: string;
  maximumInvestment: string;
  lockPeriodDays: number;
  currentLockDays: number;
}

// ============================================================================
// Action Results
// ============================================================================

export interface InvestmentActionResult {
  success: boolean;
  message: string;
  referenceId?: string;
  newBalance?: string;
  estimatedTime?: string;
  nextAction?: 'view_detail' | 'view_portfolio' | 'invest_again' | 'dashboard';
}

// ============================================================================
// Tab/Filter State
// ============================================================================

export interface InvestmentTabFilter {
  tab: 'active' | 'matured' | 'redeemed' | 'utilized' | 'all';
  search?: string;
  sortBy?: 'recent' | 'value' | 'returns';
  sortOrder?: 'asc' | 'desc';
}

export interface HistoryFilter {
  dateRange?: {
    from: string;
    to: string;
  };
  types?: Array<TransactionHistoryEvent['type']>;
  statuses?: Array<'completed' | 'pending' | 'failed'>;
}

// ============================================================================
// Alert Models
// ============================================================================

export interface InvestmentAlert {
  id: string;
  type: 'maturity' | 'returns_available' | 'reinvestment_opportunity' | 'redemption_eligible';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  description: string;
  cta?: {
    label: string;
    action: string;
  };
  dismissible: boolean;
}

// ============================================================================
// Education Models
// ============================================================================

export interface EducationTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: Array<{
    heading: string;
    content: string;
    example?: string;
  }>;
  learnMoreUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful?: boolean;
}
