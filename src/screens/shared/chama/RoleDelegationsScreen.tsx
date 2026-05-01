import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { Membership, RoleDelegation } from '@/types';
import { formatDate } from '@/utils/format';
import { ROLE_DESCRIPTIONS, ROLE_DISPLAY_NAMES, Role, parseRole } from '@/auth/roles';

type RoleDelegationsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RoleDelegations'>;
type RoleDelegationsScreenRouteProp = RouteProp<MainStackParamList, 'RoleDelegations'>;

const DELEGABLE_ROLES: Role[] = [Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR];

export const RoleDelegationsScreen: React.FC = () => {
  const navigation = useNavigation<RoleDelegationsScreenNavigationProp>();
  const route = useRoute<RoleDelegationsScreenRouteProp>();
  const { chamaId } = route.params;

  const [delegations, setDelegations] = useState<RoleDelegation[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.TREASURER);
  const [durationDays, setDurationDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadDelegationData = async () => {
    setLoading(true);

    try {
      const [delegationRows, memberRows] = await Promise.all([
        chamaService.getRoleDelegations(chamaId).catch(() => []),
        chamaService.getMembers(chamaId).catch(() => []),
      ]);

      setDelegations(delegationRows);
      const eligibleMembers = memberRows.filter((member) => member.is_active && member.is_approved);
      setMembers(eligibleMembers);

      if (!selectedDelegateId && eligibleMembers.length > 0) {
        setSelectedDelegateId(eligibleMembers[0].user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDelegationData();
  }, [chamaId]);

  const activeDelegations = useMemo(
    () =>
      delegations.filter((delegation) =>
        delegation.status === 'active' || delegation.is_active === true
      ),
    [delegations]
  );

  const inactiveDelegations = useMemo(
    () =>
      delegations.filter(
        (delegation) => !(delegation.status === 'active' || delegation.is_active === true)
      ),
    [delegations]
  );

  const selectedMember = members.find((member) => member.user.id === selectedDelegateId) || null;
  const parsedDurationDays = Number.parseInt(durationDays, 10);
  const canSubmit = Boolean(selectedDelegateId) && Number.isFinite(parsedDurationDays) && parsedDurationDays > 0;

  const handleCreateDelegation = async () => {
    if (!selectedDelegateId) {
      Alert.alert('Delegate required', 'Pick a member to receive temporary powers.');
      return;
    }

    if (!Number.isFinite(parsedDurationDays) || parsedDurationDays <= 0) {
      Alert.alert('Invalid duration', 'Enter a delegation period in whole days.');
      return;
    }

    setSaving(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parsedDurationDays);

      await chamaService.createRoleDelegation(chamaId, {
        delegate_id: selectedDelegateId,
        role: selectedRole,
        expires_at: expiresAt.toISOString(),
        notes: notes.trim() || undefined,
      });

      setNotes('');
      setDurationDays('7');
      Alert.alert('Delegation created', 'The temporary role handover has been recorded.');
      await loadDelegationData();
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Unable to create delegation.')
          : 'Unable to create delegation.';
      Alert.alert('Delegation failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeDelegation = (delegation: RoleDelegation) => {
    const delegateName =
      delegation.delegate?.full_name || delegation.delegate_id || 'this member';

    Alert.alert(
      'Revoke delegation',
      `Revoke ${delegateName}'s temporary ${delegation.role.replace(/_/g, ' ')} powers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(delegation.id);

            try {
              await chamaService.revokeRoleDelegation(chamaId, delegation.id);
              await loadDelegationData();
            } catch (error) {
              const message =
                typeof error === 'object' && error && 'message' in error
                  ? String((error as { message?: string }).message || 'Unable to revoke delegation.')
                  : 'Unable to revoke delegation.';
              Alert.alert('Revoke failed', message);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (roleValue: string) => {
    const parsed = parseRole(roleValue);
    return parsed ? ROLE_DISPLAY_NAMES[parsed] : roleValue.replace(/_/g, ' ');
  };

  const renderDelegationCard = (delegation: RoleDelegation, isActive: boolean) => (
    <Card key={delegation.id} style={styles.delegationCard}>
      <View style={styles.delegationHeader}>
        <View style={styles.delegationIdentity}>
          <Avatar
            name={delegation.delegate?.full_name || delegation.delegate_id || 'Delegate'}
            size="md"
            imageUri={delegation.delegate?.avatar || undefined}
          />
          <View style={styles.delegationMeta}>
            <Text style={styles.delegateName}>
              {delegation.delegate?.full_name || delegation.delegate_id || 'Unknown member'}
            </Text>
            <Text style={styles.delegateRoleLabel}>{getRoleLabel(delegation.role)}</Text>
          </View>
        </View>
        <Badge
          label={delegation.status}
          variant={isActive ? 'success' : 'warning'}
          size="sm"
        />
      </View>

      <View style={styles.delegationInfoRow}>
        <Text style={styles.delegationInfoLabel}>Created</Text>
        <Text style={styles.delegationInfoValue}>{formatDate(delegation.created_at)}</Text>
      </View>
      <View style={styles.delegationInfoRow}>
        <Text style={styles.delegationInfoLabel}>Expires</Text>
        <Text style={styles.delegationInfoValue}>
          {delegation.expires_at ? formatDate(delegation.expires_at) : 'No expiry'}
        </Text>
      </View>
      {delegation.notes ? (
        <Text style={styles.delegationNotes}>{delegation.notes}</Text>
      ) : null}

      {isActive ? (
        <Button
          title="Revoke Delegation"
          onPress={() => handleRevokeDelegation(delegation)}
          variant="outline"
          loading={revokingId === delegation.id}
        />
      ) : null}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading delegations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Role Delegation</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Icon name="shield-account-outline" size={22} color={colors.primary[500]} />
            <Text style={styles.guidanceTitle}>Temporary handover only</Text>
          </View>
          <Text style={styles.guidanceText}>
            Use delegation for short-term coverage like treasurer absence or meeting administration.
            Every delegation should expire automatically and remain auditable.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Delegation</Text>
          <Card style={styles.formCard}>
            <Text style={styles.helperText}>Choose who receives temporary authority.</Text>
            {members.length > 0 ? (
              <View style={styles.memberGrid}>
                {members.map((member) => {
                  const isSelected = member.user.id === selectedDelegateId;

                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.memberOption, isSelected ? styles.memberOptionSelected : null]}
                      onPress={() => setSelectedDelegateId(member.user.id)}
                      activeOpacity={0.85}
                    >
                      <Avatar
                        name={member.user.full_name}
                        size="sm"
                        imageUri={member.user.avatar || undefined}
                      />
                      <View style={styles.memberCopy}>
                        <Text style={[styles.memberName, isSelected ? styles.memberNameSelected : null]}>
                          {member.user.full_name}
                        </Text>
                        <Text style={[styles.memberRole, isSelected ? styles.memberRoleSelected : null]}>
                          {getRoleLabel(member.role)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Card variant="outlined" padding="sm" style={styles.noMembersCard}>
                <Text style={styles.noMembersTitle}>No eligible delegates yet</Text>
                <Text style={styles.noMembersText}>
                  Approve at least one active member before creating a temporary role handover.
                </Text>
              </Card>
            )}

            <Text style={styles.subsectionTitle}>Delegated role</Text>
            <View style={styles.roleGrid}>
              {DELEGABLE_ROLES.map((role) => {
                const isSelected = role === selectedRole;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, isSelected ? styles.roleOptionSelected : null]}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.roleOptionTitle, isSelected ? styles.roleOptionTitleSelected : null]}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </Text>
                    <Text style={[styles.roleOptionText, isSelected ? styles.roleOptionTextSelected : null]}>
                      {ROLE_DESCRIPTIONS[role]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Delegation period in days"
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholder="7"
              leftIcon={<Icon name="calendar-clock-outline" size={18} color={colors.neutral[400]} />}
            />

            <Input
              label="Handover note"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional context for why this delegation exists"
              multiline
              numberOfLines={3}
              leftIcon={<Icon name="text-box-outline" size={18} color={colors.neutral[400]} />}
            />

            <Card variant="outlined" padding="sm" style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewText}>
                {selectedMember
                  ? `${selectedMember.user.full_name} will temporarily act as ${ROLE_DISPLAY_NAMES[selectedRole]} for ${durationDays || '0'} day(s).`
                  : 'Pick a member to preview the delegation.'}
              </Text>
            </Card>

            <Button
              title="Create Delegation"
              onPress={() => void handleCreateDelegation()}
              disabled={!canSubmit}
              loading={saving}
              icon={<Icon name="account-switch-outline" size={18} color="#FFFFFF" />}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Delegations</Text>
            <Badge label={String(activeDelegations.length)} variant="success" size="sm" />
          </View>
          {activeDelegations.length > 0 ? (
            activeDelegations.map((delegation) => renderDelegationCard(delegation, true))
          ) : (
            <EmptyState
              icon={<Icon name="account-clock-outline" size={56} color={colors.neutral[400]} />}
              title="No active delegations"
              description="Temporary handovers will appear here once created."
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delegation History</Text>
            <Badge label={String(inactiveDelegations.length)} variant="warning" size="sm" />
          </View>
          {inactiveDelegations.length > 0 ? (
            inactiveDelegations.map((delegation) => renderDelegationCard(delegation, false))
          ) : (
            <EmptyState
              icon={<Icon name="history" size={56} color={colors.neutral[400]} />}
              title="No delegation history yet"
              description="Revoked or expired delegations will be shown here."
            />
          )}
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
    alignItems: 'center',
    borderBottomColor: colors.neutral[200],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
  },
  guidanceCard: {
    marginBottom: spacing[4],
  },
  guidanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  guidanceTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  guidanceText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
  },
  helperText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
  },
  formCard: {
    gap: spacing[3],
  },
  memberGrid: {
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  noMembersCard: {
    backgroundColor: colors.neutral[50],
    marginBottom: spacing[2],
  },
  noMembersTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  noMembersText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  memberOption: {
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  memberOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  memberCopy: {
    flex: 1,
    marginLeft: spacing[3],
  },
  memberName: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
  },
  memberNameSelected: {
    color: colors.primary[700],
  },
  memberRole: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  memberRoleSelected: {
    color: colors.primary[600],
  },
  subsectionTitle: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  roleGrid: {
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  roleOption: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  roleOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  roleOptionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  roleOptionTitleSelected: {
    color: '#FFFFFF',
  },
  roleOptionText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing[1],
  },
  roleOptionTextSelected: {
    color: colors.primary[50],
  },
  previewCard: {
    backgroundColor: colors.neutral[50],
  },
  previewTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  previewText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  delegationCard: {
    marginBottom: spacing[3],
  },
  delegationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  delegationIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: spacing[3],
  },
  delegationMeta: {
    flex: 1,
    marginLeft: spacing[3],
  },
  delegateName: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  delegateRoleLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  delegationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  delegationInfoLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
  },
  delegationInfoValue: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  delegationNotes: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
});
