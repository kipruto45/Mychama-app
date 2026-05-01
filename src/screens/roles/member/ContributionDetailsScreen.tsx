import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Badge } from '@/components/ui/Badge';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { memberContributionService, type MemberContributionDetail } from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

type ContributionDetailsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionDetails'
>;
type ContributionDetailsRouteProp = RouteProp<MainStackParamList, 'ContributionDetails'>;

export const ContributionDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ContributionDetailsNavigationProp>();
  const route = useRoute<ContributionDetailsRouteProp>();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();
  const contributionId = route.params?.contributionId;
  const [detail, setDetail] = useState<MemberContributionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedRoute('ContributionDetails');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    if (!contributionId) {
      setError('We couldn’t find this contribution.');
      return;
    }

    let mounted = true;
    const loadDetail = async () => {
      try {
        const payload = await memberContributionService.getContributionDetail(contributionId);
        if (mounted) {
          setDetail(payload);
        }
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        if (mounted) {
          setError(message || 'We couldn’t load this contribution right now.');
        }
      }
    };

    void loadDetail();
    return () => {
      mounted = false;
    };
  }, [contributionId]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution details" showBack />
        <EmptyState
          title="Contribution unavailable"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution details" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const contribution = detail.contribution;
  const currency = detail.payment_intent?.currency || 'KES';

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Contribution details" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.sectionCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.sectionTitle}>{contribution.contribution_type_name || 'Contribution'}</Text>
            <Badge label={detail.status || 'Paid'} variant="success" size="sm" />
          </View>
          <Text style={styles.heroAmount}>{formatCurrency(contribution.amount, currency)}</Text>
          <Text style={styles.heroMeta}>{detail.cycle_month}</Text>
          {detail.note ? <Text style={styles.noteText}>{detail.note}</Text> : null}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{detail.status || 'Success'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(contribution.date_paid)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment method</Text>
            <Text style={styles.detailValue}>{String(contribution.method || 'payment').toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>{contribution.receipt_code}</Text>
          </View>
          {detail.payment_intent?.reference ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction reference</Text>
              <Text style={styles.detailValue}>{detail.payment_intent.reference}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cycle</Text>
            <Text style={styles.detailValue}>{detail.cycle_month}</Text>
          </View>
          {detail.payment_intent?.created_at ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recorded at</Text>
              <Text style={styles.detailValue}>{formatDateTime(detail.payment_intent.created_at)}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.actions}>
          {detail.receipt ? (
            <Button
              title="Open receipt"
              onPress={() =>
                navigation.navigate('Receipt', {
                  intentId: detail.payment_intent?.id,
                  contributionId,
                  contributionTypeName: contribution.contribution_type_name,
                })
              }
            />
          ) : null}
          <Button
            title="Contribution history"
            variant="outline"
            onPress={() =>
              navigation.navigate('ContributionHistory', {
                chamaId: route.params?.chamaId,
              })
            }
          />
          <Button
            title="Back to contributions"
            variant="outline"
            onPress={() =>
              navigation.navigate('MemberContributions', {
                chamaId: route.params?.chamaId,
              })
            }
          />
          {detail.payment_intent?.id ? (
            <Button
              title="Open payment status"
              variant="outline"
              onPress={() =>
                navigation.navigate('PaymentStatus', {
                  intentId: detail.payment_intent?.id || '',
                  amount: contribution.amount,
                  currency,
                  purpose: 'contribution',
                  contributionTypeName: contribution.contribution_type_name,
                  paymentMethod: contribution.method,
                })
              }
            />
          ) : null}
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  sectionCard: {
    gap: spacing[3],
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroAmount: {
    fontSize: 32,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  detailLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  actions: {
    gap: spacing[3],
  },
});

export default ContributionDetailsScreen;
