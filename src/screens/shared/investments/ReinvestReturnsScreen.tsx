import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentDetail, useInvestmentProducts } from './hooks';
import {
  InvestmentProductCard,
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import { formatCurrency, formatPercentage } from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { MainStackParamList } from '@/navigation/types';

type ReinvestReturnsRouteProp = RouteProp<
  { ReinvestReturns: { investmentId: string; chamaId?: string } },
  'ReinvestReturns'
>;
type InvestmentNavProp = NativeStackNavigationProp<MainStackParamList>;

export const ReinvestReturnsScreen: React.FC = () => {
  const route = useRoute<ReinvestReturnsRouteProp>();
  const navigation = useNavigation<InvestmentNavProp>();
  const { colors: themeColors } = useTheme();

  const investmentId = route.params?.investmentId || '';
  const chamaId = route.params?.chamaId;
  const { investment, isLoading: investmentLoading } = useInvestmentDetail(investmentId, chamaId);
  const { products, isLoading: productsLoading } = useInvestmentProducts(chamaId);

  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const projection = useMemo(() => {
    if (!investment || !selectedProduct) return null;
    const returns = parseFloat(investment.available_returns || '0') || 0;
    const expected = parseFloat(
      selectedProduct.expected_return_percentage ||
        selectedProduct.expected_return_percent ||
        selectedProduct.expected_return_rate ||
        '0'
    ) || 0;
    const projected = returns + (returns * expected) / 100;
    return {
      principal: returns,
      projected,
      gains: projected - returns,
      expectedReturn: expected,
    };
  }, [investment, selectedProduct]);

  const handleConfirm = () => {
    if (!selectedProduct) return;
    navigation.navigate('StartInvestment', { productId: selectedProduct.id, chamaId });
  };

  if (productsLoading || investmentLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Reinvest Returns" />
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
      <ModernHeader title="Reinvest Returns" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Available Returns */}
        {investment && (
          <Card
            style={[
              styles.returnsCard,
              {
                backgroundColor: themeColors.success + '20',
                marginHorizontal: spacing[4],
                marginTop: spacing[4],
              },
            ]}
          >
            <View style={styles.returnsHeader}>
              <View>
                <Text style={[styles.returnsLabel, { color: themeColors.textSecondary }]}>
                  Available to Reinvest
                </Text>
                <Text style={[styles.returnsAmount, { color: themeColors.success }]}>
                  {formatCurrency(investment.available_returns)}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="reload"
                size={32}
                color={themeColors.success}
              />
            </View>
          </Card>
        )}

        {/* Product Selection */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Choose a Product
          </Text>
          <View style={styles.productsContainer}>
            {products?.map(product => (
              <TouchableOpacity
                key={product.id}
                onPress={() => setSelectedProductId(product.id)}
              >
                <Card
                  style={[
                    styles.productCard,
                    {
	                      backgroundColor: selectedProductId === product.id
	                        ? themeColors.primary[500] + '20'
	                        : themeColors.card,
	                      borderColor: selectedProductId === product.id
	                        ? themeColors.primary[500]
	                        : themeColors.border,
                      borderWidth: selectedProductId === product.id ? 2 : 1,
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
                        )}
                      </Text>
                    </View>
	                    {selectedProductId === product.id && (
	                      <MaterialCommunityIcons
	                        name="check-circle"
	                        size={24}
	                        color={themeColors.primary[500]}
	                      />
	                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Projection */}
        {selectedProduct && projection && (
          <>
            <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Projected Growth
              </Text>
              <Card
                style={[
                  styles.projectionCard,
                  { backgroundColor: themeColors.card },
                ]}
              >
                <View style={styles.projectionRow}>
                  <View>
                    <Text style={[styles.projLabel, { color: themeColors.textSecondary }]}>
                      Reinvest
                    </Text>
                    <Text style={[styles.projValue, { color: themeColors.text }]}>
                      {formatCurrency(projection.principal)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={24}
                    color={themeColors.textSecondary}
                  />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.projLabel, { color: themeColors.textSecondary }]}>
                      Future Value
                    </Text>
	                    <Text style={[styles.projValue, { color: themeColors.primary[500] }]}>
	                      {formatCurrency(projection.projected)}
	                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.gainsRow,
                    { borderTopColor: themeColors.border, borderTopWidth: 1 },
                  ]}
                >
                  <Text style={[styles.gainsLabel, { color: themeColors.textSecondary }]}>
                    Additional Gains
                  </Text>
                  <Text style={[styles.gainsValue, { color: themeColors.success }]}>
                    +{formatCurrency(projection.gains)}
                  </Text>
                </View>
              </Card>
            </View>

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
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
                Terms
              </Text>
	              <View style={styles.termRow}>
	                <MaterialCommunityIcons
	                  name="lock-clock"
	                  size={16}
	                  color={themeColors.primary[500]}
	                />
                <Text style={[styles.termText, { color: themeColors.text }]}>
                  Lock period: {selectedProduct.lock_period_days ?? selectedProduct.lock_in_days} days
                </Text>
              </View>
	              <View style={styles.termRow}>
	                <MaterialCommunityIcons
	                  name="percent"
	                  size={16}
	                  color={themeColors.primary[500]}
	                />
                <Text style={[styles.termText, { color: themeColors.text }]}>
                  Expected return:{' '}
                  {formatPercentage(
                    selectedProduct.expected_return_percentage ||
                      selectedProduct.expected_return_percent ||
                      selectedProduct.expected_return_rate ||
                      '0'
                  )}
                </Text>
              </View>
            </Card>
          </>
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
          title="Continue with Selected Product"
          size="lg"
          onPress={handleConfirm}
          disabled={!selectedProductId}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  returnsCard: { padding: spacing[4], borderRadius: 8 },
  returnsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  returnsLabel: { fontSize: 12 },
  returnsAmount: { fontSize: 24, fontWeight: '700', marginTop: spacing[1] },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  productsContainer: { gap: spacing[2] },
  productCard: { padding: spacing[3], borderRadius: 8 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '600' },
  productReturn: { fontSize: 12, marginTop: spacing[1] },
  projectionCard: { padding: spacing[4], borderRadius: 8 },
  projectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projLabel: { fontSize: 12 },
  projValue: { fontSize: 16, fontWeight: '700', marginTop: spacing[1] },
  gainsRow: { paddingTop: spacing[3], marginTop: spacing[3], flexDirection: 'row', justifyContent: 'space-between' },
  gainsLabel: { fontSize: 12 },
  gainsValue: { fontSize: 16, fontWeight: '700' },
  termsCard: { padding: spacing[4], borderRadius: 8 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  termText: { fontSize: 13 },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
