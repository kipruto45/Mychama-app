import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StatusBar,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { AuthStackParamList } from '@/navigation/types';
import { useOnboardingStore } from '@/store/onboardingStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { getPendingInviteIntent } from '@/utils/inviteFlow';

type JoinChamaEntryNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'JoinChamaEntry'
>;

const CODE_LENGTH = 8;
const ANIMATION_DURATION = 600;

export const JoinChamaEntryScreen: React.FC = () => {
  const navigation = useNavigation<JoinChamaEntryNavigationProp>();
  const insets = useSafeAreaInsets();
  const { selectPath, setJoinChamaProgress } = useOnboardingStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingInvite, setExistingInvite] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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

    checkExistingInvite();
  }, []);

  const checkExistingInvite = async () => {
    const intent = await getPendingInviteIntent();
    if (intent?.code || intent?.token) {
      setExistingInvite(intent);
    }
  };

  const formatCode = (text: string) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, CODE_LENGTH);
  };

  const handleCodeChange = (text: string) => {
    const formatted = formatCode(text);
    setCode(formatted);
    if (error) setError('');
  };

  const validateCode = () => {
    if (!code.trim()) {
      return 'Please enter your invite code';
    }
    if (code.length < CODE_LENGTH) {
      return 'Enter all 8 characters of your invite code';
    }
    return '';
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = async () => {
    const validationError = validateCode();
    if (validationError) {
      setError(validationError);
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      selectPath('join');
      setJoinChamaProgress({ inviteCode: code.trim() });
      const root = navigation.getParent() || navigation;
      (root as any).navigate('JoinViaCode', { code: code.trim() });
    } catch (err) {
      setError('Unable to continue. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingInvite = async () => {
    const root = navigation.getParent() || navigation;
    selectPath('join');

    if (existingInvite?.token) {
      setJoinChamaProgress({
        inviteToken: existingInvite.token,
        previewChamaName: existingInvite.preview?.chamaName || null,
      });
      (root as any).navigate('InvitePreview', { token: existingInvite.token });
      return;
    }

    if (existingInvite?.code) {
      setJoinChamaProgress({
        inviteCode: existingInvite.code,
        previewChamaName: existingInvite.preview?.chamaName || null,
      });
      (root as any).navigate('JoinViaCode', { code: existingInvite.code });
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If no history, navigate back to ChooseChamaPath
      const root = navigation.getParent() || navigation;
      (root as any).navigate('ChooseChamaPath');
    }
  };

  const isCodeValid = code.length === CODE_LENGTH;
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join with Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: cardFade,
              transform: [
                { translateY: cardSlide },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {existingInvite?.preview?.chamaName ? (
            <View style={styles.existingCard}>
              <View style={styles.existingIconGlow}>
                <View style={styles.existingIcon}>
                  <Icon name="link-variant" size={28} color={colors.primary[500]} />
                </View>
              </View>
              
              <View style={styles.existingContent}>
                <Text style={styles.existingLabel}>You've been invited to</Text>
                <Text style={styles.existingChamaName}>
                  {existingInvite.preview.chamaName}
                </Text>
                <Text style={styles.existingMeta}>
                  Invited by {existingInvite.preview.invitedByName || 'a member'}
                </Text>
              </View>

              <Button
                title="Review Invite"
                onPress={handleUseExistingInvite}
                style={styles.existingButton}
                size="lg"
              />

              <Pressable onPress={() => setExistingInvite(null)} style={styles.dismissLink}>
                <Text style={styles.dismissText}>Use a different code</Text>
              </Pressable>
            </View>
          ) : (
            <>
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
                    <Icon name="shield-check" size={32} color={colors.primary[500]} />
                  </View>
                </View>
                <Text style={styles.heroTitle}>Join an Existing Chama</Text>
                <Text style={styles.heroSubtitle}>
                  Enter the invite code shared with you to preview and join a chama securely.
                </Text>
              </Animated.View>

              {/* Code Input Card */}
              <View style={styles.inputCard}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Your Invite Code</Text>
                  <Text style={styles.inputHint}>8 characters</Text>
                </View>
                
                <Pressable 
                  onPress={() => inputRef.current?.focus()}
                  style={[
                    styles.codeInputContainer,
                    isFocused && styles.codeInputContainerFocused,
                    error && styles.codeInputContainerError,
                    isCodeValid && styles.codeInputContainerValid,
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
                    placeholder="XXXXXXXX"
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

                {/* Progress Dots */}
                <View style={styles.codeProgress}>
                  {[...Array(CODE_LENGTH)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.progressDot,
                        i < code.length && styles.progressDotFilled,
                        i === code.length && isFocused && styles.progressDotActive,
                      ]}
                    />
                  ))}
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={16} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
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
            </>
          )}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBack} style={styles.backLink}>
            <Icon name="arrow-left" size={18} color={colors.primary[600]} />
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
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
  inputHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
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
  codeProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  progressDotFilled: {
    backgroundColor: colors.primary[500],
  },
  progressDotActive: {
    backgroundColor: colors.primary[300],
    borderWidth: 1,
    borderColor: colors.primary[600],
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
  existingCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.md,
  },
  existingIconGlow: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  existingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  existingContent: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  existingLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  existingChamaName: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  existingMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  existingButton: {
    width: '100%',
    marginBottom: spacing[3],
  },
  dismissLink: {
    paddingVertical: spacing[2],
  },
  dismissText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  backLinkText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
});

export default JoinChamaEntryScreen;
