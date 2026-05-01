import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { meetingService } from '@/services/meetingService';
import { offlineQueueService, QueuedKYCAction } from '@/services/offlineQueueService';
import { paymentService, PaymentIntentRecord } from '@/services/paymentService';
import { profileService } from '@/services/profileService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { KYCRecord, Meeting } from '@/types';
import { formatCurrency, formatDate, formatDateTime, formatStatus } from '@/utils/format';

type DocumentCenterScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'DocumentCenter'>;

export const DocumentCenterScreen: React.FC = () => {
  const navigation = useNavigation<DocumentCenterScreenNavigationProp>();
  const {
    activeChama,
    activeChamaId,
    availableChamas,
    clearSwitchError,
    getScopedChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentIntentRecord[]>([]);
  const [minutesArchive, setMinutesArchive] = useState<Meeting[]>([]);
  const [offlineActions, setOfflineActions] = useState<QueuedKYCAction[]>([]);

  const loadDocuments = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setLoading(true);

    try {
      const scopedChamas = getScopedChamas();
      const [kyc, queuedActions, paymentRows, minutesRows] = await Promise.all([
        profileService.getKYCStatus().catch(() => []),
        offlineQueueService.listActions().catch(() => []),
        Promise.all(scopedChamas.map((chama) => paymentService.getPayments(chama.id).catch(() => []))).then((results) =>
          results.flat()
        ),
        activeChamaId
          ? meetingService.getMinutesArchive(activeChamaId).catch(() => [])
          : Promise.all(scopedChamas.map((chama) => meetingService.getMinutesArchive(chama.id).catch(() => []))).then((results) =>
              results.flat()
            ),
      ]);

      setKycRecords(kyc);
      setOfflineActions(queuedActions.filter((action): action is QueuedKYCAction => action.type === 'kyc_submission'));
      setPaymentReceipts(
        paymentRows
          .filter((payment) => payment.status === 'completed' || payment.status === 'success')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8)
      );
      setMinutesArchive(
        minutesRows
          .filter((meeting) => meeting.minutes?.content || meeting.minutes_status !== 'draft')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 8)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [activeChamaId, isLoadingChamaContext]);

  const refreshDocuments = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const latestKYC = kycRecords[0] || null;
  const totalDocumentCount = useMemo(
    () =>
      (latestKYC?.documents?.length || 0) +
      paymentReceipts.length +
      minutesArchive.length +
      offlineActions.length,
    [latestKYC, minutesArchive.length, offlineActions.length, paymentReceipts.length]
  );

  const handleRetryQueuedAction = async (action: QueuedKYCAction) => {
    try {
      await offlineQueueService.retryAction(action.id);
      Alert.alert('Queued action synced', 'The pending KYC submission has been sent successfully.');
      await refreshDocuments();
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Retry failed.')
          : 'Retry failed.';
      Alert.alert('Retry failed', message);
    }
  };

  const handleRemoveQueuedAction = (action: QueuedKYCAction) => {
    Alert.alert(
      'Remove queued item',
      'This will delete the saved retry item from the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await offlineQueueService.removeAction(action.id);
            await refreshDocuments();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Document Center</Text>
        <TouchableOpacity onPress={() => void refreshDocuments()} style={styles.iconButton}>
          <Icon name="refresh" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {availableChamas.length > 1 ? (
          <View style={styles.contextBar}>
            <Text style={styles.contextLabel}>Current chama</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextPills}>
              {availableChamas.map((chama) => {
                const isActive = chama.id === activeChamaId;
                return (
                  <TouchableOpacity
                    key={chama.id}
                    style={[styles.contextPill, isActive ? styles.contextPillActive : null]}
                    onPress={() => {
                      clearSwitchError();
                      void switchChama(chama.id).then(() => {
                        void loadDocuments();
                      }).catch(() => undefined);
                    }}
                  >
                    <Text style={[styles.contextPillText, isActive ? styles.contextPillTextActive : null]}>
                      {chama.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {isSwitching ? <Text style={styles.switchHint}>Switching document context…</Text> : null}
            {switchError ? <Text style={styles.errorText}>{switchError}</Text> : null}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading documents…</Text>
          </View>
        ) : (
          <>
            <Card style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Icon name="file-cabinet" size={28} color={colors.primary[500]} />
              </View>
              <Text style={styles.heroLabel}>Tracked documents</Text>
              <Text style={styles.heroValue}>{totalDocumentCount}</Text>
              <Text style={styles.heroSubtext}>
                {activeChama ? `${activeChama.name} context` : 'All joined chamas'}
              </Text>
            </Card>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>KYC and Member Documents</Text>
                <Badge label={latestKYC?.status || 'not submitted'} variant={latestKYC ? 'info' : 'warning'} size="sm" />
              </View>
              {latestKYC ? (
                <Card style={styles.sectionCard}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Status</Text>
                    <Text style={styles.rowValue}>{formatStatus(latestKYC.status || 'pending')}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Submitted</Text>
                    <Text style={styles.rowValue}>{latestKYC.created_at ? formatDateTime(latestKYC.created_at) : '-'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Documents</Text>
                    <Text style={styles.rowValue}>{latestKYC.documents?.length || 0}</Text>
                  </View>
                  {latestKYC.rejection_reason ? (
                    <Text style={styles.bodyText}>{latestKYC.rejection_reason}</Text>
                  ) : null}
                  <Button
                    title="Open KYC Screen"
                    onPress={() => navigation.navigate('KYC')}
                    variant="outline"
                    icon={<Icon name="shield-check-outline" size={18} color={colors.primary[500]} />}
                  />
                </Card>
              ) : (
                <EmptyState
                  title="No KYC submission yet"
                  description="Identity documents will appear here once you submit verification."
                  action={<Button title="Start KYC" onPress={() => navigation.navigate('KYC')} />}
                />
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Offline Retry Queue</Text>
                <Badge label={String(offlineActions.length)} variant={offlineActions.length > 0 ? 'warning' : 'success'} size="sm" />
              </View>
              {offlineActions.length > 0 ? (
                offlineActions.map((action) => (
                  <Card key={action.id} style={styles.sectionCard}>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Queued</Text>
                      <Text style={styles.rowValue}>{formatDateTime(action.created_at)}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Attempts</Text>
                      <Text style={styles.rowValue}>{action.attempt_count}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>ID number</Text>
                      <Text style={styles.rowValue}>{action.payload.id_number}</Text>
                    </View>
                    {action.last_error ? <Text style={styles.errorText}>{action.last_error}</Text> : null}
                    <View style={styles.actionRow}>
                      <Button title="Retry Now" onPress={() => void handleRetryQueuedAction(action)} size="sm" />
                      <Button
                        title="Remove"
                        onPress={() => handleRemoveQueuedAction(action)}
                        size="sm"
                        variant="outline"
                      />
                    </View>
                  </Card>
                ))
              ) : (
                <EmptyState
                  title="No queued document actions"
                  description="Offline-safe document retries will show up here when a KYC submission is saved for later sync."
                />
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Receipts</Text>
                <Badge label={String(paymentReceipts.length)} variant="info" size="sm" />
              </View>
              {paymentReceipts.length > 0 ? (
                paymentReceipts.map((payment) => (
                  <TouchableOpacity
                    key={payment.id}
                    style={styles.linkCard}
                    onPress={() =>
                      navigation.navigate('Receipt', {
                        paymentId: payment.id,
                        chamaId: payment.chama,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.linkCardHeader}>
                      <Text style={styles.linkCardTitle}>{formatCurrency(payment.amount, payment.currency)}</Text>
                      <Badge label={formatStatus(payment.status)} variant="success" size="sm" />
                    </View>
                    <Text style={styles.linkCardSubtitle}>
                      {formatStatus(payment.purpose)} • {formatDate(payment.created_at)}
                    </Text>
                    <Text style={styles.linkCardMeta}>{payment.reference_id || payment.id}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState
                  title="No receipt history yet"
                  description="Completed payment receipts will appear here for quick retrieval."
                />
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Meeting Minutes Archive</Text>
                <Badge label={String(minutesArchive.length)} variant="info" size="sm" />
              </View>
              {minutesArchive.length > 0 ? (
                minutesArchive.map((meeting) => (
                  <TouchableOpacity
                    key={meeting.id}
                    style={styles.linkCard}
                    onPress={() => navigation.navigate('MeetingDetail', { meetingId: meeting.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.linkCardHeader}>
                      <Text style={styles.linkCardTitle}>{meeting.title}</Text>
                      <Badge label={formatStatus(meeting.minutes_status)} variant="info" size="sm" />
                    </View>
                    <Text style={styles.linkCardSubtitle}>{formatDate(meeting.date)}</Text>
                    <Text style={styles.linkCardMeta}>
                      {meeting.minutes?.content
                        ? `${meeting.minutes.content.slice(0, 90)}${meeting.minutes.content.length > 90 ? '…' : ''}`
                        : 'Minutes attached to this meeting.'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState
                  title="No archived minutes yet"
                  description="Approved or uploaded meeting minutes will show up here."
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.neutral[200],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  title: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  contextBar: {
    marginBottom: spacing[4],
  },
  contextLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  contextPills: {
    gap: spacing[2],
  },
  contextPill: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  contextPillActive: {
    backgroundColor: colors.primary[500],
  },
  contextPillText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  contextPillTextActive: {
    color: '#FFFFFF',
  },
  switchHint: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  loadingText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing[3],
    width: 56,
  },
  heroLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  heroValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    marginTop: spacing[1],
  },
  heroSubtext: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
  },
  sectionCard: {
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  rowLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
  },
  rowValue: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  bodyText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  linkCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  linkCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  linkCardTitle: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    marginRight: spacing[3],
  },
  linkCardSubtitle: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
  },
  linkCardMeta: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing[2],
  },
});
