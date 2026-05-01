import React, { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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
import { useNavigation } from '@react-navigation/native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { appService } from '@/services/appService';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { DashboardOverview } from '@/types';
import { formatCurrency } from '@/utils/format';

const initialOverview: DashboardOverview = {
  user: { id: '', name: '', phone: '' },
  totals: {
    total_savings: '0',
    chama_balance: '0',
    total_loans: '0',
    total_expenses: '0',
    pending_contributions: 0,
    unread_notifications: 0,
  },
  member_overview: {
    active_chamas: 0,
    pending_contributions: 0,
    loan_eligibility: {},
  },
  chamas: [],
  recent_transactions: [],
  upcoming_meetings: [],
  announcements: [],
  activity_preview: [],
  trends: { contributions: [], expenses: [] },
  loan_stats: { active_count: 0, requested_count: 0 },
  smart_summary: { headline: '', plain_language: '', period_label: '' },
  scores: {
    member_reliability: 0,
    loan_eligibility: 0,
    chama_health: 0,
    liquidity_health: 0,
    default_risk: 0,
    attendance_score: 0,
  },
  analytics: {
    monthly_contributions: '0',
    monthly_expenses: '0',
    pending_withdrawals_amount: '0',
    pending_expenses_amount: '0',
    pending_loan_requests_amount: '0',
    contribution_completion_rate: 0,
    attendance_recent_average: null,
    attendance_previous_average: null,
    attendance_trend_delta: 0,
    failed_payouts: 0,
    failed_notifications: 0,
    pending_disbursements: 0,
    unpaid_penalties_total: '0',
    unpaid_penalties_count: 0,
  },
  next_actions: [],
  smart_insights: [],
  admin_action_center: {
    is_visible: false,
    pending_approvals: 0,
    pending_join_requests: 0,
    pending_expenses: 0,
    pending_withdrawals: 0,
    overdue_contributions: 0,
    overdue_loans: 0,
    pending_minutes_approval: 0,
    open_issues: 0,
    failed_payouts: 0,
    items: [],
  },
  compliance: {
    member_reliability_score: 0,
    pending_contributions: 0,
    unpaid_penalties: 0,
    overdue_loans: 0,
    contribution_completion_rate: 0,
  },
  role_workspaces: [],
};

export const SmartDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { activeChama, activeChamaId } = useActiveChama();
  const [overview, setOverview] = useState<DashboardOverview>(initialOverview);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreCards = useMemo(
    () => [
      {
        key: 'health',
        label: 'Chama health',
        value: `${overview.scores.chama_health}/100`,
        tint: colors.primary[700],
        icon: 'heart-pulse',
      },
      {
        key: 'liquidity',
        label: 'Liquidity',
        value: `${overview.scores.liquidity_health}/100`,
        tint: colors.success,
        icon: 'water-outline',
      },
      {
        key: 'reliability',
        label: 'Reliability',
        value: `${overview.scores.member_reliability}/100`,
        tint: colors.info,
        icon: 'shield-check-outline',
      },
      {
        key: 'risk',
        label: 'Default risk',
        value: `${overview.scores.default_risk}/100`,
        tint: colors.warning,
        icon: 'alert-outline',
      },
    ],
    [overview.scores]
  );

  const loadOverview = async () => {
    setError(null);
    try {
      const data = await appService.getDashboardOverview(activeChamaId || undefined);
      setOverview(data);
    } catch {
      setError('We could not load smart insights right now.');
      setOverview(initialOverview);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [activeChamaId]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadOverview();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading smart insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeChama) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="account-group-outline" size={56} color={colors.neutral[400]} />}
          title="Pick a chama first"
          description="Select an active chama to see health signals, insights, and next actions."
          action={
            <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Chamas')}>
              <Text style={styles.primaryActionText}>Open Chamas</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="chart-line-variant" size={56} color={colors.neutral[400]} />}
          title="Smart dashboard unavailable"
          description={error}
          action={
            <TouchableOpacity style={styles.primaryAction} onPress={() => void loadOverview()}>
              <Text style={styles.primaryActionText}>Retry</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.heroCard}>
          <Text style={styles.eyebrow}>{activeChama.name}</Text>
          <Text style={styles.heroTitle}>
            {overview.smart_summary.headline || 'Smart insights for your chama'}
          </Text>
          <Text style={styles.heroText}>
            {overview.smart_summary.plain_language ||
              'Use this view to quickly understand health, liquidity, risk, and the actions that need attention.'}
          </Text>
        </Card>

        <View style={styles.scoreGrid}>
          {scoreCards.map((card) => (
            <Card key={card.key} style={styles.scoreCard}>
              <View style={[styles.scoreIcon, { backgroundColor: `${card.tint}15` }]}>
                <Icon name={card.icon as any} size={20} color={card.tint} />
              </View>
              <Text style={styles.scoreValue}>{card.value}</Text>
              <Text style={styles.scoreLabel}>{card.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Financial pulse</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatCurrency(overview.totals.total_savings || '0', activeChama.currency || 'KES')}
              </Text>
              <Text style={styles.summaryLabel}>Total savings</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatCurrency(overview.totals.chama_balance || '0', activeChama.currency || 'KES')}
              </Text>
              <Text style={styles.summaryLabel}>Ledger balance</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{overview.admin_action_center.overdue_contributions}</Text>
              <Text style={styles.summaryLabel}>Overdue contributions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{overview.admin_action_center.overdue_loans}</Text>
              <Text style={styles.summaryLabel}>Overdue loans</Text>
            </View>
          </View>
        </Card>

        {overview.smart_insights.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Smart insights</Text>
            {overview.smart_insights.slice(0, 4).map((insight) => (
              <View key={insight.id} style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="lightbulb-on-outline" size={18} color={colors.primary[700]} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoTitle}>{insight.title}</Text>
                  <Text style={styles.infoDescription}>{insight.message}</Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {overview.next_actions.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recommended next actions</Text>
            {overview.next_actions.slice(0, 4).map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                activeOpacity={0.85}
                onPress={() => {
                  if (action.action?.route) {
                    navigation.navigate(action.action.route, action.action.params || {});
                  }
                }}
              >
                <View style={styles.infoCopy}>
                  <Text style={styles.infoTitle}>{action.title}</Text>
                  <Text style={styles.infoDescription}>{action.description}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            ))}
          </Card>
        ) : null}

        {overview.recent_transactions.length > 0 ? (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            </View>
            {overview.recent_transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionCopy}>
                  <Text style={styles.infoTitle}>{transaction.description}</Text>
                  <Text style={styles.infoDescription}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.transactionAmount}>
                  {formatCurrency(transaction.amount || '0', activeChama.currency || 'KES')}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[600],
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[2],
  },
  heroTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  heroText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 22,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  scoreCard: {
    width: '48%',
    minWidth: 0,
  },
  scoreIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  scoreValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  scoreLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
  },
  sectionCard: {
    borderRadius: borderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  transactionCopy: {
    flex: 1,
    marginRight: spacing[3],
  },
  transactionAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  linkText: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
  },
  primaryAction: {
    marginTop: spacing[2],
    alignSelf: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  primaryActionText: {
    color: colors.light.background,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default SmartDashboardScreen;
