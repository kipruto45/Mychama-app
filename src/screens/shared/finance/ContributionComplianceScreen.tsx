import React, { useEffect, useMemo, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess } from '@/rbac';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { Chama, Contribution, ContributionType, MemberComplianceSummary, Membership, Penalty } from '@/types';
import { buildComplianceSummaries } from '@/utils/compliance';
import { formatCurrency, formatDate } from '@/utils/format';

type ContributionComplianceScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionCompliance'
>;
type ContributionComplianceScreenRouteProp = RouteProp<MainStackParamList, 'ContributionCompliance'>;

type ComplianceFilter = 'all' | 'paid' | 'in_grace' | 'missed' | 'at_risk';

const FILTERS: Array<{ key: ComplianceFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'in_grace', label: 'Grace' },
  { key: 'missed', label: 'Missed' },
  { key: 'at_risk', label: 'At Risk' },
];

const getScoreTone = (score: number) => {
  if (score >= 80) return colors.success;
  if (score >= 55) return colors.warning;
  return colors.error;
};

const getStatusVariant = (status: MemberComplianceSummary['current_status']) => {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'in_grace':
      return 'info' as const;
    default:
      return 'error' as const;
  }
};

export const ContributionComplianceScreen: React.FC = () => {
  const navigation = useNavigation<ContributionComplianceScreenNavigationProp>();
  const route = useRoute<ContributionComplianceScreenRouteProp>();
  const routeChamaId = route.params?.chamaId;
  const { activeChama, activeChamaId, isLoading: isLoadingChamaContext } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const canIssuePenalty = useCanPerformAction(Permission.CAN_ISSUE_PENALTY, chamaId || undefined);

  const [chama, setChama] = useState<Chama | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ComplianceFilter>(route.params?.filter || 'all');
  const currency = chama?.currency || activeChama?.currency || 'KES';

  const loadComplianceData = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [chamaRow, memberRows, typeRows, contributionRows, penaltyRows] = await Promise.all([
        chamaService.getChama(chamaId).catch(() => null),
        chamaService.getMembers(chamaId).catch(() => []),
        financeService.getContributionTypes(chamaId).catch(() => []),
        financeService.getContributions(chamaId).catch(() => []),
        financeService.getPenalties(chamaId).catch(() => []),
      ]);

      setChama(chamaRow);
      setMembers(memberRows);
      setContributionTypes(typeRows);
      setContributions(contributionRows);
      setPenalties(penaltyRows);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load compliance data.')
          : 'Unable to load compliance data.';
      setError(message);
      setChama(null);
      setMembers([]);
      setContributionTypes([]);
      setContributions([]);
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplianceData();
  }, [chamaId, isLoadingChamaContext]);

  useEffect(() => {
    setFilter(route.params?.filter || 'all');
  }, [route.params?.filter]);

  const summaries = useMemo(
    () =>
      chamaId
        ? buildComplianceSummaries({
            chamaId,
            chama,
            members,
            contributionTypes,
            contributions,
            penalties,
          })
        : [],
    [chamaId, chama, members, contributionTypes, contributions, penalties]
  );

  const usingLivePolicy = Boolean(chama?.contribution_setup);

  const filteredSummaries = useMemo(() => {
    if (filter === 'all') {
      return summaries;
    }

    if (filter === 'at_risk') {
      return summaries.filter(
        (row) => row.current_status !== 'missed' && row.compliance_score >= 55 && row.compliance_score < 80
      );
    }

    return summaries.filter((row) => row.current_status === filter);
  }, [filter, summaries]);

  const overview = useMemo(() => {
    const totalSuggestedFines = summaries.reduce(
      (sum, row) => sum + Number(row.suggested_fine_amount || 0),
      0
    );

    return {
      compliant: summaries.filter((row) => row.compliance_score >= 80).length,
      atRisk: summaries.filter((row) => row.compliance_score >= 55 && row.compliance_score < 80).length,
      overdue: summaries.filter((row) => row.current_status === 'missed').length,
      totalSuggestedFines,
    };
  }, [summaries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <RequireRouteAccess route="ContributionCompliance" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading contribution compliance</Text>
          <Text style={styles.centerText}>Calculating who paid, who missed, and who needs follow-up.</Text>
        </View>
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  if (!chamaId) {
    return (
      <RequireRouteAccess route="ContributionCompliance" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Compliance signals are calculated inside the active chama context."
          style={styles.centerState}
        />
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  return (
    <RequireRouteAccess route="ContributionCompliance" chamaId={chamaId || undefined}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Compliance</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Icon name="shield-check-outline" size={22} color={colors.primary[500]} />
            <Text style={styles.guidanceTitle}>Contribution discipline engine</Text>
          </View>
          <Text style={styles.guidanceText}>
            This screen scores members from recent contribution behavior, missed cycles, pending fines,
            and current-period payment status so admins can intervene early.
          </Text>
          <View style={styles.policyBanner}>
            <Badge
              label={usingLivePolicy ? 'Live chama policy' : 'Fallback defaults'}
              variant={usingLivePolicy ? 'success' : 'warning'}
              size="sm"
            />
            <Text style={styles.policyBannerText}>
              {usingLivePolicy
                ? `Using due day ${chama?.contribution_setup?.due_day}, ${chama?.contribution_setup?.grace_period_days} grace days, and ${formatCurrency(
                    chama?.contribution_setup?.late_fine_amount || '0',
                    currency
                  )} late fine from this chama's contribution setup.`
                : 'This chama detail did not include contribution setup, so temporary defaults are still being used.'}
            </Text>
          </View>
        </Card>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('paid')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Compliant</Text>
            <Text style={styles.summaryValue}>{overview.compliant}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('at_risk')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>At Risk</Text>
            <Text style={styles.summaryValue}>{overview.atRisk}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('missed')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Missed</Text>
            <Text style={styles.summaryValue}>{overview.overdue}</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.finesCard}>
          <Text style={styles.finesTitle}>Auto-fine recommendations</Text>
          <Text style={styles.finesAmount}>{formatCurrency(overview.totalSuggestedFines.toFixed(2), currency)}</Text>
          <Text style={styles.finesText}>
            {usingLivePolicy
              ? 'Suggested fines now use the chama contribution setup before falling back to temporary defaults.'
              : 'Suggested fines are still using temporary defaults because this chama detail did not include contribution setup fields.'}
          </Text>
        </Card>

        {error ? (
          <EmptyState
            title="Compliance data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadComplianceData()} />}
            style={styles.inlineState}
          />
        ) : filteredSummaries.length > 0 ? (
          filteredSummaries.map((summary) => (
            <Card key={summary.member_id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberMeta}>
                  <Text style={styles.memberName}>{summary.member_name}</Text>
                  <Text style={styles.memberSubtext}>
                    Last paid {summary.last_paid_at ? formatDate(summary.last_paid_at) : 'never'}
                  </Text>
                </View>
                <Badge
                  label={summary.current_status.replace(/_/g, ' ')}
                  variant={getStatusVariant(summary.current_status)}
                  size="sm"
                />
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Compliance</Text>
                  <Text style={[styles.scoreValue, { color: getScoreTone(summary.compliance_score) }]}>
                    {summary.compliance_score}
                  </Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Risk</Text>
                  <Text style={[styles.scoreValue, { color: getScoreTone(100 - summary.risk_score) }]}>
                    {summary.risk_score}
                  </Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Streak</Text>
                  <Text style={styles.scoreValue}>{summary.contribution_streak}</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricText}>
                  Paid this cycle: {formatCurrency(summary.paid_amount, currency)}
                </Text>
                <Text style={styles.metricText}>
                  Expected: {formatCurrency(summary.expected_amount, currency)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricText}>Missed cycles: {summary.missed_cycles}</Text>
                <Text style={styles.metricText}>Pending fines: {summary.pending_penalties}</Text>
              </View>
              {summary.grace_deadline && summary.current_status === 'in_grace' ? (
                <Text style={styles.graceText}>Grace deadline: {formatDate(summary.grace_deadline)}</Text>
              ) : null}

              {Number(summary.suggested_fine_amount) > 0 ? (
                <View style={styles.recommendationBox}>
                  <View style={styles.recommendationHeader}>
                    <Icon name="alert-decagram-outline" size={16} color={colors.warning} />
                    <Text style={styles.recommendationTitle}>Suggested late-contribution fine</Text>
                  </View>
                  <Text style={styles.recommendationAmount}>
                    {formatCurrency(summary.suggested_fine_amount, currency)}
                  </Text>
                  {canIssuePenalty ? (
                    <Button
                      title="Issue Fine"
                      variant="outline"
                      onPress={() =>
                        navigation.navigate('Penalties', {
                          chamaId,
                          memberId: summary.member_id,
                          suggestedAmount: summary.suggested_fine_amount,
                          reason: 'Late contribution fine',
                        })
                      }
                    />
                  ) : null}
                </View>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            title="No compliance data yet"
            description="Add members and contribution activity first, then compliance scoring will appear here."
            style={styles.inlineState}
          />
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  guidanceCard: {
    marginBottom: spacing[4],
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  guidanceTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  guidanceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  policyBanner: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    gap: spacing[2],
  },
  policyBannerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryCardTouch: {
    flex: 1,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  filterLabelActive: {
    color: colors.light.background,
  },
  finesCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.accent[50],
  },
  finesTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.accent[700],
  },
  finesAmount: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  finesText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  memberCard: {
    marginBottom: spacing[3],
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  memberMeta: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  memberSubtext: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  scoreBlock: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
  },
  scoreLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  scoreValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  metricText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  graceText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.info,
  },
  recommendationBox: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warning + '14',
    gap: spacing[2],
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  recommendationTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  recommendationAmount: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerTitle: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  centerText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  inlineState: {
    marginTop: spacing[6],
  },
});
