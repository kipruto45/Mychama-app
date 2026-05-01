import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useAuthStore } from '@/store/authStore';
import { MainStackParamList } from '@/navigation/types';
import { memberWalletService, type WalletActionMethodOption } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

import { getPaymentMethodIcon, normalizePhoneNumber } from './memberPaymentsWorkflowShared';

type WalletDepositMethodNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletDepositMethod'
>;
type WalletDepositMethodRouteProp = RouteProp<MainStackParamList, 'WalletDepositMethod'>;

export const WalletDepositMethodScreen: React.FC = () => {
  const navigation = useNavigation<WalletDepositMethodNavigationProp>();
  const route = useRoute<WalletDepositMethodRouteProp>();
  const { user } = useAuthStore();
  const {
    depositDraftMethod,
    setDepositDraft,
    setLastVisitedScreen,
  } = useMemberWalletFlowStore();

  const [methods, setMethods] = useState<WalletActionMethodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [phone, setPhone] = useState(normalizePhoneNumber(user?.phone || ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletDepositMethod');
  }, [setLastVisitedScreen]);

  useEffect(() => {
    const loadMethods = async () => {
      try {
        const workspace = await memberWalletService.getWorkspace(route.params.chamaId);
        setMethods(workspace.methods.depositMethods);
        if (depositDraftMethod === 'bank') {
          setSelectedMethod('bank');
        } else {
          setSelectedMethod('mpesa');
        }
      } catch {
        setMethods([
          {
            key: 'mpesa',
            label: 'M-Pesa',
            description: 'Add money to your wallet securely.',
            enabled: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    void loadMethods();
  }, [depositDraftMethod, route.params.chamaId]);

  const normalizedPhone = normalizePhoneNumber(phone);
  const activeMethod = useMemo(
    () => methods.find((method) => method.key === selectedMethod) || null,
    [methods, selectedMethod]
  );

  const handleContinue = () => {
    if (!activeMethod?.enabled) {
      setError('Select a deposit method to continue.');
      return;
    }

    if (selectedMethod === 'mpesa') {
      if (!normalizedPhone || normalizedPhone.length < 12) {
        setError('Enter a valid phone number to continue.');
        return;
      }
    }

    setDepositDraft({ amount: route.params.amount, method: selectedMethod });
    navigation.navigate('WalletDepositReview', {
      chamaId: route.params.chamaId,
      amount: route.params.amount,
      currency: route.params.currency,
      paymentMethod: selectedMethod,
      phone: selectedMethod === 'mpesa' ? normalizedPhone : '',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Deposit Method" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading payment methods…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Deposit Method" showBack />
        <EmptyState
          title="Deposit method unavailable"
          description="Go back and start the deposit again."
          icon="credit-card-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Deposit Method" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Deposit summary</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(route.params.amount, route.params.currency)}
          </Text>
          <Text style={styles.summaryText}>Choose how you want to fund your wallet.</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment methods</Text>
          <Text style={styles.sectionSubtitle}>Pick the method that is ready right now.</Text>
        </View>

        {methods.map((method) => {
          const selected = method.key === selectedMethod;
          const disabled = !method.enabled;
          return (
            <TouchableOpacity
              key={method.key}
              activeOpacity={disabled ? 1 : 0.86}
              style={[
                styles.methodCard,
                selected ? styles.methodCardSelected : null,
                disabled ? styles.methodCardDisabled : null,
              ]}
              onPress={() => {
                if (disabled || (method.key !== 'mpesa' && method.key !== 'bank')) {
                  return;
                }
                setSelectedMethod(method.key);
                setError(null);
              }}
            >
              <View style={styles.methodIcon}>
                <Icon
                  name={getPaymentMethodIcon(method.key) as any}
                  size={22}
                  color={disabled ? colors.neutral[400] : colors.primary[600]}
                />
              </View>
              <View style={styles.methodBody}>
                <View style={styles.methodRow}>
                  <Text style={styles.methodTitle}>{method.label}</Text>
                  {!method.enabled ? <Text style={styles.comingSoon}>Unavailable</Text> : null}
                </View>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {activeMethod?.enabled && selectedMethod === 'mpesa' ? (
          <Card style={styles.formCard}>
            <Input
              label="M-Pesa phone number"
              placeholder="2547XXXXXXXX"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (error) setError(null);
              }}
              keyboardType="phone-pad"
              error={error || undefined}
            />
          </Card>
        ) : null}

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!activeMethod?.enabled}
        />
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
    padding: spacing[5],
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    marginTop: spacing[4],
    textAlign: 'center',
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  summaryAmount: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    marginBottom: spacing[2],
  },
  summaryText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
  },
  sectionHeader: {
    gap: spacing[1],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  sectionSubtitle: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  methodCard: {
    flexDirection: 'row',
    gap: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  methodCardSelected: {
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: '#F3FBF6',
  },
  methodCardDisabled: {
    opacity: 0.7,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8F1',
  },
  methodBody: {
    flex: 1,
    gap: spacing[1],
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  methodTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  methodDescription: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  comingSoon: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
});

export default WalletDepositMethodScreen;
