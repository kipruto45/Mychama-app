import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { Invite } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type InviteMemberScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'InviteMember'>;
type InviteMemberScreenRouteProp = RouteProp<MainStackParamList, 'InviteMember'>;

const ROLE_OPTIONS = ['MEMBER', 'TREASURER', 'SECRETARY', 'AUDITOR'] as const;

export const InviteMemberScreen: React.FC = () => {
  const navigation = useNavigation<InviteMemberScreenNavigationProp>();
  const route = useRoute<InviteMemberScreenRouteProp>();
  const { chamaId } = route.params;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>('MEMBER');

  const chamaInvites = useMemo(
    () => invites.filter((invite) => invite.chama === chamaId).slice(0, 8),
    [invites, chamaId]
  );

  const loadInvites = async () => {
    setFetching(true);
    try {
      const rows = await chamaService.getInvites();
      setInvites(rows);
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Unable to load invites.')
          : 'Unable to load invites.';
      Alert.alert('Invite error', message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void loadInvites();
  }, [chamaId]);

  const handleCreateInvite = async () => {
    if (!phone.trim() && !email.trim()) {
      Alert.alert('Recipient needed', 'Enter a phone number, an email address, or both.');
      return;
    }

    setLoading(true);
    try {
      const invite = await chamaService.createInvite(chamaId, {
        invitee_phone: phone.trim() || undefined,
        invitee_email: email.trim() || undefined,
        role_to_assign: role,
        expires_in_days: 7,
        max_uses: 1,
      });
      setInvites((prev) => [invite, ...prev]);
      setPhone('');
      setEmail('');

      await Share.share({
        message: `You have been invited to join MyChama.\nLink: ${chamaService.buildInviteLink(invite.token)}\nCode: ${invite.code}`,
      });
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Failed to create invite.')
          : 'Failed to create invite.';
      Alert.alert('Invite failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvite = async (invite: Invite) => {
    await Share.share({
      message: `Join MyChama using this secure invite.\nLink: ${chamaService.buildInviteLink(invite.token)}\nCode: ${invite.code}`,
    });
  };

  const handleSendSms = async (invite: Invite) => {
    const targetPhone = invite.invitee_phone || phone.trim();
    if (!targetPhone) {
      Alert.alert('Phone required', 'This invite does not have a destination phone number.');
      return;
    }
    const smsUrl = `sms:${targetPhone}?body=${encodeURIComponent(
      `Join our chama on MyChama using ${chamaService.buildInviteLink(invite.token)} or code ${invite.code}`
    )}`;
    await Linking.openURL(smsUrl);
  };

  const handleRevoke = async (invite: Invite) => {
    try {
      const revoked = await chamaService.revokeSecureInvite(invite.id, 'Revoked from mobile app.');
      setInvites((prev) => prev.map((row) => (row.id === invite.id ? revoked : row)));
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Failed to revoke invite.')
          : 'Failed to revoke invite.';
      Alert.alert('Revoke failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Members</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Create secure invite</Text>
          <Text style={styles.sectionDescription}>Each invite is one-time, expires in 7 days, and can carry a pre-assigned role.</Text>
          <Input
            label="Phone number"
            placeholder="0712345678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Icon name="cellphone" size={20} color={colors.neutral[400]} />}
          />
          <Input
            label="Email address"
            placeholder="member@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Icon name="email-outline" size={20} color={colors.neutral[400]} />}
          />
          <Text style={styles.fieldLabel}>Role to assign</Text>
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((option) => {
              const active = option === role;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.rolePill, active && styles.rolePillActive]}
                  onPress={() => setRole(option)}
                >
                  <Text style={[styles.roleText, active && styles.roleTextActive]}>{option.toLowerCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button
            title="Create invite"
            onPress={handleCreateInvite}
            loading={loading}
            style={styles.primaryButton}
            icon={<Icon name="account-plus" size={18} color="#FFFFFF" />}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>Recent invites</Text>
            <TouchableOpacity onPress={() => void loadInvites()}>
              <Text style={styles.linkText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>Share the secure link or the short code. Revoked and accepted invites stay visible for audit context.</Text>
          {fetching ? <Text style={styles.helperText}>Loading invites...</Text> : null}
          {!fetching && chamaInvites.length === 0 ? (
            <Text style={styles.helperText}>No invites created for this chama yet.</Text>
          ) : null}
          {chamaInvites.map((invite) => (
            <View key={invite.id} style={styles.inviteCard}>
              <View style={styles.inviteHeader}>
                <View style={styles.inviteMeta}>
                  <Text style={styles.inviteTitle}>{invite.invitee_phone || invite.invitee_email || 'Targeted invite'}</Text>
                  <Text style={styles.inviteSubtitle}>{invite.role_to_assign} • code {invite.code}</Text>
                </View>
                <Badge
                  label={invite.status}
                  variant={
                    invite.status === 'accepted'
                      ? 'success'
                      : invite.status === 'pending'
                      ? 'warning'
                      : 'error'
                  }
                  size="sm"
                />
              </View>
              <View style={styles.tokenBlock}>
                <Text style={styles.tokenLabel}>Deep link</Text>
                <Text style={styles.tokenValue}>{chamaService.buildInviteLink(invite.token)}</Text>
              </View>
              <View style={styles.actionRow}>
                <Button
                  title="Share"
                  variant="outline"
                  onPress={() => void handleShareInvite(invite)}
                  style={styles.actionButton}
                  icon={<Icon name="share-variant" size={16} color={colors.primary[500]} />}
                />
                <Button
                  title="SMS"
                  variant="outline"
                  onPress={() => void handleSendSms(invite)}
                  style={styles.actionButton}
                  icon={<Icon name="message-text-outline" size={16} color={colors.primary[500]} />}
                />
                <Button
                  title="Revoke"
                  variant="ghost"
                  onPress={() => void handleRevoke(invite)}
                  style={styles.actionButton}
                  disabled={invite.status !== 'pending'}
                  icon={<Icon name="cancel" size={16} color={colors.primary[500]} />}
                />
              </View>
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  card: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  rolePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
  },
  rolePillActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    textTransform: 'capitalize',
  },
  roleTextActive: {
    color: colors.primary[700],
  },
  primaryButton: {
    width: '100%',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[500],
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  inviteCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: spacing[3],
    marginTop: spacing[3],
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  inviteMeta: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  inviteSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  tokenBlock: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginTop: spacing[3],
  },
  tokenLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  tokenValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[800],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
});
