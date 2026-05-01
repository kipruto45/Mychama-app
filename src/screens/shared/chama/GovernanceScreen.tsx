import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Modal } from '@/components/ui';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess } from '@/rbac';
import { governanceService } from '@/services/governanceService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  ChamaRule,
  GovernanceApprovalRequest,
  GovernanceMotion,
  GovernanceOverview,
  RoleDelegation,
  RuleAcknowledgment,
} from '@/types';
import { formatDate, formatDateTime, formatStatus } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Governance'>;
type RoutePropType = RouteProp<MainStackParamList, 'Governance'>;

export const GovernanceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const routeChamaId = route.params?.chamaId;
  const {
    activeChamaId,
    availableChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const activeRole = useActiveRole(chamaId || undefined) || Role.MEMBER;
  const canManageApprovals = useCanPerformAction(Permission.CAN_ASSIGN_ROLES, chamaId || undefined);
  const canCreateMotion = canManageApprovals;
  const canVoteOnMotions =
    activeRole === Role.MEMBER || activeRole === Role.TREASURER || activeRole === Role.SECRETARY || activeRole === Role.CHAMA_ADMIN;
  const canReviewApprovals = activeRole === Role.CHAMA_ADMIN || activeRole === Role.ADMIN;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<GovernanceOverview | null>(null);
  const [rules, setRules] = useState<ChamaRule[]>([]);
  const [approvals, setApprovals] = useState<GovernanceApprovalRequest[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<RuleAcknowledgment[]>([]);
  const [delegations, setDelegations] = useState<RoleDelegation[]>([]);
  const [motions, setMotions] = useState<GovernanceMotion[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [motionModalVisible, setMotionModalVisible] = useState(false);
  const [motionTitle, setMotionTitle] = useState('');
  const [motionDescription, setMotionDescription] = useState('');
  const [motionEndTime, setMotionEndTime] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [motionQuorum, setMotionQuorum] = useState('50');

  const loadData = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [overviewRow, ruleRows, approvalRows, acknowledgmentRows, delegationRows, motionRows] = await Promise.all([
        governanceService.getOverview(chamaId).catch(() => null),
        governanceService.getRules(chamaId).catch(() => []),
        governanceService.getApprovals(chamaId, 'pending').catch(() => []),
        governanceService.getMyAcknowledgments().catch(() => []),
        governanceService.getDelegations(chamaId).catch(() => []),
        governanceService.getMotions(chamaId).catch(() => []),
      ]);

      setOverview(overviewRow);
      setRules(ruleRows);
      setApprovals(approvalRows);
      setAcknowledgments(acknowledgmentRows.filter((item) => ruleRows.some((rule) => rule.id === item.rule)));
      setDelegations(delegationRows);
      setMotions(motionRows);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load governance data.')
          : 'Unable to load governance data.';
      setError(message);
      setOverview(null);
      setRules([]);
      setApprovals([]);
      setAcknowledgments([]);
      setDelegations([]);
      setMotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [chamaId, isLoadingChamaContext]);

  const activeRules = useMemo(
    () => rules.filter((rule) => ['active', 'pending_approval'].includes(rule.status)).slice(0, 6),
    [rules]
  );

  const activeDelegations = useMemo(
    () => delegations.filter((delegation) => ['active', 'pending'].includes((delegation.status || '').toLowerCase())),
    [delegations]
  );

  const openMotions = useMemo(
    () => motions.filter((motion) => (motion.status || '').toLowerCase() === 'open'),
    [motions]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcknowledge = async (ruleId: string) => {
    try {
      setProcessingId(ruleId);
      await governanceService.acknowledgeRule(ruleId);
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to acknowledge this rule.')
          : 'Unable to acknowledge this rule.';
      setError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprovalDecision = async (approvalId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(approvalId);
      await governanceService.decideApproval(approvalId, {
        action,
        comment: action === 'approve' ? 'Approved from mobile governance queue.' : 'Rejected from mobile governance queue.',
      });
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to update this approval.')
          : 'Unable to update this approval.';
      setError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetMotionForm = () => {
    setMotionTitle('');
    setMotionDescription('');
    setMotionEndTime(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setMotionQuorum('50');
  };

  const handleCreateMotion = async () => {
    if (!motionTitle.trim()) {
      Alert.alert('Title required', 'Give the motion a clear title before publishing it.');
      return;
    }

    try {
      setProcessingId('create-motion');
      await governanceService.createMotion(chamaId, {
        title: motionTitle.trim(),
        description: motionDescription.trim() || undefined,
        start_time: new Date().toISOString(),
        end_time: new Date(motionEndTime).toISOString(),
        quorum_percent: Number(motionQuorum || 50),
      });
      setMotionModalVisible(false);
      resetMotionForm();
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to create this motion.')
          : 'Unable to create this motion.';
      setError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleVote = async (motionId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      setProcessingId(`${motionId}:${vote}`);
      await governanceService.voteMotion(motionId, vote);
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to cast this vote.')
          : 'Unable to cast this vote.';
      setError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseMotion = async (motionId: string) => {
    try {
      setProcessingId(`close:${motionId}`);
      await governanceService.closeMotion(motionId);
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to close this motion.')
          : 'Unable to close this motion.';
      setError(message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <RequireRouteAccess route="Governance" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading governance</Text>
          <Text style={styles.centerText}>Pulling rules, acknowledgments, approvals, and delegated roles.</Text>
        </View>
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  if (!chamaId) {
    return (
      <RequireRouteAccess route="Governance" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Governance tools are scoped to one chama so policy and approvals stay accurate."
          style={styles.centerState}
        />
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  return (
    <RequireRouteAccess route="Governance" chamaId={chamaId || undefined}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Governance</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          onSelectChama={(id) => {
            void switchChama(id);
          }}
          helperText={switchError || null}
        />

        <Card style={styles.introCard}>
          <View style={styles.cardHeader}>
            <Icon name="gavel" size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Constitution, approvals, and delegated authority</Text>
          </View>
          <Text style={styles.bodyText}>
            This queue keeps rule versions, member acknowledgments, approval requests, and acting-role handovers in one auditable place.
          </Text>
        </Card>

        {overview ? (
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{overview.active_rules}</Text>
              <Text style={styles.summaryLabel}>Active Rules</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{overview.pending_acknowledgments}</Text>
              <Text style={styles.summaryLabel}>Need Acknowledgment</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{overview.pending_approvals}</Text>
              <Text style={styles.summaryLabel}>Pending Approvals</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{openMotions.length}</Text>
              <Text style={styles.summaryLabel}>Open Motions</Text>
            </Card>
          </View>
        ) : null}

        {error ? (
          <EmptyState
            title="Governance data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadData()} />}
            style={styles.inlineState}
          />
        ) : null}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rules Waiting for You</Text>
            <Badge label={`${acknowledgments.length}`} variant={acknowledgments.length ? 'warning' : 'success'} size="sm" />
          </View>

          {acknowledgments.length ? (
            acknowledgments.map((ack) => (
              <View key={ack.id} style={styles.listRow}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{ack.rule_title || 'Rule acknowledgment'}</Text>
                  <Text style={styles.listMeta}>{formatStatus(ack.status)}</Text>
                </View>
                <Button
                  title="Acknowledge"
                  size="sm"
                  onPress={() => void handleAcknowledge(ack.rule)}
                  loading={processingId === ack.rule}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>Nothing is waiting for your acknowledgment right now.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Policy Set</Text>
            <Badge label={`${activeRules.length}`} variant="info" size="sm" />
          </View>

          {activeRules.length ? (
            activeRules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Badge label={rule.status_display || formatStatus(rule.status)} variant="info" size="sm" />
                </View>
                <Text style={styles.ruleMeta}>
                  {rule.category_display || formatStatus(rule.category)} · v{rule.version}
                </Text>
                <Text style={styles.ruleDescription} numberOfLines={3}>
                  {rule.description || rule.content}
                </Text>
                <Text style={styles.ruleFooter}>
                  Effective {rule.effective_date ? formatDate(rule.effective_date) : 'immediately'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No rules have been published for this chama yet.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approval Queue</Text>
            <Badge label={`${approvals.length}`} variant={approvals.length ? 'warning' : 'success'} size="sm" />
          </View>

          {approvals.length ? (
            approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleTitle}>{approval.title}</Text>
                  <Badge label={approval.status_display || formatStatus(approval.status)} variant="warning" size="sm" />
                </View>
                <Text style={styles.ruleMeta}>
                  {approval.approval_type_display || formatStatus(approval.approval_type)}
                  {approval.amount ? ` · ${approval.currency || 'KES'} ${approval.amount}` : ''}
                </Text>
                <Text style={styles.ruleDescription} numberOfLines={3}>
                  {approval.description || approval.reference_display || 'Approval request awaiting action.'}
                </Text>
                <Text style={styles.ruleFooter}>
                  Requested by {approval.requested_by_name || 'member'}{approval.due_date ? ` · due ${formatDate(approval.due_date)}` : ''}
                </Text>

              {canReviewApprovals ? (
                <View style={styles.inlineActions}>
                  <Button
                    title="Approve"
                      size="sm"
                      onPress={() => void handleApprovalDecision(approval.id, 'approve')}
                      loading={processingId === approval.id}
                    />
                    <Button
                      title="Reject"
                      size="sm"
                      variant="outline"
                      onPress={() => void handleApprovalDecision(approval.id, 'reject')}
                      disabled={processingId === approval.id}
                    />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>The governance approval queue is clear.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voting & Motions</Text>
            <View style={styles.motionHeaderActions}>
              <Badge label={`${openMotions.length}/${motions.length}`} variant="info" size="sm" />
              {canCreateMotion ? (
                <Button title="New motion" size="sm" onPress={() => setMotionModalVisible(true)} />
              ) : null}
            </View>
          </View>

          {motions.length ? (
            motions.map((motion) => (
              <View key={motion.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleTitle}>{motion.title}</Text>
                  <Badge
                    label={formatStatus(motion.status)}
                    variant={(motion.status || '').toLowerCase() === 'closed' ? 'success' : 'info'}
                    size="sm"
                  />
                </View>
                <Text style={styles.ruleDescription}>
                  {motion.description || 'No extra motion context was provided.'}
                </Text>
                <Text style={styles.ruleMeta}>
                  Opens {formatDateTime(motion.start_time)} · Closes {formatDateTime(motion.end_time)} · Quorum {motion.quorum_percent}%
                </Text>
                <Text style={styles.ruleFooter}>
                  Votes {motion.vote_summary?.total_votes || 0} · Yes {motion.vote_summary?.yes_votes || 0} · No {motion.vote_summary?.no_votes || 0} · Abstain {motion.vote_summary?.abstain_votes || 0}
                </Text>
                {motion.result ? (
                  <Text style={styles.motionResultText}>
                    Result: {motion.result.passed ? 'Passed' : 'Rejected'} · Quorum {motion.result.quorum_met ? 'met' : 'not met'}
                  </Text>
                ) : null}

                {(motion.status || '').toLowerCase() === 'open' && canVoteOnMotions ? (
                  <View style={styles.inlineActions}>
                    <Button
                      title="Yes"
                      size="sm"
                      onPress={() => void handleVote(motion.id, 'yes')}
                      loading={processingId === `${motion.id}:yes`}
                    />
                    <Button
                      title="No"
                      size="sm"
                      variant="outline"
                      onPress={() => void handleVote(motion.id, 'no')}
                      disabled={Boolean(processingId)}
                    />
                    <Button
                      title="Abstain"
                      size="sm"
                      variant="ghost"
                      onPress={() => void handleVote(motion.id, 'abstain')}
                      disabled={Boolean(processingId)}
                    />
                  </View>
                ) : null}

                {canCreateMotion && (motion.status || '').toLowerCase() === 'open' ? (
                  <View style={styles.inlineActions}>
                    <Button
                      title="Close voting"
                      size="sm"
                      variant="outline"
                      onPress={() => void handleCloseMotion(motion.id)}
                      loading={processingId === `close:${motion.id}`}
                    />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No motions have been opened for this chama yet.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Role Delegations</Text>
            <Badge label={`${activeDelegations.length}`} variant="info" size="sm" />
          </View>

          {activeDelegations.length ? (
            activeDelegations.map((delegation) => (
              <View key={delegation.id} style={styles.listRow}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{delegation.delegate?.full_name || 'Delegated member'}</Text>
                  <Text style={styles.listMeta}>
                    {formatStatus(delegation.role)} · {formatStatus(delegation.status || 'pending')}
                  </Text>
                </View>
                <Text style={styles.sideNote}>
                  {delegation.expires_at ? formatDate(delegation.expires_at) : 'Open ended'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No active delegations are recorded for this chama.</Text>
          )}
        </Card>
      </ScrollView>

      <Modal
        visible={motionModalVisible}
        onClose={() => {
          setMotionModalVisible(false);
          resetMotionForm();
        }}
        title="Create Motion"
      >
        <Input label="Title" value={motionTitle} onChangeText={setMotionTitle} placeholder="Enter a motion title" />
        <Input
          label="Description"
          value={motionDescription}
          onChangeText={setMotionDescription}
          placeholder="Explain what members are voting on."
          multiline
          numberOfLines={4}
        />
        <Input
          label="Voting closes"
          value={motionEndTime}
          onChangeText={setMotionEndTime}
          placeholder="2026-04-02T18:00"
        />
        <Input label="Quorum %" value={motionQuorum} onChangeText={setMotionQuorum} keyboardType="numeric" />
        <Button title="Publish motion" onPress={() => void handleCreateMotion()} loading={processingId === 'create-motion'} />
      </Modal>
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  approvalCard: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  backButton: {
    padding: spacing[2],
  },
  bodyText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  cardTitle: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  centerTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    marginTop: spacing[4],
  },
  container: {
    backgroundColor: colors.light.background,
    flex: 1,
  },
  emptyCopy: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
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
  headerRight: {
    width: 40,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  inlineState: {
    marginTop: spacing[4],
  },
  introCard: {
    marginTop: spacing[4],
  },
  motionHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  motionResultText: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  listContent: {
    flex: 1,
    gap: spacing[1],
  },
  listMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
  },
  listRow: {
    alignItems: 'center',
    borderTopColor: colors.neutral[100],
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[3],
  },
  listTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  ruleCard: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  ruleDescription: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  ruleFooter: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  ruleHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  ruleMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  ruleTitle: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionCard: {
    gap: spacing[1],
    marginTop: spacing[4],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  sideNote: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textAlign: 'right',
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
    paddingVertical: spacing[4],
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  summaryValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
  },
  title: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
  },
});
