import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui/Button';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { analyticsService } from '@/services/analyticsService';
import { chamaService } from '@/services/chamaService';
import { useOnboardingStore } from '@/store/onboardingStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import {
  completeInviteJoin,
  getInviteStatusCopy,
  savePendingInviteIntent,
  savePendingInvitePreview,
} from '@/utils/inviteFlow';
import { getUserMessage } from '@/utils/userMessages';
import { InvitePreview } from '@/types';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type JoinViaCodeScreenNavigationProp = MainStackParamList extends { JoinViaCode: infer P } 
  ? NativeStackNavigationProp<MainStackParamList, 'JoinViaCode'> 
  : any;
type JoinViaCodeScreenRouteProp = MainStackParamList extends { JoinViaCode: infer P } 
  ? RouteProp<MainStackParamList, 'JoinViaCode'> 
  : any;

const ANIMATION_DURATION = 600;
const CODE_LENGTH = 8;

export const JoinViaCodeScreen: React.FC = () => {
  const navigation = useNavigation<JoinViaCodeScreenNavigationProp>();
  const route = useRoute<JoinViaCodeScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { selectPath, setJoinChamaProgress, markPendingInviteAcceptance } = useOnboardingStore();
  
  const [code, setCode] = useState(route.params?.code || '');
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [errorCopy, setErrorCopy] = useState<{ title: string; message: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const inviteStatusCopy = useMemo(() => getInviteStatusCopy(preview?.status), [preview?.status]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(heroSlide, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (route.params?.code) {
      void validateCode(route.params.code);
    }
  }, [route.params?.code]);

  const openAuthGate = async (target: 'Register' | 'Login', inviteCode: string) => {
    selectPath('join');
    setJoinChamaProgress({ inviteCode: inviteCode.trim().toUpperCase() });
    await savePendingInviteIntent({ type: 'code', code: inviteCode, createdAt: new Date().toISOString() });
    const rootNavigation = navigation.getParent() || navigation;
    (rootNavigation as any).navigate('Auth', { screen: target });
  };

  const validateCode = async (inviteCode: string) => {
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }

    setLoading(true);
    try {
      selectPath('join');
      setJoinChamaProgress({ inviteCode: normalizedCode });
      await savePendingInviteIntent({ type: 'code', code: normalizedCode, createdAt: new Date().toISOString() });
      const invite = await chamaService.validateInviteCode(normalizedCode);
      markPendingInviteAcceptance({
        inviteCode: normalizedCode,
        previewChamaName: invite.chama_name || null,
      });
      setPreview(invite);
      setCode(normalizedCode);
      setErrorCopy(null);
      await savePendingInvitePreview(invite);
      await analyticsService.track('join_code_used', {
        invite_status: invite.status,
        invite_valid: invite.is_valid ?? true,
        chama_name: invite.chama_name,
      });
    } catch (error) {
      setPreview(null);
      setErrorCopy(getUserMessage(error, 'invite.validate'));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    // Use the stored code instead of preview.code to avoid issues with field overwrites
    if (!code || code.length < 4) {
      setErrorCopy({
        title: 'Invalid Code',
        message: 'Please enter a valid invite code.',
      });
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (!preview) {
      setErrorCopy({
        title: 'Preview Not Available',
        message: 'Please validate the code first by tapping Continue.',
      });
      return;
    }

    setAccepting(true);
    try {
      // Send the normalized code that was used for validation
      const result = await chamaService.acceptInviteCode(code);
      await analyticsService.track('invite_accepted', {
        source: 'invite_code',
        chama_name: result.invite?.chama_name,
      });
      await completeInviteJoin(navigation as any, result.membership, result.invite);
    } catch (error) {
      const userMessage = getUserMessage(error, 'invite.accept');
      setErrorCopy(userMessage);
    } finally {
      setAccepting(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setCode(cleaned);
    if (errorCopy) setErrorCopy(null);
  };

  const handleContinue = () => {
    if (code.length > 0) {
      void validateCode(code);
    }
  };

  const isCodeValid = code.length >= 4;
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.light.background} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background Ambient Glow */}
        <View style={styles.backgroundGlow} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home' as never);
              }
            }} 
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join with Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!preview ? (
            <Animated.View
              style={[
                styles.inputSection,
                {
                  opacity: cardFade,
                  transform: [
                    { translateY: cardSlide },
                  ],
                },
              ]}
            >
              {/* Hero Section */}
              <Animated.View
                style={[
                  styles.heroSection,
                  {
                    opacity: heroFade,
                    transform: [{ translateY: heroSlide }],
                  },
                ]}
              >
                <View style={styles.heroIconWrapper}>
                  <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />
                  <View style={styles.heroIcon}>
                    <Icon name="shield-key-outline" size={32} color={colors.primary[500]} />
                  </View>
                </View>
                <Text style={styles.heroTitle}>Enter Invite Code</Text>
                <Text style={styles.heroSubtitle}>
                  Enter the code you received to preview the chama and continue securely.
                </Text>
              </Animated.View>

              {/* Code Input Card */}
              <View style={styles.inputCard}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Your Invite Code</Text>
                </View>
                
                <Pressable 
                  onPress={() => inputRef.current?.focus()}
                  style={[
                    styles.codeInputContainer,
                    isFocused && styles.codeInputContainerFocused,
                    errorCopy && styles.codeInputContainerError,
                    code.length >= 4 && styles.codeInputContainerValid,
                  ]}
                >
                  <View style={styles.inputLeftIcon}>
                    <Icon name="pound" size={20} color={colors.neutral[400]} />
                  </View>
                  <TextInput
                    ref={inputRef}
                    style={styles.codeInput}
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder="ABCD1234"
                    placeholderTextColor={colors.neutral[300]}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={CODE_LENGTH}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                  
                  {code.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setCode('')} 
                      style={styles.clearButton}
                    >
                      <Icon name="close-circle" size={20} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </Pressable>

                {errorCopy ? (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={16} color={colors.error} />
                    <Text style={styles.errorText}>{errorCopy.message}</Text>
                  </View>
                ) : null}
              </View>

              {/* Continue Button */}
              <Button
                title="Continue"
                onPress={handleContinue}
                loading={loading}
                disabled={!isCodeValid || loading}
                style={styles.continueButton}
                size="lg"
                icon={<Icon name="check-decagram-outline" size={18} color="#FFFFFF" />}
              />

              {/* Help Section */}
              <View style={styles.helpSection}>
                <View style={styles.helpIcon}>
                  <Icon name="information-slab-circle" size={16} color={colors.neutral[500]} />
                </View>
                <Text style={styles.helpText}>
                  Ask your chama admin or treasurer for a valid invite code
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.previewSection,
                {
                  opacity: cardFade,
                  transform: [{ translateY: cardSlide }],
                },
              ]}
            >
              {/* Success Header */}
              <View style={styles.successHeader}>
                <View style={styles.successIconWrapper}>
                  <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />
                  <View style={styles.successIcon}>
                    <Icon name="check-circle" size={32} color={colors.success} />
                  </View>
                </View>
                <Text style={styles.successTitle}>Invite Found!</Text>
                <Text style={styles.successSubtitle}>
                  You've been invited to join this chama
                </Text>
              </View>

              {/* Preview Card */}
              <View style={styles.previewCard}>
                {inviteStatusCopy ? (
                  <View style={styles.statusBanner}>
                    <Icon name="information-outline" size={18} color={colors.accent[700]} />
                    <View style={styles.statusCopy}>
                      <Text style={styles.statusTitle}>{inviteStatusCopy.title}</Text>
                      <Text style={styles.statusText}>{inviteStatusCopy.message}</Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Chama</Text>
                  <Text style={styles.previewValue}>{preview.chama_name || preview.chama}</Text>
                </View>
                
                {preview.chama_description ? (
                  <View style={styles.previewRowStacked}>
                    <Text style={styles.previewLabel}>Description</Text>
                    <Text style={styles.previewValueBlock}>{preview.chama_description}</Text>
                  </View>
                ) : null}
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Assigned role</Text>
                  <Text style={styles.previewValue}>
                    {preview.assigned_role_display || preview.role_display || preview.role || 'Member'}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Status</Text>
                  <Text style={[styles.previewValue, { color: colors.success }]}>{preview.status}</Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Invited by</Text>
                  <Text style={styles.previewValue}>
                    {preview.invited_by_name || preview.invited_by?.full_name || 'MyChama admin'}
                  </Text>
                </View>
                
                <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.previewLabel}>Expires</Text>
                  <Text style={styles.previewValue}>{new Date(preview.expires_at).toLocaleDateString()}</Text>
                </View>
              </View>

              {!isAuthenticated ? (
                <>
                  <View style={styles.authNotice}>
                    <Icon name="account-lock-outline" size={18} color={colors.primary[700]} />
                    <Text style={styles.authNoticeText}>
                      Sign in or create an account first. We'll bring you back to this code automatically.
                    </Text>
                  </View>
                  
                  <View style={styles.authButtons}>
                    <Button
                      title="Create account"
                      onPress={() => void openAuthGate('Register', preview.code || code)}
                      style={styles.halfButton}
                      icon={<Icon name="account-plus-outline" size={16} color="#FFFFFF" />}
                    />
                    <Button
                      title="Sign in"
                      variant="outline"
                      onPress={() => void openAuthGate('Login', preview.code || code)}
                      style={styles.halfButton}
                      icon={<Icon name="login" size={16} color={colors.primary[500]} />}
                    />
                  </View>
                </>
              ) : null}

              <Button
                title="Join chama"
                onPress={handleAccept}
                loading={accepting}
                disabled={preview.is_valid === false}
                style={styles.joinButton}
                size="lg"
                icon={<Icon name="account-check-outline" size={18} color="#FFFFFF" />}
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary[400],
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutral[50],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[5],
    paddingBottom: spacing[6],
  },
  inputSection: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  heroIconWrapper: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  heroGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[400],
    top: -10,
    left: -10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  inputCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.md,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
    height: 56,
  },
  codeInputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.light.card,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  codeInputContainerError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  codeInputContainerValid: {
    borderColor: colors.success,
    backgroundColor: colors.success + '08',
  },
  inputLeftIcon: {
    marginRight: spacing[2],
  },
  codeInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 3,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  clearButton: {
    padding: spacing[1],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.error + '12',
    borderRadius: borderRadius.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    flex: 1,
  },
  continueButton: {
    marginBottom: spacing[4],
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
  },
  helpIcon: {
    marginTop: 2,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  previewSection: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  successIconWrapper: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.success + '30',
  },
  successTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  successSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.lg,
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
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  previewRowStacked: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  previewValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing[3],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  previewValueBlock: {
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
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  authNoticeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[700],
    lineHeight: 20,
  },
  authButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  halfButton: {
    flex: 1,
  },
  joinButton: {
    marginTop: spacing[2],
  },
});

export default JoinViaCodeScreen;