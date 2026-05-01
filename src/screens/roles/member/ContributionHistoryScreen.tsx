import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import {
  memberContributionService,
  type ContributionHistoryItem,
} from '@/services/memberContributionService';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { getContributionTypeIcon } from './contributionWorkflowShared';

type ContributionHistoryNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ContributionHistory'
>;
type ContributionHistoryRouteProp = RouteProp<MainStackParamList, 'ContributionHistory'>;

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

export const ContributionHistoryScreen: React.FC = () => {
  const navigation = useNavigation<ContributionHistoryNavigationProp>();
  const route = useRoute<ContributionHistoryRouteProp>();
  const { activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberContributionFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId;

  const [history, setHistory] = useState<ContributionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadHistory = async (showRefresh = false) => {
    if (!chamaId) {
      setLoading(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await memberContributionService.getContributionHistory(chamaId);
      setHistory(response);
      setError(null);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t load your contributions right now. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedRoute('ContributionHistory');
    void loadHistory();
  }, [chamaId, setLastVisitedRoute]);

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    history.forEach((item) => {
      map.set(item.typeName, item.typeName);
    });
    return ['all', ...Array.from(map.keys())];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const statusMatches = statusFilter === 'all' || item.paymentState === statusFilter;
      const typeMatches = typeFilter === 'all' || item.typeName === typeFilter;
      return statusMatches && typeMatches;
    });
  }, [history, statusFilter, typeFilter]);

  const handleOpenItem = (item: ContributionHistoryItem) => {
    if (item.paymentState === 'success' && item.contributionId) {
      navigation.navigate('ContributionDetails', {
        contributionId: item.contributionId,
        chamaId: chamaId || undefined,
      });
      return;
    }

    if (item.intentId) {
      navigation.navigate('PaymentStatus', {
        intentId: item.intentId,
        amount: item.amount,
        currency: item.currency,
        contributionTypeName: item.typeName,
        paymentMethod: item.paymentMethod,
        purpose: item.itemType === 'fine_or_penalty' ? 'fine' : 'contribution',
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution history" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Contribution history" showBack />
        <EmptyState
          title="Unable to load contribution history"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Contribution history" showBack />
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadHistory(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {STATUS_FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
                  onPress={() => setStatusFilter(item.key)}
                >
                  <Text
                    style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {typeOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.filterChip, typeFilter === item && styles.filterChipActive]}
                  onPress={() => setTypeFilter(item)}
                >
                  <Text
                    style={[styles.filterChipText, typeFilter === item && styles.filterChipTextActive]}
                  >
                    {item === 'all' ? 'All types' : item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No contribution history yet"
            description="Completed, pending, and failed contribution attempts will appear here."
            icon="history"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenItem(item)}>
            <Card style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <Icon
                  name={getContributionTypeIcon(item.itemType) as any}
                  size={18}
                  color={colors.primary[600]}
                />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{item.typeName}</Text>
                <Text style={styles.historyMeta}>
                  {formatDate(item.date)} • Ref {item.reference}
                </Text>
                {item.failureReason ? (
                  <Text style={styles.historyFailure}>{item.failureReason}</Text>
                ) : null}
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>{formatCurrency(item.amount, item.currency)}</Text>
                <Badge
                  label={
                    item.paymentState === 'success'
                      ? 'Paid'
                      : item.paymentState === 'pending'
                      ? 'Pending'
                      : item.paymentState === 'failed'
                      ? 'Failed'
                      : 'Status'
                  }
                  variant={
                    item.paymentState === 'success'
                      ? 'success'
                      : item.paymentState === 'pending'
                      ? 'warning'
                      : 'error'
                  }
                  size="sm"
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  filterSection: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterRow: {
    gap: spacing[2],
  },
  filterChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  filterChipTextActive: {
    color: colors.light.background,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.lg,
    backgroundColor: '#EEF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
    gap: spacing[1],
  },
  historyTitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  historyMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  historyFailure: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  historyAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
});

export default ContributionHistoryScreen;
