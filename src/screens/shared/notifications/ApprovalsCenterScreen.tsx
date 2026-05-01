import React, { useEffect, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { appService } from '@/services/appService';
import { ApprovalCenter, ApprovalCenterItem } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

type ApprovalsCenterNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ApprovalsCenter'>;

const emptyState: ApprovalCenter = {
  scope: {
    active_chamas: 0,
    is_admin_scope: false,
    primary_chama_id: null,
    primary_chama_name: null,
  },
  summary: {
    pending_total: 0,
    join_requests: 0,
    invites: 0,
    loan_requests: 0,
    expense_requests: 0,
    withdrawal_requests: 0,
    approval_requests: 0,
    policy_changes: 0,
    role_changes: 0,
    disputes: 0,
    reconciliation_items: 0,
  },
  sections: [],
  recent_items: [],
};

export const ApprovalsCenterScreen: React.FC = () => {
  const navigation = useNavigation<ApprovalsCenterNavigationProp>();
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
  const [data, setData] = useState<ApprovalCenter>(emptyState);

  const scopedChamaId = routeChamaId || activeChamaId || undefined;

  const loadData = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setError(null);
    try {
      const response = await appService.getApprovalsCenter(scopedChamaId);
      setData(response);
    } catch {
      setError('We could not load pending approvals right now.');
      setData(emptyState);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [scopedChamaId, isLoadingChamaContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openItem = (item?: { action?: { route?: string | null; params?: Record<string, any> } | null } | null) => {
    const routeName = item?.action?.route;
    if (!routeName) {
      return;
    }
    (navigation as any).navigate(routeName, item?.action?.params || {});
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.primary[500];
    }
  };

  const renderItem = (item: ApprovalCenterItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.itemCard}
      onPress={() => openItem(item)}
      activeOpacity={0.88}
    >
      <View style={[styles.itemIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
      <View style={styles.itemBody}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemStatus}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemMeta}>{item.chama_name}</Text>
          {item.requested_by ? <Text style={styles.itemMeta}>By {item.requested_by}</Text> : null}
        </View>
        <View style={styles.itemMetaRow}>
          {item.amount && item.currency ? (
            <Text style={styles.itemAmount}>{formatCurrency(item.amount, item.currency)}</Text>
          ) : (
            <Text style={styles.itemMeta}>{item.item_type.replace(/_/g, ' ')}</Text>
          )}
          {item.created_at ? <Text style={styles.itemMeta}>{formatRelativeTime(item.created_at)}</Text> : null}
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading approvals center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="clipboard-alert-outline" size={64} color={colors.neutral[400]} />}
          title="Could not load approvals"
          description={error}
          action={
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadData()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          }
          style={styles.fullState}
        />
      </SafeAreaView>
    );
  }

  if (!data.scope.is_admin_scope) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="shield-account-outline" size={64} color={colors.neutral[400]} />}
          title="Approvals center unavailable"
          description="This workspace is shown when your current chama role can review pending actions."
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
          <Text style={styles.eyebrow}>Approvals Center</Text>
          <Text style={styles.title}>One queue for pending decisions</Text>
          <Text style={styles.subtitle}>
            Review join requests, loans, withdrawals, disputes, reconciliation alerts, policy changes, and role changes from one place.
          </Text>
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
                  void loadData();
                })
                .catch(() => undefined);
            }}
            helperText={switchError}
          />
        </View>

        <View style={styles.summaryGrid}>
          {[
            ['All Pending', data.summary.pending_total],
            ['Join Requests', data.summary.join_requests],
            ['Loans', data.summary.loan_requests],
            ['Expenses', data.summary.expense_requests],
            ['Withdrawals', data.summary.withdrawal_requests],
            ['Disputes', data.summary.disputes],
            ['Reconciliation', data.summary.reconciliation_items],
            ['Policies', data.summary.policy_changes],
            ['Role Changes', data.summary.role_changes],
            ['Invites', data.summary.invites],
          ].map(([label, value]) => (
            <View key={label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Pending Items</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity onPress={() => navigation.navigate('PaymentOperations', { chamaId: scopedChamaId })}>
                <Text style={styles.sectionLink}>Payment ops</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('AutomationCenter', { chamaId: scopedChamaId })}>
                <Text style={styles.sectionLink}>Automation view</Text>
              </TouchableOpacity>
            </View>
          </View>
          {data.recent_items.length > 0 ? (
            data.recent_items.map(renderItem)
          ) : (
            <EmptyState
              title="No pending actions"
              description="Your pending approval queue is currently clear."
              style={styles.inlineEmptyState}
            />
          )}
        </View>

        {data.sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {section.title} ({section.count})
              </Text>
              {section.route?.route ? (
                <TouchableOpacity onPress={() => openItem({ action: section.route })}>
                  <Text style={styles.sectionLink}>{section.route.label || 'Open'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {section.items.length > 0 ? (
              section.items.map(renderItem)
            ) : (
              <EmptyState
                title={`No ${section.title.toLowerCase()}`}
                description="Nothing is waiting in this section right now."
                style={styles.inlineEmptyState}
              />
            )}
          </View>
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
  scrollContent: {
    paddingBottom: spacing[8],
  },
  fullState: {
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
  itemCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  itemIndicator: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: borderRadius.full,
    marginRight: spacing[3],
  },
  itemBody: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  itemStatus: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  itemDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemMeta: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  itemAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  inlineEmptyState: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
  },
});
