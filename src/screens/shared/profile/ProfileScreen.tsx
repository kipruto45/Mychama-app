import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { RoleAwarePageShell } from '@/components/system/RoleAwarePageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { authService } from '@/services/authService';
import { appService } from '@/services/appService';
import { formatCurrency } from '@/utils/format';
import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { activeChamaId } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const isAdminWorkspace = [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN].includes(activeRole);
  const { experience, visibleTabs, visibleColumns, dataScope } = useScreenRBAC('profile', activeChamaId || undefined);
  const {
    data: referrals,
    refetch: refetchReferrals,
  } = useQuery({
    queryKey: ['auth', 'referrals'],
    queryFn: authService.getReferralSummary,
    enabled: !!user,
  });
  const {
    data: memberProfile,
    isLoading: isLoadingProfile,
    isRefetching: isRefreshingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', 'financial-summary'],
    enabled: !!user,
    queryFn: () => appService.getMemberProfile(),
  });

  const onRefresh = async () => {
    await Promise.all([refetchProfile(), refetchReferrals()]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const openLink = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn(`Failed to open ${label}`, error);
      Alert.alert('Profile', `Unable to open ${label} right now.`);
    }
  };



  const menuSections: { title: string; items: MenuItem[] }[] = useMemo(() => [
    {
      title: 'Account',
      items: [
        {
          icon: 'account-edit',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          onPress: () => navigation.navigate('EditProfile'),
          showArrow: true,
        },
        {
          icon: 'shield-check',
          title: 'KYC Verification',
          subtitle: 'Verify your identity',
          onPress: () => navigation.navigate('KYC'),
          showArrow: true,
        },
        {
          icon: 'file-cabinet',
          title: 'Document Center',
          subtitle: 'Receipts, KYC files, queued retries, and meeting minutes',
          onPress: () => navigation.navigate('DocumentCenter'),
          showArrow: true,
        },
        {
          icon: 'lock',
          title: 'Change Password',
          subtitle: 'Update your password',
          onPress: () => navigation.navigate('ChangePassword'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'two-factor-authentication',
          title: 'Two-Factor Authentication',
          subtitle: 'Add an extra layer of security',
          onPress: () => navigation.navigate('TwoFactorAuth'),
          showArrow: true,
        },
        {
          icon: 'fingerprint',
          title: 'Biometric Login',
          subtitle: 'Available when secure device authentication is enabled',
          onPress: () =>
            Alert.alert(
              'Biometric Login Unavailable',
              'Biometric sign-in is not enabled in this build yet.'
            ),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => navigation.navigate('HelpSupport'),
          showArrow: true,
        },
        {
          icon: 'file-document',
          title: 'Terms of Service',
          onPress: () => navigation.navigate('TermsOfService'),
          showArrow: true,
        },
        {
          icon: 'shield-lock',
          title: 'Privacy Policy',
          onPress: () => navigation.navigate('PrivacyPolicy'),
          showArrow: true,
        },
      ],
    },
  ].map((section) => {
    if (activeRole !== Role.MEMBER && section.title === 'Account') {
      return {
        ...section,
        items: section.items.filter((item) => item.title !== 'KYC Verification'),
      };
    }

    return section;
  }), [activeRole, navigation]);

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Icon name={item.icon} size={22} color={colors.primary[500]} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.showArrow && (
        <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
      )}
    </TouchableOpacity>
  );

  return (
    <RequireRouteAccess route="Profile" chamaId={activeChamaId || undefined}>
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProfile}
            onRefresh={() => {
              void onRefresh();
            }}
          />
        }
      >
        <RoleAwarePageShell
          eyebrow={`${ROLE_DISPLAY_NAMES[activeRole]} workspace`}
          title="Profile"
          description={`${experience.does[0] || 'Manage your account and personal workspace settings.'} Data scope: ${dataScope.replace(/_/g, ' ')}.`}
          accessLabel={experience.access.replace(/_/g, ' ')}
          accessMode={experience.access}
          scopeLabel={dataScope.replace(/_/g, ' ')}
          tabs={visibleTabs}
          columns={visibleColumns}
          badges={[...experience.sees.slice(0, 2), ...visibleTabs.slice(0, 1), ...visibleColumns.slice(0, 1)]}
          actions={[
            { key: 'edit', label: 'Edit profile', icon: 'account-edit', onPress: () => navigation.navigate('EditProfile') },
            { key: 'settings', label: 'Settings', icon: 'cog', onPress: () => navigation.navigate('Settings') },
            ...(!isAdminWorkspace
              ? [{ key: 'kyc', label: 'KYC', icon: 'shield-check', onPress: () => navigation.navigate('KYC') }]
              : []),
          ]}
        />



        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            <Icon name="cog" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.full_name || 'User'}
              size="xl"
              imageUri={user?.avatar || undefined}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
              <Text style={styles.profilePhone}>{user?.phone || ''}</Text>
              {user?.email && (
                <Text style={styles.profileEmail}>{user.email}</Text>
              )}
              <View style={styles.profileBadges}>
                {user?.role && (
                  <Badge
                    label={user.role}
                    variant="primary"
                    size="sm"
                  />
                )}
                {user?.is_active && (
                  <Badge
                    label="Active"
                    variant="success"
                    size="sm"
                  />
                )}
              </View>
            </View>
          </View>
          
          {!isAdminWorkspace && user?.referral_code && (
            <View style={styles.referralContainer}>
              <Text style={styles.referralLabel}>Referral Code</Text>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCode}>{user.referral_code}</Text>
                <TouchableOpacity
                  onPress={() =>
                    Share.share({
                      message: `Join MyChama with my referral code: ${user.referral_code}`,
                    })
                  }
                >
                  <Icon name="content-copy" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.referralCount}>
                {user.referral_count || 0} referrals
              </Text>
            </View>
          )}
        </Card>

        {isLoadingProfile && !memberProfile ? (
          <Card style={styles.loadingSummaryCard}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.loadingSummaryText}>Loading your financial profile...</Text>
          </Card>
        ) : memberProfile && activeRole !== Role.MEMBER ? (
          <>
            <Card style={styles.portfolioCard}>
              <View style={styles.portfolioHeader}>
                <View>
                  <Text style={styles.portfolioTitle}>Member Financial Profile</Text>
                  <Text style={styles.portfolioSubtitle}>
                    Wallet balances, obligations, participation, and reliability across your chamas.
                  </Text>
                </View>
                <Badge
                  label={`Reliability ${memberProfile.portfolio.reliability_score}`}
                  variant={
                    memberProfile.portfolio.reliability_score >= 75
                      ? 'success'
                      : memberProfile.portfolio.reliability_score >= 50
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                />
              </View>

              <View style={styles.portfolioGrid}>
                {[
                  ['Wallet Total', formatCurrency(memberProfile.wallet.total, memberProfile.wallet.currency)],
                  ['Available', formatCurrency(memberProfile.wallet.available, memberProfile.wallet.currency)],
                  ['Locked', formatCurrency(memberProfile.wallet.locked, memberProfile.wallet.currency)],
                  ['Savings', formatCurrency(memberProfile.portfolio.total_contributions, memberProfile.wallet.currency)],
                  ['Outstanding Loans', formatCurrency(memberProfile.portfolio.outstanding_balances, memberProfile.wallet.currency)],
                  ['Payable Fines', formatCurrency(memberProfile.portfolio.payable_fines, memberProfile.wallet.currency)],
                  ['Attendance', `${memberProfile.portfolio.attendance_rate}%`],
                  ['Voting', `${memberProfile.portfolio.voting_participation_rate}%`],
                ].map(([label, value]) => (
                  <View key={label} style={styles.portfolioMetric}>
                    <Text style={styles.portfolioMetricValue}>{value}</Text>
                    <Text style={styles.portfolioMetricLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{memberProfile.memberships.active}</Text>
                  <Text style={styles.statLabel}>Chamas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatCurrency(memberProfile.portfolio.total_loans_repaid, memberProfile.wallet.currency)}
                  </Text>
                  <Text style={styles.statLabel}>Loans Repaid</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {isAdminWorkspace ? memberProfile.portfolio.active_loans : referrals?.stats?.total_referrals ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>{isAdminWorkspace ? 'Active Loans' : 'Referrals'}</Text>
                </View>
              </View>
            </Card>

            {memberProfile.role_workspaces.length > 0 ? (
              <View style={styles.financialListSection}>
                <Text style={styles.menuSectionTitle}>Role Workspaces</Text>
                {memberProfile.role_workspaces.map((workspace) => (
                  <Card key={`${workspace.workspace_key}:${workspace.chama_id}`} style={styles.workspacePreviewCard}>
                    <View style={styles.workspacePreviewHeader}>
                      <View style={styles.workspacePreviewCopy}>
                        <Text style={styles.workspacePreviewTitle}>{workspace.workspace_label}</Text>
                        <Text style={styles.workspacePreviewSubtitle}>{workspace.chama_name}</Text>
                        <Text style={styles.workspacePreviewSummary}>{workspace.workspace_summary}</Text>
                      </View>
                      <Badge label={workspace.effective_role.replace(/_/g, ' ')} variant="info" size="sm" />
                    </View>
                    <View style={styles.workspacePreviewMetricRow}>
                      {[
                        ['Approvals', workspace.metrics.pending_approvals],
                        ['Open Disputes', workspace.metrics.open_disputes],
                        ['Due Items', workspace.metrics.pending_contributions],
                        ['Reconciliation', workspace.metrics.reconciliation_alerts],
                      ].map(([label, value]) => (
                        <View key={`${workspace.chama_id}:${label}`} style={styles.workspacePreviewMetric}>
                          <Text style={styles.workspacePreviewMetricValue}>{value}</Text>
                          <Text style={styles.workspacePreviewMetricLabel}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}

            <View style={styles.financialListSection}>
              <Text style={styles.menuSectionTitle}>By Chama</Text>
              {memberProfile.financial_profile.by_chama.map((entry) => (
                <Card key={entry.chama.id} style={styles.memberChamaCard}>
                  <View style={styles.memberChamaHeader}>
                    <View>
                      <Text style={styles.memberChamaTitle}>{entry.chama.name}</Text>
                      <Text style={styles.memberChamaMeta}>
                        {entry.effective_role.replace(/_/g, ' ')} • Joined {new Date(entry.joined_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Badge
                      label={`${entry.reliability.score}/100`}
                      variant={
                        entry.reliability.risk_level === 'low'
                          ? 'success'
                          : entry.reliability.risk_level === 'medium'
                            ? 'warning'
                            : 'error'
                      }
                      size="sm"
                    />
                  </View>

                  <View style={styles.memberChamaMetricsGrid}>
                    {[
                      ['Contributions', formatCurrency(entry.contributions.total, entry.chama.currency)],
                      ['Next Due', formatCurrency(entry.contributions.next_due_amount, entry.chama.currency)],
                      ['Loan Exposure', formatCurrency(entry.obligations.loan_exposure, entry.chama.currency)],
                      ['Payable Fines', formatCurrency(entry.obligations.payable_fines, entry.chama.currency)],
                      ['Attendance', `${entry.attendance.rate}%`],
                      ['Voting', `${entry.voting.rate}%`],
                    ].map(([label, value]) => (
                      <View key={`${entry.chama.id}:${label}`} style={styles.memberChamaMetric}>
                        <Text style={styles.memberChamaMetricValue}>{value}</Text>
                        <Text style={styles.memberChamaMetricLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  {entry.reliability.flags.length > 0 ? (
                    <View style={styles.memberChamaRisk}>
                      <Text style={styles.memberChamaRiskTitle}>Risk Flags</Text>
                      <Text style={styles.memberChamaRiskText}>{entry.reliability.flags.join(' • ')}</Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          </>
        ) : memberProfile ? null : (
          <EmptyState
            title="Profile summary unavailable"
            description="Your account details are available, but the financial summary could not be loaded yet."
            style={styles.profileSummaryEmpty}
          />
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderMenuItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
          icon={<Icon name="logout" size={20} color={colors.error} />}
        />
      </ScrollView>
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  settingsButton: {
    padding: spacing[2],
  },
  profileCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  profilePhone: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  profileBadges: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  referralContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  referralLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  referralCode: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
    letterSpacing: 2,
  },
  referralCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
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
  profileSummaryEmpty: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
  },
  roleSummaryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  roleSummaryTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  roleSummaryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  roleSummaryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  loadingSummaryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingSummaryText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  portfolioCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  portfolioTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  portfolioSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
    maxWidth: 260,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  portfolioMetric: {
    width: '47%',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  portfolioMetricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  portfolioMetricLabel: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
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
  financialListSection: {
    marginBottom: spacing[4],
  },
  workspacePreviewCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  workspacePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  workspacePreviewCopy: {
    flex: 1,
  },
  workspacePreviewTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  workspacePreviewSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  workspacePreviewSummary: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  workspacePreviewMetricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  workspacePreviewMetric: {
    width: '47%',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  workspacePreviewMetricValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  workspacePreviewMetricLabel: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  memberChamaCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  memberChamaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  memberChamaTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  memberChamaMeta: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  memberChamaMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  memberChamaMetric: {
    width: '47%',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  memberChamaMetricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  memberChamaMetricLabel: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  memberChamaRisk: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FEF3C7',
  },
  memberChamaRiskTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: '#92400E',
    marginBottom: spacing[1],
  },
  memberChamaRiskText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: '#92400E',
    lineHeight: 20,
  },
  menuSection: {
    marginBottom: spacing[4],
  },
  menuSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[500],
    marginLeft: spacing[4],
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    marginHorizontal: spacing[4],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  menuItemSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginLeft: spacing[4] + 40 + spacing[3],
  },
  logoutButton: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.error,
  },
});
