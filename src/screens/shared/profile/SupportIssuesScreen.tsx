import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { RoleAwarePageShell } from '@/components/system/RoleAwarePageShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { issueService } from '@/services/issueService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { IssueDetail, IssueStats, IssueSummary } from '@/types';
import { formatDateTime, formatStatus } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'SupportIssues'>;
type RoutePropType = RouteProp<MainStackParamList, 'SupportIssues'>;

const ISSUE_CATEGORIES = ['finance', 'loan', 'meeting', 'behavior', 'technical', 'other'];
const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const SupportIssuesScreen: React.FC = () => {
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
  const { experience, visibleTabs, visibleColumns, visibleQuickActions, dataScope } = useScreenRBAC('support', chamaId || undefined);
  const canCreateCases = activeRole !== Role.AUDITOR;
  const supportNarrative =
    activeRole === Role.MEMBER
      ? 'Raise and track your own disputes, payment problems, or member concerns.'
      : activeRole === Role.TREASURER
        ? 'Review finance-related disputes, repayment complaints, and payment follow-ups.'
        : activeRole === Role.SECRETARY
          ? 'Review attendance, meetings, records, and communication-related support cases.'
          : activeRole === Role.CHAMA_ADMIN
            ? 'Manage chama-level disputes, unresolved member issues, and sensitive escalations.'
            : activeRole === Role.ADMIN
              ? 'Resolve support, moderation, and dispute cases across the operational queue.'
              : activeRole === Role.SUPERADMIN
                ? 'Inspect high-impact escalations and platform-sensitive support incidents.'
                : 'Review issue history and audit-sensitive disputes in a read-only workspace.';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [postingCommentId, setPostingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [issueDetails, setIssueDetails] = useState<Record<string, IssueDetail>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('finance');
  const [priority, setPriority] = useState('medium');

  const loadData = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [issueRows, statsRow] = await Promise.all([
        issueService.getIssues(chamaId).catch(() => []),
        issueService.getIssueStats(chamaId).catch(() => null),
      ]);

      setIssues(issueRows);
      setStats(statsRow);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load support cases.')
          : 'Unable to load support cases.';
      setError(message);
      setIssues([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [chamaId, isLoadingChamaContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateIssue = async () => {
    if (!chamaId || !title.trim() || !description.trim()) {
      setError('Issue title and description are required.');
      return;
    }

    try {
      setSubmittingIssue(true);
      setError(null);
      const created = await issueService.createIssue({
        chama_id: chamaId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      setTitle('');
      setDescription('');
      setIssueDetails((current) => ({ ...current, [created.id]: created }));
      setExpandedIssueId(created.id);
      await loadData();
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to log this issue.')
          : 'Unable to log this issue.';
      setError(message);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleToggleIssue = async (issueId: string) => {
    const nextExpanded = expandedIssueId === issueId ? null : issueId;
    setExpandedIssueId(nextExpanded);

    if (!nextExpanded || issueDetails[issueId]) {
      return;
    }

    try {
      const detail = await issueService.getIssue(issueId);
      setIssueDetails((current) => ({ ...current, [issueId]: detail }));
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load issue details.')
          : 'Unable to load issue details.';
      setError(message);
    }
  };

  const handleAddComment = async (issueId: string) => {
    const message = commentDrafts[issueId]?.trim();

    if (!message) {
      setError('Write a comment before posting.');
      return;
    }

    try {
      setPostingCommentId(issueId);
      setError(null);
      await issueService.addComment(issueId, { message });
      const detail = await issueService.getIssue(issueId);
      setIssueDetails((current) => ({ ...current, [issueId]: detail }));
      setCommentDrafts((current) => ({ ...current, [issueId]: '' }));
      await loadData();
    } catch (serviceError) {
      const messageText =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to post this comment.')
          : 'Unable to post this comment.';
      setError(messageText);
    } finally {
      setPostingCommentId(null);
    }
  };

  if (loading) {
    return (
      <RequireRouteAccess route="SupportIssues" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading support cases</Text>
          <Text style={styles.centerText}>Gathering disputes, finance cases, technical issues, and their current status.</Text>
        </View>
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  if (!chamaId) {
    return (
      <RequireRouteAccess route="SupportIssues" chamaId={chamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Support and dispute workflows need a chama context so membership permissions are enforced correctly."
          style={styles.centerState}
        />
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  return (
    <RequireRouteAccess route="SupportIssues" chamaId={chamaId || undefined}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Support & Disputes</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <RoleAwarePageShell
          eyebrow={`${ROLE_DISPLAY_NAMES[activeRole]} workspace`}
          title="Support & disputes"
          description={`${supportNarrative} Data scope: ${dataScope.replace(/_/g, ' ')}.`}
          accessLabel={experience.access.replace(/_/g, ' ')}
          accessMode={experience.access}
          scopeLabel={dataScope.replace(/_/g, ' ')}
          tabs={visibleTabs}
          columns={visibleColumns}
          badges={[...visibleQuickActions.slice(0, 2), ...visibleColumns.slice(0, 2)]}
          actions={[
            canCreateCases
              ? {
                  key: 'new-case',
                  label: 'New case',
                  icon: 'plus-circle-outline',
                  onPress: () => undefined,
                }
              : null,
          ].filter(Boolean) as Array<{ key: string; label: string; icon?: string; onPress?: () => void }>}
        />

        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          onSelectChama={(id) => {
            void switchChama(id);
          }}
          helperText={switchError || null}
        />

        <Card style={styles.heroCard}>
          <View style={styles.cardHeader}>
            <Icon name="lifebuoy" size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Report disputes, payment problems, and member incidents</Text>
          </View>
          <Text style={styles.bodyText}>
            Cases raised here stay chama-scoped, auditable, and visible to the right people without moving support into private chats.
          </Text>
        </Card>

        {stats ? (
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.total_issues}</Text>
              <Text style={styles.summaryLabel}>Total Cases</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.status_counts.open || 0}</Text>
              <Text style={styles.summaryLabel}>Open</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.active_suspensions.length}</Text>
              <Text style={styles.summaryLabel}>Active Suspensions</Text>
            </Card>
          </View>
        ) : null}

        {error ? (
          <EmptyState
            title="Support data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadData()} />}
            style={styles.inlineState}
          />
        ) : null}

        {canCreateCases ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Create Support Case</Text>
            <Text style={styles.sectionDescription}>
              Use this for payment disputes, loan disagreements, technical bugs, attendance complaints, or member conduct issues.
            </Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Short summary"
              placeholderTextColor={colors.neutral[400]}
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue and the outcome you need"
              placeholderTextColor={colors.neutral[400]}
              multiline
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.choiceRow}>
              {ISSUE_CATEGORIES.map((item) => {
                const selected = item === category;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.choiceChip, selected ? styles.choiceChipActive : null]}
                    onPress={() => setCategory(item)}
                  >
                    <Text style={[styles.choiceText, selected ? styles.choiceTextActive : null]}>
                      {formatStatus(item)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.choiceRow}>
              {ISSUE_PRIORITIES.map((item) => {
                const selected = item === priority;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.choiceChip, selected ? styles.choiceChipActive : null]}
                    onPress={() => setPriority(item)}
                  >
                    <Text style={[styles.choiceText, selected ? styles.choiceTextActive : null]}>
                      {formatStatus(item)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button title="Log Case" onPress={() => void handleCreateIssue()} loading={submittingIssue} />
          </Card>
        ) : (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Read-only issue review</Text>
            <Text style={styles.sectionDescription}>
              Your role can inspect issue history, comments, and outcomes here, but it should not create new support cases from this workspace.
            </Text>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Case Queue</Text>
            <Text style={styles.sectionCaption}>{issues.length} items</Text>
          </View>

          {issues.length ? (
            issues.map((issue) => {
              const detail = issueDetails[issue.id];
              const isExpanded = expandedIssueId === issue.id;

              return (
                <View key={issue.id} style={styles.issueCard}>
                  <TouchableOpacity onPress={() => void handleToggleIssue(issue.id)} activeOpacity={0.85}>
                    <View style={styles.issueHeader}>
                      <View style={styles.issueTitleWrap}>
                        <Text style={styles.issueTitle}>{issue.title}</Text>
                        <Text style={styles.issueMeta}>
                          {formatStatus(issue.category)} · {formatStatus(issue.priority)}
                        </Text>
                      </View>
                      <View style={styles.issueRight}>
                        <Text style={styles.issueStatus}>{formatStatus(issue.status)}</Text>
                        <Icon
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.neutral[500]}
                        />
                      </View>
                    </View>
                    <Text style={styles.issueDescription} numberOfLines={isExpanded ? 0 : 2}>
                      {issue.description}
                    </Text>
                    <Text style={styles.issueMeta}>
                      {issue.comment_count || 0} comments · opened {formatDateTime(issue.created_at)}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.expandedPanel}>
                      {detail ? (
                        <>
                          {detail.comments.length ? (
                            detail.comments.map((comment) => (
                              <View key={comment.id} style={styles.commentCard}>
                                <Text style={styles.commentAuthor}>
                                  {comment.author?.full_name || 'Member'} · {formatDateTime(comment.created_at)}
                                </Text>
                                <Text style={styles.commentText}>{comment.message}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.emptyCopy}>No comments yet. Add a follow-up below.</Text>
                          )}

                          <TextInput
                            style={[styles.input, styles.multilineInput]}
                            value={commentDrafts[issue.id] || ''}
                            onChangeText={(value) =>
                              setCommentDrafts((current) => ({ ...current, [issue.id]: value }))
                            }
                            placeholder="Add a follow-up or clarification"
                            placeholderTextColor={colors.neutral[400]}
                            multiline
                          />
                          <Button
                            title="Post Comment"
                            size="sm"
                            onPress={() => void handleAddComment(issue.id)}
                            loading={postingCommentId === issue.id}
                          />
                        </>
                      ) : (
                        <View style={styles.inlineLoader}>
                          <ActivityIndicator size="small" color={colors.primary[500]} />
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyCopy}>No support or dispute cases are logged for this chama yet.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
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
  choiceChip: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  choiceChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  choiceText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  commentAuthor: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  commentCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    gap: spacing[1],
    marginBottom: spacing[2],
    padding: spacing[3],
  },
  commentText: {
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
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
  expandedPanel: {
    borderTopColor: colors.neutral[100],
    borderTopWidth: 1,
    marginTop: spacing[3],
    paddingTop: spacing[3],
  },
  fieldLabel: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
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
  heroCard: {
    marginTop: spacing[4],
  },
  inlineLoader: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  inlineState: {
    marginTop: spacing[4],
  },
  input: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  issueCard: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  issueDescription: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing[2],
  },
  issueHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  issueMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  issueRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  issueStatus: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
  issueTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  issueTitleWrap: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionCaption: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  sectionCard: {
    marginTop: spacing[4],
  },
  sectionDescription: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing[2],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
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
    gap: spacing[3],
    marginTop: spacing[4],
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
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
