/**
 * Payout Navigation Types and Stack Configuration
 * 
 * Defines navigation structure for payout screens
 */

import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Payout Navigator Stack Param List
 */
export type PayoutStackParamList = {
  PayoutsList: undefined;
  PayoutDetail: { payoutId: string };
  TreasurerReview: { payoutId: string };
  ChairpersonApproval: { payoutId: string };
  RotationQueue: { chamaId: string };
  SelectPaymentMethod: { payoutId: string };
  PayoutCreation: { chamaId: string };
};

/**
 * Navigation type helpers
 */
export type PayoutsListScreenNavigationProp = NativeStackNavigationProp<
  PayoutStackParamList,
  'PayoutsList'
>;

export type PayoutDetailScreenNavigationProp = NativeStackNavigationProp<
  PayoutStackParamList,
  'PayoutDetail'
>;

export type TreasurerReviewScreenNavigationProp = NativeStackNavigationProp<
  PayoutStackParamList,
  'TreasurerReview'
>;

export type ChairpersonApprovalScreenNavigationProp = NativeStackNavigationProp<
  PayoutStackParamList,
  'ChairpersonApproval'
>;

export type RotationQueueScreenNavigationProp = NativeStackNavigationProp<
  PayoutStackParamList,
  'RotationQueue'
>;

/**
 * Route type helpers
 */
export type PayoutDetailScreenRouteProp = RouteProp<PayoutStackParamList, 'PayoutDetail'>;
export type TreasurerReviewScreenRouteProp = RouteProp<PayoutStackParamList, 'TreasurerReview'>;
export type ChairpersonApprovalScreenRouteProp = RouteProp<PayoutStackParamList, 'ChairpersonApproval'>;
export type RotationQueueScreenRouteProp = RouteProp<PayoutStackParamList, 'RotationQueue'>;

/**
 * Navigator screen options
 */
export const payoutNavigatorScreenOptions = {
  payoutsList: {
    title: 'Payouts',
    headerShown: true,
    headerBackTitle: 'Back',
  },
  payoutDetail: {
    title: 'Payout Status',
    headerShown: true,
  },
  treasurerReview: {
    title: 'Review Payout',
    headerShown: true,
  },
  chairpersonApproval: {
    title: 'Approve Payout',
    headerShown: true,
  },
  rotationQueue: {
    title: 'Rotation Queue',
    headerShown: true,
  },
  selectPaymentMethod: {
    title: 'Select Payment Method',
    headerShown: true,
  },
  payoutCreation: {
    title: 'Create Payout',
    headerShown: true,
  },
};

/**
 * Payout status display mapping
 */
export const payoutStatusDisplay: Record<string, string> = {
  triggered: 'Initiated',
  rotation_check: 'Checking Rotation',
  eligibility_check: 'Checking Eligibility',
  ineligible: 'Ineligible',
  awaiting_treasurer_review: 'Awaiting Treasurer',
  treasury_rejected: 'Rejected by Treasurer',
  awaiting_chair_approval: 'Awaiting Chairperson',
  chair_rejected: 'Rejected by Chair',
  approved: 'Approved',
  processing: 'Processing Payment',
  success: 'Completed',
  failed: 'Payment Failed',
  hold: 'On Hold',
  cancelled: 'Cancelled',
};

/**
 * Payment method display mapping
 */
export const paymentMethodDisplay: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  mpesa: 'M-Pesa',
  wallet: 'MyChama Wallet',
};

/**
 * Eligibility status display mapping
 */
export const eligibilityStatusDisplay: Record<string, string> = {
  eligible: 'Eligible',
  pending_penalties: 'Pending Penalties',
  active_disputes: 'Active Disputes',
  overdue_loans: 'Overdue Loans',
  inactive_member: 'Inactive Member',
  insufficient_funds: 'Insufficient Funds',
  multiple_issues: 'Multiple Issues',
};

/**
 * Check type display mapping
 */
export const checkTypeDisplay: Record<string, string> = {
  member_status: 'Member Status',
  active_penalties: 'Active Penalties',
  active_disputes: 'Active Disputes',
  overdue_loans: 'Overdue Loans',
  wallet_balance: 'Wallet Balance',
};
