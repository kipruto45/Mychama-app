import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess } from '@/rbac';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { formatCurrency } from '@/utils/format';

type MemberListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MemberList'>;
type MemberListScreenRouteProp = RouteProp<MainStackParamList, 'MemberList'>;

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  role: 'admin' | 'treasurer' | 'secretary' | 'member';
  status: 'active' | 'suspended' | 'exited';
  joined_at: string;
  total_contributions: string;
}

export const MemberListScreen: React.FC = () => {
  const navigation = useNavigation<MemberListScreenNavigationProp>();
  const route = useRoute<MemberListScreenRouteProp>();
  const { chamaId } = route.params;
  const activeRole = useActiveRole(chamaId) || Role.MEMBER;
  const canInviteMembers = useCanPerformAction(Permission.CAN_INVITE_MEMBERS, chamaId);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiMembers, contributions] = await Promise.all([
        chamaService.getMembers(chamaId),
        financeService.getContributions(chamaId).catch(() => []),
      ]);

      const contributionTotals = contributions.reduce<Record<string, number>>((acc, contribution) => {
        const memberUserId = contribution.member.id;
        acc[memberUserId] = (acc[memberUserId] || 0) + Number(contribution.amount || 0);
        return acc;
      }, {});

      const mappedMembers = apiMembers.map((member) => ({
        id: member.id,
        user: {
          id: member.user.id,
          name: member.user.full_name,
          phone: member.user.phone,
          email: member.user.email || undefined,
          avatar: member.user.avatar || undefined,
        },
        role: member.role === 'auditor' ? 'member' : (member.role as Member['role']),
        status:
          member.status === 'exited' && member.exit_reason?.toLowerCase().includes('suspend')
            ? 'suspended'
            : (member.status as Member['status']),
        joined_at: member.joined_at,
        total_contributions: String(contributionTotals[member.user.id] || 0),
      }));

      setMembers(mappedMembers);
      setFilteredMembers(mappedMembers);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load members.')
          : 'Unable to load members.';
      setError(message);
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    let filtered = members;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (member) =>
          member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user.phone.includes(searchQuery)
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === activeFilter);
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, activeFilter, members]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleMemberPress = (member: Member) => {
    navigation.navigate('MemberDetail', { chamaId, memberId: member.id });
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'treasurer':
        return 'success';
      case 'secretary':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'exited':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return members.length;
    return members.filter((m) => m.status === status).length;
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => handleMemberPress(item)}
      activeOpacity={0.7}
    >
      <Avatar name={item.user.name} size="md" />
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.user.name}</Text>
          <Badge
            label={item.role}
            variant={getRoleVariant(item.role) as any}
            size="sm"
          />
        </View>
        <Text style={styles.memberPhone}>{item.user.phone}</Text>
        <View style={styles.memberStats}>
          <Text style={styles.memberStat}>
            Total: {formatCurrency(item.total_contributions, 'KES')}
          </Text>
        </View>
      </View>
      <View style={styles.memberRight}>
        <Badge
          label={item.status}
          variant={getStatusVariant(item.status) as any}
          size="sm"
        />
        <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={<Icon name="account-group" size={64} color={colors.neutral[400]} />}
      title={error ? 'Members unavailable' : 'No Members Found'}
      description={
        error
          ? error
          : searchQuery || activeFilter !== 'all'
          ? 'No members match your search or filter criteria'
          : 'No members in this chama yet'
      }
      action={
        error ? (
          <Button
            title="Retry"
            onPress={() => void loadMembers()}
            icon={<Icon name="refresh" size={18} color="#FFFFFF" />}
          />
        ) : undefined
      }
    />
  );

  return (
    <RequireRouteAccess route="MemberList" chamaId={chamaId}>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Members</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('InviteMember', { chamaId })}
          style={styles.inviteButton}
        >
          <Icon name="account-plus" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
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

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'suspended', label: 'Suspended' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                activeFilter === filter.key && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  activeFilter === filter.key && styles.filterBadgeTextActive,
                ]}
              >
                {getStatusCount(filter.key)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Member List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberItem}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  inviteButton: {
    padding: spacing[2],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    marginHorizontal: spacing[1],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginRight: spacing[1],
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[600],
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginRight: spacing[2],
  },
  memberPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  memberStats: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  memberStat: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  memberPending: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.warning,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
});
