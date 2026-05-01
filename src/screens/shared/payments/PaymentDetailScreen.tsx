import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { paymentService } from '@/services/paymentService';
import { chamaService } from '@/services/chamaService';
import { Chama } from '@/types';

interface PaymentDetailRecord {
  id: string;
  chama: string;
  intent_type: string;
  purpose: string;
  reference_id: string;
  amount: string;
  currency: string;
  phone?: string;
  status: string;
  idempotency_key?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

type PaymentDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentDetail'>;
type PaymentDetailScreenRouteProp = RouteProp<MainStackParamList, 'PaymentDetail'>;

export const PaymentDetailScreen: React.FC = () => {
  const navigation = useNavigation<PaymentDetailScreenNavigationProp>();
  const route = useRoute<PaymentDetailScreenRouteProp>();
  const { paymentId, chamaId } = route.params;
  const [payment, setPayment] = useState<PaymentDetailRecord | null>(null);
  const [chama, setChama] = useState<Chama | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayment = async () => {
      try {
        const directPayment = await paymentService.getTransaction(paymentId).catch(() => null);
        if (directPayment) {
          setPayment(directPayment);
          const resolvedChamaId = directPayment.chama || chamaId;
          if (resolvedChamaId) {
            const chamaData = await chamaService.getChama(resolvedChamaId).catch(() => null);
            setChama(chamaData);
          }
          return;
        }

        if (chamaId) {
          try {
            const [paymentData, chamaData] = await Promise.all([
              paymentService.getPaymentDetail(chamaId, paymentId),
              chamaService.getChama(chamaId).catch(() => null),
            ]);
            setPayment(paymentData);
            setChama(chamaData);
            return;
          } catch (directError) {
            console.warn('Falling back to payment list lookup', directError);
          }
        }

        const chamas = await chamaService.getChamas();
        for (const currentChama of chamas) {
          const paymentRows = await paymentService.getPayments(currentChama.id).catch(() => []);
          const paymentData = paymentRows.find((item) => item.id === paymentId);
          if (paymentData) {
            setPayment(paymentData);
            setChama(currentChama);
            break;
          }
        }
      } catch (error) {
        console.warn('Failed to load payment details', error);
        Alert.alert('Payment Details', 'Unable to load this payment right now.');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, chamaId]);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return 'cellphone';
      case 'cash':
        return 'cash';
      default:
        return 'wallet';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'mpesa':
        return '#4CAF50';
      case 'cash':
        return '#FF9800';
      default:
        return colors.neutral[500];
    }
  };

  const normalizedMethod =
    payment?.intent_type?.toLowerCase().includes('stk') ||
    payment?.intent_type?.toLowerCase().includes('mpesa')
      ? 'mpesa'
      : 'cash';

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'reconciled':
        return 'success';
      case 'partially_refunded':
      case 'refunded':
        return 'warning';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'reversed':
        return 'error';
      default:
        return 'info';
    }
  };

  const handleDownloadReceipt = () => {
    navigation.navigate('Receipt', {
      paymentId,
      chamaId: payment?.chama || chamaId,
    });
  };

  const handleShare = async () => {
    if (!payment) return;

    await Share.share({
      message: [
        `Payment Reference: ${payment.reference_id || payment.id}`,
        `Purpose: ${payment.purpose}`,
        `Amount: ${formatCurrency(payment.amount, payment.currency)}`,
        `Status: ${payment.status}`,
        `Method: ${(payment.intent_type || normalizedMethod || 'payment').replace(/_/g, ' ').toUpperCase()}`,
        `Date: ${formatDateTime(payment.updated_at || payment.created_at)}`,
      ].join('\n'),
    });
  };

  const handleReportIssue = () => {
    const resolvedChamaId = payment?.chama || chamaId;
    if (!resolvedChamaId || !payment) {
      Alert.alert(
        'Report Issue',
        'Share this payment reference with support so the team can investigate it quickly.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Reference',
            onPress: () =>
              void Share.share({
                message: `Payment issue reference: ${payment?.reference_id || payment?.id || paymentId}`,
              }),
          },
        ]
      );
      return;
    }

    navigation.navigate('PaymentDispute', {
      paymentId: payment.id || paymentId,
      chamaId: resolvedChamaId,
      amount: payment.amount,
      currency: payment.currency,
      purpose: payment.purpose,
      status: payment.status,
      reference: payment.reference_id || payment.id || paymentId,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Payment details unavailable"
          description="We could not find this payment in your live payment history."
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.statusCard}>
          <View
            style={[
              styles.methodIcon,
              { backgroundColor: getMethodColor(normalizedMethod) + '20' },
            ]}
          >
            <Icon
              name={getMethodIcon(normalizedMethod)}
              size={32}
              color={getMethodColor(normalizedMethod)}
            />
          </View>
          <Text style={styles.amountLabel}>Payment Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(payment.amount, payment.currency)}
          </Text>
          <Badge
            label={payment.status}
            variant={getStatusVariant(payment.status)}
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Payment Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {String(payment.metadata?.description || payment.purpose || 'Payment').replace(/_/g, ' ')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(payment.updated_at || payment.created_at)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>
              {(normalizedMethod === 'mpesa' ? 'M-PESA' : payment.intent_type || 'PAYMENT').toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue}>{payment.reference_id || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Provider Reference</Text>
            <Text style={styles.infoValue}>{payment.idempotency_key || '-'}</Text>
          </View>
        </Card>

        {normalizedMethod === 'mpesa' && payment.phone ? (
          <Card style={styles.mpesaCard}>
            <Text style={styles.sectionTitle}>M-Pesa Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction ID</Text>
              <Text style={styles.infoValue}>{payment.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{payment.phone || '-'}</Text>
            </View>
          </Card>
        ) : null}

        <Card style={styles.memberCard}>
          <Text style={styles.sectionTitle}>Payment Scope</Text>
          <View style={styles.memberInfo}>
            <Icon name="information-outline" size={20} color={colors.primary[500]} />
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>Payment Record</Text>
              <Text style={styles.memberPhone}>
                {String(payment.purpose || 'payment').replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.chamaCard}>
          <Text style={styles.sectionTitle}>Chama</Text>
          <View style={styles.chamaInfo}>
            <Icon name="account-group" size={24} color={colors.primary[500]} />
            <View style={styles.chamaDetails}>
              <Text style={styles.chamaName}>{chama?.name || 'Chama'}</Text>
              <Text style={styles.chamaId}>ID: {payment.chama}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="View Receipt"
            onPress={handleDownloadReceipt}
            variant="outline"
            style={styles.actionButton}
            icon={<Icon name="download" size={16} color={colors.primary[500]} />}
          />
          <Button
            title="Share"
            onPress={handleShare}
            variant="outline"
            style={styles.actionButton}
            icon={<Icon name="share-variant" size={16} color={colors.primary[500]} />}
          />
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportIssue}
        >
          <Icon name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.reportText}>Open Payment Dispute</Text>
        </TouchableOpacity>
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
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
  },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  amountValue: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
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
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[4],
  },
  mpesaCard: {
    marginBottom: spacing[4],
    backgroundColor: '#4CAF50' + '10',
  },
  memberCard: {
    marginBottom: spacing[4],
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberDetails: {
    marginLeft: spacing[3],
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  memberPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  chamaCard: {
    marginBottom: spacing[4],
  },
  chamaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chamaDetails: {
    marginLeft: spacing[3],
  },
  chamaName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  chamaId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  actionButton: {
    flex: 1,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
  },
  reportText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing[2],
  },
});
