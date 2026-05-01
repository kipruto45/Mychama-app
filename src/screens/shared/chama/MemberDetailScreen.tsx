import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { Membership, Contribution, Loan, Chama } from '@/types';
import { formatCurrency, formatDate, formatPhoneNumber, formatStatus } from '@/utils/format';

type MemberDetailNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MemberDetail'>;
type MemberDetailRouteProp = RouteProp<MainStackParamList, 'MemberDetail'>;

export const MemberDetailScreen: React.FC = () => {
  const navigation = useNavigation<MemberDetailNavigationProp>();
  const route = useRoute<MemberDetailRouteProp>();
  const { chamaId, memberId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chama, setChama] = useState<Chama | null>(null);
  const [member, setMember] = useState<Membership | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [updating, setUpdating] = useState(false);

  const loadMemberDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [memberData, chamaData, contributionRows, loanRows] = await Promise.all([
        chamaService.getMember(chamaId, memberId),
        chamaService.getChama(chamaId).catch(() => null),
        financeService.getContributions(chamaId).catch(() => []),
        financeService.getLoans(chamaId).catch(() => []),
      ]);

      const userId = memberData.user.id;
      setMember(memberData);
      setChama(chamaData);
      setContributions(contributionRows.filter((item) => item.member.id === userId));
      setLoans(loanRows.filter((item) => item.member.id === userId));
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load member details.')
          : 'Unable to load member details.';
      setError(message);
      setMember(null);
      setContributions([]);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMemberDetail();
  }, [chamaId, memberId]);

  const contributionTotal = useMemo(
    () => contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [contributions]
  );

  const activeLoanCount = useMemo(
    () => loans.filter((loan) => !['repaid', 'rejected'].includes(loan.status)).length,
    [loans]
  );

  const outstandingLoanTotal = useMemo(
    () =>
      loans
        .filter((loan) => !['repaid', 'rejected'].includes(loan.status))
        .reduce((sum, loan) => sum + Number(loan.principal || 0), 0),
    [loans]
  );

  const updateRole = async (role: Membership['role']) => {
    if (!member) return;

    setUpdating(true);
    try {
      const updatedMember = await chamaService.updateMemberRole(chamaId, member.id, role);
      setMember(updatedMember);
      Alert.alert('Role Updated', 'Member role has been updated successfully.');
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to update member role.')
          : 'Unable to update member role.';
      Alert.alert('Update Failed', message);
    } finally {
      setUpdating(false);
    }
  };

  const toggleStatus = async () => {
    if (!member) return;

    setUpdating(true);
    try {
      if (member.status === 'active') {
        await chamaService.rejectMember(chamaId, member.id, 'Suspended from mobile app.');
        setMember({ ...member, status: 'suspended' });
        Alert.alert('Member Suspended', 'The member has been suspended.');
      } else {
        const approvedMember = await chamaService.approveMember(chamaId, member.id);
        setMember(approvedMember);
        Alert.alert('Member Activated', 'The member has been activated.');
      }
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to update member status.')
          : 'Unable to update member status.';
      Alert.alert('Update Failed', message);
    } finally {
      setUpdating(false);
    }
  };

  const openRolePicker = () => {
    if (!member) return;

    Alert.alert('Change Role', `Select a new role for ${member.user.full_name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Member', onPress: () => void updateRole('member') },
      { text: 'Treasurer', onPress: () => void updateRole('treasurer') },
      { text: 'Secretary', onPress: () => void updateRole('secretary') },
      { text: 'Auditor', onPress: () => void updateRole('auditor') },
      { text: 'Admin', onPress: () => void updateRole('admin') },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading member details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Member unavailable"
          description={error || 'We could not load this member right now.'}
          action={
            <Button
              title="Retry"
              onPress={() => void loadMemberDetail()}
              icon={<Icon name="refresh" size={18} color="#FFFFFF" />}
            />
          }
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Member Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <Avatar
            name={member.user.full_name || 'Member'}
            imageUri={member.user.avatar || undefined}
            size="xl"
          />
          <Text style={styles.memberName}>{member.user.full_name}</Text>
          <Text style={styles.memberMeta}>{chama?.name || 'Chama member'}</Text>
          <View style={styles.badges}>
            <Badge label={formatStatus(member.role)} variant="primary" />
            <Badge
              label={formatStatus(member.status)}
              variant={member.status === 'active' ? 'success' : member.status === 'suspended' ? 'warning' : 'error'}
            />
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact & Membership</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{formatPhoneNumber(member.user.phone)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{member.user.email || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>{formatDate(member.joined_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Approved</Text>
            <Text style={styles.infoValue}>
              {member.approved_at ? formatDate(member.approved_at) : 'Pending approval'}
            </Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Contributions</Text>
            <Text style={styles.statValue}>{formatCurrency(contributionTotal, chama?.currency || 'KES')}</Text>
            <Text style={styles.statMeta}>{contributions.length} recorded</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Open Loans</Text>
            <Text style={styles.statValue}>{activeLoanCount}</Text>
            <Text style={styles.statMeta}>{formatCurrency(outstandingLoanTotal, chama?.currency || 'KES')}</Text>
          </Card>
        </View>

        <View style={styles.actionRow}>
          <Button
            title="Change Role"
            onPress={openRolePicker}
            variant="outline"
            disabled={updating}
            style={styles.actionButton}
            icon={<Icon name="account-cog-outline" size={16} color={colors.primary[500]} />}
          />
          <Button
            title={member.status === 'active' ? 'Suspend' : 'Activate'}
            onPress={() => void toggleStatus()}
            loading={updating}
            style={styles.actionButton}
            icon={
              <Icon
                name={member.status === 'active' ? 'account-off-outline' : 'account-check-outline'}
                size={16}
                color="#FFFFFF"
              />
            }
          />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Contributions</Text>
          {contributions.length > 0 ? (
            contributions.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View>
                  <Text style={styles.activityTitle}>{item.contribution_type_name || 'Contribution'}</Text>
                  <Text style={styles.activityMeta}>{formatDate(item.date_paid)}</Text>
                </View>
                <Text style={styles.activityAmount}>
                  {formatCurrency(item.amount, chama?.currency || 'KES')}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState
              title="No contributions yet"
              description="Contribution history for this member will appear here once recorded."
              style={styles.inlineEmpty}
            />
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loans</Text>
          {loans.length > 0 ? (
            loans.slice(0, 5).map((loan) => (
              <TouchableOpacity
                key={loan.id}
                style={styles.activityRow}
                onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
              >
                <View>
                  <Text style={styles.activityTitle}>{loan.loan_product.name}</Text>
                  <Text style={styles.activityMeta}>{formatStatus(loan.status)}</Text>
                </View>
                <Text style={styles.activityAmount}>
                  {formatCurrency(loan.principal, chama?.currency || 'KES')}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              title="No loans yet"
              description="Loan activity for this member will appear here once available."
              style={styles.inlineEmpty}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textAlign: 'center',
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
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  profileCard: {
    alignItems: 'center',
    gap: spacing[2],
  },
  memberName: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  memberMeta: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  badges: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  infoCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  statValue: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  statMeta: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  sectionCard: {
    gap: spacing[3],
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
  },
  activityMeta: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  activityAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  inlineEmpty: {
    paddingVertical: spacing[5],
  },
});
