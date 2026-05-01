/**
 * Payouts List Screen
 *
 * Lists payout records and provides quick status filtering.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, EmptyState, Input, LoadingSpinner } from '@/components/ui';
import { PayoutStackParamList, payoutStatusDisplay } from '@/navigation/PayoutNavigator.types';
import { useTheme } from '@/providers/ThemeProvider';
import { usePayoutStore } from '@/store/payoutStore';
import { colors as palette, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

type NavProp = NativeStackNavigationProp<PayoutStackParamList, 'PayoutsList'>;

const PENDING_STATUSES = new Set([
  'triggered',
  'rotation_check',
  'eligibility_check',
  'awaiting_treasurer_review',
  'awaiting_chair_approval',
  'approved',
  'processing',
  'hold',
]);
const REJECTED_STATUSES = new Set(['treasury_rejected', 'chair_rejected', 'failed', 'cancelled', 'ineligible']);

const statusColor = (status: string) => {
  if (status === 'success') return palette.success;
  if (status === 'processing') return palette.warning;
  if (REJECTED_STATUSES.has(status)) return palette.error;
  if (status === 'hold') return palette.warning;
  return palette.neutral[500];
};

export default function PayoutsListScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors: themeColors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    payouts,
    isLoadingPayouts,
    payoutsError,
    activeTab,
    setActiveTab,
    selectedChamaId,
    fetchPayouts,
  } = usePayoutStore();

  useFocusEffect(
    useCallback(() => {
      void fetchPayouts(selectedChamaId || undefined);
    }, [fetchPayouts, selectedChamaId])
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = payouts;

    if (query) {
      items = items.filter((item) => {
        const name = String(item.member_name || '').toLowerCase();
        const phone = String(item.member_phone || '');
        const chamaName = String(item.chama_name || '').toLowerCase();
        return name.includes(query) || phone.includes(query) || chamaName.includes(query);
      });
    }

    if (activeTab === 'pending') {
      return items.filter((item) => PENDING_STATUSES.has(item.status));
    }
    if (activeTab === 'completed') {
      return items.filter((item) => item.status === 'success');
    }
    return items.filter((item) => REJECTED_STATUSES.has(item.status));
  }, [activeTab, payouts, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPayouts(selectedChamaId || undefined);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoadingPayouts && payouts.length === 0) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <LoadingSpinner text="Loading payouts…" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Input
          placeholder="Search by name, phone, or chama…"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.tabs}>
          {(['pending', 'completed', 'rejected'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? palette.primary[50] : 'transparent',
                    borderColor: isActive ? palette.primary[200] : themeColors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? palette.primary[700] : themeColors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => {
          const badgeColor = statusColor(item.status);
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('PayoutDetail', { payoutId: item.id })}
              activeOpacity={0.9}
              style={styles.itemTouch}
            >
              <Card>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[styles.memberName, { color: themeColors.text }]}>{item.member_name}</Text>
                    <Text style={[styles.memberMeta, { color: themeColors.textSecondary }]}>{item.member_phone}</Text>
                  </View>
                  <Text style={[styles.amount, { color: palette.primary[700] }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[styles.chamaName, { color: themeColors.textSecondary }]}>{item.chama_name}</Text>
                    <Text style={[styles.date, { color: themeColors.textSecondary }]}>{formatDate(item.created_at)}</Text>
                  </View>

                  <View style={[styles.badge, { borderColor: badgeColor, backgroundColor: `${badgeColor}1A` }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {payoutStatusDisplay[item.status] || item.status}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <EmptyState
              title={payoutsError ? 'Unable to load payouts' : 'No payouts yet'}
              message={payoutsError ? payoutsError : 'Payout records will appear here once created.'}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  itemTouch: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  memberMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
  },
  amount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  chamaName: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  date: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  emptyWrapper: {
    paddingTop: spacing.xl,
  },
});
