/**
 * My Investments Screen - Portfolio management
 */

import React, { useMemo, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';

import { useMyInvestments, useInvestmentPortfolio } from './hooks';
import {
  InvestmentProgressCard,
  PortfolioSummaryCard,
  ReturnsAvailableCard,
  SkeletonLoader,
} from './components';
import {
  computeInvestmentDisplayCards,
  computePortfolioDisplayState,
  formatCurrency,
  formatDate,
  getInvestmentStatusLabel,
  sortInvestmentsByDate,
} from './utils';
import { PortfolioDisplayState } from './types';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'MyInvestments'>;
type Route = RouteProp<MainStackParamList, 'MyInvestments'>;

const tabs = ['active', 'matured', 'redeemed', 'utilized', 'all'] as const;

export const MyInvestmentsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();

  const chamaId = (route.params?.chamaId || activeChamaId) || undefined;
  const initialTab = (route.params?.initialTab || 'active') as typeof tabs[number];

  const [activeTab, setActiveTab] = useState<typeof tabs[number]>(initialTab);
  const { investments, isLoading, refetch } = useMyInvestments(chamaId);
  const { summary, isLoading: summaryLoading } = useInvestmentPortfolio(chamaId);

  const [portfolio, setPortfolio] = useState<PortfolioDisplayState | null>(null);

  React.useEffect(() => {
    if (summary && investments.length > 0) {
      setPortfolio(computePortfolioDisplayState(summary, investments));
    }
  }, [summary, investments]);

  const filteredInvestments = useMemo(() => {
    let result = [...investments];

    if (activeTab !== 'all') {
      result = result.filter((inv) => inv.status === activeTab);
    }

    return sortInvestmentsByDate(result, 'desc');
  }, [investments, activeTab]);

  const tabCounts = useMemo(
    () => ({
      active: investments.filter((i) => i.status === 'active').length,
      matured: investments.filter((i) => i.status === 'matured').length,
      redeemed: investments.filter((i) => i.status === 'redeemed').length,
      utilized: investments.filter((i) => i.status === 'utilized').length,
      all: investments.length,
    }),
    [investments]
  );

  if (!chamaId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <EmptyState
          title="Select a chama"
          message="Open a chama workspace to view your investments"
        />
      </SafeAreaView>
    );
  }

  if (isLoading && investments.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="My Investments" subtitle="Your portfolio" />
        <View style={styles.skeletonContainer}>
          <SkeletonLoader height={160} style={{ marginBottom: spacing[3] }} />
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} height={120} style={{ marginBottom: spacing[3] }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader
        title="My Investments"
        subtitle="Track your portfolio"
        onAction={() => navigation.navigate('InvestmentProducts', { chamaId })}
        actionIcon="plus"
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={filteredInvestments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Portfolio Summary */}
            {portfolio && !summaryLoading && (
              <>
                <PortfolioSummaryCard
                  portfolio={portfolio}
                  onViewPortfolio={() => {}}
                />

                {/* Returns Available Card */}
                {parseFloat(portfolio.availableReturns || '0') > 0 && (
                  <ReturnsAvailableCard
                    amount={`KES ${portfolio.availableReturns}`}
                    onUtilize={() => {
                      // Find first active investment with returns
                      const invWithReturns = investments.find(
                        (inv) =>
                          inv.status === 'active' &&
                          parseFloat(inv.unrealized_gains || '0') > 0
                      );
                      if (invWithReturns) {
                        navigation.navigate('UtilizeReturns', {
                          investmentId: invWithReturns.id,
                          chamaId,
                        });
                      }
                    }}
                  />
                )}

                {/* Tabs */}
                <View style={styles.tabs}>
                  <FlatList
                    horizontal
                    data={tabs}
                    keyExtractor={(tab) => tab}
                    renderItem={({ item: tab }) => (
                      <TouchableOpacity
                        style={[
                          styles.tab,
                          {
                            borderBottomColor:
                              activeTab === tab ? colors.primary[600] : 'transparent',
                            borderBottomWidth: activeTab === tab ? 2 : 0,
                          },
                        ]}
                        onPress={() => setActiveTab(tab)}
                      >
                        <Text
                          style={[
                            styles.tabLabel,
                            {
                              color:
                                activeTab === tab
                                  ? colors.primary[600]
                                  : themeColors.textSecondary,
                            },
                          ]}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                        <Text
                          style={[
                            styles.tabCount,
                            {
                              color:
                                activeTab === tab
                                  ? colors.primary[600]
                                  : themeColors.textSecondary,
                            },
                          ]}
                        >
                          {tabCounts[tab]}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              </>
            )}
          </>
        }
        renderItem={({ item: investment }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('InvestmentDetail', {
                investmentId: investment.id,
                chamaId,
              })
            }
          >
            <Card
              style={[
                styles.investmentCard,
                { backgroundColor: themeColors.card },
              ]}
            >
              {/* Header */}
              <View style={styles.investmentCardHeader}>
                <View>
                  <Text style={[styles.investmentCardName, { color: themeColors.text }]}>
                    {typeof investment.product === 'string'
                      ? investment.product
                      : investment.product?.name || 'Investment'}
                  </Text>
                  <Text
                    style={[styles.investmentCardDate, { color: themeColors.textSecondary }]}
                  >
                    {formatDate(investment.investment_date || '')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.investmentStatusBadge,
                    {
                      backgroundColor:
                        investment.status === 'active'
                          ? '#E8F7ED'
                          : investment.status === 'matured'
                            ? '#FFF4E5'
                            : '#EEF2FF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.investmentStatusLabel,
                      {
                        color:
                          investment.status === 'active'
                            ? '#156F3D'
                            : investment.status === 'matured'
                              ? '#9A5B00'
                              : colors.primary[600],
                      },
                    ]}
                  >
                    {getInvestmentStatusLabel(investment.status)}
                  </Text>
                </View>
              </View>

              {/* Metrics */}
              <View style={styles.investmentMetrics}>
                <View style={styles.investmentMetric}>
                  <Text
                    style={[
                      styles.investmentMetricLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    Invested
                  </Text>
                  <Text
                    style={[styles.investmentMetricValue, { color: themeColors.text }]}
                  >
                    {formatCurrency(investment.principal_amount || '0')}
                  </Text>
                </View>

                <View style={styles.investmentMetricDivider} />

                <View style={styles.investmentMetric}>
                  <Text
                    style={[
                      styles.investmentMetricLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    Current Value
                  </Text>
                  <Text
                    style={[styles.investmentMetricValue, { color: colors.primary[600] }]}
                  >
                    {formatCurrency(investment.current_value || '0')}
                  </Text>
                </View>

                <View style={styles.investmentMetricDivider} />

                <View style={styles.investmentMetric}>
                  <Text
                    style={[
                      styles.investmentMetricLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    Returns
                  </Text>
                  <Text
                    style={[
                      styles.investmentMetricValue,
                      {
                        color:
                          parseFloat(investment.unrealized_gains || '0') >= 0
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    +{formatCurrency(investment.unrealized_gains || '0')}
                  </Text>
                </View>
              </View>

              {/* Footer CTA */}
              <View
                style={[
                  styles.investmentCardFooter,
                  { borderTopColor: themeColors.border, borderTopWidth: 1 },
                ]}
              >
                <Text style={[styles.investmentCardCTA, { color: colors.primary[600] }]}>
                  View Details
                </Text>
                <Icon name="chevron-right" size={20} color={colors.primary[600]} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title={
              activeTab === 'all'
                ? 'No investments yet'
                : `No ${activeTab} investments`
            }
            message={
              activeTab === 'all'
                ? 'Start your investment journey today'
                : 'Switch tabs to view other investments'
            }
            icon="briefcase-off-outline"
            action={{
              label: 'Explore Products',
              onPress: () => navigation.navigate('InvestmentProducts', { chamaId }),
            }}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
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
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    marginHorizontal: -spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginRight: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  tabCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  investmentCard: {
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  investmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  investmentCardName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  investmentCardDate: {
    fontSize: typography.fontSize.xs,
  },
  investmentStatusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  investmentStatusLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  investmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  investmentMetric: {
    flex: 1,
  },
  investmentMetricLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  investmentMetricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  investmentMetricDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    alignSelf: 'stretch',
  },
  investmentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  investmentCardCTA: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});
