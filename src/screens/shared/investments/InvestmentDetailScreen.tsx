import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentDetail } from './hooks';
import {
  InvestmentProgressCard,
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import {
  formatCurrency,
  formatDate,
  formatDays,
  calculateDaysRemaining,
} from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Route = {
  params?: { investmentId: string; chamaId?: string };
};

// Helper function to calculate progress percentage
const calculateProgressPercentage = (currentValue: string | number, expectedValue: string | number): number => {
  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
  const expected = typeof expectedValue === 'string' ? parseFloat(expectedValue) : expectedValue;
  if (expected <= 0) return 0;
  return Math.min(100, (current / expected) * 100);
};

export const InvestmentDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<any, 'InvestmentDetail'>>();
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();

  const investmentId = route.params?.investmentId || '';
  const chamaId = route.params?.chamaId;
  const { investment, isLoading, refetch } = useInvestmentDetail(investmentId, chamaId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const daysRemaining = investment ? calculateDaysRemaining(investment.maturity_date || '') : 0;
  const daysLocked = investment && investment.lock_until_date ? calculateDaysRemaining(investment.lock_until_date) : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Investment Details" />
        <View style={{ paddingHorizontal: spacing[4] }}>
          <SkeletonLoader />
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
        <ModernHeader title="Investment Details" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={themeColors.error}
          />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Investment not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const breakdown = {
    principal: investment.principal_amount,
    currentValue: investment.current_value,
    realizedReturns: investment.realized_returns || 0,
    unrealizedReturns: investment.unrealized_returns || 0,
    availableReturns: investment.available_returns || 0,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title={investment.product_name} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Progress Card */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[4] }}>
          <InvestmentProgressCard
            title={investment.product_name}
            principalAmount={investment.principal_amount}
            currentAmount={investment.current_value}
            progressPercentage={calculateProgressPercentage(investment.current_value, investment.expected_value_at_maturity)}
            startDate={investment.started_at || investment.created_at || ''}
            maturityDate={investment.maturity_date || ''}
          />
        </View>

        {/* Returns Breakdown */}
        <Card
          style={[
            styles.returnsCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Returns Overview
          </Text>
          <View style={styles.returnRow}>
            <Text style={[styles.returnLabel, { color: themeColors.textSecondary }]}>
              Realized Returns
            </Text>
            <Text style={[styles.returnValue, { color: themeColors.success }]}>
              +{formatCurrency(investment.realized_returns || 0)}
            </Text>
          </View>
          <View style={styles.returnRow}>
            <Text style={[styles.returnLabel, { color: themeColors.textSecondary }]}>
              Unrealized Returns
            </Text>
            <Text style={[styles.returnValue, { color: themeColors.warning }]}>
              +{formatCurrency(investment.unrealized_returns || 0)}
            </Text>
          </View>
          <View
            style={[
              styles.returnRow,
              { borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: spacing[3] },
            ]}
          >
            <Text style={[styles.returnLabel, { color: themeColors.text, fontWeight: '600' }]}>
              Available to Use
            </Text>
            <Text style={[styles.returnValue, { color: themeColors.primary[500], fontWeight: '700' }]}>
              {formatCurrency(investment.available_returns || 0)}
            </Text>
          </View>
        </Card>

        {/* Timeline */}
        <Card
          style={[
            styles.timelineCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Timeline
          </Text>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: themeColors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.timelineLabel, { color: themeColors.text }]}>
                Created
              </Text>
              <Text style={[styles.timelineDate, { color: themeColors.textSecondary }]}>
                {formatDate(investment.created_at)}
              </Text>
            </View>
          </View>
          {investment.lock_until_date && daysLocked > 0 && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: themeColors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineLabel, { color: themeColors.text }]}>
                  Locked Until
                </Text>
                <Text style={[styles.timelineDate, { color: themeColors.textSecondary }]}>
                  {formatDate(investment.lock_until_date || '')} ({formatDays(daysLocked)})
                </Text>
              </View>
            </View>
          )}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: themeColors.primary[500] }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.timelineLabel, { color: themeColors.text }]}>
                Maturity
              </Text>
              <Text style={[styles.timelineDate, { color: themeColors.textSecondary }]}>
                {formatDate(investment.maturity_date || '')} ({formatDays(daysRemaining)})
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        {parseFloat(investment.available_returns || '0') > 0 && (
          <Card
            style={[
              styles.actionsCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[5],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
              Quick Actions
            </Text>
            <Button
              title="Use Returns"
              size="sm"
              onPress={() => {
                (navigation.navigate as any)('UtilizeReturns', {
                  investmentId,
                });
              }}
              style={{ marginBottom: spacing[2] }}
            />
            <Button
              title="Reinvest"
              size="sm"
              variant="outline"
              onPress={() => {
                (navigation.navigate as any)('ReinvestReturns', {
                  investmentId,
                });
              }}
              style={{ marginBottom: spacing[2] }}
            />
            <Button
              title="Redeem"
              size="sm"
              variant="outline"
              onPress={() => {
                (navigation.navigate as any)('RedeemInvestment', {
                  investmentId,
                });
              }}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, marginTop: spacing[3] },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  returnsCard: { padding: spacing[4], borderRadius: 8 },
  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  returnLabel: { fontSize: 13 },
  returnValue: { fontSize: 14, fontWeight: '600' },
  timelineCard: { padding: spacing[4], borderRadius: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: spacing[1] },
  timelineLabel: { fontSize: 13, fontWeight: '500' },
  timelineDate: { fontSize: 12, marginTop: spacing[1] },
  actionsCard: { padding: spacing[4], borderRadius: 8 },
});
