import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { colors } from '@/theme/colors';
import { AuthStackParamList, MainStackParamList } from './types';
import { RequirePermission, useActiveRole, useCanCreateChama } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { useCanPerformAction } from '@/auth/guards';
import type { AuthFlowState } from '@/auth/authFlow';
import { Role } from '@/auth/roles';
import { useActiveChama } from '@/hooks';
import { resolveOnboardingDestination } from '@/onboarding/onboardingResolver';
import { ONBOARDING_COMPLETED_STORAGE_KEY } from '@/constants/storageKeys';
import { useOnboardingStore } from '@/store/onboardingStore';
import { storage } from '@/utils/storage';
import { getPendingInviteIntent, type PendingInviteContext } from '@/utils/inviteFlow';
import { RequireRouteAccess } from '@/rbac';
import { getWorkspaceTabTitle, getWorkspaceTabs, WorkspaceTabRoute } from '../config/sharedPageArchitecture';
import { getRoleScreenComponent } from '@/screens/roles/roleScreenResolver';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load screens for better performance
const WelcomeScreen = lazy(() => import('@/screens/auth/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const LoginScreen = lazy(() => import('@/screens/auth/LoginScreen').then(m => ({ default: m.LoginScreen })));
const RegisterScreen = lazy(() => import('@/screens/auth/RegisterScreen').then(m => ({ default: m.RegisterScreen })));

const HelpSupportScreen = lazy(() => import('@/screens/auth/HelpSupportScreen').then(m => ({ default: m.HelpSupportScreen })));
const OTPScreen = lazy(() => import('@/screens/auth/OTPScreen').then(m => ({ default: m.OTPScreen })));
const ForgotPasswordScreen = lazy(() => import('@/screens/auth/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
const OTPRequestScreen = lazy(() => import('@/screens/auth/OTPRequestScreen').then(m => ({ default: m.OTPRequestScreen })));
const OTPVerificationScreen = lazy(() => import('@/screens/auth/OTPVerificationScreen').then(m => ({ default: m.OTPVerificationScreen })));
const ResetPasswordScreen = lazy(() => import('@/screens/auth/ResetPasswordScreen').then(m => ({ default: m.ResetPasswordScreen })));
const SessionExpiredScreen = lazy(() => import('@/screens/auth/SessionExpiredScreen').then(m => ({ default: m.SessionExpiredScreen })));
const OnboardingScreen = lazy(() => import('@/screens/auth/PremiumOnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const ChooseChamaPathScreen = lazy(() => import('@/screens/auth/ChooseChamaPathScreen').then(m => ({ default: m.ChooseChamaPathScreen })));
const JoinChamaEntryScreen = lazy(() => import('@/screens/auth/JoinChamaEntryScreen').then(m => ({ default: m.JoinChamaEntryScreen })));
const JoinViaCodeScreenWrapper = lazy(() => import('@/screens/shared/chama/JoinViaCodeScreen').then(m => ({ default: m.JoinViaCodeScreen })));
const InvitePreviewScreenWrapper = lazy(() => import('@/screens/shared/chama/InvitePreviewScreen').then(m => ({ default: m.InvitePreviewScreen })));
const CreateChamaIntroScreen = lazy(() => import('@/screens/shared/chama/CreateChamaIntroScreen').then(m => ({ default: m.CreateChamaIntroScreen })));
const OnboardingSuccessScreen = lazy(() => import('@/screens/auth/OnboardingSuccessScreen').then(m => ({ default: m.OnboardingSuccessScreen })));
const TermsOfServiceScreen = lazy(() => import('@/screens/legal/TermsOfServiceScreen').then(m => ({ default: m.TermsOfServiceScreen })));
const PrivacyPolicyScreen = lazy(() => import('@/screens/legal/PrivacyPolicyScreen').then(m => ({ default: m.PrivacyPolicyScreen })));
const SplashScreen = lazy(() => import('@/screens/auth/SplashScreen').then(m => ({ default: m.SplashScreen })));
const LoanEligibilityScreen = lazy(() => import('@/screens/roles/member/LoanEligibilityScreen').then(m => ({ default: m.LoanEligibilityScreen })));
const LoanReviewConfirmScreen = lazy(() => import('@/screens/roles/member/LoanReviewConfirmScreen').then(m => ({ default: m.LoanReviewConfirmScreen })));
const LoanSubmissionResultScreen = lazy(() => import('@/screens/roles/member/LoanSubmissionResultScreen').then(m => ({ default: m.LoanSubmissionResultScreen })));
const LoanApplicationDetailsScreen = lazy(() => import('@/screens/roles/member/LoanApplicationDetailsScreen').then(m => ({ default: m.LoanApplicationDetailsScreen })));
const LoanRepaymentScreen = lazy(() => import('@/screens/roles/member/LoanRepaymentScreen').then(m => ({ default: m.LoanRepaymentScreen })));
const LoanRepaymentHistoryScreen = lazy(() => import('@/screens/roles/member/LoanRepaymentHistoryScreen').then(m => ({ default: m.LoanRepaymentHistoryScreen })));
const OverdueRepaymentScreen = lazy(() => import('@/screens/roles/member/OverdueRepaymentScreen').then(m => ({ default: m.OverdueRepaymentScreen })));
const RepaymentScheduleScreen = lazy(() => import('@/screens/roles/member/RepaymentScheduleScreen').then(m => ({ default: m.RepaymentScheduleScreen })));
const RejectedApplicationStateScreen = lazy(() => import('@/screens/roles/member/RejectedApplicationStateScreen').then(m => ({ default: m.RejectedApplicationStateScreen })));
const InvestmentProductsScreen = lazy(() => import('@/screens/shared/investments/InvestmentProductsScreen').then(m => ({ default: m.InvestmentProductsScreen })));
const InvestmentProductDetailScreen = lazy(() => import('@/screens/shared/investments/InvestmentProductDetailScreen').then(m => ({ default: m.InvestmentProductDetailScreen })));
const StartInvestmentScreen = lazy(() => import('@/screens/shared/investments/StartInvestmentScreen').then(m => ({ default: m.StartInvestmentScreen })));
const InvestmentReviewScreen = lazy(() => import('@/screens/shared/investments/InvestmentReviewScreen').then(m => ({ default: m.InvestmentReviewScreen })));
const InvestmentSuccessScreen = lazy(() => import('@/screens/shared/investments/InvestmentSuccessScreen').then(m => ({ default: m.InvestmentSuccessScreen })));
const MyInvestmentsScreen = lazy(() => import('@/screens/shared/investments/MyInvestmentsScreen').then(m => ({ default: m.MyInvestmentsScreen })));
const InvestmentDetailScreen = lazy(() => import('@/screens/shared/investments/InvestmentDetailScreen').then(m => ({ default: m.InvestmentDetailScreen })));
const UtilizeReturnsScreen = lazy(() => import('@/screens/shared/investments/UtilizeReturnsScreen').then(m => ({ default: m.UtilizeReturnsScreen })));
const RedeemInvestmentScreen = lazy(() => import('@/screens/shared/investments/RedeemInvestmentScreen').then(m => ({ default: m.RedeemInvestmentScreen })));
const InvestmentHistoryScreen = lazy(() => import('@/screens/shared/investments/InvestmentHistoryScreen').then(m => ({ default: m.InvestmentHistoryScreen })));
const PortfolioAnalyticsScreen = lazy(() => import('@/screens/shared/investments/PortfolioAnalyticsScreen').then(m => ({ default: m.PortfolioAnalyticsScreen })));
const InvestmentLearnScreen = lazy(() => import('@/screens/shared/investments/InvestmentLearnScreen').then(m => ({ default: m.InvestmentLearnScreen })));

const Stack = createNativeStackNavigator<MainStackParamList & { Auth: undefined }>();
const Tab = createBottomTabNavigator();
const AuthStackNavigator = createNativeStackNavigator<AuthStackParamList>();
const brandLogo = require('../../assets/logo_hd.png');
const MaterialIcon = Icon as any;

const MAIN_APP_FLOW_STATES: AuthFlowState[] = [
  'verified_profile_incomplete',
  'verified_pending_chama_setup',
  'authenticated_member',
  'authenticated_chama_admin',
  'authenticated_treasurer',
  'authenticated_secretary',
  'authenticated_auditor',
  'authenticated_admin',
  'authenticated_superadmin',
];

const makeWorkspaceTabRedirectScreen = (targetTab: WorkspaceTabRoute) => {
  const WorkspaceTabRedirectScreen = ({ navigation, route }: any) => {
    const { isAuthenticated, authFlowState } = useAuth();
    const { activeChamaId } = useActiveChama();
    const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
    const isMemberWorkspace = activeRole === Role.MEMBER;
    const canViewChamas = useCanPerformAction(Permission.CAN_VIEW_CHAMA, activeChamaId || undefined) || !activeChamaId;
    const canViewPayments =
      useCanPerformAction(
        [Permission.CAN_VIEW_PAYMENTS, Permission.CAN_MAKE_PAYMENTS, Permission.CAN_VIEW_FINANCE],
        activeChamaId || undefined
      ) || !activeChamaId;
    const canViewMeetings =
      useCanPerformAction(
        [Permission.CAN_VIEW_MEETINGS, Permission.CAN_CREATE_MEETINGS],
        activeChamaId || undefined
      ) || !activeChamaId;

    const canEnterMainTabs = isAuthenticated && MAIN_APP_FLOW_STATES.includes(authFlowState);
    const availableTabs = getWorkspaceTabs(activeRole, {
      isMemberWorkspace,
      canViewChamas,
      canViewPayments,
      canViewMeetings,
    });
    const destinationTab = availableTabs.includes(targetTab)
      ? targetTab
      : availableTabs[0] || 'Dashboard';

    useEffect(() => {
      if (!canEnterMainTabs) {
        navigation.replace('Auth');
        return;
      }

      navigation.replace('MainTabs', {
        screen: destinationTab,
        ...(destinationTab === targetTab ? { params: route?.params } : {}),
      });
    }, [canEnterMainTabs, destinationTab, navigation, route?.params]);

    return <LoadingSpinner />;
  };

  WorkspaceTabRedirectScreen.displayName = `${targetTab}TabRedirectScreen`;
  return WorkspaceTabRedirectScreen;
};

const DashboardRedirectScreen = makeWorkspaceTabRedirectScreen('Dashboard');
const ChamasRedirectScreen = makeWorkspaceTabRedirectScreen('Chamas');
const PaymentsRedirectScreen = makeWorkspaceTabRedirectScreen('Payments');
const MeetingsRedirectScreen = makeWorkspaceTabRedirectScreen('Meetings');
const MoreRedirectScreen = makeWorkspaceTabRedirectScreen('More');
const TAB_TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  SmartDashboard: 'Smart Insights',
  Chamas: 'Chamas',
  Payments: 'Wallet',
  Meetings: 'Meetings',
  More: 'More',
};

const TAB_ICONS: Record<string, { default: string; focused: string }> = {
  Dashboard: {
    default: 'chart-box-outline',
    focused: 'chart-box',
  },
  Chamas: {
    default: 'account-group-outline',
    focused: 'account-group',
  },
  Payments: {
    default: 'wallet-bifold-outline',
    focused: 'wallet-bifold',
  },
  Meetings: {
    default: 'calendar-clock-outline',
    focused: 'calendar-check',
  },
  More: {
    default: 'dots-horizontal-circle-outline',
    focused: 'dots-horizontal-circle',
  },
};

const STACK_TITLES: Partial<Record<keyof (MainStackParamList & { Auth: undefined }), string>> = {
  InvitePreview: 'Invite Preview',
  JoinViaCode: 'Join With Code',
  RequestJoin: 'Request to Join',
  JoinRequestStatus: 'Request Status',
  TermsOfService: 'Terms of Service',
  PrivacyPolicy: 'Privacy Policy',
  HelpSupport: 'Help & Support',
  ChamaDetail: 'Chama Details',
  CreateChamaIntro: 'Set Up Chama',
  CreateChama: 'Create Chama',
  CreateChamaSuccess: 'Chama Created',
  JoinSuccess: 'Join Successful',
  PostJoinSetup: 'Next Steps',
  ChamaSettings: 'Chama Settings',
  MemberList: 'Members',
  MemberDetail: 'Member Details',
  MembershipRequests: 'Join Requests',
  RoleDelegations: 'Role Delegations',
  Governance: 'Governance',
  InviteMember: 'Invite Members',
  Notifications: 'Notifications',
  AnnouncementsFeed: 'Announcements',
  ApprovalsCenter: 'Approvals',
  AutomationCenter: 'Automation',
  CommunicationCenter: 'Communication Center',
  CommunicationLogs: 'Delivery Logs',
  Settings: 'Settings',
  Finance: 'Finance',
  Expenses: 'Expenses',
  Withdrawals: 'Withdrawals',
  ContributionCompliance: 'Contributions',
  Penalties: 'Fines & Penalties',
  ContributionAlerts: 'Alerts & Reminders',
  AIChat: 'AI Assistant',
  MakeContribution: 'Make Contribution',
  SelectContributionType: 'Select Type',
  PaymentMethod: 'Payment Method',
  PaymentReview: 'Review Payment',
  MpesaPayment: 'M-Pesa Payment',
  CashPayment: 'Cash Payment',
  PaymentStatus: 'Payment Status',
  PendingPaymentDetail: 'Pending Payment',
  PaymentHistory: 'Wallet Activity',
  WalletDeposit: 'Deposit to Wallet',
  WalletDepositMethod: 'Deposit Method',
  WalletDepositReview: 'Review Deposit',
  WalletDepositStatus: 'Deposit Status',
  WalletWithdraw: 'Withdraw from Wallet',
  WalletWithdrawalReview: 'Review Withdrawal',
  WalletWithdrawalStatus: 'Withdrawal Status',
  WalletWithdrawalDetail: 'Withdrawal Detail',
  WalletTransactionDetail: 'Transaction Details',
  WalletTransfer: 'Transfer from Wallet',
  WalletTransferReview: 'Review Transfer',
  WalletSendToChama: 'Send to Chama',
  WalletSendToChamaReview: 'Review Contribution',
  PaymentOperations: 'Payment Operations',
  ContributionHistory: 'Contribution History',
  ContributionSchedule: 'Payment Schedule',
  ContributionBreakdown: 'Contribution Breakdown',
  ContributionDetails: 'Contribution Details',
  MemberContributions: 'My Contributions',
  MemberLoans: 'My Loans',
  LoanEligibility: 'Loan Eligibility',
  PaymentDetail: 'Payment Details',
  PaymentDispute: 'Payment Issue',
  Receipt: 'Receipt',
  ReportsHub: 'Reports',
  AuditLogs: 'Audit Logs',
  PlatformDashboard: 'Platform Dashboard',
  Transactions: 'Transactions',
  TransactionDetail: 'Transaction Details',
  FinanceReportDetail: 'Report Details',
  RequestLoan: 'Apply for Loan',
  LoanReviewConfirm: 'Review Request',
  LoanSubmissionResult: 'Application Status',
  LoanApplicationDetails: 'Application Details',
  LoanApplications: 'Loan History',
  LoanApprovalQueue: 'Loan Approval Queue',
  LoanRecoveryQueue: 'Loan Recovery',
  LoanRestructureQueue: 'Loan Restructures',
  LoanDetail: 'Active Loan',
  LoanRepayment: 'Repay Loan',
  LoanRepaymentHistory: 'Repayment History',
  OverdueRepayment: 'Overdue Repayment',
  RepaymentSchedule: 'Repayment Schedule',
  RejectedApplicationState: 'Application Result',
  GoalsInvestments: 'Goals & Investments',
  InvestmentProducts: 'Investment Products',
  InvestmentProductDetail: 'Product Details',
  StartInvestment: 'Start Investment',
  InvestmentReview: 'Review Investment',
  InvestmentSuccess: 'Investment Created',
  MyInvestments: 'My Investments',
  InvestmentDetail: 'Investment Detail',
  UtilizeReturns: 'Utilize Returns',
  RedeemInvestment: 'Redeem Investment',
  InvestmentHistory: 'Investment History',
  PortfolioAnalytics: 'Portfolio Analytics',
  InvestmentLearn: 'Learn Investments',
  CreateMeeting: 'Create Meeting',
  MeetingDetail: 'Meeting Details',
  Attendance: 'Attendance',
  Minutes: 'Minutes',
  Resolutions: 'Resolutions',
  EditProfile: 'Edit Profile',
  BasicProfileSetup: 'Profile Setup',
  Profile: 'Profile',
  DocumentCenter: 'Documents',
  KYC: 'KYC Verification',
  ChangePassword: 'Change Password',
  TwoFactorAuth: 'Two-Factor Authentication',
  SupportIssues: 'Support Issues',
  Referrals: 'Referrals',
};

const AUTH_TITLES: Partial<Record<keyof AuthStackParamList, string>> = {
  Welcome: 'Welcome',
  Login: 'Sign In',
  Register: 'Create Account',
  OTP: 'Verification Code',
  OTPRequest: 'Sign In with OTP',
  OTPVerification: 'Verify Account',
  ChooseChamaPath: 'Choose Path',
  JoinChamaEntry: 'Join Chama',
  OnboardingSuccess: 'Welcome',
  ForgotPassword: 'Forgot Password',
  ResetPassword: 'Reset Password',
  SessionExpired: 'Session Expired',
  TermsOfService: 'Terms of Service',
  PrivacyPolicy: 'Privacy Policy',
};

const AUTH_ROUTE_NAMES = new Set<string>(['Splash', ...Object.keys(AUTH_TITLES)]);

const prettifyRouteName = (routeName: string) =>
  routeName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

// Loading fallback component
const LoadingFallback = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
      <Image source={brandLogo} style={styles.loadingLogo} resizeMode="contain" />
      <LoadingSpinner size="large" text="Loading MyChama" />
      <Text style={[styles.loadingTitle, { color: themeColors.text }]}>Preparing your session</Text>
      <Text style={[styles.loadingSubtitle, { color: themeColors.textSecondary }]}>
        Please wait...
      </Text>
    </View>
  );
};

const ScreenChromeContext = React.createContext(false);

const ScreenChrome = ({ children }: { children: React.ReactNode }) => {
  const alreadyWrapped = React.useContext(ScreenChromeContext);

  if (alreadyWrapped) {
    return <>{children}</>;
  }

  return (
    <ScreenChromeContext.Provider value={true}>
      {children}
    </ScreenChromeContext.Provider>
  );
};

// Wrapper component for lazy loaded screens with Suspense
const LazyScreen = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    <ScreenChrome>{children}</ScreenChrome>
  </Suspense>
);

const RoleScreen = ({
  role,
  screenName,
}: {
  role: Role;
  screenName: string;
}) => {
  const ScreenComponent = getRoleScreenComponent(role, screenName);
  return (
    <LazyScreen>
      <ScreenComponent />
    </LazyScreen>
  );
};

const MainTabsHeader = ({ title }: { title: string }) => {
  const navigation = useNavigation<any>();
  const { activeChama } = useActiveChama();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  return (
    <View
      style={[
        styles.fixedHeader,
        {
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        },
      ]}
    >
      <View style={[styles.fixedHeaderBrand, { backgroundColor: themeColors.surface }]}>
        <Image source={brandLogo} style={styles.fixedHeaderLogo} resizeMode="contain" />
      </View>
      <View style={styles.fixedHeaderCopy}>
        <Text style={[styles.fixedHeaderEyebrow, { color: themeColors.textSecondary }]}>
          {activeChama?.name || 'MyChama'}
        </Text>
        <Text style={[styles.fixedHeaderTitle, { color: themeColors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={[styles.fixedHeaderAction, { backgroundColor: themeColors.surface }]}
      >
        <Icon name="bell-ring-outline" size={22} color={themeColors.text} />
      </TouchableOpacity>
    </View>
  );
};

const StackScreenHeader = ({
  title,
  canGoBack,
  onBack,
}: {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const { colors: themeColors } = useTheme();

  return (
    <View
      style={[
        styles.fixedHeader,
        styles.thinStackHeader,
        {
          paddingTop: Math.max(insets.top, 8),
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        },
      ]}
    >
      {canGoBack || isAuthenticated ? (
        <TouchableOpacity
          onPress={canGoBack ? onBack : () => navigation.navigate('MainTabs')}
          style={[styles.fixedHeaderAction, { backgroundColor: themeColors.surface }]}
        >
          <Icon
            name={canGoBack ? 'arrow-left' : 'home-outline'}
            size={20}
            color={themeColors.text}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.fixedHeaderSpacer} />
      )}
      <View style={styles.stackHeaderCopy}>
        <Text style={[styles.stackHeaderTitle, { color: themeColors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {isAuthenticated ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={[styles.fixedHeaderAction, { backgroundColor: themeColors.surface }]}
        >
          <Icon name="bell-ring-outline" size={20} color={themeColors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.fixedHeaderSpacer} />
      )}
    </View>
  );
};

const AuthStack = ({
  initialRoute,
  pendingVerification,
  sessionExpiredMessage,
}: {
  initialRoute: 'Welcome' | 'Login' | 'Onboarding' | 'OTPVerification' | 'ChooseChamaPath' | 'JoinChamaEntry' | 'SessionExpired';
  pendingVerification?: AuthStackParamList['OTPVerification'];
  sessionExpiredMessage?: string | null;
}) => {
  const { colors: themeColors } = useTheme();

  return (
    <AuthStackNavigator.Navigator
      initialRouteName={initialRoute}
      screenOptions={() => ({
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.background },
      })}
    >
      <AuthStackNavigator.Screen name="Splash">
        {() => <LazyScreen><SplashScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="Welcome">
        {() => <LazyScreen><WelcomeScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="Onboarding">
        {() => <LazyScreen><OnboardingScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="Login">
        {() => <LazyScreen><LoginScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="Register">
        {() => <LazyScreen><RegisterScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="TermsOfService">
        {() => <LazyScreen><TermsOfServiceScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="PrivacyPolicy">
        {() => <LazyScreen><PrivacyPolicyScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="HelpSupport">
        {() => <LazyScreen><HelpSupportScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="OTP">
        {() => <LazyScreen><OTPScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="OTPRequest">
        {() => <LazyScreen><OTPRequestScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen
        name="OTPVerification"
        initialParams={pendingVerification}
      >
        {() => <LazyScreen><OTPVerificationScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="ChooseChamaPath">
        {() => <LazyScreen><ChooseChamaPathScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="JoinChamaEntry">
        {() => <LazyScreen><JoinChamaEntryScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="JoinViaCode">
        {() => <LazyScreen><JoinViaCodeScreenWrapper /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="InvitePreview">
        {() => <LazyScreen><InvitePreviewScreenWrapper /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="OnboardingSuccess">
        {() => <LazyScreen><OnboardingSuccessScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="ForgotPassword">
        {() => <LazyScreen><ForgotPasswordScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen name="ResetPassword">
        {() => <LazyScreen><ResetPasswordScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
      <AuthStackNavigator.Screen
        name="SessionExpired"
        initialParams={{ message: sessionExpiredMessage || undefined }}
      >
        {() => <LazyScreen><SessionExpiredScreen /></LazyScreen>}
      </AuthStackNavigator.Screen>
    </AuthStackNavigator.Navigator>
  );
};

	const MainTabs = () => {
	  const { colors: themeColors } = useTheme();
	  const navigation = useNavigation<any>();
	  const { activeChamaId } = useActiveChama();
	  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
	  const isMemberWorkspace = activeRole === Role.MEMBER;
	  const hasChamaContext = !!activeChamaId;
	  const canViewChamas = useCanPerformAction(Permission.CAN_VIEW_CHAMA, activeChamaId || undefined);
	  const canViewPaymentsScoped = useCanPerformAction(
	    [Permission.CAN_VIEW_PAYMENTS, Permission.CAN_MAKE_PAYMENTS, Permission.CAN_VIEW_FINANCE],
	    activeChamaId || undefined
	  );
	  const canViewMeetingsScoped = useCanPerformAction(
	    [Permission.CAN_VIEW_MEETINGS, Permission.CAN_CREATE_MEETINGS],
	    activeChamaId || undefined
	  );
	  const canViewPayments = canViewPaymentsScoped || !hasChamaContext;
	  const canViewMeetings = canViewMeetingsScoped || !hasChamaContext;
	  const canUseAI = useCanPerformAction(Permission.CAN_USE_AI_ASSISTANT, activeChamaId || undefined);

  const sharedTabScreens: Record<WorkspaceTabRoute, () => React.ReactNode> = {
    Dashboard: () => <RoleScreen role={activeRole} screenName="DashboardScreen" />,
    Chamas: () => <RoleScreen role={activeRole} screenName="ChamaListScreen" />,
    Payments: () => isMemberWorkspace 
      ? <RoleScreen role={activeRole} screenName="PaymentsScreen" />
      : <RoleScreen role={activeRole} screenName="PaymentsScreen" />,
    Meetings: () => <RoleScreen role={activeRole} screenName="MeetingsScreen" />,
    More: () => <RoleScreen role={activeRole} screenName="MoreScreen" />,
  };

  const tabScreens = getWorkspaceTabs(activeRole, {
    isMemberWorkspace,
    canViewChamas: canViewChamas || !activeChamaId,
    canViewPayments,
    canViewMeetings,
  }).map((name) => ({
    name,
    render: sharedTabScreens[name],
  }));

  const tabIconMap: Record<string, { default: string; focused: string }> = isMemberWorkspace
    ? {
        ...TAB_ICONS,
        Dashboard: {
          default: 'home-outline',
          focused: 'home',
        },
      }
    : TAB_ICONS;

  const openAIChat = () => {
    const parentNavigation = navigation.getParent?.();
    (parentNavigation || navigation).navigate('AIChat');
  };

  return (
    <View style={styles.tabShell}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const iconConfig = tabIconMap[route.name] || tabIconMap.More;
            return (
              <View style={[styles.tabIconShell, focused ? styles.tabIconShellActive : null]}>
                <MaterialIcon
                  name={focused ? iconConfig.focused : iconConfig.default}
                  size={size}
                  color={color}
                />
              </View>
            );
          },
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: themeColors.textSecondary,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: themeColors.background,
              borderTopColor: themeColors.border,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarHideOnKeyboard: true,
          headerShown: route.name !== 'Dashboard',
          header: route.name !== 'Dashboard' ? () => <MainTabsHeader title={getWorkspaceTabTitle(activeRole, route.name as WorkspaceTabRoute) || TAB_TITLES[route.name] || route.name} /> : undefined,
          sceneStyle: { backgroundColor: themeColors.background },
        })}
      >
        {tabScreens.map((screen) => (
          <Tab.Screen key={screen.name} name={screen.name}>
            {screen.render}
          </Tab.Screen>
        ))}
      </Tab.Navigator>

      {canUseAI ? (
        <TouchableOpacity
          style={styles.aiFab}
          onPress={openAIChat}
          activeOpacity={0.85}
        >
          <Icon name="star-four-points-circle" size={26} color={colors.light.background} />
          <View style={styles.aiFabGlow} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const AppNavigator = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    authFlowState,
    pendingVerification,
    sessionExpiredMessage,
  } = useAuth();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const canAccessChamaCreation = useCanCreateChama();
  const [startupResolved, setStartupResolved] = useState(false);
  const [hasSeenPublicOnboarding, setHasSeenPublicOnboarding] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInviteContext | null>(null);
  const onboardingStep = useOnboardingStore((state) => state.step);
  const onboardingPath = useOnboardingStore((state) => state.path);
  const syncResolvedState = useOnboardingStore((state) => state.syncResolvedState);
  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: themeColors.background },
    }),
    [themeColors.background]
  );

  useEffect(() => {
    let mounted = true;

    const resolveStartupRoute = async () => {
      try {
        const [publicOnboardingSeen, pendingInviteIntent, accessToken] = await Promise.all([
          storage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY),
          getPendingInviteIntent(),
          storage.getItem('access_token'),
        ]);

        if (!mounted) {
          return;
        }

        setHasSeenPublicOnboarding(publicOnboardingSeen === 'true');
        setHasExistingToken(!!accessToken);
        setPendingInvite(pendingInviteIntent);
      } finally {
        if (mounted) {
          setStartupResolved(true);
        }
      }
    };

    void resolveStartupRoute();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    syncResolvedState({
      authFlowState,
      path: onboardingPath,
      phoneNumber: user?.phone ?? pendingVerification?.identifier ?? null,
      isPhoneVerified: !!user?.phone_verified,
      isProfileComplete: !!user?.profile_completed || !!(user?.full_name?.trim() && user?.email?.trim()),
      activeChamaId: activeChamaId || user?.active_chama_id || null,
      activeRole: activeRole || user?.role || null,
      hasPendingInvite: !!pendingInvite,
    });
  }, [
    activeChamaId,
    activeRole,
    authFlowState,
    onboardingPath,
    pendingInvite,
    pendingVerification?.identifier,
    syncResolvedState,
    user?.active_chama_id,
    user?.email,
    user?.full_name,
    user?.phone,
    user?.phone_verified,
    user?.profile_completed,
    user?.role,
  ]);

  if (isLoading || !startupResolved) {
    return <SplashScreen />;
  }

  const shouldShowAuthenticatedApp = isAuthenticated && MAIN_APP_FLOW_STATES.includes(authFlowState);
  const onboardingDestination = resolveOnboardingDestination({
    isAuthenticated,
    authFlowState,
    hasSeenPublicOnboarding,
    onboardingPath,
    onboardingStep,
    pendingVerification,
    pendingInvite,
    hasExistingToken,
  });
  const authInitialRoute = onboardingDestination.authInitialRoute;
  const rootNavigatorKey = [
    'app',
    authFlowState,
    onboardingStep,
    onboardingPath || 'none',
    pendingVerification?.purpose || 'none',
    pendingInvite?.intendedRoute || 'none',
    pendingInvite?.token || pendingInvite?.code || 'none',
    hasSeenPublicOnboarding ? 'seen' : 'new',
  ].join(':');
  const initialRouteName = onboardingDestination.rootInitialRoute;
  const otpVerificationParams = onboardingDestination.otpVerificationParams;
  const invitePreviewInitialParams = onboardingDestination.invitePreviewParams;
  const joinViaCodeInitialParams = onboardingDestination.joinViaCodeParams;

  return (
    <Stack.Navigator
      key={rootNavigatorKey}
      initialRouteName={initialRouteName}
      screenOptions={() => ({
        ...stackScreenOptions,
      })}
    >
      <Stack.Screen
        name="InvitePreview"
        initialParams={invitePreviewInitialParams}
      >
        {() => <LazyScreen><RoleScreen role={activeRole} screenName="InvitePreviewScreen" /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen
        name="JoinViaCode"
        initialParams={joinViaCodeInitialParams}
      >
        {() => <LazyScreen><RoleScreen role={activeRole} screenName="JoinViaCodeScreen" /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="RequestJoin">
        {() => <LazyScreen><RoleScreen role={activeRole} screenName="RequestJoinScreen" /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="JoinRequestStatus">
        {() => <LazyScreen><RoleScreen role={activeRole} screenName="JoinRequestStatusScreen" /></LazyScreen>}
      </Stack.Screen>
      <Stack.Screen name="TermsOfService">
        {() => <LazyScreen><TermsOfServiceScreen /></LazyScreen>}
      </Stack.Screen>
	      <Stack.Screen name="PrivacyPolicy">
	        {() => <LazyScreen><PrivacyPolicyScreen /></LazyScreen>}
	      </Stack.Screen>

	      {/* Workspace tab redirects (avoid NAVIGATE warnings from stack contexts). */}
	      <Stack.Screen name="Dashboard" component={DashboardRedirectScreen} options={{ headerShown: false }} />
	      <Stack.Screen name="Chamas" component={ChamasRedirectScreen} options={{ headerShown: false }} />
	      <Stack.Screen name="Payments" component={PaymentsRedirectScreen} options={{ headerShown: false }} />
	      <Stack.Screen name="Meetings" component={MeetingsRedirectScreen} options={{ headerShown: false }} />
	      <Stack.Screen name="More" component={MoreRedirectScreen} options={{ headerShown: false }} />
			  {shouldShowAuthenticatedApp ? (
			    <>
			      <Stack.Screen
			        name="MainTabs"
			        component={MainTabs}
			        options={{ headerShown: false }}
			      />
			      
			      {/* Chama Management - Requires CHAMA_ADMIN or higher */}
			      <Stack.Screen name="ChamaDetail">
			        {() => (
	              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_CHAMA} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="ChamaDetail">
                    <RoleScreen role={activeRole} screenName="ChamaDetailScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="CreateChamaIntro">
            {() => (
              <LazyScreen>
                <CreateChamaIntroScreen />
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="CreateChama">
            {() => (
              <LazyScreen>
                {canAccessChamaCreation ? (
                  <RoleScreen role={activeRole} screenName="CreateChamaScreen" />
                ) : (
                  <LoadingFallback />
                )}
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="CreateChamaSuccess">
            {() => (
              <LazyScreen>
                {canAccessChamaCreation ? (
                  <RoleScreen role={activeRole} screenName="CreateChamaSuccessScreen" />
                ) : (
                  <LoadingFallback />
                )}
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="JoinSuccess">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="JoinSuccessScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="PostJoinSetup">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="PostJoinSetupScreen" /></LazyScreen>}
          </Stack.Screen>
          
          <Stack.Screen name="ChamaSettings">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MANAGE_CHAMA_SETTINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="ChamaSettingsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="MemberList">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEMBERS} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="MemberList">
                    <RoleScreen role={activeRole} screenName="MemberListScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="MemberDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEMBERS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MemberDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="MembershipRequests">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_APPROVE_MEMBERS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MembershipRequestsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="RoleDelegations">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_ASSIGN_ROLES} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="RoleDelegationsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Governance">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_CHAMA} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="Governance">
                    <RoleScreen role={activeRole} screenName="GovernanceScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="InviteMember">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_INVITE_MEMBERS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="InviteMemberScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          {/* Notifications - All authenticated users */}
          <Stack.Screen name="Notifications">
            {() => (
              <LazyScreen>
                <RequireRouteAccess route="Notifications">
                  <RoleScreen role={activeRole} screenName="NotificationsScreen" />
                </RequireRouteAccess>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="AnnouncementsFeed">
            {() => (
              <LazyScreen>
                <RequireRouteAccess route="AnnouncementsFeed">
                  <RoleScreen role={activeRole} screenName="AnnouncementsFeedScreen" />
                </RequireRouteAccess>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ApprovalsCenter">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="ApprovalsCenterScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="AutomationCenter">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="AutomationCenterScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="CommunicationCenter">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MANAGE_NOTIFICATIONS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="CommunicationCenterScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="SendCommunication">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_SEND_ANNOUNCEMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="SendCommunicationScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="CommunicationLogs">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MANAGE_NOTIFICATIONS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="CommunicationLogsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Settings - All authenticated users */}
          <Stack.Screen name="Settings">
            {() => (
              <LazyScreen>
                <RequireRouteAccess route="Settings">
                  <RoleScreen role={activeRole} screenName="SettingsScreen" />
                </RequireRouteAccess>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Finance - Requires CAN_VIEW_FINANCE */}
          <Stack.Screen name="Finance">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="FinanceScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Expenses">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="ExpensesScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Withdrawals">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WithdrawalsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionCompliance">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="ContributionComplianceScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Penalties">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PenaltiesScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionAlerts">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="ContributionAlertsScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* AI Chat - Requires CAN_USE_AI_ASSISTANT */}
          <Stack.Screen
            name="AIChat"
            options={{
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          >
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_USE_AI_ASSISTANT} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="AIChat">
                    <RoleScreen role={activeRole} screenName="AIChatScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Payments - Requires CAN_MAKE_PAYMENTS */}
          <Stack.Screen name="MakeContribution">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MakeContributionScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="SelectContributionType">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="SelectContributionTypeScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentMethod">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentMethodScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentReview">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentReviewScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="MpesaPayment">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MpesaPaymentScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="CashPayment">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="CashPaymentScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentStatus">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentStatusScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PendingPaymentDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PendingPaymentDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentHistory">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentHistoryScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletDeposit">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletDepositScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletDepositMethod">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletDepositMethodScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletDepositReview">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletDepositReviewScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletDepositStatus">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletDepositStatusScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletWithdraw">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletWithdrawScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletWithdrawalReview">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletWithdrawalReviewScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletWithdrawalStatus">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletWithdrawalStatusScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletWithdrawalDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletWithdrawalDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletTransactionDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletTransactionDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletTransfer">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletTransferScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletTransferReview">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletTransferReviewScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletSendToChama">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletSendToChamaScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="WalletSendToChamaReview">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_MAKE_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="WalletSendToChamaReviewScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentOperations">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentOperationsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="MemberContributions">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="MemberContributionsScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionHistory">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="ContributionHistoryScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionSchedule">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="ContributionScheduleScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionBreakdown">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="ContributionBreakdownScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ContributionDetails">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="ContributionDetailsScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="MemberLoans">
            {() => (
              <LazyScreen>
                <RoleScreen role={activeRole} screenName="MemberLoansScreen" />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanEligibility">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanEligibilityScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="PaymentDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PaymentDispute">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PaymentDisputeScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Receipt">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_PAYMENTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="ReceiptScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="ReportsHub">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_VIEW_FINANCIAL_REPORTS, Permission.CAN_VIEW_REPORTS]} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="ReportsHub">
                    <RoleScreen role={activeRole} screenName="ReportsHubScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="AuditLogs">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_VIEW_REPORTS, Permission.CAN_VIEW_FINANCIAL_REPORTS, Permission.CAN_ACCESS_ADMIN_TOOLS]} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="AuditLogsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PlatformDashboard">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_ACCESS_ADMIN_TOOLS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="PlatformDashboardScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="SmartDashboard">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_CHAMA} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="SmartDashboardScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Transactions - Requires CAN_VIEW_FINANCE */}
          <Stack.Screen name="Transactions">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="TransactionsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="TransactionDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="TransactionDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="FinanceReportDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCIAL_REPORTS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="FinanceReportDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Loans - Requires CAN_REQUEST_LOAN */}
          <Stack.Screen name="RequestLoan">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="RequestLoanScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanReviewConfirm">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanReviewConfirmScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanSubmissionResult">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanSubmissionResultScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanApplicationDetails">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanApplicationDetailsScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanApplications">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_VIEW_FINANCE, Permission.CAN_REQUEST_LOAN]} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="LoanApplications">
                    <RoleScreen role={activeRole} screenName="LoanApplicationsScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanApprovalQueue">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_APPROVE_LOAN} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="LoanApprovalQueueScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanRecoveryQueue">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_VIEW_FINANCE, Permission.CAN_MAKE_ADJUSTMENTS]} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="LoanRecoveryQueueScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanRestructureQueue">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_APPROVE_LOAN, Permission.CAN_MAKE_ADJUSTMENTS]} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="LoanRestructureQueueScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="LoanDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={[Permission.CAN_VIEW_FINANCE, Permission.CAN_REQUEST_LOAN]} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="LoanDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanRepayment">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanRepaymentScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="LoanRepaymentHistory">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <LoanRepaymentHistoryScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="OverdueRepayment">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <OverdueRepaymentScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="RepaymentSchedule">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <RepaymentScheduleScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="RejectedApplicationState">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_REQUEST_LOAN} fallback={<LoadingFallback />}>
                  <RejectedApplicationStateScreen />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="GoalsInvestments">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_FINANCE} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="GoalsInvestmentsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentProducts">
            {() => (
              <LazyScreen>
                <InvestmentProductsScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentProductDetail">
            {() => (
              <LazyScreen>
                <InvestmentProductDetailScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="StartInvestment">
            {() => (
              <LazyScreen>
                <StartInvestmentScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentReview">
            {() => (
              <LazyScreen>
                <InvestmentReviewScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentSuccess">
            {() => (
              <LazyScreen>
                <InvestmentSuccessScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="MyInvestments">
            {() => (
              <LazyScreen>
                <MyInvestmentsScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentDetail">
            {() => (
              <LazyScreen>
                <InvestmentDetailScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="UtilizeReturns">
            {() => (
              <LazyScreen>
                <UtilizeReturnsScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="RedeemInvestment">
            {() => (
              <LazyScreen>
                <RedeemInvestmentScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentHistory">
            {() => (
              <LazyScreen>
                <InvestmentHistoryScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="PortfolioAnalytics">
            {() => (
              <LazyScreen>
                <PortfolioAnalyticsScreen />
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="InvestmentLearn">
            {() => (
              <LazyScreen>
                <InvestmentLearnScreen />
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Meetings - Requires CAN_CREATE_MEETINGS for create, CAN_VIEW_MEETINGS for view */}
          <Stack.Screen name="CreateMeeting">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_CREATE_MEETINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="CreateMeetingScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="MeetingDetail">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEETINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MeetingDetailScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Attendance">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEETINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="AttendanceScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Minutes">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEETINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="MinutesScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="Resolutions">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_MEETINGS} fallback={<LoadingFallback />}>
                  <RoleScreen role={activeRole} screenName="ResolutionsScreen" />
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          {/* Profile - All authenticated users */}
          <Stack.Screen name="EditProfile">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="EditProfileScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="BasicProfileSetup">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="BasicProfileSetupScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="Profile">
            {() => (
              <LazyScreen>
                <RequireRouteAccess route="Profile">
                  <RoleScreen role={activeRole} screenName="ProfileScreen" />
                </RequireRouteAccess>
              </LazyScreen>
            )}
          </Stack.Screen>

          <Stack.Screen name="DocumentCenter">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="DocumentCenterScreen" /></LazyScreen>}
          </Stack.Screen>
          
          <Stack.Screen name="KYC">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="KYCScreen" /></LazyScreen>}
          </Stack.Screen>
          
          <Stack.Screen name="ChangePassword">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="ChangePasswordScreen" /></LazyScreen>}
          </Stack.Screen>
          
          <Stack.Screen name="TwoFactorAuth">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="TwoFactorAuthScreen" /></LazyScreen>}
          </Stack.Screen>
          
          <Stack.Screen name="HelpSupport">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="HelpSupportScreen" /></LazyScreen>}
          </Stack.Screen>

          <Stack.Screen name="SupportIssues">
            {() => (
              <LazyScreen>
                <RequirePermission permission={Permission.CAN_VIEW_CHAMA} fallback={<LoadingFallback />}>
                  <RequireRouteAccess route="SupportIssues">
                    <RoleScreen role={activeRole} screenName="SupportIssuesScreen" />
                  </RequireRouteAccess>
                </RequirePermission>
              </LazyScreen>
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Referrals">
            {() => <LazyScreen><RoleScreen role={activeRole} screenName="ReferralsScreen" /></LazyScreen>}
          </Stack.Screen>
        </>
      ) : null}

      <Stack.Screen name="Auth" options={{ headerShown: false }}>
        {() => (
          <AuthStack
            initialRoute={authInitialRoute}
            pendingVerification={otpVerificationParams}
            sessionExpiredMessage={sessionExpiredMessage}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.background,
    paddingHorizontal: 24,
  },
  loadingLogo: {
    width: 108,
    height: 108,
    marginBottom: 20,
  },
  loadingTitle: {
    marginTop: 16,
    color: colors.neutral[900],
    fontSize: 22,
    fontWeight: '700' as const,
  },
  loadingSubtitle: {
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
    color: colors.neutral[600],
    fontSize: 14,
    lineHeight: 20,
  },
  tabShell: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  thinStackHeader: {
    minHeight: 56,
  },
  fixedHeaderBrand: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fixedHeaderLogo: {
    width: 24,
    height: 24,
  },
  fixedHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  fixedHeaderEyebrow: {
    color: colors.neutral[500],
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  fixedHeaderTitle: {
    color: colors.neutral[900],
    fontSize: 18,
    fontWeight: '700',
  },
  stackHeaderCopy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  stackHeaderTitle: {
    color: colors.neutral[900],
    fontSize: 16,
    fontWeight: '700',
  },
  fixedHeaderAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  fixedHeaderSpacer: {
    width: 36,
    height: 36,
    marginLeft: 10,
  },
  tabBar: {
    height: 84,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 0,
    backgroundColor: colors.light.background,
    elevation: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabIconShell: {
    minWidth: 42,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconShellActive: {
    backgroundColor: 'transparent',
  },
  aiFab: {
    position: 'absolute',
    right: 20,
    bottom: 98,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    overflow: 'visible',
  },
  aiFabGlow: {
    position: 'absolute',
    inset: -6,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },
});

export default AppNavigator;
