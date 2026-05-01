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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
import { memberContributionService } from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { Penalty } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type PenaltiesNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Penalties'>;
type PenaltiesRouteProp = RouteProp<MainStackParamList, 'Penalties'>;

const getStatusMeta = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  if (['paid'].includes(normalized)) {
    return { label: 'Paid', variant: 'success' as const, tint: colors.success };
  }
  if (['partial', 'partially_paid', 'partially-paid'].includes(normalized)) {
    return { label: 'Partially paid', variant: 'warning' as const, tint: colors.warning };
  }
  if (['waived'].includes(normalized)) {
    return { label: 'Waived', variant: 'secondary' as const, tint: colors.neutral[500] };
  }
  return { label: 'Outstanding', variant: 'error' as const, tint: colors.error };
};

export const PenaltiesScreen: React.FC = () => {
  const navigation = useNavigation<PenaltiesNavigationProp>();
  const route = useRoute<PenaltiesRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId;
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPenalties = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
        setPenalties([]);
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
        const response = await memberContributionService.getPenalties(chamaId);
        setPenalties(response);
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your penalties right now. Please try again.');
        setPenalties([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [chamaId]
  );

  useEffect(() => {
    setLastVisitedRoute('Penalties');
    void loadPenalties();
  }, [loadPenalties, setLastVisitedRoute]);

  const currency = activeChama?.currency || 'KES';
  const outstandingPenalties = useMemo(
    () => penalties.filter((item) => !['paid', 'waived'].includes(String(item.status || '').toLowerCase())),
    [penalties]
  );
  const outstandingTotal = useMemo(
    () =>
      outstandingPenalties.reduce(
        (sum, item) => sum + Number(item.outstanding_amount || item.amount || 0),
        0
      ),
    [outstandingPenalties]
  );

  const openPenaltyPayment = (penalty: Penalty) => {
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
        <ModernHeader title="Penalties" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerStateText}>Loading your penalties…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Penalties" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first to view any penalties linked to your account."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Penalties" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load penalties"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (!penalties.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Penalties" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="No penalties right now"
          description="You have no fines or penalties linked to your contribution account."
          icon="shield-check-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Penalties" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPenalties(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>Outstanding penalties</Text>
              <Text style={styles.heroAmount}>{formatCurrency(outstandingTotal.toFixed(2), currency)}</Text>
              <Text style={styles.heroCaption}>
                {outstandingPenalties.length} item{outstandingPenalties.length === 1 ? '' : 's'} need attention
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Icon name="alert-outline" size={28} color={colors.warning} />
            </View>
          </View>
          <Text style={styles.heroText}>
            Penalties are shown separately so you can understand what is owed and clear them without restarting your contribution flow.
          </Text>
          <View style={styles.heroActions}>
            <Button
              title="Contribution overview"
              size="sm"
              variant="outline"
              onPress={() => navigation.navigate('MemberContributions', { chamaId })}
            />
            <Button
              title="Payment history"
              size="sm"
              variant="outline"
              onPress={() => navigation.navigate('PaymentHistory')}
            />
          </View>
        </Card>

        {penalties.map((penalty) => {
          const statusMeta = getStatusMeta(penalty.status);
          const isPayable = Number(penalty.outstanding_amount || penalty.amount || 0) > 0 && !['paid', 'waived'].includes(String(penalty.status || '').toLowerCase());

          return (
            <Card key={penalty.id} style={styles.penaltyCard}>
              <View style={styles.penaltyHeader}>
                <View style={styles.penaltyIcon}>
                  <Icon name="gavel" size={20} color={statusMeta.tint} />
                </View>
                <View style={styles.penaltyCopy}>
                  <Text style={styles.penaltyTitle}>Fine / Penalty</Text>
                  <Text style={styles.penaltyReason}>{penalty.reason || penalty.issued_reason || 'Contribution penalty'}</Text>
                </View>
                <Badge label={statusMeta.label} variant={statusMeta.variant} size="sm" />
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Amount</Text>
                <Text style={styles.metricValue}>{formatCurrency(penalty.amount, currency)}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Outstanding</Text>
                <Text style={[styles.metricValue, isPayable && styles.outstandingValue]}>
                  {formatCurrency(penalty.outstanding_amount || penalty.amount, currency)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Due date</Text>
                <Text style={styles.metricValue}>{formatDate(penalty.due_date)}</Text>
              </View>

              {isPayable ? (
                <Button
                  title="Pay penalty"
                  size="sm"
                  onPress={() => openPenaltyPayment(penalty)}
                />
              ) : null}
            </Card>
          );
        })}
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
  centerStateText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  heroCard: {
    gap: spacing[3],
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5D9A6',
    shadowColor: '#C98B15',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#A46805',
    fontFamily: typography.fontFamily.medium,
  },
  heroAmount: {
    marginTop: spacing[1],
    fontSize: 32,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroCaption: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
  },
  heroText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  heroActions: {
    gap: spacing[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFECC3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaltyCard: {
    gap: spacing[3],
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  penaltyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaltyCopy: {
    flex: 1,
    gap: spacing[1],
  },
  penaltyTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  penaltyReason: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 20,
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
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  outstandingValue: {
    color: colors.error,
  },
});

export default PenaltiesScreen;
