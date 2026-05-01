import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { analyticsService } from '@/services/analyticsService';
import { chamaService } from '@/services/chamaService';
import { useOnboardingStore } from '@/store/onboardingStore';
import {
  completeInviteJoin,
  getInviteStatusCopy,
  savePendingInviteIntent,
  savePendingInvitePreview,
} from '@/utils/inviteFlow';
import { getUserMessage } from '@/utils/userMessages';
import { colors, spacing, typography } from '@/theme';
import { InvitePreview } from '@/types';

type InvitePreviewScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'InvitePreview'>;
type InvitePreviewScreenRouteProp = RouteProp<MainStackParamList, 'InvitePreview'>;

export const InvitePreviewScreen: React.FC = () => {
  const navigation = useNavigation<InvitePreviewScreenNavigationProp>();
  const route = useRoute<InvitePreviewScreenRouteProp>();
  const { token } = route.params;
  const { isAuthenticated } = useAuth();
  const { selectPath, markPendingInviteAcceptance } = useOnboardingStore();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [errorCopy, setErrorCopy] = useState<{ title: string; message: string } | null>(null);
  const inviteStatusCopy = useMemo(() => getInviteStatusCopy(invite?.status), [invite?.status]);

  useEffect(() => {
    const loadInvite = async () => {
      setLoading(true);
      try {
        selectPath('join');
        markPendingInviteAcceptance({ inviteToken: token });
        await savePendingInviteIntent({ type: 'token', token, createdAt: new Date().toISOString() });
        const payload = await chamaService.lookupSecureInvite(token);
        setInvite(payload);
        setErrorCopy(null);
        markPendingInviteAcceptance({
          inviteToken: token,
          previewChamaName: payload.chama_name || null,
        });
        await savePendingInvitePreview(payload);
        await analyticsService.track('invite_preview_viewed', {
          source: 'invite_link',
          invite_status: payload.status,
          invite_valid: payload.is_valid ?? true,
          chama_name: payload.chama_name,
        });
      } catch (error) {
        setInvite(null);
        setErrorCopy(getUserMessage(error, 'invite.preview'));
      } finally {
        setLoading(false);
      }
    };

    void loadInvite();
  }, [token]);

  const openAuthGate = async (target: 'Register' | 'Login') => {
    selectPath('join');
    markPendingInviteAcceptance({
      inviteToken: token,
      previewChamaName: invite?.chama_name || null,
    });
    await savePendingInviteIntent({ type: 'token', token, createdAt: new Date().toISOString() });
    const rootNavigation = navigation.getParent() || navigation;
    (rootNavigation as any).navigate('Auth', { screen: target });
  };

  const promptForAuthentication = async () => {
    await savePendingInviteIntent({ type: 'token', token, createdAt: new Date().toISOString() });
    const rootNavigation = navigation.getParent() || navigation;

    Alert.alert(
      'Sign in to join this chama',
      "You've been invited to join this chama. Sign in or create an account to continue.",
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Create account',
          onPress: () => (rootNavigation as any).navigate('Auth', { screen: 'Register' }),
        },
        {
          text: 'Sign in',
          onPress: () => (rootNavigation as any).navigate('Auth', { screen: 'Login' }),
        },
      ]
    );
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      await promptForAuthentication();
      return;
    }

    setAccepting(true);
    try {
      const result = await chamaService.acceptSecureInvite(token);
      await analyticsService.track('invite_accepted', {
        source: 'invite_link',
        chama_name: result.invite?.chama_name,
      });
      await completeInviteJoin(navigation as any, result.membership, result.invite);
    } catch (error) {
      const userMessage = getUserMessage(error, 'invite.accept');
      Alert.alert(userMessage.title, userMessage.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!isAuthenticated) {
      await promptForAuthentication();
      return;
    }

    try {
      await chamaService.declineSecureInvite(token, 'Declined from invite preview.');
      await analyticsService.track('invite_declined', {
        source: 'invite_link',
        invite_token: token,
      });
      Alert.alert('Invite declined', 'You can ask for a new invite whenever you are ready to join.');
      navigation.goBack();
    } catch (error) {
      const userMessage = getUserMessage(error, 'invite.accept');
      Alert.alert(userMessage.title, userMessage.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Preview</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>You&apos;ve been invited to join a chama</Text>
          <Text style={styles.sectionDescription}>
            Review the chama details below, then continue when you&apos;re ready.
          </Text>

          {loading ? <Text style={styles.helperText}>Loading invite...</Text> : null}

          {!loading && errorCopy && !invite ? (
            <View style={styles.errorState}>
              <Icon name="alert-circle-outline" size={20} color={colors.error} />
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>{errorCopy.title}</Text>
                <Text style={styles.errorMessage}>{errorCopy.message}</Text>
              </View>
            </View>
          ) : null}

          {!loading && invite ? (
            <>
              {inviteStatusCopy ? (
                <View style={styles.statusBanner}>
                  <Icon name="information-outline" size={18} color={colors.accent[700]} />
                  <View style={styles.statusCopy}>
                    <Text style={styles.statusTitle}>{inviteStatusCopy.title}</Text>
                    <Text style={styles.statusText}>{inviteStatusCopy.message}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Chama</Text>
                <Text style={styles.infoValue}>{invite.chama_name || invite.chama}</Text>
              </View>

              {invite.chama_description ? (
                <View style={styles.infoRowStacked}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValueBlock}>{invite.chama_description}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned role</Text>
                <Text style={styles.infoValue}>
                  {invite.assigned_role_display || invite.role_display || invite.role || 'Member'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invited by</Text>
                <Text style={styles.infoValue}>
                  {invite.invited_by_name || invite.invited_by?.full_name || 'MyChama admin'}
                </Text>
              </View>

              {invite.recipient_hint ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Invite target</Text>
                  <Text style={styles.infoValue}>{invite.recipient_hint}</Text>
                </View>
              ) : null}

              {invite.code ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Invite code</Text>
                  <Text style={styles.infoValue}>{invite.code}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{invite.status}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires</Text>
                <Text style={styles.infoValue}>{new Date(invite.expires_at).toLocaleString()}</Text>
              </View>

              {!isAuthenticated ? (
                <>
                  <View style={styles.authNotice}>
                    <Icon name="account-lock-outline" size={18} color={colors.primary[600]} />
                    <Text style={styles.authNoticeText}>
                      Sign in or create an account to continue. We&apos;ll keep this invite ready for you.
                    </Text>
                  </View>

                  <View style={styles.authButtons}>
                    <Button
                      title="Create account"
                      onPress={() => void openAuthGate('Register')}
                      style={styles.halfButton}
                      icon={<Icon name="account-plus-outline" size={16} color="#FFFFFF" />}
                    />
                    <Button
                      title="Sign in"
                      variant="outline"
                      onPress={() => void openAuthGate('Login')}
                      style={styles.halfButton}
                      icon={<Icon name="login" size={16} color={colors.primary[500]} />}
                    />
                  </View>
                </>
              ) : null}

              <View style={styles.buttonRow}>
                {isAuthenticated ? (
                  <Button
                    title="Decline"
                    variant="outline"
                    onPress={() => void handleDecline()}
                    style={styles.halfButton}
                    icon={<Icon name="close" size={16} color={colors.primary[500]} />}
                  />
                ) : (
                  <View style={styles.halfButtonPlaceholder} />
                )}
                <Button
                  title={isAuthenticated ? 'Join chama' : 'Continue'}
                  onPress={() => void handleAccept()}
                  loading={accepting}
                  disabled={invite.is_valid === false}
                  style={styles.halfButton}
                  icon={<Icon name="check" size={16} color="#FFFFFF" />}
                />
              </View>
            </>
          ) : null}
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
  iconButton: {
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
  helperText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: spacing[3],
    gap: spacing[2],
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: '#B91C1C',
    marginBottom: spacing[1],
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: '#B91C1C',
    lineHeight: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent[50],
    borderRadius: 16,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.accent[800],
    marginBottom: spacing[1],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.accent[800],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  infoRowStacked: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing[3],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  infoValueBlock: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
    lineHeight: 20,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: spacing[3],
    marginTop: spacing[4],
    gap: spacing[2],
  },
  authNoticeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[700],
  },
  authButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  halfButton: {
    flex: 1,
  },
  halfButtonPlaceholder: {
    flex: 1,
  },
});
