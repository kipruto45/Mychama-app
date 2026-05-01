import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentDetail, useRedeemInvestment } from './hooks';
import {
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import {
  formatCurrency,
  calculateDaysRemaining,
  formatDays,
} from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { MainStackParamList } from '@/navigation/types';

type RedeemInvestmentRouteProp = RouteProp<MainStackParamList, 'RedeemInvestment'>;
type RedeemInvestmentNavProp = NativeStackNavigationProp<MainStackParamList>;

export const RedeemInvestmentScreen: React.FC = () => {
  const route = useRoute<RedeemInvestmentRouteProp>();
  const navigation = useNavigation<RedeemInvestmentNavProp>();
  const { colors: themeColors } = useTheme();

  const investmentId = route.params?.investmentId || '';
  const { investment, isLoading } = useInvestmentDetail(investmentId);
  const { redeem, isLoading: redeeming } = useRedeemInvestment();

  const [redemptionType, setRedemptionType] = useState<'returns_only' | 'partial' | 'full'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [destination, setDestination] = useState<'wallet' | 'mpesa'>('wallet');
  const [phoneNumber, setPhoneNumber] = useState('');

  const daysRemaining =
    investment && investment.maturity_date ? calculateDaysRemaining(investment.maturity_date) : 0;
  const isEarlyRedemption = daysRemaining > 0;

  const breakdown = useMemo(() => {
    if (!investment) return null;
    const product = typeof investment.product === 'object' ? investment.product : undefined;
    const penaltyRate = parseFloat(
      (product?.early_redemption_penalty_percentage ||
        product?.early_redemption_penalty_rate ||
        '0') as string
    ) || 0;

    let principal = 0;
    if (redemptionType === 'returns_only') {
      principal = parseFloat(investment.available_returns || '0') || 0;
    } else if (redemptionType === 'partial') {
      principal = parseFloat(partialAmount) || 0;
    } else {
      principal = parseFloat(investment.principal_amount || '0') || 0;
    }
    const penalty = isEarlyRedemption ? (principal * penaltyRate) / 100 : 0;
    return {
      principal,
      penalty,
      fee: 0,
      total: principal - penalty,
      netPayout: principal - penalty,
    };
  }, [investment, redemptionType, partialAmount, isEarlyRedemption]);

  const handleConfirm = () => {
    if (!investment) return;
    redeem(
      {
        investmentId,
        redemptionType,
        amount: redemptionType === 'partial' ? partialAmount : undefined,
        destination,
        beneficiaryPhone: destination === 'mpesa' ? phoneNumber : undefined,
      },
      {
        onSuccess: () => {
          navigation.navigate('Dashboard');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Redeem Investment" />
        <View style={{ paddingHorizontal: spacing[4] }}>
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </View>
      </SafeAreaView>
    );
  }

  if (!investment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Redeem Investment" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={themeColors.error} />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Unable to load this investment.
          </Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Redeem Investment" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Lock Warning */}
        {isEarlyRedemption && (
          <Card
            style={[
              styles.warningCard,
              {
                backgroundColor: themeColors.warning + '20',
                borderColor: themeColors.warning,
                marginHorizontal: spacing[4],
                marginTop: spacing[4],
              },
            ]}
          >
            <View style={styles.warningRow}>
              <MaterialCommunityIcons
                name="alert"
                size={20}
                color={themeColors.warning}
              />
              <Text style={[styles.warningText, { color: themeColors.text }]}>
                {formatDays(daysRemaining)} remaining. Early redemption will incur a penalty.
              </Text>
            </View>
          </Card>
        )}

        {/* Redemption Type Selection */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            What would you like to redeem?
          </Text>
          <View style={styles.optionsContainer}>
            {(parseFloat(investment?.available_returns || '0') || 0) > 0 && (
              <TouchableOpacity
	                style={[
	                  styles.optionCard,
	                  {
	                    backgroundColor: redemptionType === 'returns_only' ? themeColors.primary[500] + '20' : themeColors.card,
	                    borderColor: redemptionType === 'returns_only' ? themeColors.primary[500] : themeColors.border,
	                  },
	                ]}
	                onPress={() => setRedemptionType('returns_only')}
	              >
                <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                  Returns Only
                </Text>
                <Text style={[styles.optionAmount, { color: themeColors.success }]}>
                  {formatCurrency(investment.available_returns)}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
	              style={[
	                styles.optionCard,
	                {
	                  backgroundColor: redemptionType === 'partial' ? themeColors.primary[500] + '20' : themeColors.card,
	                  borderColor: redemptionType === 'partial' ? themeColors.primary[500] : themeColors.border,
	                },
	              ]}
	              onPress={() => setRedemptionType('partial')}
	            >
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Partial Redemption
              </Text>
	              <Text style={[styles.optionAmount, { color: themeColors.primary[500] }]}>
	                Custom amount
	              </Text>
            </TouchableOpacity>

            <TouchableOpacity
	              style={[
	                styles.optionCard,
	                {
	                  backgroundColor: redemptionType === 'full' ? themeColors.primary[500] + '20' : themeColors.card,
	                  borderColor: redemptionType === 'full' ? themeColors.primary[500] : themeColors.border,
	                },
	              ]}
	              onPress={() => setRedemptionType('full')}
	            >
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Full Redemption
              </Text>
	              <Text style={[styles.optionAmount, { color: themeColors.primary[500] }]}>
	                {formatCurrency(investment.principal_amount)}
	              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partial Amount Input */}
        {redemptionType === 'partial' && (
          <Card
            style={[
              styles.amountCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[4],
              },
            ]}
          >
            <TextInput
              placeholder="Enter amount"
              value={partialAmount}
              onChangeText={setPartialAmount}
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.amountInput, { color: themeColors.text }]}
              keyboardType="decimal-pad"
            />
          </Card>
        )}

        {/* Destination */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Redemption Destination
          </Text>
          <View style={styles.destContainer}>
	            <TouchableOpacity
	              style={[
	                styles.destCard,
	                {
	                  backgroundColor: destination === 'wallet' ? themeColors.primary[500] + '20' : themeColors.card,
	                  borderColor: destination === 'wallet' ? themeColors.primary[500] : themeColors.border,
	                },
	              ]}
	              onPress={() => setDestination('wallet')}
	            >
	              <MaterialCommunityIcons name="wallet" size={24} color={themeColors.primary[500]} />
              <Text style={[styles.destTitle, { color: themeColors.text }]}>Wallet</Text>
            </TouchableOpacity>

	            <TouchableOpacity
	              style={[
	                styles.destCard,
	                {
	                  backgroundColor: destination === 'mpesa' ? themeColors.primary[500] + '20' : themeColors.card,
	                  borderColor: destination === 'mpesa' ? themeColors.primary[500] : themeColors.border,
	                },
	              ]}
	              onPress={() => setDestination('mpesa')}
	            >
	              <MaterialCommunityIcons name="phone" size={24} color={themeColors.primary[500]} />
              <Text style={[styles.destTitle, { color: themeColors.text }]}>M-Pesa</Text>
            </TouchableOpacity>
          </View>

          {destination === 'mpesa' && (
            <TextInput
              placeholder="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.phoneInput, { color: themeColors.text, backgroundColor: themeColors.card }]}
              keyboardType="phone-pad"
            />
          )}
        </View>

        {/* Breakdown */}
        {breakdown && (
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Payment Summary
            </Text>
            <InvestmentBreakdownCard items={[
              { label: 'Principal', value: `${breakdown.principal}` },
              { label: 'Penalty', value: `-${breakdown.penalty}` },
              { label: 'Fee', value: `-${breakdown.fee}` },
              { label: 'Total', value: `${breakdown.total}` },
              { label: 'Net Payout', value: `${breakdown.netPayout}` },
            ]} />
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
        <Button
          title="Confirm Redemption"
          size="lg"
          onPress={handleConfirm}
          loading={redeeming}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  errorText: {
    fontSize: 14,
    marginTop: spacing[3],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  warningCard: { padding: spacing[3], borderRadius: 8, borderWidth: 1 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  warningText: { fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  optionsContainer: { gap: spacing[2] },
  optionCard: { padding: spacing[3], borderRadius: 8, borderWidth: 2 },
  optionTitle: { fontSize: 14, fontWeight: '600' },
  optionAmount: { fontSize: 16, fontWeight: '700', marginTop: spacing[1] },
  amountCard: { padding: spacing[4], borderRadius: 8 },
  amountInput: { padding: spacing[3], fontSize: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  destContainer: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  destCard: { flex: 1, padding: spacing[3], borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  destTitle: { fontSize: 12, fontWeight: '600', marginTop: spacing[1] },
  phoneInput: { padding: spacing[3], fontSize: 14, borderRadius: 8, marginTop: spacing[2] },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
