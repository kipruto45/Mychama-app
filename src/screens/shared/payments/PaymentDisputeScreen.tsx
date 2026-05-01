import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { MainStackParamList } from '@/navigation/types';
import { PaymentDisputeRecord, paymentService } from '@/services/paymentService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

type PaymentDisputeNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentDispute'>;
type PaymentDisputeRouteProp = RouteProp<MainStackParamList, 'PaymentDispute'>;

const MEMBER_DISPUTE_CATEGORIES = [
  { value: 'duplicate', label: 'Duplicate charge', helper: 'You were charged more than once.' },
  { value: 'incorrect_amount', label: 'Incorrect amount', helper: 'The amount debited does not match the payment.' },
  { value: 'failed_callback', label: 'Missing confirmation', helper: 'Money moved but the app still shows a pending or failed payment.' },
  { value: 'missing_reference', label: 'Missing reference', helper: 'You cannot trace the provider reference or receipt cleanly.' },
  { value: 'fraud', label: 'Fraud concern', helper: 'You do not recognize the payment or suspect account misuse.' },
  { value: 'other', label: 'Other issue', helper: 'Something else looks wrong and needs review.' },
] as const;

const getStatusVariant = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const normalized = status.toLowerCase();
  if (normalized === 'won' || normalized === 'resolved') return 'success';
  if (normalized === 'rejected' || normalized === 'lost') return 'error';
  if (normalized === 'in_review' || normalized === 'open') return 'warning';
  return 'info';
};

export const PaymentDisputeScreen: React.FC = () => {
  const navigation = useNavigation<PaymentDisputeNavigationProp>();
  const route = useRoute<PaymentDisputeRouteProp>();
  const { paymentId, chamaId, amount, currency = 'KES', purpose, status, reference } = route.params;

  const [category, setCategory] = useState<(typeof MEMBER_DISPUTE_CATEGORIES)[number]['value']>('failed_callback');
  const [reason, setReason] = useState('');
  const [disputedAmount, setDisputedAmount] = useState(amount || '');
  const [disputes, setDisputes] = useState<PaymentDisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDisputes = useCallback(async () => {
    try {
      const rows = await paymentService.getPaymentDisputes({
        chama_id: chamaId,
        intent_id: paymentId,
        limit: 20,
      });
      setDisputes(rows);
    } catch (error) {
      console.warn('Failed to load payment disputes', error);
    }
  }, [chamaId, paymentId]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadDisputes();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [loadDisputes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDisputes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 12) {
      Alert.alert('Dispute Reason', 'Give a short but clear explanation so the chama team can investigate properly.');
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.openPaymentDispute({
        chama_id: chamaId,
        intent_id: paymentId,
        category,
        amount: disputedAmount.trim() ? disputedAmount.trim() : undefined,
        reason: trimmedReason,
        reference: reference || paymentId,
      });
      setReason('');
      await loadDisputes();
      Alert.alert('Dispute Submitted', 'Your payment dispute has been recorded and shared with the chama operations team.');
    } catch (error) {
      console.warn('Failed to submit payment dispute', error);
      Alert.alert('Dispute Not Submitted', 'We could not submit this dispute right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Dispute</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading dispute history...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Payment snapshot</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                {amount ? formatCurrency(amount, currency) : `Payment ${paymentId}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Purpose</Text>
              <Text style={styles.summaryValue}>{String(purpose || 'payment').replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current status</Text>
              <Badge label={String(status || 'unknown').replace(/_/g, ' ')} variant={getStatusVariant(status || 'unknown')} />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reference</Text>
              <Text style={styles.summaryValue}>{reference || paymentId}</Text>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Open a dispute</Text>
            <Text style={styles.sectionSubtitle}>
              Use this for member-reported problems. Provider chargebacks are captured automatically from verified webhooks.
            </Text>

            <Text style={styles.fieldLabel}>Issue type</Text>
            <View style={styles.categoryGrid}>
              {MEMBER_DISPUTE_CATEGORIES.map((item) => {
                const selected = item.value === category;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    onPress={() => setCategory(item.value)}
                  >
                    <Text style={[styles.categoryChipTitle, selected && styles.categoryChipTitleSelected]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.categoryChipHelper, selected && styles.categoryChipHelperSelected]}>
                      {item.helper}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Amount in dispute"
              value={disputedAmount}
              onChangeText={setDisputedAmount}
              keyboardType="decimal-pad"
              placeholder={amount || '0.00'}
            />

            <Input
              label="What happened?"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
              placeholder="Explain what you expected, what happened instead, and any details that will help the team investigate."
            />

            <Button title="Submit Dispute" onPress={() => void handleSubmit()} loading={submitting} />
          </Card>

          <Card style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Dispute history for this payment</Text>
            <Text style={styles.sectionSubtitle}>You and the chama admins will see the same live dispute trail here.</Text>
            {disputes.length > 0 ? (
              disputes.map((dispute) => (
                <View key={dispute.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{dispute.category.replace(/_/g, ' ')}</Text>
                    <Badge label={dispute.status.replace(/_/g, ' ')} variant={getStatusVariant(dispute.status)} />
                  </View>
                  <Text style={styles.historyReason}>{dispute.reason}</Text>
                  <Text style={styles.historyMeta}>
                    {dispute.amount ? `${formatCurrency(dispute.amount, currency)} • ` : ''}
                    Opened {formatDateTime(dispute.created_at)}
                  </Text>
                  {dispute.resolution_notes ? (
                    <Text style={styles.historyResolution}>Resolution: {dispute.resolution_notes}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <EmptyState
                title="No disputes raised yet"
                description="If something looks wrong with this payment, raise it here and the team can investigate with full payment context."
                style={styles.emptyState}
              />
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  summaryCard: {
    gap: spacing[3],
  },
  formCard: {
    gap: spacing[3],
  },
  historyCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  summaryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  summaryValue: {
    flex: 1.3,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  categoryGrid: {
    gap: spacing[3],
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    backgroundColor: colors.light.surface,
    gap: spacing[1],
  },
  categoryChipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  categoryChipTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  categoryChipTitleSelected: {
    color: colors.primary[700],
  },
  categoryChipHelper: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  categoryChipHelperSelected: {
    color: colors.primary[700],
  },
  historyItem: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    gap: spacing[2],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  historyTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  historyReason: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  historyMeta: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  historyResolution: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[700],
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: spacing[6],
  },
});
