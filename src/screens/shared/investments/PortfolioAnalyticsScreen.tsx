import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card } from '@/components/ui';
import { useInvestmentPortfolio } from './hooks';
import { formatCurrency, formatPercentage } from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const PortfolioAnalyticsScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const { summary, analytics, isLoading } = useInvestmentPortfolio('');
  const [period, setPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('1y');

  const metrics = useMemo(() => {
    if (!summary) return null;
    const totalInvested = parseFloat(summary.total_invested) || 0;
    const currentValue = parseFloat(summary.current_value) || 0;
    const gains = currentValue - totalInvested;
    const gainsPercent = totalInvested > 0 ? (gains / totalInvested) * 100 : 0;
    return {
      totalInvested,
      currentValue,
      gains,
      gainsPercent,
      activeCount: summary.active_count || 0,
      maturedCount: summary.matured_count || 0,
    };
  }, [summary]);

  const insights = [
    {
      icon: 'target',
      title: 'Portfolio on Track',
      description: 'Your investments are performing well',
    },
    {
      icon: 'trending-up',
      title: 'Consistent Growth',
      description: 'Average growth of 8.5% YTD',
    },
    {
      icon: 'alert-circle',
      title: 'Action Needed',
      description: 'One investment maturing soon',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Portfolio Analytics" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
	          {(['3m', '6m', '1y', 'all'] as const).map(p => (
	            <TouchableOpacity
	              key={p}
	              style={[
	                styles.periodBtn,
	                {
	                  backgroundColor: period === p ? themeColors.primary[500] : themeColors.card,
	                  borderColor: themeColors.border,
	                },
	              ]}
	              onPress={() => setPeriod(p)}
	            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p ? '#fff' : themeColors.text },
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        {metrics && (
          <>
	            <Card
	              style={[
	                styles.metricsCard,
	                {
	                  backgroundColor: themeColors.accent[200],
	                  marginHorizontal: spacing[4],
	                  marginTop: spacing[4],
	                },
	              ]}
	            >
              <View style={styles.metricRow}>
                <View>
                  <Text style={[styles.metricLabel, { color: '#000' }]}>
                    Portfolio Value
                  </Text>
                  <Text style={[styles.metricValue, { color: '#000' }]}>
                    {formatCurrency(metrics.currentValue)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.gainLabel, { color: '#000' }]}>
                    Total Gain
                  </Text>
                  <Text
                    style={[
                      styles.gainValue,
                      { color: metrics.gains >= 0 ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {metrics.gains >= 0 ? '+' : ''}{formatCurrency(metrics.gains)} (
                    {formatPercentage(metrics.gainsPercent)})
                  </Text>
                </View>
              </View>
            </Card>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
	              <Card
	                style={[
	                  styles.summaryCard,
	                  { backgroundColor: themeColors.card },
	                ]}
	              >
	                <MaterialCommunityIcons
	                  name="cash-multiple"
	                  size={24}
	                  color={themeColors.primary[500]}
	                />
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                  Total Invested
                </Text>
	                <Text style={[styles.summaryValue, { color: themeColors.primary[500] }]}>
	                  {formatCurrency(metrics.totalInvested)}
	                </Text>
              </Card>

              <Card
                style={[
                  styles.summaryCard,
                  { backgroundColor: themeColors.card },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={themeColors.success}
                />
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                  Active
                </Text>
                <Text style={[styles.summaryValue, { color: themeColors.success }]}>
                  {metrics.activeCount}
                </Text>
              </Card>

              <Card
                style={[
                  styles.summaryCard,
                  { backgroundColor: themeColors.card },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={24}
                  color={themeColors.warning}
                />
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                  Matured
                </Text>
                <Text style={[styles.summaryValue, { color: themeColors.warning }]}>
                  {metrics.maturedCount}
                </Text>
              </Card>
            </View>
          </>
        )}

        {/* Insights */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Insights
          </Text>
          {insights.map((insight, idx) => (
            <Card
              key={idx}
              style={[
                styles.insightCard,
                {
                  backgroundColor: themeColors.card,
                  marginBottom: spacing[2],
                },
              ]}
            >
              <View style={styles.insightRow}>
	                <View
	                  style={[
	                    styles.insightIcon,
	                    { backgroundColor: themeColors.primary[500] + '20' },
	                  ]}
	                >
	                  <MaterialCommunityIcons
	                    name={insight.icon as any}
	                    size={20}
	                    color={themeColors.primary[500]}
	                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: themeColors.text }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightDesc, { color: themeColors.textSecondary }]}>
                    {insight.description}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  periodContainer: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  periodBtn: { flex: 1, paddingVertical: spacing[2], borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  periodText: { fontSize: 11, fontWeight: '600' },
  metricsCard: { padding: spacing[4], borderRadius: 12, marginBottom: spacing[4] },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 12 },
  metricValue: { fontSize: 24, fontWeight: '700', marginTop: spacing[1] },
  gainLabel: { fontSize: 12, marginBottom: spacing[1] },
  gainValue: { fontSize: 16, fontWeight: '700' },
  summaryContainer: { flexDirection: 'row', gap: spacing[2], marginHorizontal: spacing[4] },
  summaryCard: { flex: 1, padding: spacing[3], borderRadius: 8, alignItems: 'center' },
  summaryTitle: { fontSize: 11, marginTop: spacing[2] },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: spacing[1] },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  insightCard: { padding: spacing[3], borderRadius: 8 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  insightIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  insightTitle: { fontSize: 13, fontWeight: '600' },
  insightDesc: { fontSize: 12, marginTop: spacing[1] },
});
