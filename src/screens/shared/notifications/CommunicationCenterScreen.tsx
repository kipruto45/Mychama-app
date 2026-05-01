import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainStackParamList } from '@/navigation/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { communicationService } from '@/services/communicationService';
import { CommunicationAnalytics } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils/format';
import { useActiveChama } from '@/hooks';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'CommunicationCenter'>;
type RouteProps = RouteProp<MainStackParamList, 'CommunicationCenter'>;

export const CommunicationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { activeChamaId } = useActiveChama();
  const chamaId = route.params?.chamaId || activeChamaId || '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CommunicationAnalytics | null>(null);

  const loadData = async () => {
    if (!chamaId) {
      setAnalytics(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      const response = await communicationService.getAnalytics(chamaId);
      setAnalytics(response);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'We could not load communication analytics right now.')
          : 'We could not load communication analytics right now.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [chamaId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading communication center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="account-group-outline" size={64} color={colors.neutral[400]} />}
          title="Choose a chama first"
          description="Communication tools need an active chama context before loading analytics and delivery health."
          action={<Button title="Open Chamas" onPress={() => navigation.navigate('Chamas')} />}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="message-alert-outline" size={64} color={colors.neutral[400]} />}
          title="Communication center unavailable"
          description={error || 'Analytics could not be loaded.'}
          action={<Button title="Retry" onPress={() => void loadData()} />}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Communication Center</Text>
            <Text style={styles.subtitle}>Broadcasts, delivery health, and campaign activity</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button title="Send Message" onPress={() => navigation.navigate('SendCommunication', { chamaId })} style={styles.actionButton} />
          <Button title="Delivery Logs" variant="outline" onPress={() => navigation.navigate('CommunicationLogs', { chamaId })} style={styles.actionButton} />
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.summary.total_deliveries}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.summary.delivery_success_rate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.summary.failed_deliveries}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.summary.broadcasts_count}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>By Channel</Text>
          {Object.entries(analytics.by_channel).map(([channel, count]) => (
            <View key={channel} style={styles.row}>
              <Text style={styles.rowLabel}>{channel.replace('_', ' ')}</Text>
              <Text style={styles.rowValue}>{count}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Campaigns</Text>
          {analytics.recent_campaigns.length > 0 ? analytics.recent_campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.campaignRow}
              onPress={() => navigation.navigate('CommunicationLogs', { chamaId })}
            >
              <View style={styles.campaignBody}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <Text style={styles.campaignMeta}>
                  {campaign.channels.join(', ')} • {formatRelativeTime(campaign.created_at)}
                </Text>
              </View>
              <Badge label={campaign.status} variant={campaign.status === 'failed' ? 'error' : campaign.status === 'pending' ? 'warning' : 'success'} size="sm" />
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>No campaigns have been created for this chama yet.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  stateText: { marginTop: spacing[3], color: colors.neutral[600], fontFamily: typography.fontFamily.medium },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[4] },
  backButton: { marginRight: spacing[3], paddingTop: spacing[1] },
  headerText: { flex: 1 },
  title: { fontSize: typography.fontSize['2xl'], fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  subtitle: { marginTop: spacing[1], color: colors.neutral[500], fontFamily: typography.fontFamily.regular },
  actionRow: { flexDirection: 'row', marginBottom: spacing[4], gap: spacing[3] },
  actionButton: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[4] },
  statCard: { width: '48%', padding: spacing[3] },
  statValue: { fontSize: typography.fontSize['2xl'], fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  statLabel: { marginTop: spacing[1], color: colors.neutral[500], fontFamily: typography.fontFamily.medium },
  sectionCard: { marginBottom: spacing[4] },
  sectionTitle: { fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.semibold, color: colors.neutral[900], marginBottom: spacing[3] },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[2] },
  rowLabel: { color: colors.neutral[700], fontFamily: typography.fontFamily.medium, textTransform: 'capitalize' },
  rowValue: { color: colors.neutral[900], fontFamily: typography.fontFamily.bold },
  campaignRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  campaignBody: { flex: 1, marginRight: spacing[3] },
  campaignTitle: { color: colors.neutral[900], fontFamily: typography.fontFamily.semibold, marginBottom: spacing[1] },
  campaignMeta: { color: colors.neutral[500], fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm },
  emptyText: { color: colors.neutral[500], fontFamily: typography.fontFamily.regular },
});
