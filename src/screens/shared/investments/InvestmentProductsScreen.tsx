import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { investmentService } from '@/services/investmentService';
import { InvestmentProduct } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatStatus } from '@/utils/format';
import { getRiskTone, PremiumHeroCard, SectionTitle, StatusPill } from './investmentUi';

type Nav = NativeStackNavigationProp<MainStackParamList, 'InvestmentProducts'>;

export const InvestmentProductsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { colors: themeColors } = useTheme();
  const { activeChama, activeChamaId } = useActiveChama();
  const chamaId = route.params?.chamaId || activeChamaId;
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadProducts = async (isRefresh = false) => {
    if (!chamaId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await investmentService.getProducts({ chamaId, search });
      setProducts(data);
    } catch (error: any) {
      Alert.alert('Unable to load products', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [chamaId]);

  const filtered = search.trim()
    ? products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  if (!chamaId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <EmptyState title="Choose a chama first" message="Open a chama workspace to browse investment products." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {loading ? (
        <LoadingSpinner text="Loading investment products" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadProducts(true)} />}
          showsVerticalScrollIndicator={false}
        >
          <PremiumHeroCard
            eyebrow="Investments"
            title={`Build your portfolio inside ${activeChama?.name || 'MyChama'}`}
            subtitle="Compare products by risk, return range, term, and liquidity before you commit funds."
            footer={<Button title="My Portfolio" variant="outline" onPress={() => navigation.navigate('MyInvestments', { chamaId })} />}
          />

          <Input
            label="Search products"
            placeholder="Fixed return, long-term, pooled..."
            value={search}
            onChangeText={setSearch}
          />

          <SectionTitle title="Available products" subtitle={`${filtered.length} live opportunities`} />

          {filtered.length === 0 ? (
            <EmptyState
              icon="trending-up"
              title="No products available"
              message="This chama has not published any active investment products yet."
            />
          ) : (
            filtered.map((product) => {
              const riskTone = getRiskTone(product.risk_level);
              return (
                <TouchableOpacity
                  key={product.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('InvestmentProductDetail', { productId: product.id, chamaId })}
                >
                  <Card style={[styles.productCard, { backgroundColor: themeColors.card }]}>
                    <View style={styles.rowBetween}>
                      <View style={styles.titleBlock}>
                        <Text style={[styles.productTitle, { color: themeColors.text }]}>{product.name}</Text>
                        <Text style={[styles.productDescription, { color: themeColors.textSecondary }]}>
                          {product.description}
                        </Text>
                      </View>
                      <StatusPill label={product.risk_level_display || formatStatus(product.risk_level)} tone={riskTone} />
                    </View>

                    <View style={styles.metricRow}>
                      <View style={styles.metricCol}>
                        <Text style={[styles.metricCaption, { color: themeColors.textSecondary }]}>Minimum</Text>
                        <Text style={[styles.metricNumber, { color: themeColors.text }]}>
                          {formatCurrency(product.minimum_amount, product.currency)}
                        </Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={[styles.metricCaption, { color: themeColors.textSecondary }]}>Projected return</Text>
                        <Text style={[styles.metricNumber, { color: themeColors.text }]}>
                          {product.projected_return_min_rate}% - {product.projected_return_max_rate}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.footerRow}>
                      <View style={styles.metaPill}>
                        <Icon name="calendar-range" size={16} color={colors.primary[500]} />
                        <Text style={styles.metaPillText}>{product.term_days} day term</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Icon name="lock-outline" size={16} color={colors.primary[500]} />
                        <Text style={styles.metaPillText}>{product.lock_in_days} day lock</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: spacing[4],
    gap: spacing[4],
  },
  productCard: {
    marginBottom: spacing[4],
    gap: spacing[4],
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  titleBlock: {
    flex: 1,
    gap: spacing[1],
  },
  productTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  productDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metricCol: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
  },
  metricCaption: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing[1],
  },
  metricNumber: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  metaPillText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
});
