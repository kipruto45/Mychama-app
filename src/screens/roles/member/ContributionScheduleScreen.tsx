import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import {
  memberContributionService,
  type MemberContributionScheduleItem,
} from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  getContributionTypeColor,
  getContributionTypeIcon,
} from './contributionWorkflowShared';

type ContributionScheduleNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionSchedule'
>;
type ContributionScheduleRouteProp = RouteProp<MainStackParamList, 'ContributionSchedule'>;

const getStatusMeta = (status: MemberContributionScheduleItem['status']) => {
  switch (status) {
    case 'paid':
      return { label: 'Paid', variant: 'success' as const, tint: colors.success };
    case 'overdue':
      return { label: 'Overdue', variant: 'error' as const, tint: colors.error };
    case 'due':
      return { label: 'Due', variant: 'warning' as const, tint: colors.warning };
    default:
      return { label: 'Upcoming', variant: 'info' as const, tint: colors.primary[500] };
  }
};

export const ContributionScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ContributionScheduleNavigationProp>();
  const route = useRoute<ContributionScheduleRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId;

  const [schedule, setSchedule] = useState<MemberContributionScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
        setSchedule([]);
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
        const response = await memberContributionService.getContributionSchedule(
          chamaId
        );
        setSchedule(response);
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' &&
          serviceError &&
          'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(
          message || 'We couldn’t load your schedule right now. Please try again.'
        );
        setSchedule([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [chamaId]
  );

  useEffect(() => {
    setLastVisitedRoute('ContributionSchedule');
    void loadSchedule();
  }, [loadSchedule, setLastVisitedRoute]);

  const openMakeContribution = (item: MemberContributionScheduleItem) => {
    if (item.status !== 'paid') {
      navigateToWorkspaceTab(navigation as any, 'Payments', {
        chamaId: chamaId || undefined,
        entryPoint: 'contributions',
        preselectedPurpose: 'contribution',
        contributionTypeId: item.contribution_type_id,
        contributionTypeName: item.contribution_type_name,
        amount: item.remaining_amount,
        dueDate: item.due_date,
      });
    }
  };

  const currency = activeChama?.currency || 'KES';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution Schedule" subtitle={activeChama?.name} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerStateText}>Loading your schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution Schedule" subtitle="Choose a chama" />
        <EmptyState
          title="No chama selected"
          description="Open a chama workspace first to view your schedule."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution Schedule" subtitle={activeChama?.name} />
        <EmptyState
          title="Unable to load schedule"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
        <Button title="Try again" onPress={() => void loadSchedule()} style={styles.retryButton} />
      </SafeAreaView>
    );
  }

  const renderScheduleItem = ({ item }: { item: MemberContributionScheduleItem }) => {
    const statusMeta = getStatusMeta(item.status);
    const typeColor = getContributionTypeColor(item.contribution_type_name);
    const typeIcon = getContributionTypeIcon(item.contribution_type_name);

    return (
      <View style={styles.scheduleItem}>
        <View style={styles.scheduleItemLeft}>
          <View style={[styles.scheduleItemIcon, { backgroundColor: `${typeColor}18` }]}>
            <Icon name={typeIcon as any} size={20} color={typeColor} />
          </View>
          <View style={styles.scheduleItemContent}>
            <View style={styles.scheduleItemRow}>
              <Text style={styles.scheduleItemTitle}>{item.cycle_label}</Text>
              <Badge
                label={statusMeta.label}
                variant={statusMeta.variant}
                size="sm"
              />
            </View>
            <Text style={styles.scheduleItemType}>{item.contribution_type_name}</Text>
            <Text style={styles.scheduleItemDue}>
              Due {formatDate(item.due_date)}
            </Text>
            <View style={styles.scheduleItemAmountRow}>
              <View style={styles.scheduleItemAmountBlock}>
                <Text style={styles.scheduleItemAmountLabel}>Expected</Text>
                <Text style={styles.scheduleItemAmountValue}>
                  {formatCurrency(item.expected_amount, currency)}
                </Text>
              </View>
              <View style={styles.scheduleItemAmountBlock}>
                <Text style={styles.scheduleItemAmountLabel}>Paid</Text>
                <Text style={styles.scheduleItemAmountValue}>
                  {formatCurrency(item.paid_amount, currency)}
                </Text>
              </View>
              <View style={styles.scheduleItemAmountBlock}>
                <Text style={styles.scheduleItemAmountLabel}>Remaining</Text>
                <Text style={[styles.scheduleItemAmountValue, styles.remainingAmount]}>
                  {formatCurrency(item.remaining_amount, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {item.status !== 'paid' && (
          <Button
            title="Pay now"
            variant="secondary"
            size="sm"
            onPress={() => openMakeContribution(item)}
            style={styles.payNowButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Contribution Schedule" subtitle={activeChama?.name} />

      {schedule.length === 0 ? (
        <EmptyState
          title="No scheduled contributions"
          description="Your chama has not yet set up a contribution schedule."
          icon="calendar-blank-outline"
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item) => item.id}
          renderItem={renderScheduleItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Need a reminder before the next due date?</Text>
              <Text style={styles.headerText}>
                Open alerts to review due, overdue, and penalty reminders without leaving the contribution workflow.
              </Text>
              <Button
                title="Open alerts"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate('ContributionAlerts', { chamaId })}
              />
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadSchedule(true)}
              tintColor={colors.primary[500]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
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
  retryButton: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  headerCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#DDEDD9',
    backgroundColor: '#F4FAF6',
    padding: spacing[4],
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  scheduleItem: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing[3],
  },
  scheduleItemLeft: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  scheduleItemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleItemContent: {
    flex: 1,
    gap: spacing[1],
  },
  scheduleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleItemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  scheduleItemType: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  scheduleItemDue: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
  },
  scheduleItemAmountRow: {
    flexDirection: 'row',
    marginTop: spacing[2],
    gap: spacing[4],
  },
  scheduleItemAmountBlock: {
    gap: 2,
  },
  scheduleItemAmountLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
  },
  scheduleItemAmountValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  remainingAmount: {
    color: colors.warning,
  },
  payNowButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    minHeight: 200,
  },
});

export default ContributionScheduleScreen;
