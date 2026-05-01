import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { appService } from '@/services/appService';
import { AuditTrailEntry } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/format';

type AuditLogsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'AuditLogs'>;
type AuditLogsRouteProp = RouteProp<MainStackParamList, 'AuditLogs'>;

export const AuditLogsScreen: React.FC = () => {
  const navigation = useNavigation<AuditLogsNavigationProp>();
  const route = useRoute<AuditLogsRouteProp>();
  const { activeChamaId } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scopedChamaId = route.params?.chamaId || activeChamaId || undefined;

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = scopedChamaId
        ? await appService.getAuditLogs({ chamaId: scopedChamaId, pageSize: 50 })
        : await appService.getActivityHistory({ pageSize: 50 });
      setEntries(response.results || []);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : 'We could not load audit history right now.';
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditLogs();
  }, [scopedChamaId]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) {
      return entries;
    }

    const normalizedSearch = search.trim().toLowerCase();
    return entries.filter((entry) =>
      [entry.actor_name, entry.action, entry.entity_type, entry.entity_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [entries, search]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Logs</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => void loadAuditLogs()}>
          <Icon name="refresh" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="history" size={26} color={colors.primary[700]} />
          </View>
          <Text style={styles.heroTitle}>Workspace activity timeline</Text>
          <Text style={styles.heroSubtitle}>
            Review approvals, edits, financial actions, and role changes across the workspace.
          </Text>
        </Card>

        <Card>
          <View style={styles.searchRow}>
            <Icon name="magnify" size={20} color={colors.neutral[400]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search actor, action, or entity"
              placeholderTextColor={colors.neutral[400]}
              style={styles.searchInput}
            />
          </View>
        </Card>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.centerText}>Loading audit logs...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Audit history unavailable"
            description={error}
            action={{ label: 'Retry', onPress: () => void loadAuditLogs() }}
          />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="There are no matching activity entries for the current search."
          />
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} style={styles.logCard}>
              <View style={styles.logTopRow}>
                <View style={styles.actorBadge}>
                  <Icon name="account-circle-outline" size={18} color={colors.primary[700]} />
                  <Text style={styles.actorText}>{entry.actor_name || 'System'}</Text>
                </View>
                <Text style={styles.timestamp}>{formatDateTime(entry.created_at)}</Text>
              </View>

              <Text style={styles.actionTitle}>
                {entry.action.replace(/_/g, ' ')} on {entry.entity_type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.entityMeta}>Entity ID: {entry.entity_id}</Text>

              {Object.keys(entry.metadata || {}).length > 0 ? (
                <View style={styles.metadataWrap}>
                  {Object.entries(entry.metadata).slice(0, 4).map(([key, value]) => (
                    <View key={key} style={styles.metaRow}>
                      <Text style={styles.metaKey}>{key.replace(/_/g, ' ')}</Text>
                      <Text style={styles.metaValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    marginLeft: spacing[2],
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  logCard: {
    gap: spacing[2],
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  actorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
  },
  actorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  entityMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  metadataWrap: {
    marginTop: spacing[1],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  metaKey: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  metaValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
});

