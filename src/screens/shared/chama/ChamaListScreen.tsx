import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ChamaCard } from '@/components/cards/ChamaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { useActiveChama, useChamas } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { getScreenExperience, RequireRouteAccess } from '@/rbac';
import { chamaService } from '@/services/chamaService';
import { formatDate } from '@/utils/format';
import { getUserMessage } from '@/utils/userMessages';
import { Chama, MembershipRequest } from '@/types';

type ChamaListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Chamas'>;

export const ChamaListScreen: React.FC = () => {
  const navigation = useNavigation<ChamaListScreenNavigationProp>();
  const { activeChamaId } = useActiveChama();
  
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const canManageSettings = useCanPerformAction(Permission.CAN_MANAGE_CHAMA_SETTINGS, activeChamaId || undefined);
  const roleExperience = useMemo(() => getScreenExperience('chamas_list', activeRole), [activeRole]);
  const canCreateChama = canManageSettings || activeRole === Role.MEMBER || activeRole === Role.CHAMA_ADMIN;
  const canJoinChama = activeRole === Role.MEMBER || activeRole === Role.CHAMA_ADMIN;

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: chamas,
    isLoading: loading,
    refetch,
  } = useChamas();

  const loadMembershipRequests = useCallback(async () => {
    try {
      const requests = await chamaService.getMyMembershipRequests();
      setPendingRequests(requests.filter((r) => r.status === 'pending'));
    } catch (e) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    loadMembershipRequests();
  }, [loadMembershipRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadMembershipRequests()]);
    setRefreshing(false);
  }, [refetch, loadMembershipRequests]);

  const filteredChamas = useMemo(() => {
    if (!chamas) return [];
    if (!searchQuery.trim()) return chamas;
    const q = searchQuery.toLowerCase();
    return chamas.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false)
    );
  }, [chamas, searchQuery]);

  const renderChamaItem = useCallback(
    ({ item }: { item: Chama }) => (
      <ChamaCard
        chama={item}
        onPress={() => navigation.navigate('ChamaDetail', { chamaId: item.id })}
      />
    ),
    [navigation]
  );

  const handleCancelRequest = useCallback(async (requestId: string) => {
    Alert.alert('Cancel join request?', 'This cannot be undone.', [
      { text: 'Keep request', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: async () => {
          try {
            await chamaService.cancelJoinRequest(requestId);
            await loadMembershipRequests();
          } catch (error) {
            const message = getUserMessage(error, 'generic').message;
            Alert.alert('Could not cancel request', message);
          }
        },
      },
    ]);
  }, [loadMembershipRequests]);

  const renderPendingRequest = useCallback((request: MembershipRequest) => (
    <Card key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestIdentity}>
          <Avatar name={request.chama_name} size="md" />
          <View style={styles.requestMeta}>
            <Text style={styles.requestTitle}>{request.chama_name}</Text>
            <Text style={styles.requestSubtitle}>
              Submitted {formatDate(request.created_at)} via {request.requested_via.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <Badge label={request.status_display || request.status} variant="warning" size="sm" />
      </View>

      {request.status === 'pending' && (
        <>
          <Text style={styles.requestHint}>
            Waiting for an admin to review your join request.
          </Text>
          <View style={styles.requestActions}>
            <Button
              title="Cancel Request"
              variant="ghost"
              size="sm"
              onPress={() => handleCancelRequest(request.id)}
              style={styles.cancelButton}
            />
          </View>
        </>
      )}
    </Card>
  ), [handleCancelRequest]);

  const renderEmptyState = useMemo(() => {
    if (pendingRequests.length > 0) {
      return (
        <View style={styles.emptyStateContainer}>
          {pendingRequests.map(renderPendingRequest)}
        </View>
      );
    }

    return (
      <EmptyState
        icon={<Icon name="account-group-outline" size={64} color={colors.neutral[400]} />}
        title={searchQuery ? 'No Chamas Found' : 'No Chamas Yet'}
        description={
          searchQuery
            ? 'No chamas match your search criteria'
            : roleExperience.scope === 'platform'
              ? 'No chama workspaces match this operational view yet.'
              : "You haven't joined any chamas yet. Create or join one to get started!"
        }
        action={
          !searchQuery && (
            <View style={styles.emptyActions}>
              {canCreateChama ? (
                <Button
                  title="Create Chama"
                  onPress={() => navigation.navigate('CreateChama')}
                  icon={<Icon name="plus" size={20} color="#FFFFFF" />}
                  style={styles.emptyActionButton}
                />
              ) : null}
              {canJoinChama ? (
                <Button
                  title="Join via Code"
                  variant="outline"
                  onPress={() => {
                    const root = navigation.getParent();
                    if (root) {
                      (root as any).navigate('Auth', { screen: 'JoinViaCode' });
                    }
                  }}
                  icon={<Icon name="key-outline" size={20} color={colors.primary[500]} />}
                  style={styles.emptyActionButton}
                />
              ) : null}
            </View>
          )
        }
      />
    );
  }, [pendingRequests, searchQuery, roleExperience.scope, canCreateChama, canJoinChama, navigation, renderPendingRequest]);

  return (
    <RequireRouteAccess route="Chamas" chamaId={activeChamaId || undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Chamas</Text>
            <Text style={styles.subtitle}>{ROLE_DISPLAY_NAMES[activeRole]} view</Text>
          </View>
          <View style={styles.headerActions}>
            {canJoinChama ? (
              <TouchableOpacity
                onPress={() => {
                  const root = navigation.getParent();
                  if (root) {
                    (root as any).navigate('Auth', { screen: 'JoinViaCode' });
                  }
                }}
                style={styles.createButton}
              >
                <Icon name="key-outline" size={22} color={colors.primary[500]} />
              </TouchableOpacity>
            ) : null}
            {canCreateChama ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateChama')}
                style={styles.createButton}
              >
                <Icon name="plus" size={24} color={colors.primary[500]} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chamas..."
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{chamas?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Chamas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {chamas?.filter((c) => c.status === 'active').length || 0}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {chamas?.reduce((sum, c) => sum + (c.member_count || 0), 0) || 0}
            </Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
        </View>

        {pendingRequests.length > 0 ? (
          <View style={styles.pendingSection}>
            <View style={styles.pendingSectionHeader}>
              <Text style={styles.pendingSectionTitle}>Pending Join Requests</Text>
              <Badge label={String(pendingRequests.length)} variant="warning" size="sm" />
            </View>
            <Text style={styles.pendingSectionDescription}>
              These requests are still waiting for approval, so you can track your waiting list status.
            </Text>
            {pendingRequests.map(renderPendingRequest)}
          </View>
        ) : null}

        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <FlatList
            data={filteredChamas}
            renderItem={renderChamaItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  emptyActions: {
    gap: spacing[2],
    width: '100%',
  },
  emptyActionButton: {
    width: '100%',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    marginBottom: spacing[4],
  },
  pendingSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  pendingSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  pendingSectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
  },
  pendingSectionDescription: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
  },
  requestCard: {
    marginBottom: spacing[3],
  },
  requestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing[3],
  },
  requestMeta: {
    flex: 1,
    marginLeft: spacing[3],
  },
  requestTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  requestSubtitle: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  cancelButton: {
    borderColor: colors.error,
  },
  requestHint: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[600],
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.primary[200],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  emptyStateContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
});
