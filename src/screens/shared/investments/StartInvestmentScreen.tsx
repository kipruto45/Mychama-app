import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentProductDetail } from './hooks';
import {
  InvestmentAmountInput,
  FundingSourceSelector,
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import {
  formatCurrency,
  formatPercentage,
  calculateMaturityDate,
  formatDate,
} from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useActiveChama } from '@/hooks';
import type { MainStackParamList } from '@/navigation/types';

type StartInvestmentRouteProp = RouteProp<MainStackParamList, 'StartInvestment'>;
type StartInvestmentNavProp = NativeStackNavigationProp<MainStackParamList>;

export const StartInvestmentScreen: React.FC = () => {
  const route = useRoute<StartInvestmentRouteProp>();
  const navigation = useNavigation<StartInvestmentNavProp>();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();

  const productId = route.params?.productId || '';
  const chamaId = route.params?.chamaId || activeChamaId || '';
  const { product, isLoading } = useInvestmentProductDetail(productId);

  const [amount, setAmount] = useState('');
  const [fundingSource, setFundingSource] = useState<'wallet' | 'mpesa' | 'hybrid'>('wallet');
  const [walletPhone, setWalletPhone] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const fundingOptions = useMemo(() => {
    const options: Array<{
      id: 'wallet' | 'mpesa' | 'hybrid';
      label: string;
      availableBalance: string;
      fees?: string;
      icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    }> = [];

    // Balance values are not yet wired into this screen; keep copy stable and non-blocking.
    const walletOption = {
      id: 'wallet' as const,
      label: 'Wallet',
      availableBalance: 'KES 0',
      icon: 'wallet' as const,
    };
    const mpesaOption = {
      id: 'mpesa' as const,
      label: 'M-Pesa',
      availableBalance: 'KES 0',
      icon: 'cellphone' as const,
    };
    const hybridOption = {
      id: 'hybrid' as const,
      label: 'Hybrid',
      availableBalance: 'Wallet + M-Pesa',
      icon: 'swap-horizontal' as const,
    };

    if (!product || product.wallet_funding_enabled) options.push(walletOption);
    if (!product || product.mpesa_funding_enabled) options.push(mpesaOption);
    if (!product || product.hybrid_funding_enabled) options.push(hybridOption);
    return options.length ? options : [walletOption, mpesaOption];
  }, [product]);

  useEffect(() => {
    if (!fundingOptions.length) return;
    if (!fundingOptions.some((opt) => opt.id === fundingSource)) {
      setFundingSource(fundingOptions[0].id);
    }
  }, [fundingOptions, fundingSource]);

  const breakdown = useMemo(() => {
    if (!product || !amount) return null;
    const principal = parseFloat(amount) || 0;
    const feeRate =
      parseFloat(String(product.fees_percentage || product.management_fee_rate || '0')) || 0;
    const expectedReturnRate =
      parseFloat(
        String(
          product.expected_return_percentage ||
            product.expected_return_percent ||
            product.expected_return_rate ||
            '0'
        )
      ) || 0;
    const fee = (principal * feeRate) / 100;
    const projected = principal + (principal * expectedReturnRate) / 100;
    return {
      principal,
      fee,
      total: principal + fee,
      projected,
      gains: projected - principal,
      maturityDate: calculateMaturityDate(new Date().toISOString(), product.term_days),
    };
  }, [product, amount]);

  const handleValidate = () => {
    const newErrors: string[] = [];
    if (!chamaId) newErrors.push('Select a chama before investing');
    if (!amount) newErrors.push('Please enter an investment amount');
    if (product) {
      const minAmount = parseFloat(product.minimum_amount || '0') || 0;
      if ((parseFloat(amount) || 0) < minAmount) {
        newErrors.push(`Minimum investment is ${formatCurrency(product.minimum_amount)}`);
      }
    }
    if ((fundingSource === 'mpesa' || fundingSource === 'hybrid') && !walletPhone) {
      newErrors.push('Please enter M-Pesa phone number');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleReview = () => {
    if (handleValidate()) {
      navigation.navigate('InvestmentReview', {
        chamaId,
        productId,
        amount,
        fundingSource,
        walletAmount: fundingSource === 'wallet' || fundingSource === 'hybrid' ? amount : undefined,
        mpesaAmount: fundingSource === 'mpesa' ? amount : undefined,
        phone: walletPhone || undefined,
        autoReinvest: false,
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Invest Now" />
        <View style={{ paddingHorizontal: spacing[4] }}>
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Invest Now" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing[6] }}
        >
          {/* Product Summary */}
          {product && (
            <Card
              style={[
                styles.productCard,
                {
                  backgroundColor: themeColors.card,
                  marginHorizontal: spacing[4],
                  marginTop: spacing[4],
                },
              ]}
            >
              <View style={styles.productHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: themeColors.text }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productReturn, { color: themeColors.success }]}>
                    {formatPercentage(
                      product.expected_return_percentage ||
                        product.expected_return_percent ||
                        product.expected_return_rate ||
                        '0'
                    )}{' '}
                    expected return
                  </Text>
                </View>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskBgColor(product.risk_level) },
                  ]}
                >
                  <Text style={[styles.riskText, { color: getRiskTextColor(product.risk_level) }]}>
                    {product.risk_level}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Amount Input */}
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Investment Amount
            </Text>
            <InvestmentAmountInput
              value={amount}
              onChangeText={setAmount}
              minAmount={product?.minimum_amount}
              placeholder="0"
            />
            {product && (
              <Text style={[styles.minText, { color: themeColors.textSecondary }]}>
                Minimum: {formatCurrency(product.minimum_amount)}
              </Text>
            )}
          </View>

          {/* Funding Source */}
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Funding Source
            </Text>
            <FundingSourceSelector
              options={fundingOptions as any}
              selected={fundingSource}
              onSelect={setFundingSource}
            />
            {(fundingSource === 'mpesa' || fundingSource === 'hybrid') && (
              <View
                style={[
                  styles.phoneInputContainer,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                ]}
              >
                <MaterialCommunityIcons
                  name="phone"
                  size={18}
                  color={themeColors.textSecondary}
                />
                <TextInput
                  placeholder="Enter M-Pesa phone number"
                  value={walletPhone}
                  onChangeText={setWalletPhone}
                  placeholderTextColor={themeColors.textSecondary}
                  style={[styles.phoneInput, { color: themeColors.text }]}
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>

          {/* Breakdown Preview */}
          {breakdown && (
            <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Investment Breakdown
              </Text>
              <InvestmentBreakdownCard
                items={[
                  { label: 'Principal', value: formatCurrency(breakdown.principal) },
                  { label: 'Fee', value: `-${formatCurrency(breakdown.fee)}` },
                  { label: 'Total', value: formatCurrency(breakdown.total) },
                  { label: 'Projected Value', value: formatCurrency(breakdown.projected) },
                  { label: 'Estimated Gains', value: formatCurrency(breakdown.gains), highlighted: true },
                ]}
              />

              {/* Maturity Info */}
              <Card
                style={[
                  styles.maturityCard,
                  { backgroundColor: themeColors.card, marginTop: spacing[3] },
                ]}
              >
                <View style={styles.maturityRow}>
                  <View>
                    <Text style={[styles.maturityLabel, { color: themeColors.textSecondary }]}>
                      Lock Period
                    </Text>
                    <Text style={[styles.maturityValue, { color: themeColors.text }]}>
                      {product?.lock_period_days} days
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.maturityLabel, { color: themeColors.textSecondary }]}>
                      Maturity Date
                    </Text>
                    <Text style={[styles.maturityValue, { color: themeColors.primary[500] }]}>
                      {formatDate(breakdown.maturityDate.toISOString())}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Card
              style={[
                styles.errorCard,
                {
                  backgroundColor: themeColors.error + '10',
                  borderColor: themeColors.error,
                  marginHorizontal: spacing[4],
                  marginTop: spacing[4],
                },
              ]}
            >
              {errors.map((error, idx) => (
                <View key={idx} style={styles.errorRow}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={16}
                    color={themeColors.error}
                  />
                  <Text style={[styles.errorText, { color: themeColors.error }]}>
                    {error}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Terms */}
          <Card
            style={[
              styles.termsCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[5],
              },
            ]}
          >
	            <View style={styles.termsRow}>
	              <MaterialCommunityIcons
	                name="shield-check"
	                size={18}
	                color={themeColors.primary[500]}
	              />
              <Text style={[styles.termsText, { color: themeColors.textSecondary }]}>
                By proceeding, you agree to the investment terms and conditions
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA Button */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
        <Button
          title="Review Investment"
          size="lg"
          onPress={handleReview}
          disabled={!amount || errors.length > 0}
        />
      </View>
    </SafeAreaView>
  );
};

const getRiskBgColor = (risk: string) => {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('low')) return '#D1FAE5';
  if (riskLower.includes('medium')) return '#FEF3C7';
  return '#FEE2E2';
};

const getRiskTextColor = (risk: string) => {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('low')) return '#059669';
  if (riskLower.includes('medium')) return '#D97706';
  return '#DC2626';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  productCard: { padding: spacing[4], borderRadius: 8 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '600', marginBottom: spacing[1] },
  productReturn: { fontSize: 12, fontWeight: '500' },
  riskBadge: { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: 6 },
  riskText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  minText: { fontSize: 12, marginTop: spacing[2] },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    marginTop: spacing[3],
  },
  phoneInput: { flex: 1, paddingVertical: spacing[3], paddingHorizontal: spacing[2], fontSize: 14 },
  maturityCard: { padding: spacing[3], borderRadius: 8 },
  maturityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  maturityLabel: { fontSize: 12, marginBottom: spacing[1] },
  maturityValue: { fontSize: 14, fontWeight: '600' },
  errorCard: { padding: spacing[3], borderRadius: 8, borderWidth: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  errorText: { fontSize: 13, flex: 1 },
  termsCard: { padding: spacing[3], borderRadius: 8 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  termsText: { fontSize: 12, flex: 1, lineHeight: 18 },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
