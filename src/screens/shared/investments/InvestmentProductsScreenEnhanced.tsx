/**
 * Investment Products Screen - Premium product discovery
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { InvestmentProduct } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

import { useInvestmentProducts } from './hooks';
import {
  InvestmentProductCard,
  SkeletonLoader,
} from './components';
import { PremiumHeroCard } from './investmentUi';
import { getRiskColor } from './utils';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'InvestmentProducts'>;
type Route = RouteProp<MainStackParamList, 'InvestmentProducts'>;

export const InvestmentProductsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors: themeColors } = useTheme();
  const { activeChama, activeChamaId } = useActiveChama();

  const chamaId = route.params?.chamaId || activeChamaId || '';
  
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'return' | 'term' | 'risk'>('return');

  const { products, isLoading, refetch } = useInvestmentProducts(chamaId, search);

  // Filter and sort products
  const filtered = useMemo(() => {
    let result = [...products];

    // Apply risk filter
    if (selectedRisk) {
      result = result.filter(
        (p) => (p.risk_level || 'medium').toLowerCase() === selectedRisk.toLowerCase()
      );
    }

    // Apply duration filter
    if (selectedDuration) {
      result = result.filter((p) => {
        const term = parseInt(String(p.term_days || '0'));
        if (selectedDuration === 'short') return term <= 90;
        if (selectedDuration === 'medium') return term > 90 && term <= 365;
        if (selectedDuration === 'long') return term > 365;
        return true;
      });
    }

    // Apply sorting
    if (sortBy === 'return') {
      result.sort(
        (a, b) => parseFloat(b.expected_return_percent || '0') - parseFloat(a.expected_return_percent || '0')
      );
    } else if (sortBy === 'term') {
      result.sort((a, b) => parseInt(String(a.term_days || '0')) - parseInt(String(b.term_days || '0')));
    } else if (sortBy === 'risk') {
      const riskOrder: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
      result.sort(
        (a, b) => (riskOrder[a.risk_level?.toLowerCase() || 'medium'] || 2) - (riskOrder[b.risk_level?.toLowerCase() || 'medium'] || 2)
      );
    }

    return result;
  }, [products, selectedRisk, selectedDuration, sortBy]);

  if (isLoading && products.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Investment Products" subtitle="Explore opportunities" />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonLoader height={20} style={{ marginBottom: spacing[2] }} />
              <SkeletonLoader height={60} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const riskOptions = [
    { value: 'low', label: 'Low Risk', icon: 'shield-check' },
    { value: 'medium', label: 'Medium Risk', icon: 'alert-circle' },
    { value: 'high', label: 'High Risk', icon: 'alert' },
  ];

  const durationOptions = [
    { value: 'short', label: '< 3 months' },
    { value: 'medium', label: '3-12 months' },
    { value: 'long', label: '> 1 year' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader
        title="Investment Products"
        subtitle={`${filtered.length} product${filtered.length !== 1 ? 's' : ''} available`}
        onAction={() => navigation.navigate('MyInvestments', { chamaId })}
        actionIcon="briefcase"
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Hero Card */}
            <PremiumHeroCard
              eyebrow="Investment Portal"
              title={`Grow your wealth inside ${activeChama?.name || 'MyChama'}`}
              subtitle="Handpicked products. Transparent returns. Your control."
              footer={
                <Button
                  title="View My Portfolio"
                  variant="outline"
                  onPress={() => navigation.navigate('MyInvestments', { chamaId })}
                />
              }
            />

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Icon name="magnify" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Search products"
                placeholderTextColor={themeColors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips - Risk */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Risk Level</Text>
              <View style={styles.filterChips}>
                {riskOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          selectedRisk === option.value
                            ? getRiskColor(option.value)
                            : themeColors.surface,
                        borderColor:
                          selectedRisk === option.value
                            ? getRiskColor(option.value)
                            : themeColors.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedRisk(selectedRisk === option.value ? null : option.value)
                    }
                  >
                    <Icon
                      name={option.icon as any}
                      size={14}
                      color={selectedRisk === option.value ? 'white' : themeColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            selectedRisk === option.value ? 'white' : themeColors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Chips - Duration */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.text }]}>Duration</Text>
              <View style={styles.filterChips}>
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          selectedDuration === option.value
                            ? colors.primary[600]
                            : themeColors.surface,
                        borderColor:
                          selectedDuration === option.value
                            ? colors.primary[600]
                            : themeColors.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedDuration(
                        selectedDuration === option.value ? null : option.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            selectedDuration === option.value ? 'white' : themeColors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.sortSection}>
              <Text style={[styles.sortLabel, { color: themeColors.textSecondary }]}>Sort By</Text>
              <View style={styles.sortButtons}>
                {[
                  { value: 'return' as const, label: 'Return' },
                  { value: 'term' as const, label: 'Term' },
                  { value: 'risk' as const, label: 'Risk' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortButton,
                      {
                        backgroundColor:
                          sortBy === option.value
                            ? colors.primary[600]
                            : themeColors.surface,
                      },
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text
                      style={[
                        styles.sortButtonText,
                        {
                          color:
                            sortBy === option.value
                              ? 'white'
                              : themeColors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Results Info */}
            {filtered.length > 0 && (
              <Text style={[styles.resultCount, { color: themeColors.textSecondary }]}>
                Showing {filtered.length} of {products.length} products
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <InvestmentProductCard
            name={item.name}
            description={item.short_description || 'Premium investment opportunity'}
            riskLevel={(item.risk_level?.toLowerCase() as any) || 'medium'}
            minAmount={`KES ${parseInt(String(item.minimum_investment || '0')).toLocaleString()}`}
            expectedReturn={`${item.expected_return_percent || '12'}% p.a.`}
            duration={`${item.term_days || '365'} days`}
            lockPeriod={`${item.lock_period_days || '0'} days`}
            onPress={() =>
              navigation.navigate('InvestmentProductDetail', {
                productId: item.id,
                chamaId,
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No products found"
            message="Adjust your filters or try a different search"
            icon="briefcase-off-outline"
          />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  skeletonContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  skeletonCard: {
    gap: spacing[2],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
  },
  filterSection: {
    marginBottom: spacing[4],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing[1],
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  sortSection: {
    marginBottom: spacing[4],
  },
  sortLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sortButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  resultCount: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
