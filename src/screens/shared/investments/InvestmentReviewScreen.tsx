import React, { useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useCreateInvestment, useInvestmentProductDetail } from './hooks';
import {
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  calculateMaturityDate,
} from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useActiveChama } from '@/hooks';
import type { MainStackParamList } from '@/navigation/types';

type InvestmentReviewRouteProp = RouteProp<MainStackParamList, 'InvestmentReview'>;
type InvestmentReviewNavProp = NativeStackNavigationProp<MainStackParamList>;

export const InvestmentReviewScreen: React.FC = () => {
  const route = useRoute<InvestmentReviewRouteProp>();
  const navigation = useNavigation<InvestmentReviewNavProp>();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();

  const {
    chamaId: chamaIdParam,
    productId,
    amount,
    fundingSource,
    walletAmount,
    mpesaAmount,
    phone,
    autoReinvest,
  } = route.params;

  const chamaId = chamaIdParam || activeChamaId || '';
  const { product, isLoading: productLoading } = useInvestmentProductDetail(productId);

  const { createInvestment, isLoading, data: createdInvestment } = useCreateInvestment();

  const breakdownItems = useMemo(() => {
    if (!product) return null;
    const principal = parseFloat(amount || '0') || 0;
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
    const maturityDate = calculateMaturityDate(new Date().toISOString(), product.term_days);

    return {
      maturityDate,
      items: [
        { label: 'Principal', value: formatCurrency(principal) },
        { label: 'Fee', value: `-${formatCurrency(fee)}` },
        { label: 'Total', value: formatCurrency(principal + fee) },
        { label: 'Projected Value', value: formatCurrency(projected) },
        { label: 'Estimated Gains', value: formatCurrency(projected - principal), highlighted: true },
      ],
    };
  }, [amount, product]);

  useEffect(() => {
    if (createdInvestment && createdInvestment.id) {
      navigation.navigate('InvestmentSuccess', {
        investmentId: createdInvestment.id,
        chamaId: chamaId || undefined,
      });
    }
  }, [createdInvestment, navigation]);

  const handleConfirm = () => {
    if (!product || !chamaId) return;
    createInvestment(
      {
        chamaId,
        productId: product.id,
        amount,
        fundingSource,
        walletAmount,
        mpesaAmount,
        phone,
        autoReinvest,
      }
    );
  };

  if (productLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Review Investment" />
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
      <ModernHeader title="Review Investment" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Summary */}
	        <Card
	          style={[
	            styles.summaryCard,
	            {
	              backgroundColor: themeColors.accent[200],
	              marginHorizontal: spacing[4],
	              marginTop: spacing[4],
	            },
	          ]}
	        >
          <Text style={[styles.summaryTitle, { color: '#000' }]}>
            {product?.name}
          </Text>
          <Text style={[styles.summaryAmount, { color: '#000' }]}>
            {formatCurrency(parseFloat(amount || '0') || 0)}
          </Text>
          <Text style={[styles.summarySubtitle, { color: 'rgba(0,0,0,0.7)' }]}>
            {formatPercentage(product?.expected_return_percentage || '0')} expected return
          </Text>
        </Card>

        {/* Breakdown */}
        {breakdownItems && (
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Investment Breakdown
            </Text>
            <InvestmentBreakdownCard items={breakdownItems.items} />
            <Card
              style={[
                styles.detailCard,
                {
                  backgroundColor: themeColors.card,
                  marginTop: spacing[3],
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
                Maturity
              </Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Maturity Date</Text>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                  {formatDate(breakdownItems.maturityDate.toISOString())}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Funding Source */}
        <Card
          style={[
            styles.detailCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Funding Details
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
              Funding Source
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
              {fundingSource === 'wallet' ? 'Wallet' : fundingSource === 'mpesa' ? 'M-Pesa' : 'Wallet + M-Pesa'}
            </Text>
          </View>
          {fundingSource === 'mpesa' && phone && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                Phone Number
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>
                {phone}
              </Text>
            </View>
          )}
        </Card>

        {/* Terms & Conditions */}
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
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Terms & Conditions
          </Text>
	          <View style={styles.termItem}>
	            <MaterialCommunityIcons
	              name="lock-clock"
	              size={16}
	              color={themeColors.primary[500]}
	            />
            <Text style={[styles.termText, { color: themeColors.text }]}>
              Lock period: {product?.lock_period_days ?? product?.lock_in_days ?? 0} days from investment date
            </Text>
          </View>
	          <View style={styles.termItem}>
	            <MaterialCommunityIcons
	              name="calendar-check"
	              size={16}
	              color={themeColors.primary[500]}
	            />
            <Text style={[styles.termText, { color: themeColors.text }]}>
              Maturity date:{' '}
              {breakdownItems?.maturityDate ? formatDate(breakdownItems.maturityDate.toISOString()) : 'TBD'}
            </Text>
          </View>
	          <View style={styles.termItem}>
	            <MaterialCommunityIcons
	              name="percent"
	              size={16}
	              color={themeColors.primary[500]}
	            />
            <Text style={[styles.termText, { color: themeColors.text }]}>
              Early redemption penalty:{' '}
              {product?.early_redemption_penalty_percentage ||
                product?.early_redemption_penalty_rate ||
                '0'}
              %
            </Text>
          </View>
        </Card>

        {/* Trust Notice */}
        <Card
          style={[
            styles.trustCard,
            {
              backgroundColor: themeColors.success + '10',
              borderColor: themeColors.success,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <View style={styles.trustRow}>
            <MaterialCommunityIcons
              name="shield-check"
              size={20}
              color={themeColors.success}
            />
            <Text style={[styles.trustText, { color: themeColors.text }]}>
              This investment is safe and CMA regulated
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* CTA Buttons */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
        {isLoading ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <SkeletonLoader />
          </View>
        ) : (
          <>
            <Button
              title="Confirm Investment"
              size="lg"
              onPress={handleConfirm}
              loading={isLoading}
            />
            <Button
              title="Edit"
              size="lg"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing[2] }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: { padding: spacing[4], borderRadius: 12 },
  summaryTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing[2] },
  summaryAmount: { fontSize: 28, fontWeight: '700', marginBottom: spacing[2] },
  summarySubtitle: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  detailCard: { padding: spacing[4], borderRadius: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  termsCard: { padding: spacing[4], borderRadius: 8 },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  termText: { fontSize: 13, flex: 1, lineHeight: 18 },
  trustCard: { padding: spacing[4], borderRadius: 8, borderWidth: 1 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  trustText: { fontSize: 13, flex: 1, lineHeight: 18 },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
