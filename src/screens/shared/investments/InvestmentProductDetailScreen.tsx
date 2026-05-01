import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentProductDetail } from './hooks';
import {
  InvestmentRiskBadge,
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import {
  formatCurrency,
  formatPercentage,
  getRiskColor,
} from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { MainStackParamList } from '@/navigation/types';

type InvestmentProductDetailRouteProp = RouteProp<
  MainStackParamList,
  'InvestmentProductDetail'
>;
type InvestmentNavProp = NativeStackNavigationProp<MainStackParamList>;

export const InvestmentProductDetailScreen: React.FC = () => {
  const route = useRoute<InvestmentProductDetailRouteProp>();
  const navigation = useNavigation<InvestmentNavProp>();
  const productId = route.params?.productId || '';
  const { colors: themeColors } = useTheme();

  const { product, isLoading, error } = useInvestmentProductDetail(productId);

  const projections = useMemo(() => {
    if (!product) return [];
    const amounts = [10000, 50000, 100000, 500000];
    const rateStr = product.expected_return_percentage || product.expected_return_percent || product.expected_return_rate || '0';
    const returnRate = parseFloat(rateStr) || 0;
    return amounts.map((amount) => ({
      invested: amount,
      projected: amount + (amount * (returnRate as number)) / 100,
      returns: (amount * (returnRate as number)) / 100,
    }));
  }, [product]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Product Details" />
        <View style={{ paddingHorizontal: spacing[4] }}>
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Product Details" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={themeColors.error}
          />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Failed to load product details
          </Text>
          <Button title="Try Again" onPress={() => {}} size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title={product.name} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Hero Section */}
	        <Card
	          style={[
	            styles.heroCard,
	            {
	              backgroundColor: themeColors.accent[200],
	              marginHorizontal: spacing[4],
	              marginTop: spacing[4],
	            },
	          ]}
	        >
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: '#000' }]}>{product.name}</Text>
            <InvestmentRiskBadge level={product.risk_level as any} size="lg" />
          </View>
          <Text style={[styles.heroDescription, { color: 'rgba(0,0,0,0.7)' }]}>
            {product.short_description || 'A premium investment opportunity'}
          </Text>
        </Card>

        {/* Key Metrics Grid */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Key Metrics
          </Text>
          <View
            style={[
              styles.metricsGrid,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <View style={styles.metricTile}>
              <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                Minimum Investment
              </Text>
	              <Text style={[styles.metricValue, { color: themeColors.primary[500] }]}>
	                {formatCurrency(product.minimum_amount)}
	              </Text>
            </View>
            <View
              style={[
                styles.metricTile,
                { borderLeftColor: themeColors.border, borderLeftWidth: 1 },
              ]}
            >
              <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                Expected Return
              </Text>
	              <Text style={[styles.metricValue, { color: themeColors.primary[500] }]}>
	                {formatPercentage(product.expected_return_percentage || '0')}
	              </Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                Term Duration
              </Text>
	              <Text style={[styles.metricValue, { color: themeColors.primary[500] }]}>
	                {product.term_days} days
	              </Text>
            </View>
            <View
              style={[
                styles.metricTile,
                { borderLeftColor: themeColors.border, borderLeftWidth: 1 },
              ]}
            >
              <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>
                Lock Period
              </Text>
	              <Text style={[styles.metricValue, { color: themeColors.primary[500] }]}>
	                {product.lock_period_days} days
	              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {product.long_description && (
          <Card
            style={[
              styles.descriptionCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[5],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
              About This Product
            </Text>
            <Text style={[styles.descriptionText, { color: themeColors.text }]}>
              {product.long_description}
            </Text>
          </Card>
        )}

        {/* Projection Calculator */}
        <Card
          style={[
            styles.calculatorCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Return Projections
          </Text>
          <FlatList
            data={projections}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.projectionRow,
                  { borderBottomColor: themeColors.border, borderBottomWidth: 1 },
                ]}
              >
                <Text style={[styles.projectionAmount, { color: themeColors.text }]}>
                  Invest {formatCurrency(item.invested)}
                </Text>
                <View style={styles.projectionRight}>
                  <Text style={[styles.projectionLabel, { color: themeColors.textSecondary }]}>
                    Returns:
                  </Text>
                  <Text style={[styles.projectionReturn, { color: themeColors.success }]}>
                    +{formatCurrency(item.returns)}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={(_, idx) => idx.toString()}
          />
        </Card>

        {/* Fees & Charges */}
        {product.fees_percentage !== null && (
          <Card
            style={[
              styles.feesCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[5],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
              Fees & Charges
            </Text>
            <View
              style={[
                styles.feeRow,
                { borderBottomColor: themeColors.border, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[styles.feeLabel, { color: themeColors.text }]}>
                Investment Fee
              </Text>
              <Text style={[styles.feeValue, { color: themeColors.text }]}>
                {formatPercentage(product.fees_percentage || '0')}
              </Text>
            </View>
            {product.early_redemption_penalty_percentage !== null && product.early_redemption_penalty_percentage !== undefined && (
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: themeColors.text }]}>
                  Early Redemption Penalty
                </Text>
                <Text style={[styles.feeValue, { color: themeColors.text }]}>
                  {formatPercentage(product.early_redemption_penalty_percentage || product.early_redemption_penalty_rate || '0')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Utilization Rules */}
        {product.utilization_options && product.utilization_options.length > 0 && (
          <Card
            style={[
              styles.utilizationCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[5],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
              Utilization Options
            </Text>
            {product.utilization_options.map((option: any, idx: number) => (
              <View
                key={idx}
                style={[
	                  styles.utilizationOption,
	                  {
	                    borderLeftColor: themeColors.primary[500],
	                    backgroundColor: themeColors.background,
	                  },
	                ]}
	              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={themeColors.success}
                />
                <Text style={[styles.utilizationText, { color: themeColors.text }]}>
                  {option}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Trust & Compliance */}
        <Card
          style={[
            styles.trustCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
	          <View style={styles.trustHeader}>
	            <MaterialCommunityIcons
	              name="shield-check"
	              size={24}
	              color={themeColors.primary[500]}
	            />
            <Text style={[styles.trustTitle, { color: themeColors.text }]}>
              Safe & Regulated
            </Text>
          </View>
          <Text style={[styles.trustText, { color: themeColors.textSecondary }]}>
            This investment product is regulated and compliant with CMA standards.
          </Text>
        </Card>
      </ScrollView>

      {/* CTA Button - Sticky Footer */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
          <Button
            title="Invest Now"
            size="lg"
            onPress={() => {
              navigation.navigate('StartInvestment', {
                productId: product.id,
              });
            }}
          />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  errorText: {
    fontSize: 16,
    marginTop: spacing[3],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  heroCard: {
    padding: spacing[4],
    borderRadius: 12,
  },
  heroContent: {
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  metricsGrid: {
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
  },
  metricTile: {
    width: '50%',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: spacing[2],
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionCard: {
    padding: spacing[4],
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  calculatorCard: {
    padding: spacing[4],
    borderRadius: 8,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  projectionAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  projectionLabel: {
    fontSize: 12,
  },
  projectionReturn: {
    fontSize: 14,
    fontWeight: '600',
  },
  feesCard: {
    padding: spacing[4],
    borderRadius: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  utilizationCard: {
    padding: spacing[4],
    borderRadius: 8,
  },
  utilizationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderLeftWidth: 3,
    marginBottom: spacing[2],
    borderRadius: 6,
  },
  utilizationText: {
    fontSize: 14,
    flex: 1,
  },
  trustCard: {
    padding: spacing[4],
    borderRadius: 8,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  trustText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
  },
});
