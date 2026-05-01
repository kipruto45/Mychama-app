import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import {
  memberContributionService,
  type MemberContributionWorkspace,
} from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  getContributionTypeColor,
  getContributionTypeIcon,
  getObligationStateMeta,
  getPaymentStateMeta,
} from './contributionWorkflowShared';

type MemberContributionsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MemberContributions'
>;
type MemberContributionsRouteProp = RouteProp<MainStackParamList, 'MemberContributions'>;

const formatFriendlyDate = (value?: string | null) =>
  value ? formatDate(value) : 'No due date';

export const MemberContributionsScreen: React.FC = () => {
  const navigation = useNavigation<MemberContributionsNavigationProp>();
  const route = useRoute<MemberContributionsRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    draft,
    activePayment,
    clearActivePayment,
    lastVisitedRoute,
    setLastVisitedRoute,
    updateActivePayment,
  } = useMemberContributionFlowStore();

  const [workspace, setWorkspace] = useState<MemberContributionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';
  const entryPointLabel = useMemo(() => {
    switch (route.params?.entryPoint) {
      case 'notifications':
        return 'Opened from your notifications';
      case 'alerts':
        return 'Opened from alerts and reminders';
      case 'payments':
      case 'wallet':
        return 'Opened from payments';
      case 'more':
        return 'Opened from More';
      case 'deep_link':
        return 'Opened from a secure deep link';
      default:
        return null;
    }
  }, [route.params?.entryPoint]);
  const pendingPaymentState = useMemo(
    () =>
      activePayment &&
      ['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(
        activePayment.status
      )
        ? getPaymentStateMeta('pending')
        : null,
    [activePayment]
  );
  const restorableDraft = useMemo(() => {
    if (!draft?.chamaId || draft.chamaId !== activeChamaId) {
      return null;
    }

    if (
      activePayment &&
      ['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(activePayment.status)
    ) {
      return null;
    }

    if (!draft.amount || !(draft.contributionTypeName || draft.penaltyId)) {
      return null;
    }

    return draft;
  }, [activeChamaId, activePayment, draft]);

  const loadWorkspace = useCallback(
    async (showRefresh = false) => {
      if (!activeChamaId) {
        setWorkspace(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await memberContributionService.getWorkspace(activeChamaId);
        setWorkspace(response);
        setError(null);

        if (
          activePayment?.intentId &&
          activePayment.chamaId === activeChamaId &&
          ['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(
            activePayment.status
          )
        ) {
          const latestStatus = await memberContributionService
            .refreshPaymentStatus(activePayment.intentId)
            .catch(() => null);
          if (latestStatus?.intent?.status) {
            const nextStatus = latestStatus.intent.status;
            updateActivePayment({ status: nextStatus });
            if (!['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(nextStatus)) {
              clearActivePayment();
            }
          }
        }
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your contributions right now. Please try again.');
        setWorkspace(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeChamaId, activePayment, clearActivePayment, updateActivePayment]
  );

  useEffect(() => {
    setLastVisitedRoute('MemberContributions');
    void loadWorkspace();
  }, [loadWorkspace, setLastVisitedRoute]);

  const healthyProgress = useMemo(() => {
    const required = Number(workspace?.summary.required_amount || 0);
    const paid = Number(workspace?.summary.paid_amount || 0);
    if (!required) {
      return 0;
    }
    return Math.min(100, Math.round((paid / required) * 100));
  }, [workspace]);

  const primaryObligation = useMemo(() => {
    if (!workspace?.obligations?.length) {
      return null;
    }

    const priority = ['overdue', 'due', 'partially_paid', 'upcoming', 'not_due_yet', 'fully_paid'];
    return [...workspace.obligations].sort(
      (left, right) => priority.indexOf(left.state) - priority.indexOf(right.state)
    )[0];
  }, [workspace]);

  const cycleCompletionState = useMemo(() => {
    if (!workspace?.obligations?.length) {
      return { isComplete: false, paidCount: 0, totalCount: 0 };
    }

    const totalCount = workspace.obligations.length;
    const paidCount = workspace.obligations.filter((obligation) => obligation.state === 'fully_paid').length;
    const isComplete = totalCount > 0 && paidCount === totalCount;

    return { isComplete, paidCount, totalCount };
  }, [workspace]);

  const openMakeContribution = (obligation = primaryObligation) => {
    navigateToWorkspaceTab(navigation as any, 'Payments', {
      chamaId: activeChamaId || undefined,
      entryPoint: 'contributions',
      preselectedPurpose: 'contribution',
      contributionTypeId: obligation?.contribution_type_id,
      contributionTypeName: obligation?.contribution_type_name,
      amount: obligation?.remaining_amount || obligation?.required_amount,
      dueDate: obligation?.due_date || undefined,
    });
  };

  const resumeDraftFlow = () => {
    if (!restorableDraft?.chamaId) {
      return;
    }

    if (
      lastVisitedRoute === 'PaymentMethod' &&
      restorableDraft.amount &&
      restorableDraft.contributionTypeName
    ) {
      navigateToWorkspaceTab(navigation as any, 'Payments', {
        chamaId: restorableDraft.chamaId,
        entryPoint: 'contributions',
        preselectedPurpose: restorableDraft.mode === 'penalty' ? 'fine_payment' : 'contribution',
        amount: restorableDraft.amount,
        contributionTypeId: restorableDraft.contributionTypeId || undefined,
        contributionTypeName: restorableDraft.contributionTypeName,
        dueDate: restorableDraft.dueDate || undefined,
        penaltyId: restorableDraft.penaltyId || undefined,
      });
      return;
    }

    navigateToWorkspaceTab(navigation as any, 'Payments', {
      chamaId: restorableDraft.chamaId,
      entryPoint: 'contributions',
      preselectedPurpose: restorableDraft.mode === 'penalty' ? 'fine_payment' : 'contribution',
      contributionTypeId: restorableDraft.contributionTypeId || undefined,
      contributionTypeName: restorableDraft.contributionTypeName || undefined,
      amount: restorableDraft.amount,
      dueDate: restorableDraft.dueDate || undefined,
      penaltyId: restorableDraft.penaltyId || undefined,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contributions" subtitle={activeChama?.name} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerStateText}>Loading your contribution workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeChamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contributions" subtitle="Choose a chama" />
        <EmptyState
          title="No chama selected"
          description="Open a chama workspace first to view your contribution obligations."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contributions" subtitle={activeChama?.name} />
        <EmptyState
          title="Unable to load contributions"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  const hasContributionTypes = (workspace?.obligations?.length || 0) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Contributions" subtitle={activeChama?.name} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadWorkspace(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        {pendingPaymentState && activePayment ? (
          <Card style={styles.pendingBanner}>
            <View style={styles.pendingBannerRow}>
              <View style={styles.pendingBannerIcon}>
                <Icon name={pendingPaymentState.icon as any} size={22} color={pendingPaymentState.tint} />
              </View>
              <View style={styles.pendingBannerCopy}>
                <Text style={styles.pendingBannerTitle}>Resume your payment</Text>
                <Text style={styles.pendingBannerText}>
                  {pendingPaymentState.description}
                </Text>
              </View>
            </View>
            <Button
              title="Open status"
              onPress={() =>
                navigation.navigate('PaymentStatus', {
                  intentId: activePayment.intentId,
                  status: activePayment.status,
                  amount: activePayment.amount,
                  currency: activePayment.currency,
                  purpose: activePayment.purpose,
                  contributionTypeName: activePayment.contributionTypeName,
                  paymentMethod: activePayment.paymentMethod,
                })
              }
            />
          </Card>
        ) : null}

        {entryPointLabel ? (
          <Card style={styles.contextBanner}>
            <Text style={styles.contextBannerText}>{entryPointLabel}</Text>
          </Card>
        ) : null}

        {restorableDraft ? (
          <Card style={styles.pendingBanner}>
            <View style={styles.pendingBannerRow}>
              <View style={styles.pendingBannerIcon}>
                <Icon name="wallet-outline" size={22} color={colors.primary[600]} />
              </View>
              <View style={styles.pendingBannerCopy}>
                <Text style={styles.pendingBannerTitle}>Resume your contribution</Text>
                <Text style={styles.pendingBannerText}>
                  {restorableDraft.mode === 'penalty'
                    ? `Continue your penalty payment for ${formatCurrency(restorableDraft.amount || '0', currency)}.`
                    : `Continue your ${restorableDraft.contributionTypeName || 'contribution'} payment for ${formatCurrency(restorableDraft.amount || '0', currency)}.`}
                </Text>
              </View>
            </View>
            <Button
              title={lastVisitedRoute === 'PaymentMethod' ? 'Continue to payment' : 'Resume draft'}
              onPress={resumeDraftFlow}
              variant="outline"
            />
          </Card>
        ) : null}

        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>Contribution status</Text>
              <Text style={styles.heroAmount}>
                {formatCurrency(workspace?.summary.total_contributed || '0', currency)}
              </Text>
              <Text style={styles.heroCaption}>Total contributed so far</Text>
            </View>
            <View style={styles.heroNextDue}>
              <Text style={styles.heroNextDueLabel}>Next due</Text>
              <Text style={styles.heroNextDueValue}>
                {formatFriendlyDate(workspace?.summary.next_due_date)}
              </Text>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.metricValue}>
                {formatCurrency(workspace?.summary.current_cycle_amount || '0', currency)}
              </Text>
              <Text style={styles.metricLabel}>Current cycle</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.metricValue}>
                {formatCurrency(workspace?.summary.remaining_balance || '0', currency)}
              </Text>
              <Text style={styles.metricLabel}>Remaining</Text>
            </View>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${healthyProgress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {healthyProgress}% of this cycle covered
            </Text>
          </View>

          <Button
            title={primaryObligation?.state === 'fully_paid' ? 'Make another contribution' : 'Make Contribution'}
            onPress={() => openMakeContribution()}
          />
        </Card>

        {cycleCompletionState.isComplete ? (
          <Card style={styles.cycleCompleteCard}>
            <View style={styles.cycleCompleteHeader}>
              <View style={styles.cycleCompleteIconWrap}>
                <Icon name="check-decagram" size={20} color={colors.success} />
              </View>
              <View style={styles.cycleCompleteCopy}>
                <Text style={styles.cycleCompleteTitle}>Contribution cycle complete</Text>
                <Text style={styles.cycleCompleteText}>
                  All {cycleCompletionState.paidCount} scheduled contributions are fully paid. Your chama officials can
                  now proceed with payout rotation for this cycle.
                </Text>
              </View>
            </View>
            <Button
              title="Open notifications"
              variant="outline"
              onPress={() => navigation.navigate('Notifications')}
            />
          </Card>
        ) : null}

        {!hasContributionTypes ? (
          <EmptyState
            title="No active contribution cycle"
            description="Your chama has not published any active contribution types yet."
            icon="calendar-remove-outline"
            style={styles.emptyState}
          />
        ) : (
          <>
            <Card style={styles.statusCard}>
              <Text style={styles.sectionTitle}>Current obligations</Text>
              {workspace?.obligations.map((obligation) => {
                const state = getObligationStateMeta(obligation.state);
                return (
                  <TouchableOpacity
                    key={obligation.contribution_type_id}
                    activeOpacity={0.86}
                    onPress={() => openMakeContribution(obligation)}
                    style={styles.obligationRow}
                  >
                    <View
                      style={[
                        styles.obligationIcon,
                        {
                          backgroundColor: `${getContributionTypeColor(obligation.contribution_type_name)}18`,
                        },
                      ]}
                    >
                      <Icon
                        name={getContributionTypeIcon(obligation.contribution_type_name) as any}
                        size={20}
                        color={getContributionTypeColor(obligation.contribution_type_name)}
                      />
                    </View>
                    <View style={styles.obligationCopy}>
                      <View style={styles.obligationTitleRow}>
                        <Text style={styles.obligationTitle}>{obligation.contribution_type_name}</Text>
                        <Badge label={state.label} variant={state.variant} size="sm" />
                      </View>
                      <Text style={styles.obligationMeta}>
                        Due {formatFriendlyDate(obligation.due_date)}
                      </Text>
                      <Text style={styles.obligationAmounts}>
                        Required {formatCurrency(obligation.required_amount, currency)} • Paid{' '}
                        {formatCurrency(obligation.paid_amount, currency)} • Remaining{' '}
                        {formatCurrency(obligation.remaining_amount, currency)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>

            <View style={styles.linkRow}>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('ContributionHistory', { chamaId: activeChamaId })}
              >
                <Icon name="history" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>History</Text>
                <Text style={styles.linkSubtitle}>All contribution payments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('ContributionSchedule', { chamaId: activeChamaId })}
              >
                <Icon name="calendar-clock-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>Schedule</Text>
                <Text style={styles.linkSubtitle}>Upcoming cycles and due dates</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('ContributionBreakdown', { chamaId: activeChamaId })}
              >
                <Icon name="view-dashboard-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>Breakdown</Text>
                <Text style={styles.linkSubtitle}>Paid vs due by category</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('Penalties', { chamaId: activeChamaId })}
              >
                <Icon name="alert-octagon-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>Penalties</Text>
                <Text style={styles.linkSubtitle}>
                  {workspace?.penalties.count
                    ? `${workspace.penalties.count} active item${workspace.penalties.count === 1 ? '' : 's'}`
                    : 'No penalties'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('ContributionAlerts', { chamaId: activeChamaId })}
              >
                <Icon name="bell-ring-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>Alerts</Text>
                <Text style={styles.linkSubtitle}>Upcoming dues and reminder shortcuts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkCard}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="message-badge-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.linkTitle}>Notifications</Text>
                <Text style={styles.linkSubtitle}>Jump into receipts, status, and reminders</Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.previewCard}>
              <Text style={styles.sectionTitle}>Recent contributions</Text>
              {workspace?.recent_contributions?.length ? (
                workspace.recent_contributions.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={styles.previewRow}
                    onPress={() =>
                      navigation.navigate('ContributionDetails', {
                        contributionId: item.id,
                        chamaId: activeChamaId,
                      })
                    }
                  >
                    <View style={styles.previewCopy}>
                      <Text style={styles.previewTitle}>
                        {item.contribution_type_name || 'Contribution'}
                      </Text>
                      <Text style={styles.previewMeta}>
                        {formatFriendlyDate(item.date_paid)} • Ref {item.receipt_code}
                      </Text>
                    </View>
                    <Text style={styles.previewAmount}>
                      {formatCurrency(item.amount, currency)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.placeholderText}>Your completed contributions will appear here.</Text>
              )}
            </Card>

            <Card style={styles.previewCard}>
              <Text style={styles.sectionTitle}>Upcoming contributions</Text>
              {workspace?.upcoming_preview?.length ? (
                workspace.upcoming_preview.map((item) => {
                  const state = getObligationStateMeta(item.state);
                  return (
                    <View key={`${item.contribution_type_id}-${item.due_date}`} style={styles.previewRow}>
                      <View style={styles.previewCopy}>
                        <Text style={styles.previewTitle}>{item.contribution_type_name}</Text>
                        <Text style={styles.previewMeta}>
                          {formatFriendlyDate(item.due_date)} • {formatCurrency(item.required_amount, currency)}
                        </Text>
                      </View>
                      <Badge label={state.label} variant={state.variant} size="sm" />
                    </View>
                  );
                })
              ) : (
                <Text style={styles.placeholderText}>You’re fully paid for this cycle.</Text>
              )}
            </Card>

            <Card style={styles.previewCard}>
              <Text style={styles.sectionTitle}>Contribution rules</Text>
              <Text style={styles.rulesText}>
                {workspace?.rules.grace_period_days
                  ? `Payments remain in good standing for ${workspace.rules.grace_period_days} grace day${workspace.rules.grace_period_days === 1 ? '' : 's'} after the due date.`
                  : 'Contributions are expected on the published due date for each cycle.'}
              </Text>
              {workspace?.penalties.outstanding_total && Number(workspace.penalties.outstanding_total) > 0 ? (
                <Text style={styles.rulesHighlight}>
                  You have an outstanding balance of {formatCurrency(workspace.penalties.outstanding_total, currency)} in penalties.
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerStateText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  pendingBanner: {
    backgroundColor: '#F8FDF6',
    borderWidth: 1,
    borderColor: '#DDEDD9',
    gap: spacing[4],
  },
  contextBanner: {
    backgroundColor: '#F8F8F8',
  },
  contextBannerText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
  },
  pendingBannerRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  pendingBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFF4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  pendingBannerTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  pendingBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#123524',
    ...shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: '#B7D8C4',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroAmount: {
    marginTop: spacing[2],
    fontSize: 34,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
  },
  heroCaption: {
    marginTop: spacing[1],
    color: '#D8EAD9',
    fontSize: typography.fontSize.sm,
  },
  heroNextDue: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  heroNextDueLabel: {
    color: '#B7D8C4',
    fontSize: typography.fontSize.xs,
  },
  heroNextDueValue: {
    marginTop: spacing[1],
    color: colors.light.background,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  heroMetricsRow: {
    marginTop: spacing[5],
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  metricValue: {
    color: colors.light.background,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  metricLabel: {
    color: '#CAE3D4',
    fontSize: typography.fontSize.xs,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressBlock: {
    marginTop: spacing[5],
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: '#57D38C',
  },
  progressLabel: {
    color: '#D8EAD9',
    fontSize: typography.fontSize.sm,
  },
  statusCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  obligationRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  obligationIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obligationCopy: {
    flex: 1,
    gap: spacing[1],
  },
  obligationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  obligationTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  obligationMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  obligationAmounts: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  linkCard: {
    flex: 1,
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing[2],
  },
  linkTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  linkSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  previewCard: {
    gap: spacing[4],
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  },
  previewCopy: {
    flex: 1,
    gap: spacing[1],
  },
  previewTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  previewMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  previewAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  placeholderText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  rulesText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  rulesHighlight: {
    marginTop: spacing[2],
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  emptyState: {
    minHeight: 220,
  },
  cycleCompleteCard: {
    backgroundColor: '#F2FBF5',
    borderWidth: 1,
    borderColor: '#CDEBD5',
    gap: spacing[3],
  },
  cycleCompleteHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cycleCompleteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF5E5',
  },
  cycleCompleteCopy: {
    flex: 1,
    gap: spacing[1],
  },
  cycleCompleteTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  cycleCompleteText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
});

export default MemberContributionsScreen;
