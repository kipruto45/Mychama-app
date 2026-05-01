import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { type MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import {
  memberContributionService,
  type MemberContributionObligation,
  type MemberContributionPenaltyPreview,
  type MemberContributionWorkspace,
} from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { getContributionTypeIcon, getObligationStateMeta } from './contributionWorkflowShared';

type ContributionAlertsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionAlerts'
>;
type ContributionAlertsRouteProp = RouteProp<MainStackParamList, 'ContributionAlerts'>;

const getAlertTone = (state: MemberContributionObligation['state']) => {
  if (state === 'overdue') {
    return {
      tint: colors.error,
      background: '#FFF4F2',
      title: 'Overdue contribution',
    };
  }

  if (state === 'due' || state === 'partially_paid') {
    return {
      tint: colors.warning,
      background: '#FFF9EE',
      title: 'Due now',
    };
  }

  return {
    tint: colors.primary[600],
    background: '#F4FAF6',
    title: 'Upcoming contribution',
  };
};

export const ContributionAlertsScreen: React.FC = () => {
  const navigation = useNavigation<ContributionAlertsNavigationProp>();
  const route = useRoute<ContributionAlertsRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId;

  const [workspace, setWorkspace] = useState<MemberContributionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
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
        const response = await memberContributionService.getWorkspace(chamaId);
        setWorkspace(response);
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your contribution reminders right now. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [chamaId]
  );

  useEffect(() => {
    setLastVisitedRoute('ContributionAlerts');
    void loadWorkspace();
  }, [loadWorkspace, setLastVisitedRoute]);

  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';
  const urgentObligations = useMemo(
    () =>
      (workspace?.obligations || []).filter((item) =>
        ['overdue', 'due', 'partially_paid', 'upcoming'].includes(item.state)
      ),
    [workspace]
  );
  const outstandingPenalties = useMemo(
    () =>
      (workspace?.penalties.items || []).filter(
        (item) => Number(item.outstanding_amount || item.amount || 0) > 0
      ),
    [workspace]
  );

  const openContribution = (obligation: MemberContributionObligation) => {
    navigateToWorkspaceTab(navigation as any, 'Payments', {
      chamaId: chamaId || undefined,
      entryPoint: 'alerts',
      preselectedPurpose: 'contribution',
      contributionTypeId: obligation.contribution_type_id,
      contributionTypeName: obligation.contribution_type_name,
      amount: obligation.remaining_amount || obligation.required_amount,
      dueDate: obligation.due_date || undefined,
    });
  };

  const openPenalty = (penalty: MemberContributionPenaltyPreview) => {
    navigateToWorkspaceTab(navigation as any, 'Payments', {
      chamaId: chamaId || undefined,
      entryPoint: 'alerts',
      preselectedPurpose: 'fine_payment',
      contributionTypeName: 'Fine / Penalty',
      amount: penalty.outstanding_amount || penalty.amount,
      dueDate: penalty.due_date,
      penaltyId: penalty.id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Alerts & reminders" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your reminders…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Alerts & reminders" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so contribution reminders can load correctly."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Alerts & reminders" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Alerts unavailable"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  const hasAlerts = urgentObligations.length > 0 || outstandingPenalties.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Alerts & reminders" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadWorkspace(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroEyebrow}>Contribution alerts</Text>
              <Text style={styles.heroTitle}>
                {hasAlerts ? 'Stay ahead of upcoming dues.' : 'You are up to date.'}
              </Text>
              <Text style={styles.heroText}>
                {hasAlerts
                  ? 'Open the right payment step directly from each reminder.'
                  : 'We will surface upcoming contribution reminders here before they become urgent.'}
              </Text>
            </View>
            <Icon name="bell-ring-outline" size={28} color={colors.primary[600]} />
          </View>
          <View style={styles.heroActions}>
            <Button
              title="Open contributions"
              onPress={() =>
                navigation.navigate('MemberContributions', {
                  chamaId,
                  entryPoint: 'alerts',
                })
              }
            />
            <Button
              title="Notifications"
              variant="outline"
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </Card>

        {!hasAlerts ? (
          <EmptyState
            title="No reminders right now"
            description="Upcoming dues, overdue contributions, and penalty reminders will appear here."
            icon="check-decagram"
          />
        ) : null}

        {urgentObligations.map((obligation) => {
          const stateMeta = getObligationStateMeta(obligation.state);
          const tone = getAlertTone(obligation.state);
          return (
            <Card
              key={obligation.contribution_type_id}
              style={[styles.alertCard, { backgroundColor: tone.background }]}
            >
              <View style={styles.alertHeader}>
                <View style={[styles.alertIcon, { backgroundColor: `${tone.tint}16` }]}>
                  <Icon
                    name={getContributionTypeIcon(obligation.contribution_type_name) as never}
                    size={20}
                    color={tone.tint}
                  />
                </View>
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>{tone.title}</Text>
                  <Text style={styles.alertSubtitle}>{obligation.contribution_type_name}</Text>
                </View>
                <Badge label={stateMeta.label} variant={stateMeta.variant} size="sm" />
              </View>
              <Text style={styles.alertBody}>
                {obligation.state === 'partially_paid'
                  ? `You still have ${formatCurrency(obligation.remaining_amount, currency)} left for this cycle.`
                  : `Amount due ${formatCurrency(obligation.remaining_amount || obligation.required_amount, currency)} by ${obligation.due_date ? formatDate(obligation.due_date) : 'the published due date'}.`}
              </Text>
              <Button title="Make contribution" size="sm" onPress={() => openContribution(obligation)} />
            </Card>
          );
        })}

        {outstandingPenalties.map((penalty) => (
          <Card key={penalty.id} style={[styles.alertCard, styles.penaltyCard]}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertIcon, { backgroundColor: `${colors.error}14` }]}>
                <Icon name="gavel" size={20} color={colors.error} />
              </View>
              <View style={styles.alertCopy}>
                <Text style={styles.alertTitle}>Penalty reminder</Text>
                <Text style={styles.alertSubtitle}>{penalty.reason || penalty.issued_reason}</Text>
              </View>
              <Badge label="Outstanding" variant="error" size="sm" />
            </View>
            <Text style={styles.alertBody}>
              {formatCurrency(penalty.outstanding_amount || penalty.amount, currency)} due by{' '}
              {formatDate(penalty.due_date)}.
            </Text>
            <View style={styles.inlineActions}>
              <Button title="Pay penalty" size="sm" onPress={() => openPenalty(penalty)} />
              <Button
                title="View penalties"
                size="sm"
                variant="outline"
                onPress={() => navigation.navigate('Penalties', { chamaId })}
              />
            </View>
          </Card>
        ))}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  heroCard: {
    gap: spacing[4],
    backgroundColor: '#F4FAF6',
    borderWidth: 1,
    borderColor: '#DDEDD9',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.medium,
  },
  heroTitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroText: {
    marginTop: spacing[2],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  heroActions: {
    gap: spacing[3],
  },
  alertCard: {
    gap: spacing[3],
  },
  penaltyCard: {
    borderWidth: 1,
    borderColor: '#F3D3CF',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: {
    flex: 1,
    gap: spacing[1],
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  alertSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  alertBody: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  inlineActions: {
    gap: spacing[2],
  },
});

export default ContributionAlertsScreen;
