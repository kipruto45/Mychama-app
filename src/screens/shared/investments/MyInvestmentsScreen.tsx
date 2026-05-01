import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers/ThemeProvider';
import { investmentService } from '@/services/investmentService';
import { MemberInvestmentPosition } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { SectionTitle, StatusPill } from './investmentUi';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MyInvestments'>;
const TABS: Array<{ key: string; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'matured', label: 'Matured' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'utilized', label: 'Utilized' },
  { key: 'all', label: 'All' },
];

export const MyInvestmentsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { colors: themeColors } = useTheme();
  const { activeChamaId } = useActiveChama();
  const chamaId = route.params?.chamaId || activeChamaId;
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'active');
  const [items, setItems] = useState<MemberInvestmentPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (!chamaId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await investmentService.getMemberInvestments({
        chamaId,
        status: activeTab === 'all' || activeTab === 'utilized' ? undefined : activeTab,
      });
      setItems(
        activeTab === 'utilized' ? data.filter((item) => Number(item.realized_returns || 0) > 0) : data
      );
    } catch (error: any) {
      Alert.alert('Unable to load investments', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeTab, chamaId]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {loading ? (
        <LoadingSpinner text="Loading your investments" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          showsVerticalScrollIndicator={false}
        >
          <SectionTitle title="My investments" subtitle="Track active positions, maturity windows, and realized returns." />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {TABS.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: active ? colors.primary[500] : themeColors.card,
                      borderColor: active ? colors.primary[500] : themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tabText, { color: active ? '#fff' : themeColors.text }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

           {items.length === 0 ? (
             <EmptyState
               icon="chart-line"
               title="No investments yet"
               message="Start with a product that matches your return target and liquidity needs."
               action={{ label: 'Start investing', onPress: () => navigation.navigate('InvestmentProducts', { chamaId }) }}
             />
           ) : (
            items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('InvestmentDetail', { investmentId: item.id, chamaId })}
              >
                <Card style={styles.card}>
                  <View style={styles.rowBetween}>
                    <View style={styles.copy}>
                      <Text style={[styles.title, { color: themeColors.text }]}>{item.product_name}</Text>
                      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{item.reference}</Text>
                    </View>
                    <StatusPill label={item.status_display || item.status} />
                  </View>
                  <View style={styles.metricStrip}>
                    <View>
                      <Text style={[styles.metricCaption, { color: themeColors.textSecondary }]}>Current value</Text>
                      <Text style={[styles.metricValue, { color: themeColors.text }]}>
                        {formatCurrency(item.current_value, item.currency || 'KES')}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.metricCaption, { color: themeColors.textSecondary }]}>Available returns</Text>
                      <Text style={[styles.metricValue, { color: themeColors.text }]}>
                        {formatCurrency(item.available_returns, item.currency || 'KES')}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}

          <Button title="Portfolio analytics" variant="outline" onPress={() => navigation.navigate('PortfolioAnalytics', { chamaId })} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4] },
  tabRow: { gap: spacing[2], paddingBottom: spacing[1] },
  tab: {
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  card: { marginBottom: spacing[3], gap: spacing[3] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  copy: { flex: 1 },
  title: { fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.bold },
  subtitle: { fontSize: typography.fontSize.sm, marginTop: spacing[1] },
  metricStrip: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  metricCaption: { fontSize: typography.fontSize.xs, textTransform: 'uppercase' },
  metricValue: { fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.semibold, marginTop: spacing[1] },
});
