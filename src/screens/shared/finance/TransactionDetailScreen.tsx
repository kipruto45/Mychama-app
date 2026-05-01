import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ApiError } from '@/api/errors';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { financeService, TransactionDetail } from '@/services/financeService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime, formatStatus } from '@/utils/format';

type TransactionDetailScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'TransactionDetail'
>;
type TransactionDetailScreenRouteProp = RouteProp<
  MainStackParamList,
  'TransactionDetail'
>;

export const TransactionDetailScreen: React.FC = () => {
  const navigation = useNavigation<TransactionDetailScreenNavigationProp>();
  const route = useRoute<TransactionDetailScreenRouteProp>();
  const { activeChamaId } = useActiveChama();

  const { transactionRef, chamaId } = route.params;
  const resolvedChamaId = chamaId || activeChamaId || null;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!resolvedChamaId) {
        setLoading(false);
        setError(
          new ApiError({
            code: 'INVALID_INPUT',
            message: 'Choose a chama workspace before opening transaction details.',
          })
        );
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await financeService.getTransactionDetail(resolvedChamaId, transactionRef);
        setTransaction(data);
      } catch (caught) {
        const apiError = caught instanceof ApiError ? caught : null;
        setError(
          apiError ||
            new ApiError({
              code: 'UNKNOWN',
              message: caught instanceof Error ? caught.message : 'Unable to load this transaction.',
            })
        );
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [transactionRef, resolvedChamaId]);

  const getStatusVariant = (value: string) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'success') return 'success';
    if (normalized === 'pending') return 'warning';
    if (normalized === 'failed' || normalized === 'reversed') return 'error';
    return 'info';
  };

  const categoryColor = useMemo(() => {
    if (!transaction) {
      return colors.primary[500];
    }
    switch (transaction.category) {
      case 'inflow':
        return colors.success;
      case 'outflow':
        return colors.error;
      case 'internal':
        return colors.info;
      case 'system':
        return colors.neutral[600];
      default:
        return colors.primary[500];
    }
  }, [transaction]);

  const iconName = useMemo(() => {
    const type = String(transaction?.type || '').toLowerCase();
    if (type.includes('contribution') || type.includes('topup')) return 'cash-plus';
    if (type.includes('withdrawal')) return 'cash-minus';
    if (type.includes('loan_disbursement')) return 'bank-transfer-out';
    if (type.includes('loan_repayment') || type.includes('repayment')) return 'bank-transfer-in';
    if (type.includes('penalty')) return 'alert-circle';
    if (type.includes('expense')) return 'receipt';
    if (type.includes('transfer')) return 'swap-horizontal';
    return 'swap-horizontal';
  }, [transaction]);

  const handleViewReceipt = () => {
    if (!transaction?.receipt_intent_id) {
      Alert.alert('Receipt', 'No receipt is available for this transaction yet.');
      return;
    }
    navigation.navigate('Receipt', { intentId: transaction.receipt_intent_id });
  };

  const handleShare = async () => {
    if (!transaction) return;

    await Share.share({
      message: [
        `Transaction: ${transaction.ref}`,
        `Title: ${transaction.title || 'Transaction'}`,
        `Amount: ${formatCurrency(transaction.amount, transaction.currency)}`,
        `Status: ${formatStatus(String(transaction.status || 'unknown'))}`,
        `Method: ${formatStatus(String(transaction.method || 'internal'))}`,
        transaction.reference ? `Reference: ${transaction.reference}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Share this reference with support so the team can investigate quickly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Reference',
          onPress: () =>
            void Share.share({
              message: `Transaction issue reference: ${transaction?.ref || transactionRef}`,
            }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading transaction details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Transaction details unavailable"
          description={error?.message || 'Unable to load this transaction right now.'}
          style={styles.centerState}
          action={
            <Button
              title="Retry"
              onPress={() => {
                if (resolvedChamaId) {
                  setLoading(true);
                  void financeService
                    .getTransactionDetail(resolvedChamaId, transactionRef)
                    .then((data) => {
                      setTransaction(data);
                      setError(null);
                    })
                    .catch((caught) => {
                      setError(caught instanceof ApiError ? caught : null);
                    })
                    .finally(() => setLoading(false));
                }
              }}
              icon={<Icon name="refresh" size={18} color="#FFFFFF" />}
            />
          }
        />
      </SafeAreaView>
    );
  }

  const prefix =
    transaction.direction === 'outflow' ? '-' : transaction.direction === 'inflow' ? '+' : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
          <Icon name="share-variant" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={[styles.typeIcon, { backgroundColor: `${categoryColor}20` }]}>
            <Icon name={iconName} size={30} color={categoryColor} />
          </View>
          <Text style={styles.titleLabel}>{transaction.title || 'Transaction'}</Text>
          <Text style={styles.amountValue}>
            {prefix}
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <View style={styles.badgesRow}>
            <Badge
              label={formatStatus(String(transaction.status || 'unknown'))}
              variant={getStatusVariant(String(transaction.status))}
            />
            <Badge label={formatStatus(transaction.category)} variant="info" />
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue}>{transaction.ref}</Text>
          </View>

          {transaction.description ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{transaction.description}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{formatStatus(transaction.type)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method</Text>
            <Text style={styles.infoValue}>{formatStatus(transaction.method || 'internal')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{formatStatus(String(transaction.status || 'unknown'))}</Text>
          </View>

          {transaction.provider ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Provider</Text>
              <Text style={styles.infoValue}>{transaction.provider}</Text>
            </View>
          ) : null}

          {transaction.reference ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Provider Reference</Text>
              <Text style={styles.infoValue}>{transaction.reference}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>{formatDateTime(transaction.event_at)}</Text>
          </View>
        </Card>

        <Card style={styles.sourceCard}>
          <Text style={styles.sectionTitle}>Involved Member</Text>
          <View style={styles.sourceRow}>
            <Avatar name={transaction.member?.name || 'Chama'} size="md" />
            <View style={styles.sourceDetails}>
              <Text style={styles.sourceName}>{transaction.member?.name || 'Chama transaction'}</Text>
              <Text style={styles.sourceSubtext}>
                {transaction.member?.phone ? transaction.member.phone : formatStatus(transaction.source)}
              </Text>
            </View>
          </View>
        </Card>

        {Array.isArray(transaction.lines) && transaction.lines.length > 0 ? (
          <Card style={styles.linesCard}>
            <Text style={styles.sectionTitle}>Posting Lines</Text>
            {transaction.lines.map((line) => (
              <View key={line.id} style={styles.lineItem}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineTitle} numberOfLines={1}>
                    {(line.account?.code || '').toUpperCase()}{' '}
                    {line.account?.name ? `— ${line.account.name}` : ''}
                  </Text>
                  <Badge
                    label={formatStatus(line.direction)}
                    variant={line.direction === 'debit' ? 'warning' : 'success'}
                    size="sm"
                  />
                </View>
                <Text style={styles.lineMeta}>
                  {formatStatus(line.entry_type)} • {formatStatus(line.status)}
                </Text>
                <View style={styles.lineAmounts}>
                  <Text style={styles.lineAmountLabel}>Debit</Text>
                  <Text style={styles.lineAmountValue}>
                    {formatCurrency(line.debit, transaction.currency)}
                  </Text>
                </View>
                <View style={styles.lineAmounts}>
                  <Text style={styles.lineAmountLabel}>Credit</Text>
                  <Text style={styles.lineAmountValue}>
                    {formatCurrency(line.credit, transaction.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            title="View Receipt"
            onPress={handleViewReceipt}
            variant="outline"
            style={styles.actionButton}
            icon={<Icon name="receipt" size={16} color={colors.primary[500]} />}
          />
          <Button
            title="Report"
            onPress={handleReportIssue}
            variant="outline"
            style={styles.actionButton}
            icon={<Icon name="alert-circle-outline" size={16} color={colors.primary[500]} />}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerAction: {
    padding: spacing[2],
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
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  titleLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  amountValue: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  infoCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    gap: spacing[4],
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  infoValue: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    textAlign: 'right',
  },
  sourceCard: {
    marginBottom: spacing[4],
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceDetails: {
    marginLeft: spacing[3],
  },
  sourceName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  sourceSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  linesCard: {
    marginBottom: spacing[4],
  },
  lineItem: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.neutral[50],
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  lineTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  lineMeta: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  lineAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  lineAmountLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  lineAmountValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
});
