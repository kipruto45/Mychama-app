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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import {
  memberLoanService,
  type MemberLoanHistoryItem,
} from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  formatLoanPurposeLabel,
  getLoanApplicationMeta,
  getLoanStateMeta,
} from './loanWorkflowShared';

type LoanApplicationsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanApplications'>;
type LoanApplicationsRouteProp = RouteProp<MainStackParamList, 'LoanApplications'>;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'completed', label: 'Completed' },
];

export const LoanApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<LoanApplicationsNavigationProp>();
  const route = useRoute<LoanApplicationsRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;

  const [history, setHistory] = useState<MemberLoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

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
      const response = await memberLoanService.getHistory(chamaId);
      setHistory(response);
      setError(null);
    } catch {
      setError('We couldn’t load your loan details right now. Please try again.');
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedRoute('LoanApplications');
    void loadHistory();
  }, [chamaId, setLastVisitedRoute]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'pending') {
        return item.applicationState === 'submitted_pending_review';
      }
      if (filter === 'active') {
        return item.loanState === 'active' || item.loanState === 'overdue';
      }
      if (filter === 'rejected') {
        return item.applicationState === 'rejected';
      }
      return item.loanState === 'completed';
    });
  }, [filter, history]);

  const openHistoryItem = (item: MemberLoanHistoryItem) => {
    if (item.recordType === 'loan' && item.loanId) {
      navigation.navigate('LoanDetail', { loanId: item.loanId, chamaId });
      return;
    }

    if (item.applicationState === 'rejected' && item.applicationId) {
      navigation.navigate('RejectedApplicationState', { applicationId: item.applicationId, chamaId });
      return;
    }

    if (item.applicationId) {
      navigation.navigate('LoanApplicationDetails', { applicationId: item.applicationId, chamaId });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loan History" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loan History" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load history"
          description={error || 'Choose a chama first so we can show your history.'}
          icon="time-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Loan History" subtitle={activeChama?.name} showBack />
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
              {FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                  onPress={() => setFilter(item.key)}
                >
                  <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No loan history yet"
            description="Your applications, approvals, and completed loans will appear here."
            icon="cash-outline"
          />
        }
        renderItem={({ item }) => {
          const meta =
            item.recordType === 'loan'
              ? getLoanStateMeta(item.loanState)
              : getLoanApplicationMeta(item.applicationState);
          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => openHistoryItem(item)}>
              <Card style={styles.historyCard}>
                <View style={styles.historyIcon}>
                  <Icon
                    name={item.recordType === 'loan' ? 'bank-outline' : 'file-document-outline'}
                    size={18}
                    color={colors.primary[600]}
                  />
                </View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>{formatLoanPurposeLabel(item.purpose)}</Text>
                  <Text style={styles.historyMeta}>
                    {formatDate(item.dateApproved || item.dateApplied || item.dateRejected || new Date().toISOString())}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(item.amount, activeChama?.currency || 'KES')}
                  </Text>
                  <Badge label={meta.label} variant={meta.tone} size="sm" />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
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
    marginBottom: spacing[4],
  },
  filterRow: {
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  filterChipTextActive: {
    color: colors.light.surface,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[50],
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
    fontFamily: typography.fontFamily.regular,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  historyAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
});
