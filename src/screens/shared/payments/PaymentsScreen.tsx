import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { RoleAwarePageShell } from '@/components/system/RoleAwarePageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { formatCurrency, formatDate } from '@/utils/format';
import { paymentService } from '@/services/paymentService';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { resolveContributionPaymentTarget } from '@/screens/roles/member/contributionWorkflowRouting';

type PaymentsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Payments'>;

interface Payment {
  id: string;
  type: 'contribution' | 'loan_repayment' | 'penalty' | 'fee' | 'payment';
  amount: string;
  currency: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'mpesa' | 'cash';
  reference: string;
  purpose: string;
  contributionId?: string | null;
  contributionTypeName?: string | null;
  intentId?: string | null;
  metadata?: Record<string, unknown>;
  chama?: {
    id: string;
    name: string;
  };
}

const mapPaymentType = (purpose: string): Payment['type'] => {
  switch (purpose) {
    case 'loan_repayment':
      return 'loan_repayment';
    case 'penalty':
      return 'penalty';
    case 'fee':
    case 'meeting_fee':
      return 'fee';
    case 'payment':
      return 'payment';
    default:
      return 'contribution';
  }
};

const mapPaymentStatus = (status: string): Payment['status'] => {
  if (['completed', 'success', 'refunded', 'partially_refunded', 'reconciled'].includes(status)) {
    return 'completed';
  }

  if (['pending', 'pending_callback', 'pending_verification', 'pending_authentication'].includes(status)) {
    return 'pending';
  }

  return 'failed';
};

const mapPaymentMethod = (intentType: string): Payment['method'] => {
  const normalizedIntentType = intentType.toLowerCase();
  if (normalizedIntentType.includes('mpesa') || normalizedIntentType.includes('stk')) {
    return 'mpesa';
  }
  return 'cash';
};

export const PaymentsScreen: React.FC = () => {
  const navigation = useNavigation<PaymentsScreenNavigationProp>();
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
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const primaryChamaId = activeChamaId || chamas[0]?.id;
  const hasChamas = chamas.length > 0 || !!primaryChamaId;
  const activeRole = useActiveRole(primaryChamaId);
  const { experience, visibleTabs, visibleColumns, dataScope } = useScreenRBAC('payments', primaryChamaId);

  // Permission checks
  const canViewPayments = useCanPerformAction(Permission.CAN_VIEW_PAYMENTS, primaryChamaId);
  const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, primaryChamaId);
  const canViewFinance = useCanPerformAction(Permission.CAN_VIEW_FINANCE, primaryChamaId);
  const hasRoleScreenAccess = experience.visible;
  const hasPaymentsAccess =
    hasRoleScreenAccess &&
    (canViewPayments || canMakePayments || canViewFinance || dataScope.startsWith('platform'));

  const paymentsScreenMeta = useMemo(() => {
    const titleByRole: Record<Role, string> = {
      [Role.SUPERADMIN]: 'Payment activity',
      [Role.ADMIN]: 'Payment operations',
      [Role.CHAMA_ADMIN]: 'Payments overview',
      [Role.TREASURER]: 'Collections and payments',
      [Role.SECRETARY]: 'Payment summary',
      [Role.AUDITOR]: 'Payment review',
      [Role.MEMBER]: 'My payments',
    };

    return {
      title: titleByRole[activeRole || Role.MEMBER],
      subtitle: `${experience.does[0] || 'Review payment activity in this workspace.'} ${experience.sees[0] ? `You can see ${experience.sees[0]}.` : ''}`.trim(),
      noChamaTitle: dataScope.startsWith('platform') ? 'No chama context selected' : 'No active chama yet',
      noChamaDescription: dataScope.startsWith('platform')
        ? 'Choose a chama workspace first so the right payment records can load.'
        : 'Open a chama workspace first so the right payment history can load.',
      deniedDescription: hasRoleScreenAccess
        ? 'This role cannot access payments in the current workspace.'
        : 'This role should use its own role-specific workspaces instead of payment operations.',
    };
  }, [activeRole, dataScope, experience.does, experience.sees, hasRoleScreenAccess]);

  const loadPayments = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const scopedChamas = getScopedChamas();

      if (chamas.length === 0) {
        setPayments([]);
        setFilteredPayments([]);
        return;
      }

      const perChamaPayments = await Promise.all(
        scopedChamas.map(async (chama) => {
          const paymentRows =
            dataScope === 'own_records'
              ? await paymentService.getPayments(chama.id)
              : await paymentService.getChamaTransactions(chama.id);
          return paymentRows.map((payment) => ({
            id: payment.id,
            type: mapPaymentType(payment.purpose),
            amount: payment.amount,
            currency: payment.currency,
            description:
              String(payment.metadata?.description || payment.purpose || 'Payment')
                .replace(/_/g, ' '),
            date: payment.created_at,
            status: mapPaymentStatus(payment.status),
            method: mapPaymentMethod(payment.intent_type || payment.payment_method || ''),
            reference: payment.reference_id || payment.id,
            purpose: payment.purpose,
            contributionId:
              String(payment.metadata?.contribution_id || payment.metadata?.business_record_id || '') || null,
            contributionTypeName:
              String(payment.metadata?.contribution_type_name || payment.metadata?.type_name || '') || null,
            intentId: payment.id,
            metadata: payment.metadata,
            chama: { id: chama.id, name: chama.name },
          }));
        })
      );

      const mergedPayments = perChamaPayments
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPayments(mergedPayments);
      setFilteredPayments(mergedPayments);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load payments.')
          : 'Unable to load payments.';
      setError(message);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, [activeChamaId, isLoadingChamaContext]);

  const showNoChamasState = !loading && !error && !hasChamas;
  const showAccessDeniedState = !loading && !error && (hasChamas || hasRoleScreenAccess) && !hasPaymentsAccess;

  const visibleFilterOptions = useMemo(() => {
    if (experience.access === 'self_service') {
      return [
        { key: 'all', label: 'All' },
        { key: 'completed', label: 'Completed' },
        { key: 'pending', label: 'Pending' },
      ] as const;
    }

    return [
      { key: 'all', label: 'All' },
      { key: 'completed', label: 'Completed' },
      { key: 'pending', label: 'Pending' },
      { key: 'failed', label: 'Failed' },
    ] as const;
  }, [experience.access]);

  useEffect(() => {
    let filtered = payments;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (payment) =>
          payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.chama?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === activeFilter);
    }
    
    setFilteredPayments(filtered);
  }, [searchQuery, activeFilter, payments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return payments.length;
    return payments.filter((p) => p.status === status).length;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'cash';
      case 'loan_repayment':
        return 'cash-sync';
      case 'penalty':
        return 'alert-circle';
      case 'fee':
        return 'file-document';
      default:
        return 'cash';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return 'cellphone';
      case 'cash':
        return 'cash';
      default:
        return 'wallet';
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => {
        const contributionTarget =
          activeRole === Role.MEMBER
            ? resolveContributionPaymentTarget({
                chamaId: item.chama?.id,
                paymentId: item.id,
                intentId: item.intentId,
                contributionId: item.contributionId,
                purpose: item.purpose,
                status: item.status,
                amount: item.amount,
                currency: item.currency,
                paymentMethod: item.method,
                contributionTypeName: item.contributionTypeName || item.description,
                metadata: item.metadata,
              })
            : null;

        if (contributionTarget) {
          (navigation as any).navigate(contributionTarget.screen, contributionTarget.params);
          return;
        }

        navigation.navigate('PaymentDetail', { paymentId: item.id, chamaId: item.chama?.id });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Icon
            name={getTypeIcon(item.type)}
            size={20}
            color={colors.primary[500]}
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentDescription}>{item.description}</Text>
          <Text style={styles.paymentChama}>{item.chama?.name}</Text>
        </View>
        <View style={styles.paymentAmountContainer}>
          <Text style={styles.paymentAmount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <Badge
            label={item.status}
            variant={
              item.status === 'completed'
                ? 'success'
                : item.status === 'pending'
                ? 'warning'
                : 'error'
            }
            size="sm"
          />
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <View style={styles.paymentMeta}>
          <Icon name={getMethodIcon(item.method)} size={14} color={colors.neutral[500]} />
          <Text style={styles.paymentMethod}>{item.method.toUpperCase()}</Text>
        </View>
        <Text style={styles.paymentDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.paymentReference}>
        <Text style={styles.referenceLabel}>Ref:</Text>
        <Text style={styles.referenceValue}>{item.reference}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={<Icon name="cash-remove" size={64} color={colors.neutral[400]} />}
      title={error ? 'Could not load payments' : 'No Payments Found'}
      description={
        error
          ? error
          : searchQuery || activeFilter !== 'all'
          ? 'No payments match your search or filter criteria'
          : 'You haven\'t made any payments yet'
      }
      action={
        !searchQuery && activeFilter === 'all' && (error || canMakePayments) && (
          <Button
            title={error ? 'Retry' : 'Make Payment'}
            onPress={error ? () => void loadPayments() : () => navigation.navigate('MemberContributions', { chamaId: primaryChamaId })}
            icon={<Icon name="cash-plus" size={20} color="#FFFFFF" />}
          />
        )
      }
    />
  );

  return (
    <RequireRouteAccess route="Payments" chamaId={primaryChamaId}>
    <SafeAreaView style={styles.container}>
      <RoleAwarePageShell
        eyebrow={activeRole ? `${ROLE_DISPLAY_NAMES[activeRole]} workspace` : 'Shared payments workspace'}
        title={paymentsScreenMeta.title}
        description={`${paymentsScreenMeta.subtitle} Data scope: ${dataScope.replace(/_/g, ' ')}.`}
        accessLabel={experience.access.replace(/_/g, ' ')}
        accessMode={experience.access}
        scopeLabel={dataScope.replace(/_/g, ' ')}
        tabs={visibleTabs}
        columns={visibleColumns}
        badges={[...visibleTabs.slice(0, 2), ...visibleColumns.slice(0, 2)]}
        actions={[
          canViewFinance && experience.access === 'full'
            ? {
                key: 'ops',
                label: 'Operations',
                icon: 'shield-sync-outline',
                onPress: () => navigation.navigate('PaymentOperations', { chamaId: primaryChamaId || undefined }),
              }
            : null,
          canMakePayments && experience.access === 'self_service'
            ? {
                key: 'pay',
                label: 'Make payment',
                icon: 'cash-plus',
                onPress: () => navigation.navigate('MemberContributions', { chamaId: primaryChamaId }),
              }
            : null,
        ].filter(Boolean) as Array<{ key: string; label: string; icon?: string; onPress?: () => void }>}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{paymentsScreenMeta.title}</Text>
          <Text style={styles.subtitle}>
            {paymentsScreenMeta.subtitle}
            {activeRole ? ` ${ROLE_DISPLAY_NAMES[activeRole]} workspace.` : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {canViewFinance && experience.access === 'full' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('PaymentOperations', { chamaId: primaryChamaId || undefined })}
              style={styles.addButton}
            >
              <Icon name="shield-sync-outline" size={22} color={colors.secondary[600]} />
            </TouchableOpacity>
          )}
          {canMakePayments && experience.access === 'self_service' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MemberContributions', { chamaId: primaryChamaId })}
              style={styles.addButton}
            >
              <Icon name="plus" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {error ? (
        <EmptyState
          icon={<Icon name="alert-circle-outline" size={64} color={colors.error} />}
          title="Could not load payments"
          description={error}
          action={<Button title="Retry" onPress={() => void loadPayments()} />}
          style={styles.emptyState}
        />
      ) : showNoChamasState ? (
        <EmptyState
          icon={<Icon name="account-group-outline" size={64} color={colors.neutral[400]} />}
          title={paymentsScreenMeta.noChamaTitle}
          description={paymentsScreenMeta.noChamaDescription}
          style={styles.emptyState}
        />
      ) : showAccessDeniedState ? (
        <EmptyState
          icon={<Icon name="shield-lock-outline" size={64} color={colors.neutral[400]} />}
          title="Payments unavailable"
          description={paymentsScreenMeta.deniedDescription}
          style={styles.emptyState}
        />
      ) : (
        <>
          <View style={styles.contextSwitcher}>
            <ChamaContextSwitcher
              chamas={availableChamas}
              activeChamaId={activeChamaId}
              isSwitching={isSwitching}
              onSelectChama={(chamaId) => {
                clearSwitchError();
                void switchChama(chamaId)
                  .then(() => {
                    void loadPayments();
                  })
                  .catch(() => undefined);
              }}
              helperText={switchError}
            />
          </View>

          {activeRole === Role.MEMBER ? (
            <Card style={styles.contributionShortcutCard}>
              <View style={styles.contributionShortcutHeader}>
                <View style={styles.contributionShortcutCopy}>
                  <Text style={styles.contributionShortcutTitle}>Contribution workflow</Text>
                  <Text style={styles.contributionShortcutText}>
                    Open your contribution overview, history, schedule, and receipts from one place.
                  </Text>
                </View>
                <Icon name="cash-check" size={24} color={colors.primary[600]} />
              </View>
              <Button
                title="Open contributions"
                onPress={() =>
                  navigation.navigate('MemberContributions', {
                    chamaId: primaryChamaId,
                    entryPoint: 'payments',
                  })
                }
              />
            </Card>
          ) : null}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Icon name="magnify" size={20} color={colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search payments..."
                placeholderTextColor={colors.neutral[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {visibleFilterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  activeFilter === filter.key && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === filter.key && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    activeFilter === filter.key && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      activeFilter === filter.key && styles.filterBadgeTextActive,
                    ]}
                  >
                    {getStatusCount(filter.key)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(
                    payments
                      .filter((p) => p.status === 'completed')
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                      .toString(),
                    payments[0]?.currency || 'KES'
                  )}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(
                    payments
                      .filter((p) => p.status === 'pending')
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                      .toString(),
                    payments[0]?.currency || 'KES'
                  )}
                </Text>
              </View>
            </View>
          </Card>

          {/* Payment List */}
          {loading ? (
            <SkeletonList count={5} />
          ) : (
            <FlatList
              data={filteredPayments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={renderEmptyState}
            />
          )}
        </>
      )}
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
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
    padding: spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  contributionShortcutCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    backgroundColor: '#F4FAF6',
    borderWidth: 1,
    borderColor: '#DDEDD9',
    gap: spacing[3],
  },
  contributionShortcutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  contributionShortcutCopy: {
    flex: 1,
    gap: spacing[1],
  },
  contributionShortcutTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  contributionShortcutText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    marginHorizontal: spacing[1],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginRight: spacing[1],
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[600],
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  emptyState: {
    flex: 1,
    marginHorizontal: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[200],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  paymentItem: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  paymentChama: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginLeft: spacing[1],
  },
  paymentDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  paymentReference: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  referenceLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    marginRight: spacing[1],
  },
  referenceValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
});
