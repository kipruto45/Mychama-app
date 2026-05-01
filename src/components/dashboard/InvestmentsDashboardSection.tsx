/**
 * Dashboard Enhancement - Investment section for Members Dashboard
 * This component should be integrated into the main Members Dashboard
 */

import React, { useMemo } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';

import {
  useInvestmentPortfolio,
  useMyInvestments,
  PortfolioSummaryCard,
  ReturnsAvailableCard,
  InvestmentQuickActions,
  SkeletonLoader,
  computeInvestmentDisplayCards,
  computePortfolioDisplayState,
  calculateDaysRemaining,
  formatDate,
  formatCurrency,
  getInvestmentStatusLabel,
  type PortfolioDisplayState,
} from '@/screens/shared/investments';

type Navigation = NativeStackNavigationProp<MainStackParamList>;

/**
 * InvestmentsDashboardSection
 * Displays investment portfolio summary and quick actions on the main dashboard
 * Should be positioned prominently below or alongside other dashboard sections
 */
export const InvestmentsDashboardSection: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();
  type IconName = React.ComponentProps<typeof Icon>['name'];

  const { investments, isLoading: investmentsLoading } = useMyInvestments(activeChamaId || undefined);
  const { summary, isLoading: summaryLoading } = useInvestmentPortfolio(activeChamaId || undefined);

  const [portfolio, setPortfolio] = React.useState<PortfolioDisplayState | null>(null);

  React.useEffect(() => {
    if (summary && investments.length > 0) {
      setPortfolio(computePortfolioDisplayState(summary, investments));
    }
  }, [summary, investments]);

  // Quick actions configuration
  const quickActions = useMemo(
    (): Array<{
      id: string;
      icon: IconName;
      label: string;
      subtitle: string;
      onPress: () => void;
      disabled?: boolean;
    }> => [
      {
        id: 'invest',
        icon: 'plus-circle',
        label: 'Invest Now',
        subtitle: 'Browse products',
        onPress: () => {
          navigation.navigate('InvestmentProducts', { chamaId: activeChamaId || undefined });
        },
      },
      {
        id: 'portfolio',
        icon: 'briefcase',
        label: 'My Portfolio',
        subtitle: `${investments.length} active`,
        onPress: () => {
          navigation.navigate('MyInvestments', { chamaId: activeChamaId || undefined });
        },
        disabled: investments.length === 0,
      },
      {
        id: 'returns',
        icon: 'gift',
        label: 'Use Returns',
        subtitle: 'Withdraw or reinvest',
        onPress: () => {
          const invWithReturns = investments.find(
            (inv) => inv.status === 'active' && parseFloat(inv.unrealized_gains || '0') > 0
          );
          if (invWithReturns) {
            navigation.navigate('UtilizeReturns', {
              investmentId: invWithReturns.id,
              chamaId: activeChamaId || undefined,
            });
          }
        },
        disabled:
          investments.length === 0 ||
          !investments.some((inv) => inv.status === 'active' && parseFloat(inv.unrealized_gains || '0') > 0),
      },
      {
        id: 'analytics',
        icon: 'chart-line',
        label: 'Analytics',
        subtitle: 'Growth stats',
        onPress: () => {
          navigation.navigate('PortfolioAnalytics', { chamaId: activeChamaId || undefined });
        },
        disabled: investments.length === 0,
      },
      {
        id: 'history',
        icon: 'history',
        label: 'History',
        subtitle: 'Transactions',
        onPress: () => {
          navigation.navigate('InvestmentHistory', { chamaId: activeChamaId || undefined });
        },
        disabled: investments.length === 0,
      },
      {
        id: 'learn',
        icon: 'book-open',
        label: 'Learn',
        subtitle: 'How it works',
        onPress: () => {
          navigation.navigate('InvestmentLearn', { chamaId: activeChamaId || undefined });
        },
      },
    ],
    [investments, activeChamaId]
  );

  // Compute alerts
  const alerts = useMemo(() => {
    const alertList: any[] = [];

    if (!portfolio) return alertList;

    // Available returns alert
    if (parseFloat(portfolio.availableReturns || '0') > 0) {
      alertList.push({
        id: 'returns',
        type: 'returns_available' as const,
        title: 'Returns Available',
        description: `KES ${portfolio.availableReturns} ready to use`,
        icon: 'gift-outline',
      });
    }

    // Upcoming maturity alert
    if (portfolio.nextMaturityDate) {
      const daysRemaining = calculateDaysRemaining(portfolio.nextMaturityDate);
      if (daysRemaining <= 30 && daysRemaining > 0) {
        alertList.push({
          id: 'maturity',
          type: 'maturity' as const,
          title: 'Investment Maturing Soon',
          description: `Matures in ${daysRemaining} days`,
          icon: 'calendar-alert',
        });
      }
    }

    // Reinvestment opportunity alert
    const maturedCount = investments.filter((inv) => inv.status === 'matured').length;
    if (maturedCount > 0) {
      alertList.push({
        id: 'reinvest',
        type: 'reinvestment_opportunity' as const,
        title: 'Reinvestment Opportunity',
        description: `${maturedCount} investment${maturedCount > 1 ? 's' : ''} ready to reinvest`,
        icon: 'sync',
      });
    }

    return alertList;
  }, [portfolio, investments]);

  if (!activeChamaId) {
    return null; // Don't show if no active chama
  }

  const isLoading = investmentsLoading || summaryLoading;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Investments
          </Text>
          <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
            Grow your wealth with premium products
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyInvestments', { chamaId: activeChamaId })}
        >
          <Icon name="arrow-right" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader height={160} style={{ marginBottom: spacing[3] }} />
          <SkeletonLoader height={80} />
        </View>
      ) : (
        <>
          {/* Portfolio Summary (mini version) */}
          {portfolio ? (
            <>
              <PortfolioSummaryCard
                portfolio={portfolio}
                onViewPortfolio={() =>
                  navigation.navigate('MyInvestments', { chamaId: activeChamaId })
                }
              />

              {/* Alerts */}
              {alerts.map((alert) => (
                <View key={alert.id} style={{ marginBottom: spacing[3] }}>
                  {alert.type === 'returns_available' && (
                    <ReturnsAvailableCard
                      amount={portfolio.availableReturns}
                      onUtilize={() => {
                        const invWithReturns = investments.find(
                          (inv) =>
                            inv.status === 'active' &&
                            parseFloat(inv.unrealized_gains || '0') > 0
                        );
                        if (invWithReturns) {
                          navigation.navigate('UtilizeReturns', {
                            investmentId: invWithReturns.id,
                            chamaId: activeChamaId,
                          });
                        }
                      }}
                    />
                  )}

                  {alert.type === 'maturity' && (
                    <MaturityAlertCard
                      daysRemaining={calculateDaysRemaining(portfolio.nextMaturityDate || '')}
                      maturityDate={formatDate(portfolio.nextMaturityDate || '')}
                      onPrepare={() =>
                        navigation.navigate('MyInvestments', {
                          chamaId: activeChamaId,
                          initialTab: 'matured',
                        })
                      }
                    />
                  )}

                  {alert.type === 'reinvestment_opportunity' && (
                    <Card style={[styles.alertCard, { backgroundColor: colors.primary[50] }]}>
                      <View style={styles.alertCardContent}>
                        <Icon name="sync" size={24} color={colors.primary[600]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.alertTitle, { color: colors.primary[700] }]}>
                            {alert.title}
                          </Text>
                          <Text
                            style={[styles.alertDescription, { color: colors.primary[600] }]}
                          >
                            {alert.description}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={colors.primary[600]} />
                      </View>
                    </Card>
                  )}
                </View>
              ))}
            </>
          ) : (
            <Card style={[styles.emptyCard, { backgroundColor: colors.primary[50] }]}>
              <Icon name="briefcase" size={40} color={colors.primary[600]} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No Investments Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                Start investing to grow your wealth
              </Text>
            </Card>
          )}

          {/* Quick Actions */}
          <InvestmentQuickActions actions={quickActions} />
        </>
      )}
    </View>
  );
};

/**
 * MaturityAlertCard
 * Reusable component for maturity alerts
 */
interface MaturityAlertCardProps {
  daysRemaining: number;
  maturityDate: string;
  onPrepare: () => void;
}

export const MaturityAlertCard: React.FC<MaturityAlertCardProps> = ({
  daysRemaining,
  maturityDate,
  onPrepare,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPrepare}>
      <Card style={styles.maturityAlertCard}>
        <View style={styles.maturityAlertContent}>
          <View
            style={[
              styles.maturityAlertIcon,
              { backgroundColor: `${colors.warning || '#F59E0B'}15` },
            ]}
          >
            <Icon name="calendar-alert" size={24} color={colors.warning || '#F59E0B'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.maturityAlertTitle}>Investment Maturing Soon</Text>
            <Text style={styles.maturityAlertSubtitle}>
              {daysRemaining} day{daysRemaining === 1 ? '' : 's'} until {maturityDate}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.warning || '#F59E0B'} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing[2],
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  loadingContainer: {
    gap: spacing[3],
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
  },
  alertCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  alertDescription: {
    fontSize: typography.fontSize.sm,
  },
  maturityAlertCard: {
    marginBottom: spacing[3],
  },
  maturityAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  maturityAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maturityAlertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.warning || '#F59E0B',
    marginBottom: spacing[1],
  },
  maturityAlertSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
});
