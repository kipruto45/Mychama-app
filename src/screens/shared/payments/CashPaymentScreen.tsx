import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

type CashPaymentScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CashPayment'>;
type CashPaymentScreenRouteProp = RouteProp<MainStackParamList, 'CashPayment'>;

export const CashPaymentScreen: React.FC = () => {
  const navigation = useNavigation<CashPaymentScreenNavigationProp>();
  const route = useRoute<CashPaymentScreenRouteProp>();
  const { chamaId, chamaName, amount, currency, purpose, contributionId } = route.params;

  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const intent = await paymentService.createPaymentIntent({
        chama_id: chamaId,
        amount,
        currency,
        payment_method: 'cash',
        purpose,
        contribution_id: contributionId,
      });

      setPaymentIntent(intent);
      setPaymentCreated(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatus = () => {
    if (paymentIntent) {
      navigation.navigate('PaymentStatus', {
        intentId: paymentIntent.id,
        status: paymentIntent.status,
        amount,
        currency,
        purpose,
      });
    }
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
          <Text style={styles.headerTitle}>Cash Payment</Text>
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

        {/* Cash Payment Instructions */}
        <Card style={styles.instructionsCard}>
          <Text style={styles.sectionTitle}>Cash Payment Instructions</Text>
          <View style={styles.instructionItem}>
            <Icon name="numeric-1-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              Pay the amount to your chama treasurer or admin
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-2-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              Get a receipt or confirmation from the treasurer
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-3-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              The treasurer will verify and confirm your payment
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-4-circle" size={24} color={colors.primary[500]} />
            <Text style={styles.instructionText}>
              You will receive a notification once payment is confirmed
            </Text>
          </View>
        </Card>

        {/* Payment Status */}
        {paymentCreated && paymentIntent && (
          <Card style={styles.statusCard}>
            <View style={styles.statusContainer}>
              <Icon name="clock-outline" size={48} color={colors.warning} />
              <Text style={styles.statusText}>Payment Pending Verification</Text>
              <Text style={styles.statusHint}>
                Your payment is waiting for treasurer/admin verification
              </Text>
              <Text style={styles.referenceText}>
                Reference: {paymentIntent.reference}
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!paymentCreated ? (
            <Button
              title="Create Payment Record"
              onPress={handleCreatePayment}
              loading={loading}
              style={styles.createButton}
            />
          ) : (
            <Button
              title="View Payment Status"
              onPress={handleViewStatus}
              style={styles.statusButton}
            />
          )}
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>

        {/* Important Notice */}
        <Card style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Icon name="information" size={24} color={colors.info} />
            <Text style={styles.noticeTitle}>Important</Text>
          </View>
          <Text style={styles.noticeText}>
            Cash payments require verification by your chama treasurer or admin.
            Please ensure you get a receipt when making the payment.
          </Text>
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
  referenceText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    marginTop: spacing.md,
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  createButton: {
    marginBottom: spacing.md,
  },
  statusButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
  noticeCard: {
    marginBottom: spacing.lg,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noticeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  noticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default CashPaymentScreen;
