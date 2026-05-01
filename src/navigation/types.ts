export type VerificationPurpose =
  | 'verify_phone'
  | 'verify_email'
  | 'login_2fa'
  | 'password_reset'
  | 'withdrawal_confirm'
  | 'register';
export type DeliveryMethod = 'console' | 'sms' | 'email';
export type NextRoute = 'ChamaSetup' | 'CreateChama' | 'Login' | 'InvitePreview' | 'JoinViaCode' | 'BasicProfileSetup' | 'ChooseChamaPath';

export interface VerificationData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  normalizedPhone?: string;
  email?: string;
  otpDeliveryMethod?: 'sms' | 'email';
  password?: string;
  confirmPassword?: string;
  acceptedTerms?: boolean;
}

export interface VerificationContext {
  identifier: string;
  phone: string;
  email?: string;
  purpose: VerificationPurpose;
  deliveryMethod: DeliveryMethod;
  channelLabel?: string;
  displayTitle?: string;
  displaySubtitle?: string;
  maskedDestination?: string;
  nextRoute: NextRoute;
  nextToken?: string;
  nextCode?: string;
  successTitle?: string;
  successMessage?: string;
  registrationData?: VerificationData;
}

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: {
    prefilledData?: VerificationData;
  };
  HelpSupport: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  OTP: { phone?: string } | undefined;
  OTPRequest: undefined;
  OTPVerification: {
    verificationContext: VerificationContext;
  };
  ChooseChamaPath: undefined;
  JoinChamaEntry: undefined;
  JoinViaCode: { code?: string } | undefined;
  InvitePreview: { token: string };
  ForgotPassword: undefined;
  ResetPassword: {
    identifier: string;
    deliveryMethod?: 'sms' | 'email';
    successMessage?: string;
  };
  SessionExpired: {
    message?: string;
  } | undefined;
  OnboardingSuccess: {
    type: 'created' | 'joined';
    chamaName?: string;
  };
};

export type MainStackParamList = {
  MainTabs: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Dashboard: undefined;
  SmartDashboard: undefined;
  Chamas: undefined;
  Payments:
    | {
        chamaId?: string;
        entryPoint?:
          | 'tab'
          | 'dashboard'
          | 'wallet'
          | 'more'
          | 'notifications'
          | 'alerts'
          | 'deep_link'
          | 'loan_detail'
          | 'contributions';
        preselectedPurpose?: 'contribution' | 'loan_repayment' | 'fine_payment' | 'one_time_charge';
        contributionId?: string;
        contributionTypeId?: string;
        contributionTypeName?: string;
        loanId?: string;
        installmentId?: string;
        penaltyId?: string;
        amount?: string;
        dueDate?: string;
        targetLabel?: string;
      }
    | undefined;
  Meetings: undefined;
  More: undefined;
  BasicProfileSetup:
    | {
        source?: 'registration' | 'join' | 'settings';
      }
    | undefined;
  PostJoinSetup: {
    chamaId: string;
    chamaName?: string;
    role?: string;
  };
  Profile: undefined;
  Notifications: undefined;
  AnnouncementsFeed: { chamaId?: string } | undefined;
  ApprovalsCenter: { chamaId?: string } | undefined;
  AutomationCenter: { chamaId?: string } | undefined;
  CommunicationCenter: { chamaId?: string } | undefined;
  SendCommunication: { chamaId?: string } | undefined;
  CommunicationLogs: { chamaId?: string } | undefined;
  Settings: undefined;
  Finance: undefined;
  Expenses:
    | {
        chamaId?: string;
        filter?: 'all' | 'pending' | 'approved' | 'paid';
      }
    | undefined;
  Withdrawals:
    | {
        chamaId?: string;
        filter?: 'all' | 'pending' | 'approved' | 'sent';
      }
    | undefined;
  ContributionCompliance:
    | {
        chamaId?: string;
        filter?: 'all' | 'paid' | 'in_grace' | 'missed' | 'at_risk';
      }
    | undefined;
  Penalties:
    | {
        chamaId?: string;
        memberId?: string;
        suggestedAmount?: string;
        reason?: string;
      }
    | undefined;
  ContributionAlerts: { chamaId?: string } | undefined;
  AIChat: undefined;
  ChamaDetail: { chamaId: string };
  CreateChamaIntro: undefined;
  CreateChama: undefined;
  CreateChamaSuccess: {
    chamaId: string;
    chamaName?: string;
    creatorRole?: string;
    invitesRequested?: number;
    invitesSent?: number;
    inviteFailures?: number;
  };
  ChamaSettings: { chamaId: string };
  MemberList: { chamaId: string };
  MemberDetail: { chamaId: string; memberId: string };
  MembershipRequests: { chamaId: string };
  RoleDelegations: { chamaId: string };
  RequestJoin: { chamaId: string; chamaName?: string };
  JoinRequestStatus: undefined;
  Governance: { chamaId?: string } | undefined;
  InviteMember: { chamaId: string };
  JoinViaCode: { code?: string } | undefined;
  InvitePreview: { token: string };
  JoinSuccess: {
    chamaId: string;
    chamaName?: string;
    role?: string;
  };
  ContributionHistory: { chamaId?: string } | undefined;
  ContributionSchedule: { chamaId?: string } | undefined;
  ContributionBreakdown: { chamaId?: string } | undefined;
  ContributionDetails: { contributionId: string; chamaId?: string } | undefined;
  MakeContribution:
    | {
        chamaId?: string;
        purpose?: string;
        contributionId?: string;
        mode?: 'contribution' | 'penalty';
        contributionTypeId?: string;
        contributionTypeName?: string;
        prefilledAmount?: string;
        dueDate?: string;
        penaltyId?: string;
      }
    | undefined;
  SelectContributionType: { chamaId?: string } | undefined;
  PaymentMethod: {
    chamaId: string;
    amount: string;
    currency: string;
    chamaName?: string;
    paymentPurposeType?: 'contribution' | 'loan_repayment' | 'fine_payment' | 'one_time_charge';
    paymentPurposeLabel?: string;
    purpose?: string;
    contributionId?: string;
    contributionTypeId?: string;
    contributionTypeName?: string;
    dueDate?: string;
    mode?: 'contribution' | 'penalty';
    penaltyId?: string;
    loanId?: string;
    installmentId?: string;
    targetLabel?: string;
    sourceRoute?: string;
    feeAmount?: string;
    totalAmount?: string;
    prefilledPhone?: string;
    outstandingBalance?: string;
    nextDueAmount?: string;
    minimumDueAmount?: string;
    resultingBalanceEstimate?: string;
  };
  PaymentReview: {
    chamaId: string;
    amount: string;
    currency: string;
    chamaName?: string;
    paymentPurposeType?: 'contribution' | 'loan_repayment' | 'fine_payment' | 'one_time_charge';
    paymentPurposeLabel?: string;
    purpose?: string;
    contributionId?: string;
    contributionTypeId?: string;
    contributionTypeName?: string;
    dueDate?: string;
    mode?: 'contribution' | 'penalty';
    penaltyId?: string;
    loanId?: string;
    installmentId?: string;
    targetLabel?: string;
    sourceRoute?: string;
    feeAmount?: string;
    totalAmount?: string;
    paymentMethod: 'mpesa' | 'paybill' | 'wallet_balance' | 'bank_transfer_placeholder';
    phone?: string;
    outstandingBalance?: string;
    nextDueAmount?: string;
    minimumDueAmount?: string;
    resultingBalanceEstimate?: string;
  };
  MpesaPayment: {
    chamaId: string;
    chamaName: string;
    amount: string;
    currency: string;
    purpose: string;
    contributionId?: string;
  };
  CashPayment: {
    chamaId: string;
    chamaName: string;
    amount: string;
    currency: string;
    purpose: string;
    contributionId?: string;
  };
  PaymentStatus: {
    intentId: string;
    chamaId?: string;
    status?: string;
    amount: string;
    currency: string;
    purpose: string;
    paymentPurposeType?:
      | 'contribution'
      | 'loan_repayment'
      | 'fine_payment'
      | 'one_time_charge'
      | 'wallet_deposit'
      | 'wallet_withdrawal';
    paymentPurposeLabel?: string;
    contributionTypeName?: string;
    paymentMethod?: string;
    failureReason?: string;
    contributionId?: string;
    loanId?: string;
    installmentId?: string;
    penaltyId?: string;
    targetLabel?: string;
    reference?: string;
  };
  PendingPaymentDetail: {
    intentId: string;
    chamaId?: string;
    amount: string;
    currency: string;
    purpose: string;
    paymentPurposeType?:
      | 'contribution'
      | 'loan_repayment'
      | 'fine_payment'
      | 'one_time_charge'
      | 'wallet_deposit'
      | 'wallet_withdrawal';
    paymentPurposeLabel?: string;
    contributionId?: string;
    loanId?: string;
    installmentId?: string;
    penaltyId?: string;
    targetLabel?: string;
    paymentMethod?: string;
  };
  PaymentOperations: { chamaId?: string } | undefined;
  PaymentHistory:
    | {
        chamaId?: string;
        filter?:
          | 'all'
          | 'deposits'
          | 'withdrawals'
          | 'transfers'
          | 'contributions'
          | 'loan_repayments'
          | 'pending'
          | 'failed'
          | 'successful';
      }
    | undefined;
  WalletDeposit:
    | {
        chamaId?: string;
        entryPoint?: 'wallet' | 'payments' | 'dashboard' | 'notifications' | 'alerts';
      }
    | undefined;
  WalletDepositMethod: {
    chamaId: string;
    amount: string;
    currency: string;
    walletBalance?: string;
  };
  WalletDepositReview: {
    chamaId: string;
    amount: string;
    currency: string;
    paymentMethod: 'mpesa' | 'bank';
    phone: string;
  };
  WalletDepositStatus: {
    chamaId?: string;
    intentId: string;
    source?: 'deposit_review' | 'wallet_activity' | 'notifications' | 'receipt';
  };
  WalletWithdraw:
    | {
        chamaId?: string;
        entryPoint?: 'wallet' | 'more' | 'notifications' | 'alerts';
      }
    | undefined;
  WalletWithdrawalReview: {
    chamaId: string;
    amount: string;
    currency: string;
    paymentMethod: 'mpesa';
    phone: string;
    withdrawableBalance: string;
  };
  WalletWithdrawalStatus: {
    chamaId?: string;
    intentId: string;
    source?: 'withdrawal_review' | 'wallet_activity' | 'notifications';
  };
  WalletWithdrawalDetail: {
    chamaId?: string;
    intentId: string;
    source?:
      | 'wallet_overview'
      | 'wallet_activity'
      | 'notifications'
      | 'wallet_withdrawal_status'
      | 'receipt';
  };
  WalletTransactionDetail: {
    transactionId: string;
    chamaId?: string;
    source?: 'wallet_overview' | 'wallet_activity' | 'notifications' | 'deep_link';
  };
  WalletTransfer:
    | {
        chamaId?: string;
        entryPoint?: 'wallet' | 'more' | 'notifications' | 'alerts';
      }
    | undefined;
  WalletTransferReview: {
    chamaId: string;
    recipientMemberId: string;
    recipientName: string;
    recipientPhone?: string;
    amount: string;
    currency: string;
    note?: string;
    availableBalance: string;
  };
  WalletSendToChama:
    | {
        chamaId?: string;
        entryPoint?: 'wallet' | 'payments' | 'dashboard' | 'notifications' | 'alerts';
      }
    | undefined;
  WalletSendToChamaReview: {
    chamaId: string;
    contributionTypeId: string;
    contributionTypeName: string;
    amount: string;
    currency: string;
    availableBalance: string;
  };
  MemberContributions:
    | {
        chamaId?: string;
        entryPoint?:
          | 'dashboard'
          | 'payments'
          | 'wallet'
          | 'more'
          | 'notifications'
          | 'alerts'
          | 'deep_link';
      }
    | undefined;
  MemberLoans: { chamaId?: string } | undefined;
  LoanEligibility: { chamaId?: string } | undefined;
  PaymentDetail: { paymentId: string; chamaId?: string };
  PaymentDispute: {
    paymentId: string;
    chamaId: string;
    amount?: string;
    currency?: string;
    purpose?: string;
    status?: string;
    reference?: string;
  };
  Receipt:
    | {
        paymentId?: string;
        transactionId?: string;
        chamaId?: string;
        intentId?: string;
        paymentPurposeType?:
          | 'contribution'
          | 'loan_repayment'
          | 'fine_payment'
          | 'one_time_charge'
          | 'wallet_deposit'
          | 'wallet_withdrawal';
        paymentPurposeLabel?: string;
        contributionTypeName?: string;
        contributionId?: string;
        loanId?: string;
        installmentId?: string;
        targetLabel?: string;
      }
    | undefined;
  ReportsHub: { chamaId?: string } | undefined;
  AuditLogs: { chamaId?: string } | undefined;
  PlatformDashboard: { chamaId?: string } | undefined;
  Transactions: undefined;
  TransactionDetail: { transactionRef: string; chamaId?: string };
  RequestLoan: { chamaId?: string } | undefined;
  LoanReviewConfirm: { chamaId?: string } | undefined;
  LoanSubmissionResult:
    | {
        chamaId?: string;
        applicationId?: string;
        status?: 'submitted_pending_review' | 'approved' | 'rejected' | 'failed';
        errorMessage?: string;
      }
    | undefined;
  LoanApplicationDetails: { applicationId: string; chamaId?: string };
  LoanApplications: { chamaId?: string } | undefined;
  LoanApprovalQueue:
    | {
        chamaId?: string;
        filter?: 'all' | 'submitted' | 'treasurer_approved' | 'committee_approved' | 'approved' | 'rejected';
      }
    | undefined;
  LoanRecoveryQueue:
    | {
        chamaId?: string;
        filter?: 'all' | 'overdue' | 'defaulted' | 'restructured' | 'written_off';
      }
    | undefined;
  LoanRestructureQueue:
    | {
        chamaId?: string;
        filter?: 'all' | 'requested' | 'applied' | 'rejected';
      }
    | undefined;
  LoanDetail: { loanId: string; chamaId?: string };
  RepaymentSchedule: { loanId: string; chamaId?: string } | undefined;
  LoanRepayment: {
    loanId: string;
    chamaId?: string;
    installmentId?: string;
    amount?: string;
    dueDate?: string;
    targetLabel?: string;
    quickAmountOption?: 'next_due' | 'full_outstanding' | 'custom';
    entryPoint?:
      | 'loans'
      | 'loan_detail'
      | 'repayment_schedule'
      | 'payments'
      | 'wallet'
      | 'notifications'
      | 'alerts'
      | 'deep_link';
  };
  LoanRepaymentHistory: { loanId: string; chamaId?: string } | undefined;
  OverdueRepayment: {
    loanId: string;
    chamaId?: string;
    installmentId?: string;
  };
  RejectedApplicationState: { applicationId: string; chamaId?: string };
  GoalsInvestments: { chamaId?: string } | undefined;
  InvestmentProducts: { chamaId?: string } | undefined;
  InvestmentProductDetail: { productId: string; chamaId?: string };
  StartInvestment: { productId: string; chamaId?: string };
  InvestmentReview: {
    chamaId: string;
    productId: string;
    amount: string;
    fundingSource: 'wallet' | 'mpesa' | 'hybrid';
    walletAmount?: string;
    mpesaAmount?: string;
    phone?: string;
    autoReinvest?: boolean;
  };
  InvestmentSuccess: { investmentId: string; chamaId?: string };
  MyInvestments:
    | {
        chamaId?: string;
        initialTab?: 'active' | 'matured' | 'redeemed' | 'utilized' | 'all';
      }
    | undefined;
  InvestmentDetail: { investmentId: string; chamaId?: string };
  UtilizeReturns: { investmentId: string; chamaId?: string };
  RedeemInvestment: { investmentId: string; chamaId?: string };
  InvestmentHistory: { chamaId?: string } | undefined;
  PortfolioAnalytics: { chamaId?: string } | undefined;
  InvestmentLearn: { chamaId?: string } | undefined;
  FinanceReportDetail: {
    reportType: 'member-statement' | 'loan-statement' | 'chama-summary' | 'loan-schedule';
    chamaId?: string;
    memberId?: string;
    loanId?: string;
  };
  CreateMeeting: { chamaId?: string } | undefined;
  MeetingDetail: { meetingId: string };
  Attendance: { meetingId: string; meetingTitle?: string };
  Minutes: { meetingId: string; meetingTitle?: string };
  Resolutions: { meetingId: string; meetingTitle?: string };
  EditProfile: undefined;
  DocumentCenter: undefined;
  KYC: undefined;
  ChangePassword: undefined;
  TwoFactorAuth: undefined;
  HelpSupport: undefined;
  SupportIssues: { chamaId?: string } | undefined;
  Referrals: undefined;
};
