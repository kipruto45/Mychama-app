import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MainStackParamList } from '@/navigation/types';
import { paymentService } from '@/services/paymentService';

type PaymentStatusScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentStatus'>;
type PaymentStatusScreenRouteProp = RouteProp<MainStackParamList, 'PaymentStatus'>;

export const PaymentStatusScreen: React.FC = () => {
  const navigation = useNavigation<PaymentStatusScreenNavigationProp>();
  const route = useRoute<PaymentStatusScreenRouteProp>();
  const { intentId, status, amount, currency, purpose, failureReason } = route.params;
  const resolvedStatus = status || 'pending';

  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetails();
  }, [intentId]);

  const fetchPaymentDetails = async () => {
    try {
      const details = await paymentService.getPaymentStatus(intentId);
      setPaymentDetails(details);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = () => {
    navigation.navigate('Receipt', { intentId });
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const handleGoHome = () => {
    navigation.navigate('Dashboard');
  };

  const getStatusIcon = () => {
    switch (resolvedStatus) {
      case 'success':
      case 'reconciled':
        return 'check-circle';
      case 'partially_refunded':
        return 'backup-restore';
      case 'refunded':
        return 'cash-refund';
      case 'failed':
        return 'close-circle';
      case 'pending':
      case 'pending_verification':
        return 'clock-outline';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = () => {
    switch (resolvedStatus) {
      case 'success':
      case 'reconciled':
        return colors.success;
      case 'partially_refunded':
        return colors.info;
      case 'refunded':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'pending':
      case 'pending_verification':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusTitle = () => {
    switch (resolvedStatus) {
      case 'success':
      case 'reconciled':
        return 'Payment Successful!';
      case 'partially_refunded':
        return 'Partial Refund Processed';
      case 'refunded':
        return 'Payment Refunded';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'pending_verification':
        return 'Pending Verification';
      default:
        return 'Payment Status';
    }
  };

  const getStatusDescription = () => {
    switch (resolvedStatus) {
      case 'success':
      case 'reconciled':
        return 'Your payment has been processed successfully.';
      case 'partially_refunded':
        return 'Part of this payment has been refunded and the remaining amount is still retained.';
      case 'refunded':
        return 'This payment has been fully refunded.';
      case 'failed':
        return failureReason || 'Your payment could not be processed.';
      case 'pending':
        return 'Your payment is being processed.';
      case 'pending_verification':
        return 'Your payment is waiting for verification by treasurer/admin.';
      default:
        return 'Payment status unknown.';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Status</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusContainer}>
            <Icon name={getStatusIcon()} size={64} color={getStatusColor()} />
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
            <Text style={styles.statusDescription}>
              {getStatusDescription()}
            </Text>
          </View>
        </Card>

        {/* Payment Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {parseFloat(amount).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailValue}>{purpose}</Text>
          </View>
          {(paymentDetails?.reference || paymentDetails?.intent?.reference) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{paymentDetails?.reference || paymentDetails?.intent?.reference}</Text>
            </View>
          )}
          {(paymentDetails?.payment_method || paymentDetails?.intent?.payment_method) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {(paymentDetails?.payment_method || paymentDetails?.intent?.payment_method || 'payment').toUpperCase()}
              </Text>
            </View>
          )}
          {(paymentDetails?.created_at || paymentDetails?.intent?.created_at) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(paymentDetails?.created_at || paymentDetails?.intent?.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {['success', 'reconciled', 'partially_refunded', 'refunded'].includes(resolvedStatus) && (
            <Button
              title="View Receipt"
              onPress={handleViewReceipt}
              style={styles.receiptButton}
            />
          )}
          {(resolvedStatus === 'failed' || resolvedStatus === 'pending_verification') && (
            <Button
              title="Try Again"
              onPress={handleRetry}
              style={styles.retryButton}
            />
          )}
          <Button
            title="Go to Dashboard"
            onPress={handleGoHome}
            variant="outline"
            style={styles.homeButton}
          />
        </View>

        {/* Additional Info */}
        {['success', 'reconciled'].includes(resolvedStatus) && (
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="information" size={24} color={colors.info} />
              <Text style={styles.infoTitle}>What Happens Next?</Text>
            </View>
            <Text style={styles.infoText}>
              Your contribution has been recorded. You can view your payment
              history and receipts in the payments section.
            </Text>
          </Card>
        )}

        {resolvedStatus === 'pending_verification' && (
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="clock-outline" size={24} color={colors.warning} />
              <Text style={styles.infoTitle}>Waiting for Verification</Text>
            </View>
            <Text style={styles.infoText}>
              Your payment is waiting for verification by your chama treasurer
              or admin. You will receive a notification once it is verified.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  statusTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  statusDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  receiptButton: {
    marginBottom: spacing.md,
  },
  retryButton: {
    marginBottom: spacing.md,
  },
  homeButton: {
    marginBottom: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default PaymentStatusScreen;
