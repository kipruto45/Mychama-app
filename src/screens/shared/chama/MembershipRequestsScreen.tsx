import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { formatDate } from '@/utils/format';

type MembershipRequestsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MembershipRequests'>;
type MembershipRequestsScreenRouteProp = RouteProp<MainStackParamList, 'MembershipRequests'>;

interface MembershipRequest {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  request_note?: string;
  requested_at: string;
  reviewed_at?: string;
  review_note?: string;
}

export const MembershipRequestsScreen: React.FC = () => {
  const navigation = useNavigation<MembershipRequestsScreenNavigationProp>();
  const route = useRoute<MembershipRequestsScreenRouteProp>();
  const { chamaId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MembershipRequest[]>([]);

  const loadRequests = async () => {
    try {
      const apiRequests = await chamaService.getMembershipRequests(chamaId);
      const mappedRequests = apiRequests.map((request) => ({
        id: request.id,
        user: {
          id: request.user.id,
          name: request.user.full_name,
          phone: request.user.phone,
          email: request.user.email || undefined,
        },
        status: request.status,
        request_note: request.request_note || undefined,
        requested_at: request.created_at,
        reviewed_at: request.reviewed_at || undefined,
        review_note: request.review_note || undefined,
      }));

      setRequests(mappedRequests);
      setFilteredRequests(mappedRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((r) => r.status === activeFilter));
    }
  }, [activeFilter, requests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApprove = (request: MembershipRequest) => {
    Alert.alert(
      'Approve Request',
      `Approve ${request.user.name}'s request to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await chamaService.approveMembershipRequest(chamaId, request.id);
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === request.id
                    ? { ...r, status: 'approved' as const, reviewed_at: new Date().toISOString() }
                    : r
                )
              );
              Alert.alert('Success', 'Request approved');
            } catch {
              Alert.alert('Error', 'Failed to approve request');
            }
          },
        },
      ]
    );
  };

  const handleReject = (request: MembershipRequest) => {
    if (typeof Alert.prompt !== 'function') {
      Alert.alert('Unsupported', 'Inline rejection notes are not supported on this device.');
      return;
    }

    Alert.prompt(
      'Reject Request',
      `Reject ${request.user.name}'s request? Add a note (optional):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (note?: string) => {
            try {
              await chamaService.rejectMembershipRequest(chamaId, request.id, note || undefined);
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === request.id
                    ? {
                        ...r,
                        status: 'rejected' as const,
                        reviewed_at: new Date().toISOString(),
                        review_note: note || undefined,
                      }
                    : r
                )
              );
              Alert.alert('Request Rejected', 'The request has been rejected');
            } catch {
              Alert.alert('Error', 'Failed to reject request');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return requests.length;
    return requests.filter((r) => r.status === status).length;
  };

  const renderRequestItem = ({ item }: { item: MembershipRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Avatar name={item.user.name} size="md" />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.user.name}</Text>
          <Text style={styles.requestPhone}>{item.user.phone}</Text>
          {item.user.email && (
            <Text style={styles.requestEmail}>{item.user.email}</Text>
          )}
        </View>
        <Badge
          label={item.status}
          variant={getStatusVariant(item.status) as any}
        />
      </View>

      {item.request_note && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Request Note:</Text>
          <Text style={styles.noteText}>{item.request_note}</Text>
        </View>
      )}

      <View style={styles.requestMeta}>
        <Text style={styles.requestDate}>
          Requested: {formatDate(item.requested_at)}
        </Text>
        {item.reviewed_at && (
          <Text style={styles.reviewDate}>
            Reviewed: {formatDate(item.reviewed_at)}
          </Text>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            title="Approve"
            onPress={() => handleApprove(item)}
            size="sm"
            style={styles.approveButton}
            icon={<Icon name="check" size={16} color="#FFFFFF" />}
          />
          <Button
            title="Reject"
            onPress={() => handleReject(item)}
            variant="outline"
            size="sm"
            style={styles.rejectButton}
            icon={<Icon name="close" size={16} color={colors.error} />}
          />
        </View>
      )}

      {item.review_note && (
        <View style={styles.reviewNoteContainer}>
          <Text style={styles.reviewNoteLabel}>Review Note:</Text>
          <Text style={styles.reviewNoteText}>{item.review_note}</Text>
        </View>
      )}
    </Card>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={<Icon name="account-clock" size={64} color={colors.neutral[400]} />}
      title="No Requests Found"
      description={
        activeFilter !== 'all'
          ? `No ${activeFilter} requests at the moment`
          : 'No membership requests yet'
      }
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Membership Requests</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('InviteMember', { chamaId })}
          style={styles.inviteButton}
        >
          <Icon name="account-plus" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
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

      {/* Request List */}
      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
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
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  requestCard: {
    marginBottom: spacing[3],
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  requestName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  requestPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginTop: spacing[1],
  },
  requestEmail: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  noteContainer: {
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  noteLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  requestMeta: {
    marginBottom: spacing[3],
  },
  requestDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  reviewDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  reviewNoteContainer: {
    backgroundColor: colors.error + '10',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginTop: spacing[3],
  },
  reviewNoteLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginBottom: spacing[1],
  },
  reviewNoteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
});
