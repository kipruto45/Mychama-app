import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionCard } from '@/components/cards/TransactionCard';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { getScreenExperience, RequireScreenAccess } from '@/rbac';
import { financeService } from '@/services/financeService';
import { formatCurrency } from '@/utils/format';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';

type FinanceScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Finance'>;
type FinanceTab = 'overview' | 'transactions' | 'loans';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FinanceScreen: React.FC = () => {
  const navigation = useNavigation<FinanceScreenNavigationProp>();
  const {
    activeChamaId,
    availableChamas,
    chamas,
    clearSwitchError,
    getScopedChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [currency, setCurrency] = useState('KES');
  const primaryChamaId = activeChamaId || chamas[0]?.id;
  const hasChamas = chamas.length > 0 || !!primaryChamaId;
  const activeRole = useActiveRole(primaryChamaId);

  // Permission checks
  const canViewFinance = useCanPerformAction(Permission.CAN_VIEW_FINANCE, primaryChamaId);
  const canRecordContributions = useCanPerformAction(Permission.CAN_RECORD_CONTRIBUTIONS, primaryChamaId);
  const canRequestLoan = useCanPerformAction(Permission.CAN_REQUEST_LOAN, primaryChamaId);
  const canAdjustFinance = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, primaryChamaId);
  const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, primaryChamaId);
  const canViewReports = useCanPerformAction(Permission.CAN_VIEW_REPORTS, primaryChamaId);
  const financeExperience = getScreenExperience('finance', activeRole || Role.MEMBER);
  const hasFinanceAccess =
    financeExperience.visible &&
    (canViewFinance ||
      canRequestLoan ||
      canMakePayments ||
      canRecordContributions ||
      financeExperience.scope === 'platform' ||
      financeExperience.scope === 'investigation');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanApplications, setLoanApplications] = useState<any[]>([]);

  const loadData = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const scopedChamas = getScopedChamas();

      if (chamas.length === 0) {
        setCurrency('KES');
        setTransactions([]);
        setLoans([]);
        setLoanApplications([]);
        return;
      }

      const snapshots = await Promise.all(
        scopedChamas.map(async (chama) => {
          const [summary, contributions, loans, applications] = await Promise.all([
            financeService.getFinancialSummary(chama.id).catch(() => null),
            financeService.getContributions(chama.id).catch(() => []),
            financeService.getLoans(chama.id).catch(() => []),
            financeService.getLoanApplications(chama.id).catch(() => []),
          ]);

          return { chama, summary, contributions, loans, applications };
        })
      );

      const recentTransactions = await (async () => {
        if (!primaryChamaId) {
          return [];
        }

        try {
          const feed = await financeService.getAllTransactionsFeed(primaryChamaId, { limit: 5 });
          return feed.items.map((item) => {
            const normalizedType = String(item.type || '').toLowerCase();
            const cardType =
              normalizedType.includes('loan_repayment') || normalizedType.includes('repayment')
                ? ('repayment' as const)
                : normalizedType.includes('loan_disbursement') || normalizedType.includes('loan')
                  ? ('loan' as const)
                  : normalizedType.includes('penalty')
                    ? ('penalty' as const)
                    : ('contribution' as const);

            const normalizedStatus = String(item.status || '').toLowerCase();
            const cardStatus =
              normalizedStatus === 'success' ? 'completed' : normalizedStatus === 'pending' ? 'pending' : 'failed';

            return {
              id: item.ref,
              type: cardType,
              direction:
                item.direction === 'inflow'
                  ? ('inflow' as const)
                  : item.direction === 'outflow'
                    ? ('outflow' as const)
                    : ('internal' as const),
              amount: item.amount,
              currency: item.currency,
              description: item.title || 'Transaction',
              date: item.event_at,
              status: cardStatus,
              memberName: item.member?.name || undefined,
              chamaId: primaryChamaId,
            };
          });
        } catch {
          return [];
        }
      })();

      const allLoans = snapshots
        .flatMap((item) => item.loans)
        .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());

      const allApplications = snapshots
        .flatMap((item) => item.applications)
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setCurrency(snapshots[0]?.summary?.currency || snapshots[0]?.chama.currency || 'KES');
      setTransactions(recentTransactions);
      setLoans(allLoans);
      setLoanApplications(allApplications);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load finance data.')
          : 'Unable to load finance data.';
      setError(message);
      setTransactions([]);
      setLoans([]);
      setLoanApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeChamaId, isLoadingChamaContext]);

  const showNoChamasState = !loading && !error && !hasChamas;
  const showAccessDeniedState = !loading && !error && (hasChamas || financeExperience.visible) && !hasFinanceAccess;

  const financeScreenMeta = (() => {
    const titleByRole: Record<Role, string> = {
      [Role.SUPERADMIN]: 'Platform finance',
      [Role.ADMIN]: 'Operations finance',
      [Role.CHAMA_ADMIN]: 'Chama finance',
      [Role.TREASURER]: 'Finance command',
      [Role.SECRETARY]: 'Finance summary',
      [Role.AUDITOR]: 'Finance review',
      [Role.MEMBER]: 'Finance workspace',
    };

    return {
      title: titleByRole[activeRole || Role.MEMBER],
      subtitle: `${financeExperience.does[0] || 'Review finance activity in this workspace.'} ${financeExperience.sees[0] ? `You can see ${financeExperience.sees[0]}.` : ''}`.trim(),
      noChamaTitle:
        financeExperience.scope === 'platform' || financeExperience.scope === 'investigation'
          ? 'No chama context selected'
          : 'No active chama yet',
      noChamaDescription:
        financeExperience.scope === 'platform' || financeExperience.scope === 'investigation'
          ? 'Choose a chama workspace first so this finance view can load the right records.'
          : 'Open your chama workspace first so finance activity can load.',
      deniedDescription:
        financeExperience.visible
          ? 'This role cannot open the finance workspace in the current context.'
          : 'This role should use role-specific contributions, payments, or loan screens instead of the finance command center.',
    };
  })();

  const financeTabs = ([
    { key: 'overview', label: 'Workspace', visible: true },
    { key: 'transactions', label: 'Transactions', visible: financeExperience.tabs?.includes('Transactions') ?? false },
    { key: 'loans', label: 'Loans', visible: financeExperience.tabs?.includes('Loans') ?? false },
  ] satisfies Array<{ key: FinanceTab; label: string; visible: boolean }>).filter((tab) => tab.visible);
  const financeIsReadOnly =
    financeExperience.access === 'read_only' ||
    financeExperience.access === 'inspect_only' ||
    financeExperience.access === 'support';

  useEffect(() => {
    if (!financeTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(financeTabs[0]?.key ?? 'overview');
    }
  }, [activeTab, financeTabs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {canRecordContributions && !financeIsReadOnly && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('MemberContributions', { chamaId: primaryChamaId })}
                >
                  <Icon name="cash-plus" size={24} color={colors.primary[500]} />
                  <Text style={styles.quickActionText}>Contribute</Text>
                </TouchableOpacity>
              )}
              {canRequestLoan && !financeIsReadOnly && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() =>
                    navigation.navigate(
                      activeRole === Role.MEMBER ? 'MemberLoans' : 'RequestLoan',
                      { chamaId: primaryChamaId }
                    )
                  }
                >
                  <Icon name="bank-transfer" size={24} color={colors.warning} />
                  <Text style={styles.quickActionText}>Request Loan</Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() =>
                    navigation.navigate(
                      activeRole === Role.MEMBER ? 'MemberLoans' : 'LoanApplications',
                      { chamaId: primaryChamaId }
                    )
                  }
                >
                  <Icon name="clipboard-list-outline" size={24} color={colors.info} />
                  <Text style={styles.quickActionText}>
                    {activeRole === Role.MEMBER ? 'Loans' : 'Loan Queue'}
                  </Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('GoalsInvestments', { chamaId: primaryChamaId })}
                >
                  <Icon name="target-variant" size={24} color={colors.primary[500]} />
                  <Text style={styles.quickActionText}>Goals</Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('Governance', { chamaId: primaryChamaId })}
                >
                  <Icon name="gavel" size={24} color={colors.accent[600]} />
                  <Text style={styles.quickActionText}>Governance</Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('Expenses', { chamaId: primaryChamaId })}
                >
                  <Icon name="receipt-text-outline" size={24} color={colors.success} />
                  <Text style={styles.quickActionText}>Expenses</Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('ContributionCompliance', { chamaId: primaryChamaId })}
                >
                  <Icon name="shield-check-outline" size={24} color={colors.accent[600]} />
                  <Text style={styles.quickActionText}>Compliance</Text>
                </TouchableOpacity>
              )}
              {canViewFinance && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('Penalties', { chamaId: primaryChamaId })}
                >
                  <Icon name="gavel" size={24} color={colors.warning} />
                  <Text style={styles.quickActionText}>Penalties</Text>
                </TouchableOpacity>
              )}
              {(canAdjustFinance || canMakePayments) && !financeIsReadOnly && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('Withdrawals', { chamaId: primaryChamaId })}
                >
                  <Icon name="bank-transfer-out" size={24} color={colors.error} />
                  <Text style={styles.quickActionText}>Withdraw</Text>
                </TouchableOpacity>
              )}
              {financeExperience.access !== 'self_service' ? (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => navigation.navigate('SupportIssues', { chamaId: primaryChamaId })}
                >
                  <Icon name="lifebuoy" size={24} color={colors.info} />
                  <Text style={styles.quickActionText}>Support</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Transactions')}
              >
                <Icon name="history" size={24} color={colors.info} />
                <Text style={styles.quickActionText}>History</Text>
              </TouchableOpacity>
              {canViewReports && (
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() =>
                    navigation.navigate('FinanceReportDetail', {
                      reportType: 'chama-summary',
                      chamaId: primaryChamaId,
                    })
                  }
                >
                  <Icon name="file-chart-outline" size={24} color={colors.accent[600]} />
                  <Text style={styles.quickActionText}>Reports</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      
      case 'transactions':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  type={transaction.type}
                  direction={transaction.direction}
                  amount={transaction.amount}
                  currency={transaction.currency}
                  description={transaction.description}
                  date={transaction.date}
                  status={transaction.status}
                  memberName={transaction.memberName}
                  onPress={() =>
                    navigation.navigate('TransactionDetail', {
                      transactionRef: transaction.id,
                      chamaId: transaction.chamaId,
                    })
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No transactions yet"
                description="Recent finance activity will appear here once it is available."
              />
            )}
          </View>
        );
      
      case 'loans':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Loan Pipeline</Text>
              <View style={styles.loanHeaderActions}>
                <Button
                  title="Queue"
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate(
                      activeRole === Role.MEMBER ? 'MemberLoans' : 'LoanApplications',
                      { chamaId: primaryChamaId }
                    )
                  }
                />
                {canRequestLoan && (
                  <Button
                    title="Request"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      navigation.navigate(
                        activeRole === Role.MEMBER ? 'MemberLoans' : 'RequestLoan',
                        { chamaId: primaryChamaId }
                      )
                    }
                  />
                )}
              </View>
            </View>
            {loanApplications.length > 0 && (
              <View style={styles.pipelineSection}>
                <Text style={styles.pipelineTitle}>Applications</Text>
                {loanApplications.slice(0, 3).map((application) => (
                  <TouchableOpacity
                    key={application.id}
                    onPress={() =>
                      navigation.navigate(
                        activeRole === Role.MEMBER ? 'MemberLoans' : 'LoanApplications',
                        { chamaId: primaryChamaId }
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Card style={styles.loanCard}>
                      <View style={styles.loanHeader}>
                        <View style={styles.loanInfo}>
                          <Text style={styles.loanMember}>{application.member.full_name}</Text>
                          <Text style={styles.loanAmount}>
                            {formatCurrency(application.requested_amount, currency)}
                          </Text>
                        </View>
                        <Badge
                          label={application.status.replace(/_/g, ' ')}
                          variant={
                            application.status === 'rejected'
                              ? 'error'
                              : ['approved', 'disbursed'].includes(application.status)
                              ? 'success'
                              : 'warning'
                          }
                        />
                      </View>
                      <View style={styles.loanDetails}>
                        <Text style={styles.loanDetail}>
                          <Icon name="clipboard-text-outline" size={14} color={colors.neutral[500]} /> {application.loan_product.name}
                        </Text>
                        <Text style={styles.loanDetail}>
                          <Icon name="clock-outline" size={14} color={colors.neutral[500]} /> {application.requested_term_months} months
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {loans.length > 0 ? (
              loans.map((loan) => (
                <TouchableOpacity
                  key={loan.id}
                  onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id, chamaId: primaryChamaId })}
                  activeOpacity={0.85}
                >
                  <Card style={styles.loanCard}>
                    <View style={styles.loanHeader}>
                      <View style={styles.loanInfo}>
                        <Text style={styles.loanMember}>{loan.member.full_name}</Text>
                        <Text style={styles.loanAmount}>
                          {formatCurrency(loan.principal, currency)}
                        </Text>
                      </View>
                      <Badge
                        label={loan.status.replace(/_/g, ' ')}
                        variant={
                          ['approved', 'disbursed', 'active', 'paid', 'cleared'].includes(loan.status)
                            ? 'success'
                            : ['overdue', 'defaulted', 'defaulted_recovering', 'written_off'].includes(loan.status)
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </View>
                    <View style={styles.loanDetails}>
                      <Text style={styles.loanDetail}>
                        <Icon name="clock" size={14} color={colors.neutral[500]} /> {loan.duration_months} months
                      </Text>
                      <Text style={styles.loanDetail}>
                        <Icon name="percent" size={14} color={colors.neutral[500]} /> {loan.interest_rate}% interest
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="No loans yet"
                description="Loan requests and active loans will appear here once they exist."
              />
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <RequireScreenAccess screen="finance" chamaId={primaryChamaId}>
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centerState}>
          <Icon name="chart-line" size={40} color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading finance data</Text>
          <Text style={styles.centerText}>Loading your live balances, loans, and transactions.</Text>
        </View>
      ) : error ? (
        <EmptyState
          icon={<Icon name="alert-circle-outline" size={56} color={colors.error} />}
          title="Finance data unavailable"
          description={error}
          action={
            <Button
              title="Retry"
              onPress={() => void loadData()}
              icon={<Icon name="refresh" size={18} color="#FFFFFF" />}
            />
          }
          style={styles.centerState}
        />
      ) : showNoChamasState ? (
        <EmptyState
          icon={<Icon name="account-group-outline" size={56} color={colors.neutral[400]} />}
          title={financeScreenMeta.noChamaTitle}
          description={financeScreenMeta.noChamaDescription}
          style={styles.centerState}
        />
      ) : showAccessDeniedState ? (
        <EmptyState
          icon={<Icon name="shield-lock-outline" size={56} color={colors.neutral[400]} />}
          title="Finance unavailable"
          description={financeScreenMeta.deniedDescription}
          style={styles.centerState}
        />
      ) : (
        <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{financeScreenMeta.title}</Text>
          <Text style={styles.subtitle}>
            {financeScreenMeta.subtitle}
            {activeRole ? ` ${ROLE_DISPLAY_NAMES[activeRole]} workspace.` : ''}
          </Text>
        </View>
        {canRecordContributions ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('MakeContribution', { chamaId: primaryChamaId })}
            style={styles.addButton}
          >
            <Icon name="plus" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
      </View>

      <View style={styles.contextSwitcher}>
        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          onSelectChama={(chamaId) => {
            clearSwitchError();
            void switchChama(chamaId)
              .then(() => {
                void loadData();
              })
              .catch(() => undefined);
          }}
          helperText={switchError}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {financeTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
        </>
      )}
    </SafeAreaView>
    </RequireScreenAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing[3],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  tabContent: {
    flex: 1,
  },
  statsContainer: {
    paddingBottom: spacing[4],
  },
  statCard: {
    width: SCREEN_WIDTH * 0.4,
    marginRight: spacing[3],
  },
  chartCard: {
    marginBottom: spacing[4],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  quickAction: {
    width: '30%',
    alignItems: 'center',
    padding: spacing[3],
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginTop: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  loanHeaderActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  loanCard: {
    marginBottom: spacing[3],
  },
  pipelineSection: {
    marginBottom: spacing[4],
  },
  pipelineTitle: {
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  loanInfo: {
    flex: 1,
  },
  loanMember: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  loanAmount: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[600],
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loanDetail: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerTitle: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  centerText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
