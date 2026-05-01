import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { automationService } from '@/services/automationService';
import { AutomationHub, AutomationQueueItem } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type AutomationCenterNavigationProp = NativeStackNavigationProp<MainStackParamList, 'AutomationCenter'>;

const emptyHub: AutomationHub = {
  scope: {
    chama_id: null,
    chama_name: null,
    active_chamas: 0,
    is_admin_scope: false,
  },
  summary: {
    my_due_contributions: 0,
    my_overdue_loans: 0,
    meetings_next_24h: 0,
    unread_notifications: 0,
    pending_membership_approvals: 0,
    pending_finance_approvals: 0,
    failed_deliveries: 0,
    jobs_needing_attention: 0,
  },
  channel_status: {
    in_app_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    quiet_hours_start: '21:00:00',
    quiet_hours_end: '07:00:00',
    active_devices: 0,
  },
  job_health: {
    enabled_jobs: 0,
    recent_failures: 0,
    stale_jobs: 0,
    recent_runs: [],
  },
  queue: [],
  recommendations: [],
  rules: [],
};

export const AutomationCenterScreen: React.FC = () => {
  const navigation = useNavigation<AutomationCenterNavigationProp>();
  const route = useRoute<any>();
  const routeChamaId = route.params?.chamaId as string | undefined;
  const {
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hub, setHub] = useState<AutomationHub>(emptyHub);

  const scopedChamaId = routeChamaId || activeChamaId || undefined;

  const loadHub = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setError(null);
    try {
      const response = await automationService.getAutomationHub(scopedChamaId);
      setHub(response);
    } catch {
      setError('We could not load automation status right now.');
      setHub(emptyHub);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHub();
  }, [scopedChamaId, isLoadingChamaContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHub();
    setRefreshing(false);
  };

  const openAction = (item?: AutomationQueueItem | null) => {
    const routeName = item?.action?.route;
    if (!routeName) {
      return;
    }
    (navigation as any).navigate(routeName, item?.action?.params || {});
  };

  const getSeverityColor = (severity: AutomationQueueItem['severity']) => {
    switch (severity) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'critical':
        return colors.error;
      default:
        return colors.info;
    }
  };

  const renderQueueList = (title: string, items: AutomationQueueItem[], emptyDescription: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.queueCard}
            onPress={() => openAction(item)}
            activeOpacity={0.88}
          >
            <View style={[styles.queueIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
            <View style={styles.queueBody}>
              <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>{item.title}</Text>
                {item.badge_count ? (
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueBadgeText}>{item.badge_count}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.queueDescription}>{item.description}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState
          title="Nothing urgent here"
          description={emptyDescription}
          style={styles.inlineEmptyState}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading automation center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="sync-alert" size={64} color={colors.neutral[400]} />}
          title="Could not load automation center"
          description={error}
          action={
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadHub()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          }
          style={styles.fullState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Automation Center</Text>
            <Text style={styles.title}>Smart reminders and operations</Text>
            <Text style={styles.subtitle}>
              {hub.scope.chama_name
                ? `${hub.scope.chama_name} automation status and recommended follow-up actions.`
                : 'Your automation queue, reminder state, and delivery health.'}
            </Text>
          </View>
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
                  if (route.params?.chamaId) {
                    navigation.setParams({ chamaId });
                  }
                  void loadHub();
                })
                .catch(() => undefined);
            }}
            helperText={switchError}
          />
        </View>

        <View style={styles.summaryGrid}>
          {[
            ['My Due Items', hub.summary.my_due_contributions + hub.summary.my_overdue_loans],
            ['Meetings <24h', hub.summary.meetings_next_24h],
            ['Unread Alerts', hub.summary.unread_notifications],
            ['Failed Deliveries', hub.summary.failed_deliveries],
            ['Pending Approvals', hub.summary.pending_membership_approvals + hub.summary.pending_finance_approvals],
            ['Job Attention', hub.summary.jobs_needing_attention],
          ].map(([label, value]) => (
            <View key={label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Channels</Text>
          <View style={styles.channelCard}>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>In-app</Text>
              <Text style={[styles.channelValue, hub.channel_status.in_app_enabled ? styles.channelEnabled : styles.channelDisabled]}>
                {hub.channel_status.in_app_enabled ? 'Enabled' : 'Off'}
              </Text>
            </View>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>Email</Text>
              <Text style={[styles.channelValue, hub.channel_status.email_enabled ? styles.channelEnabled : styles.channelDisabled]}>
                {hub.channel_status.email_enabled ? 'Enabled' : 'Off'}
              </Text>
            </View>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>SMS</Text>
              <Text style={[styles.channelValue, hub.channel_status.sms_enabled ? styles.channelEnabled : styles.channelDisabled]}>
                {hub.channel_status.sms_enabled ? 'Enabled' : 'Off'}
              </Text>
            </View>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>Active devices</Text>
              <Text style={styles.channelValue}>{hub.channel_status.active_devices}</Text>
            </View>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>Quiet hours</Text>
              <Text style={styles.channelValue}>
                {hub.channel_status.quiet_hours_start.slice(0, 5)} - {hub.channel_status.quiet_hours_end.slice(0, 5)}
              </Text>
            </View>
          </View>
        </View>

        {renderQueueList(
          'Smart Queue',
          hub.queue,
          'No urgent reminders, approvals, or delivery issues are waiting right now.'
        )}

        {renderQueueList(
          'Recommendations',
          hub.recommendations,
          'There are no extra automation recommendations at the moment.'
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Health</Text>
          <View style={styles.jobHealthCard}>
            <View style={styles.jobHealthStats}>
              <View style={styles.jobHealthChip}>
                <Text style={styles.jobHealthChipValue}>{hub.job_health.enabled_jobs}</Text>
                <Text style={styles.jobHealthChipLabel}>Enabled Jobs</Text>
              </View>
              <View style={styles.jobHealthChip}>
                <Text style={[styles.jobHealthChipValue, { color: colors.error }]}>{hub.job_health.recent_failures}</Text>
                <Text style={styles.jobHealthChipLabel}>Recent Failures</Text>
              </View>
              <View style={styles.jobHealthChip}>
                <Text style={[styles.jobHealthChipValue, { color: colors.warning }]}>{hub.job_health.stale_jobs}</Text>
                <Text style={styles.jobHealthChipLabel}>Stale Jobs</Text>
              </View>
            </View>
            {hub.job_health.recent_runs.length > 0 ? (
              hub.job_health.recent_runs.map((run) => (
                <View key={run.id} style={styles.runRow}>
                  <View style={styles.runBody}>
                    <Text style={styles.runTitle}>{run.job_name}</Text>
                    <Text style={styles.runMeta}>
                      {new Date(run.started_at).toLocaleString()} · {run.status}
                    </Text>
                    {run.error ? <Text style={styles.runError}>{run.error}</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>No recent job runs are available yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automation Rules</Text>
          {hub.rules.length > 0 ? (
            hub.rules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleTitle}>{rule.rule_type}</Text>
                  <Text style={[styles.ruleState, rule.is_enabled ? styles.channelEnabled : styles.channelDisabled]}>
                    {rule.is_enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Text style={styles.ruleConfig}>{Object.keys(rule.config || {}).length} config value(s)</Text>
              </View>
            ))
          ) : (
            <EmptyState
              title="No automation rules yet"
              description="As the chama adds more automation policies, they will appear here."
              style={styles.inlineEmptyState}
            />
          )}
        </View>
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
    paddingBottom: spacing[8],
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  fullState: {
    flex: 1,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  eyebrow: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: spacing[1],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 22,
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  metricValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  channelCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  channelValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  channelEnabled: {
    color: colors.success,
  },
  channelDisabled: {
    color: colors.error,
  },
  queueCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  queueIndicator: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: borderRadius.full,
    marginRight: spacing[3],
  },
  queueBody: {
    flex: 1,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  queueTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  queueDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  queueBadge: {
    minWidth: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  queueBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
  jobHealthCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  jobHealthStats: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  jobHealthChip: {
    flex: 1,
    backgroundColor: colors.light.background,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  jobHealthChipValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  jobHealthChipLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  runRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing[3],
    marginTop: spacing[3],
  },
  runBody: {
    gap: spacing[1],
  },
  runTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  runMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  runError: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  ruleCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  ruleTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  ruleState: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  ruleConfig: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  inlineEmptyState: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
  },
});
