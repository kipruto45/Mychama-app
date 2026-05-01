import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { authService } from '@/services/authService';
import { formatDate } from '@/utils/format';

type ReferralsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Referrals'>;

interface ReferralHistoryItem {
  chama_id: string;
  chama_name: string;
  created_at: string;
  status: string;
}

interface ReferralRewardItem {
  referred_chama_id: string;
  referred_chama_name: string;
  reward_type: string;
  reward_value: string;
  status: string;
  created_at: string;
}

export const ReferralsScreen: React.FC = () => {
  const navigation = useNavigation<ReferralsScreenNavigationProp>();

  const {
    data: referralSummary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'referrals'],
    queryFn: authService.getReferralSummary,
  });

  const referralCode = referralSummary?.referral_code || '';
  const stats = referralSummary?.stats;
  const history: ReferralHistoryItem[] = (referralSummary?.history || []).map((item) => ({
    chama_id: String(item.chama_id || ''),
    chama_name: String(item.chama_name || 'Unnamed Chama'),
    created_at: String(item.created_at || new Date().toISOString()),
    status: String(item.status || 'pending'),
  }));
  const rewards: ReferralRewardItem[] = (referralSummary?.rewards || []).map((item) => ({
    referred_chama_id: String(item.referred_chama_id || ''),
    referred_chama_name: String(item.referred_chama_name || 'Referred Chama'),
    reward_type: String(item.reward_type || 'reward'),
    reward_value: String(item.reward_value || '0'),
    status: String(item.status || 'pending'),
    created_at: String(item.created_at || new Date().toISOString()),
  }));

  const handleShareCode = async () => {
    if (!referralCode) {
      Alert.alert('Referrals', 'Your referral code is not available yet.');
      return;
    }

    try {
      await Share.share({
        message: `Join MyChama using my referral code: ${referralCode}`,
      });
    } catch {
      Alert.alert('Error', 'Failed to share referral code.');
    }
  };

  const handleCopyCode = () => {
    if (!referralCode) {
      Alert.alert('Referrals', 'Your referral code is not available yet.');
      return;
    }

    Alert.alert('Referral Code', referralCode);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'applied':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'expired':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Referrals</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading referrals...</Text>
        </View>
      ) : error ? (
        <EmptyState
          icon={<Icon name="account-multiple-remove-outline" size={64} color={colors.neutral[400]} />}
          title="Could not load referrals"
          description="We could not fetch your referral summary right now."
          action={<Button title="Retry" onPress={() => refetch()} />}
          style={styles.emptyState}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{referralCode || 'Unavailable'}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
                disabled={!referralCode}
              >
                <Icon name="content-copy" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeDescription}>
              Share your code and earn rewards when referred chamas complete setup.
            </Text>
            <Button
              title="Share Code"
              onPress={handleShareCode}
              disabled={!referralCode}
              style={styles.shareButton}
              icon={<Icon name="share-variant" size={16} color="#FFFFFF" />}
            />
          </Card>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.total_referrals || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.completed_referrals || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.pending_setup_referrals || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          <Card style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <Icon name="gift-outline" size={22} color={colors.accent[500]} />
              <Text style={styles.rewardsTitle}>Rewards Earned</Text>
            </View>
            <Text style={styles.rewardsValue}>{stats?.reward_total_earned || 0}</Text>
            <Text style={styles.rewardsDescription}>
              Total reward units recorded for your account.
            </Text>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referred Chamas</Text>
            <Card style={styles.sectionCard}>
              {history.length > 0 ? (
                history.map((item) => (
                  <View key={item.chama_id} style={styles.listRow}>
                    <View style={styles.listRowContent}>
                      <Text style={styles.listTitle}>{item.chama_name}</Text>
                      <Text style={styles.listMeta}>
                        Created {formatDate(item.created_at)}
                      </Text>
                    </View>
                    <Badge
                      label={item.status}
                      variant={getStatusVariant(item.status)}
                      size="sm"
                    />
                  </View>
                ))
              ) : (
                <EmptyState
                  title="No referrals yet"
                  description="Your referred chamas will appear here once someone signs up with your code."
                  style={styles.inlineEmpty}
                />
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reward Activity</Text>
            <Card style={styles.sectionCard}>
              {rewards.length > 0 ? (
                rewards.map((reward, index) => (
                  <View
                    key={`${reward.referred_chama_id}-${index}`}
                    style={styles.listRow}
                  >
                    <View style={styles.listRowContent}>
                      <Text style={styles.listTitle}>{reward.referred_chama_name}</Text>
                      <Text style={styles.listMeta}>
                        {reward.reward_type} • {formatDate(reward.created_at)}
                      </Text>
                    </View>
                    <View style={styles.rewardRight}>
                      <Badge
                        label={reward.status}
                        variant={getStatusVariant(reward.status)}
                        size="sm"
                      />
                      <Text style={styles.rewardValue}>{reward.reward_value}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  title="No rewards recorded yet"
                  description="Reward activity will appear here once it has been applied."
                  style={styles.inlineEmpty}
                />
              )}
            </Card>
          </View>
        </ScrollView>
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
  headerRight: {
    width: 40,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  emptyState: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  codeCard: {
    marginBottom: spacing[4],
  },
  codeLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  copyButton: {
    padding: spacing[2],
  },
  codeDescription: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  shareButton: {
    marginTop: spacing[4],
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  statLabel: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  rewardsCard: {
    marginBottom: spacing[4],
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  rewardsTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  rewardsValue: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  rewardsDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  sectionCard: {
    gap: spacing[3],
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  listRowContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  listTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  listMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  rewardRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  rewardValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.accent[600],
  },
  inlineEmpty: {
    paddingVertical: spacing[4],
  },
});
