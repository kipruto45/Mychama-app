import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card } from '@/components/ui';
import { useInvestmentHistory } from './hooks';
import { formatCurrency, formatDate } from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const InvestmentHistoryScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const { history, isLoading } = useInvestmentHistory('');
  const historyList = (history || []) as any[];

  const [filter, setFilter] = useState<string>('all');

  const filtered: any[] = useMemo(() => {
    if (!historyList) return [];
    if (filter === 'all') return historyList;
    return historyList.filter((item: any) => item.type === filter);
  }, [historyList, filter]);

  const getIcon = (type: string): any => {
    const iconMap: Record<string, string> = {
      created: 'plus-circle',
      funded: 'cash-multiple',
      returns_credited: 'trending-up',
      utilized: 'arrow-right',
      reinvested: 'repeat',
      redeemed: 'check-circle',
      withdrawn: 'wallet-minus',
    };
    return iconMap[type] || 'circle';
  };

  const getColor = (type: string) => {
    const colorMap: Record<string, string> = {
      created: themeColors.primary[500],
      funded: themeColors.success,
      returns_credited: themeColors.success,
      utilized: themeColors.primary[500],
      reinvested: themeColors.primary[500],
      redeemed: themeColors.warning,
      withdrawn: themeColors.warning,
    };
    return colorMap[type] || themeColors.textSecondary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Investment History" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[4] }}
          contentContainerStyle={{ gap: spacing[2] }}
        >
          {['all', 'created', 'funded', 'returns_credited', 'utilized', 'redeemed'].map(type => (
            <View
              key={type}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === type ? themeColors.primary[500] : themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === type ? '#fff' : themeColors.text },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* History List */}
        <FlatList
          data={filtered}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card
              style={[
                styles.historyCard,
                {
                  backgroundColor: themeColors.card,
                  marginHorizontal: spacing[4],
                  marginBottom: spacing[2],
                },
              ]}
            >
              <View style={styles.historyRow}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getColor(item.type) + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getIcon(item.type)}
                    size={20}
                    color={getColor(item.type)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: themeColors.text }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.historyDate, { color: themeColors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.historyAmount,
                      { color: item.amount > 0 ? themeColors.success : themeColors.text },
                    ]}
                  >
                    {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </Text>
                  <Text style={[styles.historyStatus, { color: themeColors.textSecondary }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </Card>
          )}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="history"
                size={48}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.text }]}>
                No history found
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },
  historyCard: { padding: spacing[3], borderRadius: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  historyTitle: { fontSize: 14, fontWeight: '600' },
  historyDate: { fontSize: 12, marginTop: spacing[1] },
  historyAmount: { fontSize: 14, fontWeight: '700' },
  historyStatus: { fontSize: 11, marginTop: spacing[1], textTransform: 'capitalize' },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: spacing[10] },
  emptyText: { fontSize: 16, marginTop: spacing[3] },
});
