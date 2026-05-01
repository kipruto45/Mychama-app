/**
 * Investment Feature Exports
 * Central export point for all investment-related components, hooks, types, and utilities
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  PortfolioDisplayState,
  InvestmentDisplayCard,
  InvestmentFormState,
  RedemptionFormState,
  UtilizationFormState,
  PortfolioChartData,
  AssetAllocationData,
  PortfolioInsight,
  ProductComparison,
  FeeBreakdown,
  ProjectionBreakdown,
  TimelineEvent,
  TransactionHistoryEvent,
  InvestmentValidationResult,
  InvestmentEligibility,
  InvestmentActionResult,
  InvestmentTabFilter,
  HistoryFilter,
  InvestmentAlert,
  EducationTopic,
  FAQItem,
} from './types';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  PortfolioSummaryCard,
  InvestmentQuickActions,
  InvestmentProductCard,
  InvestmentRiskBadge,
  InvestmentProgressCard,
  ReturnsAvailableCard,
  FundingSourceSelector,
  InvestmentAmountInput,
  InvestmentBreakdownCard,
  DestinationSelector,
  SkeletonLoader,
} from './components';

export { PremiumHeroCard, StatusPill, MetricTile, SectionTitle, ActionRow, getRiskTone, getStatusTone } from './investmentUi';

// ============================================================================
// SCREENS
// ============================================================================

export { InvestmentDetailScreen } from './InvestmentDetailScreen';
export { InvestmentHistoryScreen } from './InvestmentHistoryScreen';
export { InvestmentLearnScreen } from './InvestmentLearnScreen';
export { InvestmentProductDetailScreen } from './InvestmentProductDetailScreen';
export { InvestmentReviewScreen } from './InvestmentReviewScreen';
export { InvestmentSuccessScreen } from './InvestmentSuccessScreen';
export { PortfolioAnalyticsScreen } from './PortfolioAnalyticsScreen';
export { RedeemInvestmentScreen } from './RedeemInvestmentScreen';
export { ReinvestReturnsScreen } from './ReinvestReturnsScreen';
export { StartInvestmentScreen } from './StartInvestmentScreen';
export { UtilizeReturnsScreen } from './UtilizeReturnsScreen';

// ============================================================================
// HOOKS
// ============================================================================

export {
  useInvestmentProducts,
  useInvestmentProductDetail,
  useInvestmentPortfolio,
  useMyInvestments,
  useInvestmentDetail,
  useCreateInvestment,
  useUtilizeReturns,
  useRedeemInvestment,
  useInvestmentHistory,
  useInvestmentForm,
  useSimulateInvestment,
  useInvestmentRefresh,
  type InvestmentFormData,
} from './hooks';

// ============================================================================
// UTILITIES & FORMATTERS
// ============================================================================

export {
  formatPercentage,
  formatCurrencyWithTrend,
  formatCurrency,
  formatDays,
  formatDaysShort,
  formatDate,
  formatDateWithTime,
  calculateDaysRemaining,
  calculateProgressPercentage,
  getRiskColor,
  getStatusColor,
  computePortfolioDisplayState,
  computeInvestmentDisplayCards,
  validateInvestmentAmount,
  validatePhone,
  validateRedemptionAmount,
  calculateTotalWithFee,
  calculateProjectedReturn,
  calculateMaturityDate,
  getInvestmentStatusLabel,
  getRiskLabel,
  getTransactionTypeLabel,
  sortInvestmentsByDate,
  sortInvestmentsByValue,
  filterInvestmentsByStatus,
  filterInvestmentsByRisk,
  getInvestmentSummary,
  type ValidationError,
} from './utils';

// ============================================================================
// SCREENS (Enhanced)
// ============================================================================

export { InvestmentProductsScreen as InvestmentProductsScreenEnhanced } from './InvestmentProductsScreenEnhanced';
export { MyInvestmentsScreen as MyInvestmentsScreenEnhanced } from './MyInvestmentsScreenEnhanced';

// ============================================================================
// CONSTANTS
// ============================================================================

export const INVESTMENT_TAB_OPTIONS = ['active', 'matured', 'redeemed', 'utilized', 'all'] as const;

export const INVESTMENT_STATUS_OPTIONS = ['active', 'matured', 'locked', 'processing', 'failed'] as const;

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export const FUNDING_SOURCES = ['wallet', 'mpesa', 'hybrid'] as const;

export const REDEMPTION_TYPES = ['returns_only', 'partial', 'full'] as const;

export const PAYOUT_DESTINATIONS = ['wallet', 'mpesa'] as const;

export const UTILIZATION_ACTIONS = ['wallet', 'mpesa', 'reinvest'] as const;
