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
import { Input } from '@/components/ui/Input';
import { MainStackParamList } from '@/navigation/types';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/providers/AuthProvider';

type MpesaPaymentScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MpesaPayment'>;
type MpesaPaymentScreenRouteProp = RouteProp<MainStackParamList, 'MpesaPayment'>;

export const MpesaPaymentScreen: React.FC = () => {
  const navigation = useNavigation<MpesaPaymentScreenNavigationProp>();
  const route = useRoute<MpesaPaymentScreenRouteProp>();
  const { user } = useAuth();
  const { chamaId, chamaName, amount, currency, purpose, contributionId } = route.params;

  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  const handleInitiatePayment = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const intent = await paymentService.createPaymentIntent({
        chama_id: chamaId,
        amount,
        currency,
        payment_method: 'mpesa',
        purpose,
        contribution_id: contributionId,
        phone,
      });

      setPaymentIntent(intent);
      setPaymentStatus('pending');

      // Poll for payment status
      pollPaymentStatus(intent.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (intentId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus('timeout');
        return;
      }

      try {
        const status = await paymentService.getPaymentStatus(intentId);
        const normalizedStatus = status.intent?.status || status.status;
        setPaymentStatus(normalizedStatus);

        if (normalizedStatus === 'success') {
          navigation.navigate('PaymentStatus', {
            intentId,
            status: 'success',
            amount,
            currency,
            purpose,
          });
          return;
        } else if (normalizedStatus === 'failed') {
          navigation.navigate('PaymentStatus', {
            intentId,
            status: 'failed',
            amount,
            currency,
            purpose,
            failureReason: status.intent?.failure_reason || status.failure_reason || undefined,
          });
          return;
        }

        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (error) {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setPaymentIntent(null);
  };

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
          <Text style={styles.headerTitle}>M-Pesa Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Payment Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Chama</Text>
            <Text style={styles.detailValue}>{chamaName}</Text>
          </View>
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
        </Card>

        {/* Phone Input */}
        {!paymentStatus && (
          <Card style={styles.phoneCard}>
            <Text style={styles.sectionTitle}>Enter M-Pesa Phone Number</Text>
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g., 254712345678"
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
            <Text style={styles.phoneHint}>
              You will receive an STK push on this number
            </Text>
          </Card>
        )}

        {/* Payment Status */}
        {paymentStatus && (
          <Card style={styles.statusCard}>
            <View style={styles.statusContainer}>
              {paymentStatus === 'pending' && (
                <>
                  <ActivityIndicator size="large" color={colors.primary[500]} />
                  <Text style={styles.statusText}>
                    Waiting for M-Pesa payment...
                  </Text>
                  <Text style={styles.statusHint}>
                    Check your phone for the STK push notification
                  </Text>
                </>
              )}
              {paymentStatus === 'success' && (
                <>
                  <Icon name="check-circle" size={48} color={colors.success} />
                  <Text style={styles.statusText}>Payment Successful!</Text>
                </>
              )}
              {paymentStatus === 'failed' && (
                <>
                  <Icon name="close-circle" size={48} color={colors.error} />
                  <Text style={styles.statusText}>Payment Failed</Text>
                </>
              )}
              {paymentStatus === 'timeout' && (
                <>
                  <Icon name="clock-alert" size={48} color={colors.warning} />
                  <Text style={styles.statusText}>Payment Timeout</Text>
                  <Text style={styles.statusHint}>
                    Please try again or use a different payment method
                  </Text>
                </>
              )}
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!paymentStatus && (
            <Button
              title="Initiate Payment"
              onPress={handleInitiatePayment}
              loading={loading}
              style={styles.initiateButton}
            />
          )}
          {paymentStatus === 'timeout' && (
            <Button
              title="Retry"
              onPress={handleRetry}
              style={styles.retryButton}
            />
          )}
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.instructionItem}>
            <Icon name="numeric-1-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              Enter your M-Pesa registered phone number
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-2-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              You will receive an STK push notification on your phone
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-3-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              Enter your M-Pesa PIN to complete the payment
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-4-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              Wait for confirmation and receipt
            </Text>
          </View>
        </Card>
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
  phoneCard: {
    marginBottom: spacing.lg,
  },
  phoneInput: {
    marginBottom: spacing.sm,
  },
  phoneHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  statusText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  statusHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  initiateButton: {
    marginBottom: spacing.md,
  },
  retryButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
  instructionsCard: {
    marginBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
});

export default MpesaPaymentScreen;
