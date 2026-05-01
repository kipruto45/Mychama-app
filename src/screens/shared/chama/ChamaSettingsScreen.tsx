import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';

type ChamaSettingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChamaSettings'>;
type ChamaSettingsScreenRouteProp = RouteProp<MainStackParamList, 'ChamaSettings'>;

export const ChamaSettingsScreen: React.FC = () => {
  const navigation = useNavigation<ChamaSettingsScreenNavigationProp>();
  const route = useRoute<ChamaSettingsScreenRouteProp>();
  const { chamaId } = route.params;

  // Permission checks
  const canManageSettings = useCanPerformAction(Permission.CAN_MANAGE_CHAMA_SETTINGS, chamaId);
  const canDeleteChama = useCanPerformAction(Permission.CAN_DELETE_CHAMA, chamaId);
  const canManageCommunications = useCanPerformAction(Permission.CAN_MANAGE_NOTIFICATIONS, chamaId);

  const [chamaName, setChamaName] = useState('');
  const [description, setDescription] = useState('');
  const [allowPublicJoin, setAllowPublicJoin] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [autoReminders, setAutoReminders] = useState(true);
  const [joinEnabled, setJoinEnabled] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeExpiresAt, setJoinCodeExpiresAt] = useState<string | null>(null);
  const [memberCapacityLabel, setMemberCapacityLabel] = useState<string | null>(null);
  const [contributionPolicyLabel, setContributionPolicyLabel] = useState<string | null>(null);
  const [gracePolicyLabel, setGracePolicyLabel] = useState<string | null>(null);
  const [lateFineLabel, setLateFineLabel] = useState<string | null>(null);
  const [joinSettingsAvailable, setJoinSettingsAvailable] = useState(false);
  const [joinSettingsMessage, setJoinSettingsMessage] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [joinActionLoading, setJoinActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadChama = async () => {
    setInitialLoading(true);
    setLoadError(null);

    try {
      const chama = await chamaService.getChama(chamaId);
      setChamaName(chama.name || '');
      setDescription(chama.description || '');
      setStatus(chama.status || null);
      setContributionPolicyLabel(
        chama.contribution_setup
          ? `${chama.contribution_setup.amount} every ${chama.contribution_setup.frequency}, due day ${chama.contribution_setup.due_day}`
          : null
      );
      setGracePolicyLabel(
        chama.contribution_setup
          ? `${chama.contribution_setup.grace_period_days} grace days`
          : null
      );
      setLateFineLabel(
        chama.contribution_setup
          ? `${chama.currency || 'KES'} ${chama.contribution_setup.late_fine_amount} late fine`
          : null
      );

      try {
        const joinSettings = await chamaService.getJoinSettings(chamaId);
        setAllowPublicJoin(Boolean(joinSettings.allow_public_join));
        setRequireApproval(Boolean(joinSettings.require_approval));
        setJoinEnabled(Boolean(joinSettings.join_enabled));
        setJoinCode(joinSettings.join_code || '');
        setJoinCodeExpiresAt(joinSettings.join_code_expires_at || null);
        setJoinSettingsAvailable(true);
        setJoinSettingsMessage(null);

        const hasCurrentMembers = typeof joinSettings.current_member_count === 'number';
        const hasMembersRemaining = typeof joinSettings.members_remaining === 'number';
        if (hasCurrentMembers || hasMembersRemaining) {
          const current = joinSettings.current_member_count ?? 0;
          const remaining =
            typeof joinSettings.members_remaining === 'number'
              ? joinSettings.members_remaining
              : null;
          setMemberCapacityLabel(
            remaining === null ? `${current} members active` : `${current} active, ${remaining} slots left`
          );
        } else {
          setMemberCapacityLabel(null);
        }
      } catch {
        setJoinSettingsAvailable(false);
        setJoinSettingsMessage('Membership settings are not available for this chama yet.');
        setJoinEnabled(false);
        setJoinCode('');
        setJoinCodeExpiresAt(null);
        setMemberCapacityLabel(null);
      }
    } catch {
      setLoadError('We could not load this chama right now.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadChama();
  }, [chamaId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        chamaService.updateChama(chamaId, {
          name: chamaName.trim(),
          description: description.trim(),
        }),
        joinSettingsAvailable
          ? chamaService.updateJoinSettings(chamaId, {
              allow_public_join: allowPublicJoin,
              require_approval: requireApproval,
              join_mode: allowPublicJoin && !requireApproval ? 'auto_join' : 'approval_required',
            })
          : Promise.resolve(null),
      ]);
      Alert.alert('Success', 'Chama settings saved successfully.');
      await loadChama();
    } catch {
      Alert.alert('Error', 'Failed to save chama settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateJoinCode = async () => {
    setJoinActionLoading(true);
    try {
      const response = await chamaService.rotateJoinCode(chamaId);
      setJoinEnabled(true);
      setJoinCode(response.join_code || '');
      setJoinCodeExpiresAt(response.expires_at || null);
      Alert.alert('Join Code Updated', 'A new join code has been generated for this chama.');
    } catch {
      Alert.alert('Unavailable', 'We could not update the join code right now.');
    } finally {
      setJoinActionLoading(false);
    }
  };

  const handleToggleJoinCode = async () => {
    setJoinActionLoading(true);
    try {
      if (joinEnabled) {
        await chamaService.disableJoinCode(chamaId);
        setJoinEnabled(false);
        setJoinCode('');
        setJoinCodeExpiresAt(null);
        Alert.alert('Join Code Disabled', 'Public join via code has been turned off.');
      } else {
        const response = await chamaService.enableJoinCode(chamaId);
        setJoinEnabled(Boolean(response.join_enabled));
        setJoinCode(response.join_code || '');
        setJoinCodeExpiresAt(response.join_code_expires_at || null);
        Alert.alert('Join Code Enabled', 'Members can now join with the active join code.');
      }
    } catch {
      Alert.alert('Unavailable', 'We could not apply this join code change right now.');
    } finally {
      setJoinActionLoading(false);
    }
  };

  const handleDeleteChama = () => {
    Alert.alert(
      'Delete Chama',
      'Delete is only available for chamas that allow this action. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await chamaService.deleteChama(chamaId);
              Alert.alert('Deleted', 'The chama has been deleted.');
              navigation.goBack();
            } catch {
              Alert.alert('Unavailable', 'This chama cannot be deleted right now.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveChama = () => {
    Alert.alert(
      'Leave Chama',
      'Leaving a chama depends on your current permissions. Use another approved management flow if this option is not available yet.'
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading chama settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.title}>Chama Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <EmptyState
          icon={<Icon name="account-group-outline" size={64} color={colors.neutral[400]} />}
          title="Could not load settings"
          description={loadError}
          action={<Button title="Retry" onPress={() => void loadChama()} />}
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Chama Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Settings</Text>
          <Card style={styles.settingsCard}>
            {status ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current status</Text>
                <Badge label={status} variant="info" size="sm" />
              </View>
            ) : null}
            <Input
              label="Chama Name"
              placeholder="Enter chama name"
              value={chamaName}
              onChangeText={setChamaName}
              leftIcon={
                <Icon name="account-group" size={20} color={colors.neutral[400]} />
              }
            />
            <Input
              label="Description"
              placeholder="Describe your chama"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              leftIcon={
                <Icon name="text" size={20} color={colors.neutral[400]} />
              }
            />
            {contributionPolicyLabel ? (
              <>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Contribution rule</Text>
                  <Text style={styles.infoValue}>{contributionPolicyLabel}</Text>
                </View>
                {gracePolicyLabel ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Grace period</Text>
                    <Text style={styles.infoValue}>{gracePolicyLabel}</Text>
                  </View>
                ) : null}
                {lateFineLabel ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Late fine</Text>
                    <Text style={styles.infoValue}>{lateFineLabel}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </Card>
        </View>

        {canManageCommunications ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communications</Text>
            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.navRow}
                onPress={() => navigation.navigate('CommunicationCenter', { chamaId })}
              >
                <View style={styles.navCopy}>
                  <Text style={styles.navTitle}>Communication Center</Text>
                  <Text style={styles.navDescription}>
                    Manage broadcasts, delivery logs, retries, and campaign analytics.
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color={colors.neutral[400]} />
              </TouchableOpacity>
            </Card>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delegation and Handover</Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigation.navigate('RoleDelegations', { chamaId })}
            >
              <View style={styles.navCopy}>
                <Text style={styles.navTitle}>Role Delegations</Text>
                <Text style={styles.navDescription}>
                  Grant and revoke temporary treasurer, secretary, auditor, or admin powers with expiry dates.
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={colors.neutral[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          <Card style={styles.settingsCard}>
            {joinSettingsAvailable ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Join code status</Text>
                  <Badge label={joinEnabled ? 'active' : 'disabled'} variant={joinEnabled ? 'success' : 'warning'} size="sm" />
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Join code</Text>
                  <Text style={styles.infoValue}>{joinCode || 'Disabled'}</Text>
                </View>
                {joinCodeExpiresAt ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Code expiry</Text>
                    <Text style={styles.infoValue}>{new Date(joinCodeExpiresAt).toLocaleString()}</Text>
                  </View>
                ) : null}
                {memberCapacityLabel ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Member capacity</Text>
                    <Text style={styles.infoValue}>{memberCapacityLabel}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Membership settings unavailable"
                description={joinSettingsMessage || 'This chama does not expose membership settings yet.'}
              />
            )}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="earth" size={20} color={colors.primary[500]} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Allow Public Join</Text>
                  <Text style={styles.settingDescription}>
                    Let eligible members discover and join this chama using the live join code settings.
                  </Text>
                </View>
              </View>
              <Switch
                value={allowPublicJoin}
                onValueChange={setAllowPublicJoin}
                disabled={!joinSettingsAvailable || loading || joinActionLoading}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="shield-check" size={20} color={colors.primary[500]} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Require Approval</Text>
                  <Text style={styles.settingDescription}>
                    Keep approvals on when you want join requests reviewed by chama admins.
                  </Text>
                </View>
              </View>
              <Switch
                value={requireApproval}
                onValueChange={setRequireApproval}
                disabled={!joinSettingsAvailable || loading || joinActionLoading}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#FFFFFF"
              />
            </View>
            {joinSettingsAvailable ? (
              <>
                <View style={styles.settingDivider} />
                <Button
                  title={joinEnabled ? 'Disable Join Code' : 'Enable Join Code'}
                  onPress={handleToggleJoinCode}
                  loading={joinActionLoading}
                  variant={joinEnabled ? 'outline' : 'primary'}
                />
                {joinEnabled ? (
                  <Button
                    title="Rotate Join Code"
                    onPress={handleRotateJoinCode}
                    loading={joinActionLoading}
                    variant="ghost"
                  />
                ) : null}
              </>
            ) : null}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="bell-ring" size={20} color={colors.primary[500]} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto Reminders</Text>
                  <Text style={styles.settingDescription}>
                    This control is currently read-only.
                  </Text>
                </View>
              </View>
              <Switch
                value={autoReminders}
                onValueChange={setAutoReminders}
                disabled
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Card style={styles.settingsCard}>
            {canManageSettings && (
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={loading}
              />
            )}
            <Button
              title="Leave Chama"
              onPress={handleLeaveChama}
              variant="outline"
              style={styles.secondaryButton}
            />
            {canDeleteChama && (
              <Button
                title="Delete Chama"
                onPress={handleDeleteChama}
                variant="ghost"
                style={styles.dangerButton}
                textStyle={styles.dangerButtonText}
              />
            )}
          </Card>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  emptyState: {
    flex: 1,
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
  settingsCard: {
    gap: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  infoBlock: {
    gap: spacing[1],
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing[4],
  },
  settingText: {
    flex: 1,
    marginLeft: spacing[3],
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navCopy: {
    flex: 1,
    marginRight: spacing[3],
  },
  navTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  navDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: spacing[2],
  },
  dangerButton: {
    marginTop: spacing[2],
  },
  dangerButtonText: {
    color: colors.error,
  },
});
