import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { financeService } from '@/services/financeService';
import { investmentService } from '@/services/investmentService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  ContributionGoal,
  InvestmentDistribution,
  InvestmentOverview,
  InvestmentRecord,
} from '@/types';
import { formatCurrency, formatDate, formatStatus } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'GoalsInvestments'>;
type RoutePropType = RouteProp<MainStackParamList, 'GoalsInvestments'>;

const progressWidth = (current: string, target: string): `${number}%` => {
  const currentValue = Number(current || 0);
  const targetValue = Number(target || 0);

  if (!targetValue) {
    return '0%';
  }

  return `${Math.min(100, Math.max(0, (currentValue / targetValue) * 100))}%`;
};

export const GoalsInvestmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const routeChamaId = route.params?.chamaId;
  const {
    activeChama,
    activeChamaId,
    availableChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const currency = activeChama?.currency || 'KES';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<ContributionGoal[]>([]);
  const [overview, setOverview] = useState<InvestmentOverview | null>(null);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [distributions, setDistributions] = useState<InvestmentDistribution[]>([]);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');

  const loadData = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [goalRows, overviewRow, investmentRows, distributionRows] = await Promise.all([
        financeService.getContributionGoals(chamaId).catch(() => []),
        investmentService.getOverview(chamaId).catch(() => null),
        investmentService.getInvestments(chamaId).catch(() => []),
        investmentService.getDistributions(chamaId).catch(() => []),
      ]);

      setGoals(goalRows);
      setOverview(overviewRow);
      setInvestments(investmentRows);
      setDistributions(distributionRows);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load goals and investments.')
          : 'Unable to load goals and investments.';
      setError(message);
      setGoals([]);
      setOverview(null);
      setInvestments([]);
      setDistributions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [chamaId, isLoadingChamaContext]);

  const summary = useMemo(
    () => ({
      activeGoals: goals.filter((goal) => goal.is_active).length,
      fundedGoals: goals.filter((goal) => Number(goal.current_amount || 0) >= Number(goal.target_amount || 0)).length,
      totalGoalTarget: goals.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0),
    }),
    [goals]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateGoal = async () => {
    if (!chamaId || !goalTitle.trim() || !goalTargetAmount.trim()) {
      setError('Goal title and target amount are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await financeService.createContributionGoal(chamaId, {
        title: goalTitle.trim(),
        target_amount: goalTargetAmount.trim(),
        due_date: goalDueDate.trim() || undefined,
      });
      setGoalTitle('');
      setGoalTargetAmount('');
      setGoalDueDate('');
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to create this goal.')
          : 'Unable to create this goal.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading goals and investments</Text>
          <Text style={styles.centerText}>Pulling savings targets, investment positions, and recent distributions.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Goals and investment tracking run inside a single chama context."
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Goals & Investments</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          onSelectChama={(id) => {
            void switchChama(id);
          }}
          helperText={switchError || null}
        />

        <Card style={styles.heroCard}>
          <View style={styles.cardHeader}>
            <Icon name="target" size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Targeted saving and investment visibility</Text>
          </View>
          <Text style={styles.bodyText}>
            Create member savings goals, track live investment exposure, and keep dividend or profit distributions visible from the same finance surface.
          </Text>
        </Card>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.activeGoals}</Text>
            <Text style={styles.summaryLabel}>Active Goals</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{investments.length}</Text>
            <Text style={styles.summaryLabel}>Investments</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatCurrency(overview?.total_returns || '0', currency)}
            </Text>
            <Text style={styles.summaryLabel}>Returns</Text>
          </Card>
        </View>

        {error ? (
          <EmptyState
            title="Goals data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadData()} />}
            style={styles.inlineState}
          />
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Create Savings Goal</Text>
          <Text style={styles.sectionDescription}>
            Use real contribution goals so progress can later feed reminders, analytics, and member dashboards.
          </Text>

          <TextInput
            style={styles.input}
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder="Emergency buffer, school fees, land purchase..."
            placeholderTextColor={colors.neutral[400]}
          />
          <TextInput
            style={styles.input}
            value={goalTargetAmount}
            onChangeText={setGoalTargetAmount}
            placeholder="Target amount"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.neutral[400]}
          />
          <TextInput
            style={styles.input}
            value={goalDueDate}
            onChangeText={setGoalDueDate}
            placeholder="Due date YYYY-MM-DD"
            placeholderTextColor={colors.neutral[400]}
          />
          <Button title="Create Goal" onPress={() => void handleCreateGoal()} loading={submitting} />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <Text style={styles.sectionCaption}>
              {formatCurrency(summary.totalGoalTarget.toString(), currency)} targeted
            </Text>
          </View>

          {goals.length ? (
            goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalStatus}>{formatStatus(goal.status)}</Text>
                </View>
                <Text style={styles.goalAmount}>
                  {formatCurrency(goal.current_amount, currency)} of {formatCurrency(goal.target_amount, currency)}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: progressWidth(goal.current_amount, goal.target_amount) }]} />
                </View>
                <Text style={styles.goalMeta}>
                  {goal.due_date ? `Due ${formatDate(goal.due_date)}` : 'No due date set'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No contribution goals are recorded yet for this chama.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Investment Portfolio</Text>
            <Text style={styles.sectionCaption}>
              {formatCurrency(overview?.current_valuation || '0', currency)} current value
            </Text>
          </View>

          {investments.length ? (
            investments.map((investment) => (
              <View key={investment.id} style={styles.investmentCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{investment.name}</Text>
                  <Text style={styles.goalStatus}>{investment.status_display || formatStatus(investment.status)}</Text>
                </View>
                <Text style={styles.goalMeta}>
                  {(investment.investment_type_display || formatStatus(investment.investment_type))}{investment.institution ? ` · ${investment.institution}` : ''}
                </Text>
                <Text style={styles.goalAmount}>
                  {formatCurrency(investment.current_value, currency)} current · {formatCurrency(investment.principal_amount, currency)} principal
                </Text>
                <Text style={styles.goalMeta}>
                  Started {formatDate(investment.start_date)}
                  {investment.maturity_date ? ` · matures ${formatDate(investment.maturity_date)}` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No investment projects are recorded for this chama yet.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Distribution History</Text>
            <Text style={styles.sectionCaption}>{distributions.length} recent</Text>
          </View>

          {distributions.length ? (
            distributions.slice(0, 5).map((distribution) => (
              <View key={distribution.id} style={styles.listRow}>
                <View style={styles.listContent}>
                  <Text style={styles.goalTitle}>
                    {formatCurrency(distribution.total_amount, currency)} distributed
                  </Text>
                  <Text style={styles.goalMeta}>
                    {formatDate(distribution.distribution_date)} · {formatStatus(distribution.method)}
                  </Text>
                </View>
                <Text style={styles.goalStatus}>{formatStatus(distribution.status)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No dividends or profit distributions have been recorded yet.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: spacing[2],
  },
  bodyText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  cardTitle: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  centerTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    marginTop: spacing[4],
  },
  container: {
    backgroundColor: colors.light.background,
    flex: 1,
  },
  emptyCopy: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
  },
  goalAmount: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  goalCard: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  goalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  goalStatus: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
  goalTitle: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.neutral[200],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerRight: {
    width: 40,
  },
  heroCard: {
    marginTop: spacing[4],
  },
  inlineState: {
    marginTop: spacing[4],
  },
  input: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  investmentCard: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  listContent: {
    flex: 1,
    gap: spacing[1],
  },
  listRow: {
    alignItems: 'center',
    borderTopColor: colors.neutral[100],
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[3],
  },
  progressFill: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  progressTrack: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    height: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionCaption: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  sectionCard: {
    marginTop: spacing[4],
  },
  sectionDescription: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing[2],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
    paddingVertical: spacing[4],
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  summaryValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  title: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
  },
});
