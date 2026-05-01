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

type PaymentMethodScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentMethod'>;
type PaymentMethodScreenRouteProp = RouteProp<MainStackParamList, 'PaymentMethod'>;

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export const PaymentMethodScreen: React.FC = () => {
  const navigation = useNavigation<PaymentMethodScreenNavigationProp>();
  const route = useRoute<PaymentMethodScreenRouteProp>();
  const { chamaId, amount, currency, contributionId } = route.params;
  const chamaName = route.params.chamaName || 'My Chama';
  const purpose = route.params.purpose || route.params.contributionTypeName || 'Contribution';

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Pay via M-Pesa STK Push',
      icon: 'cellphone',
      enabled: true,
    },
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const params = {
      chamaId,
      chamaName,
      amount,
      currency,
      purpose,
      contributionId,
    };

    if (selectedMethod !== 'mpesa') {
      Alert.alert('Error', 'Only M-Pesa contributions are supported.');
      return;
    }

    navigation.navigate('MpesaPayment', params);
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
          <Text style={styles.headerTitle}>Choose Payment Method</Text>
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

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected,
              !method.enabled && styles.methodCardDisabled,
            ]}
            onPress={() => method.enabled && handleMethodSelect(method.id)}
            disabled={!method.enabled}
          >
            <View style={styles.methodIconContainer}>
              <Icon
                name={method.icon}
                size={32}
                color={selectedMethod === method.id ? colors.primary[500] : colors.textSecondary}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <View style={styles.methodCheck}>
              {selectedMethod === method.id && (
                <Icon name="check-circle" size={24} color={colors.primary[500]} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedMethod}
          style={styles.continueButton}
        />

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="shield-check" size={16} color={colors.success} />
          <Text style={styles.securityText}>
            Your payment is secured with industry-standard encryption
          </Text>
        </View>
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
    marginBottom: spacing.xl,
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primaryLight,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  methodCheck: {
    width: 24,
    alignItems: 'center',
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default PaymentMethodScreen;
