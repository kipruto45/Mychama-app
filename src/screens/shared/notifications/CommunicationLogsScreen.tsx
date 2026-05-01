import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainStackParamList } from '@/navigation/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { communicationService } from '@/services/communicationService';
import { CommunicationDeliveryLog } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/format';
import { useActiveChama } from '@/hooks';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'CommunicationLogs'>;
type RouteProps = RouteProp<MainStackParamList, 'CommunicationLogs'>;

export const CommunicationLogsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { activeChamaId } = useActiveChama();
  const chamaId = route.params?.chamaId || activeChamaId || '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<CommunicationDeliveryLog[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async (nextPage = 1, append = false) => {
    if (!chamaId) {
      setLogs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!append) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await communicationService.getDeliveryLogs({
        chamaId,
        page: nextPage,
        pageSize: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setLogs((prev) => (append ? [...prev, ...response.results] : response.results));
      setPage(response.page);
      setHasNext(response.hasNext);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Delivery logs could not be loaded right now.')
          : 'Delivery logs could not be loaded right now.';
      setError(message);
      if (!append) {
        setLogs([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLogs(1, false);
  }, [chamaId, statusFilter, search]);

  const retryLog = async (log: CommunicationDeliveryLog) => {
    try {
      await communicationService.retryDelivery(log.id);
      Alert.alert('Retry queued', 'The failed communication has been re-queued.');
      await loadLogs(1, false);
    } catch {
      Alert.alert('Retry failed', 'This delivery could not be retried right now.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading delivery logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="account-group-outline" size={56} color={colors.neutral[400]} />}
          title="Choose a chama first"
          description="Delivery logs are scoped to a chama. Switch workspace and try again."
          action={<Button title="Open Chamas" onPress={() => navigation.navigate('Chamas')} />}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void loadLogs(1, false);
        }} />}
        onEndReached={() => {
          if (hasNext && !loading) {
            void loadLogs(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.title}>Delivery Logs</Text>
                <Text style={styles.subtitle}>Track status, retry failures, and audit channel delivery</Text>
              </View>
            </View>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by address, subject, or provider id"
            />
            <View style={styles.filterRow}>
              {['', 'queued', 'sent', 'failed', 'delivered'].map((status) => {
                const active = statusFilter === status;
                return (
                  <TouchableOpacity key={status || 'all'} style={[styles.chip, active && styles.chipActive]} onPress={() => setStatusFilter(status)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{status || 'all'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="email-fast-outline" size={56} color={colors.neutral[400]} />}
            title={error ? 'Could not load delivery logs' : 'No Delivery Logs'}
            description={error || 'No communication deliveries match the current filters.'}
            action={error ? <Button title="Retry" onPress={() => void loadLogs(1, false)} /> : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={styles.rowBody}>
                <Text style={styles.subject}>{item.notification_subject || item.notification_type}</Text>
                <Text style={styles.meta}>{item.channel} • {item.to_address || item.recipient_name}</Text>
                <Text style={styles.meta}>{formatRelativeTime(item.created_at)}</Text>
              </View>
              <Badge label={item.status} variant={item.status === 'failed' ? 'error' : item.status === 'queued' ? 'warning' : 'success'} size="sm" />
            </View>
            {item.error_message ? <Text style={styles.errorText}>{item.error_message}</Text> : null}
            <View style={styles.rowFooter}>
              <Text style={styles.footerText}>Attempts: {item.attempts}</Text>
              {item.status === 'failed' ? (
                <TouchableOpacity onPress={() => void retryLog(item)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stateText: { marginTop: spacing[3], color: colors.neutral[600], fontFamily: typography.fontFamily.medium },
  headerWrap: { marginBottom: spacing[4] },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[4] },
  backButton: { marginRight: spacing[3], paddingTop: spacing[1] },
  headerText: { flex: 1 },
  title: { fontSize: typography.fontSize['2xl'], fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  subtitle: { marginTop: spacing[1], color: colors.neutral[500], fontFamily: typography.fontFamily.regular },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.light.card,
    marginBottom: spacing[3],
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  chipActive: { backgroundColor: colors.primary[500] },
  chipText: { color: colors.neutral[700], fontFamily: typography.fontFamily.medium, textTransform: 'capitalize' },
  chipTextActive: { color: '#FFFFFF' },
  rowCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  rowBody: { flex: 1, marginRight: spacing[3] },
  subject: { color: colors.neutral[900], fontFamily: typography.fontFamily.semibold, marginBottom: spacing[1] },
  meta: { color: colors.neutral[500], fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, marginBottom: spacing[1] },
  errorText: { color: colors.error, fontFamily: typography.fontFamily.regular, marginTop: spacing[2] },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing[3] },
  footerText: { color: colors.neutral[500], fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm },
  retryText: { color: colors.primary[600], fontFamily: typography.fontFamily.semibold },
});
