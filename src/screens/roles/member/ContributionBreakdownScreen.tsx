import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import {
  memberContributionService,
  type MemberContributionBreakdownItem,
} from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

type ContributionBreakdownNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionBreakdown'
>;
type ContributionBreakdownRouteProp = RouteProp<MainStackParamList, 'ContributionBreakdown'>;

export const ContributionBreakdownScreen: React.FC = () => {
  const navigation = useNavigation<ContributionBreakdownNavigationProp>();
  const route = useRoute<ContributionBreakdownRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();
  const [rows, setRows] = useState<MemberContributionBreakdownItem[]>([]);
  const [currency, setCurrency] = useState('KES');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chamaId = route.params?.chamaId || activeChamaId;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!chamaId) {
        setLoading(false);
        return;
      }
      try {
        const workspace = await memberContributionService.getWorkspace(chamaId);
        if (mounted) {
          setRows(workspace.breakdown);
          setCurrency(workspace.summary.currency);
          setError(null);
        }
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        if (mounted) {
          setError(message || 'We couldn’t load your contribution breakdown right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setLastVisitedRoute('ContributionBreakdown');
    void load();
    return () => {
      mounted = false;
    };
  }, [chamaId, setLastVisitedRoute]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Breakdown" showBack />
        <EmptyState title="Breakdown unavailable" description={error} icon="chart-donut" style={styles.centerState} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Breakdown" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Breakdown" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first to view your contribution breakdown."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (!rows.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Breakdown" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="No contribution breakdown yet"
          description="Your category totals will appear here once contribution obligations are available."
          icon="chart-donut"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Breakdown" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Contribution breakdown</Text>
          <Text style={styles.summaryText}>
            Review what is fully covered, what is still due, and jump into the right category payment when a balance remains.
          </Text>
        </Card>
        {rows.map((row) => (
          <Card key={row.contribution_type_id} style={styles.breakdownCard}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{row.contribution_type_name}</Text>
              {Number(row.outstanding_amount || 0) > 0 ? (
                <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
              ) : null}
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Paid total</Text>
              <Text style={styles.metricValue}>{formatCurrency(row.paid_total, currency)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Current due</Text>
              <Text style={styles.metricValue}>{formatCurrency(row.current_cycle_due, currency)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Current paid</Text>
              <Text style={styles.metricValue}>{formatCurrency(row.current_cycle_paid, currency)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Outstanding</Text>
              <Text style={styles.metricValue}>{formatCurrency(row.outstanding_amount, currency)}</Text>
            </View>
            {Number(row.outstanding_amount || 0) > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigateToWorkspaceTab(navigation as any, 'Payments', {
                    chamaId: chamaId || undefined,
                    entryPoint: 'contributions',
                    preselectedPurpose: 'contribution',
                    contributionTypeId: row.contribution_type_id,
                    contributionTypeName: row.contribution_type_name,
                    amount: row.outstanding_amount,
                  })
                }
              >
                <Text style={styles.actionLink}>Pay this category</Text>
              </TouchableOpacity>
            ) : null}
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  summaryCard: {
    gap: spacing[2],
    backgroundColor: '#F4FAF6',
    borderWidth: 1,
    borderColor: '#DDEDD9',
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  summaryText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  breakdownCard: {
    gap: spacing[2],
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  metricLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  metricValue: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  actionLink: {
    marginTop: spacing[2],
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default ContributionBreakdownScreen;
