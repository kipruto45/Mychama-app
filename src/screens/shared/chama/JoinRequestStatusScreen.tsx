import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { MembershipRequest } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/format';

type JoinRequestStatusNavigationProp = NativeStackNavigationProp<MainStackParamList, 'JoinRequestStatus'>;

const statusVariant = (status: MembershipRequest['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'warning';
  }
};

export const JoinRequestStatusScreen: React.FC = () => {
  const navigation = useNavigation<JoinRequestStatusNavigationProp>();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await chamaService.getMyMembershipRequests();
      setRequests(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void loadRequests();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading join requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.title}>Join Request Status</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="clipboard-account-outline" size={28} color={colors.primary[700]} />
          </View>
          <Text style={styles.heroTitle}>Track your pending access requests</Text>
          <Text style={styles.heroSubtitle}>
            See which chamas are reviewing your request, which ones were approved, and which need a fresh action from you.
          </Text>
        </Card>

        {requests.length === 0 ? (
          <EmptyState
            title="No join requests yet"
            description="When you submit a request to join a chama, it will appear here with its current review status."
          />
        ) : (
          requests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.requestTopRow}>
                <View>
                  <Text style={styles.requestTitle}>{request.chama_name}</Text>
                  <Text style={styles.requestSubtitle}>
                    Submitted {formatDateTime(request.created_at)}
                  </Text>
                </View>
                <Badge label={request.status_display || request.status} variant={statusVariant(request.status)} />
              </View>

              {request.request_note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Your note</Text>
                  <Text style={styles.noteText}>{request.request_note}</Text>
                </View>
              ) : null}

              {request.review_note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Review note</Text>
                  <Text style={styles.noteText}>{request.review_note}</Text>
                </View>
              ) : null}

              <View style={styles.requestActions}>
                {request.status === 'approved' ? (
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => navigation.navigate('Chamas')}
                    activeOpacity={0.88}
                  >
                    <Icon name="account-group-outline" size={18} color={colors.light.background} />
                    <Text style={styles.primaryActionText}>Open Chamas</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroCard: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  requestCard: {
    gap: spacing[3],
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  requestTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  requestSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  noteBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  noteLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
  },
  primaryActionText: {
    color: colors.light.background,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});

