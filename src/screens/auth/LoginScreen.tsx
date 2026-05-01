import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { AuthStackParamList } from '@/navigation/types';
import { resumePendingInviteIntent } from '@/utils/inviteFlow';
import { getUserMessage } from '@/utils/userMessages';
import { LoginFormData, loginSchema } from '@/utils/validation';
import { normalizeKenyanPhone, validateKenyanPhone } from '@/utils/phoneUtils';
import { parseApiFormError } from '@/utils/apiErrorParser';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const formatPhoneInput = (phone: string): string => {
  return phone.replace(/[^\d]/g, '').slice(0, 10);
};

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading, clearAuthError, authError } = useAuth();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = React.useRef(new Animated.Value(1)).current;
  const headerOpacity = React.useRef(new Animated.Value(1)).current;
  const formSlideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    clearAuthError();
    setScreenError(null);
  }, [clearAuthError]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(formSlideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setFocusedField(null);
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const phoneValue = watch('phone');
  const passwordValue = watch('password');

  const onSubmit = async (values: LoginFormData) => {
    clearAuthError();
    setScreenError(null);
    clearErrors();

    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const phoneValidation = validateKenyanPhone(values.phone);
      if (!phoneValidation.isValid) {
        setScreenError(phoneValidation.error || 'Enter a valid phone number');
        return;
      }
      
      const normalizedPhone = normalizeKenyanPhone(values.phone);
      
      if (__DEV__) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 LOGIN REQUEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('URL: POST /v1/auth/login');
        console.log('Payload:', {
          phone: normalizedPhone,
          password: '[REDACTED]',
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      await login(normalizedPhone, values.password);
      
      if (__DEV__) {
        console.log('\n✅ Login successful!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      const resumed = await resumePendingInviteIntent(navigation as any);
      if (resumed) {
        return;
      }
    } catch (error) {
      const userMessage = getUserMessage(error, 'auth.login');
      const parsed = parseApiFormError<keyof LoginFormData>(error, {
        fieldMap: {
          phone: 'phone',
          identifier: 'phone',
          password: 'password',
        },
        fallbackFormError: userMessage.message,
      });
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      
      if (__DEV__) {
        console.log('\n❌ LOGIN FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Status:', axiosError?.response?.status || 'N/A');
        console.log('Response Data:', axiosError?.response?.data || parsed.raw.generalMessage);
        console.log('Field Errors:', parsed.raw.fieldErrors);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      for (const [field, message] of Object.entries(parsed.fieldErrors)) {
        setError(field as keyof LoginFormData, { type: 'server', message });
      }

      setScreenError(parsed.formError || userMessage.message);
    }
  };

  const handlePhoneFocus = useCallback(() => {
    setFocusedField('phone');
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePhoneBlur = useCallback(() => {
    setFocusedField(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.backgroundGradient}>
          <View style={styles.backgroundGlow} />
          <View style={styles.backgroundGlow2} />
          <View style={styles.backgroundCircles}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 4 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <View style={styles.logoOuterRing}>
                <View style={styles.logoInner}>
                  <Icon name="shield-check" size={32} color={colors.primary[500]} />
                </View>
              </View>
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitleText}>
                Sign in to manage your chama
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: formSlideAnim }] }}>
            <Card style={styles.formCard}>
              {screenError && (
                <View style={styles.errorBanner}>
                  <Icon name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorBannerText}>{screenError}</Text>
                </View>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <Animated.View style={[
                  styles.inputContainer,
                  focusedField === 'phone' && styles.inputContainerFocused,
                  errors.phone && styles.inputContainerError,
                ]}>
                  <View style={styles.inputLeftIcon}>
                    <Text style={styles.countryCode}>🇰🇪</Text>
                    <Text style={styles.countryCodeText}>+254</Text>
                    <View style={styles.dividerVertical} />
                  </View>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="0712345678"
                        placeholderTextColor={colors.neutral[400]}
                        value={value}
                        onChangeText={(text) => onChange(formatPhoneInput(text))}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        onFocus={handlePhoneFocus}
                        onBlur={handlePhoneBlur}
                      />
                    )}
                  />
                  {phoneValue.length > 0 && (
                    <TouchableOpacity 
                      style={styles.inputRightIcon}
                      onPress={() => setValue('phone', '')}
                    >
                      <Icon name="close-circle" size={18} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
                {errors.phone && (
                  <Animated.View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={14} color={colors.error} />
                    <Text style={styles.errorText}>{errors.phone.message}</Text>
                  </Animated.View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <Animated.View style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputContainerFocused,
                  errors.password && styles.inputContainerError,
                ]}>
                  <View style={styles.inputLeftIcon}>
                    <Icon name="lock-outline" size={20} color={colors.neutral[400]} />
                  </View>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.neutral[400]}
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                    )}
                  />
                  <TouchableOpacity 
                    style={styles.inputRightIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.primary[500]}
                    />
                  </TouchableOpacity>
                </Animated.View>
                {errors.password && (
                  <Animated.View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={14} color={colors.error} />
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  </Animated.View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Button
                  title="Sign In"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading || isSubmitting}
                  loadingTitle="Signing in..."
                  disabled={!isValid || isLoading}
                  style={styles.loginButton}
                  textStyle={styles.loginButtonText}
                />
              </Animated.View>
            </Card>
          </Animated.View>

          {!isKeyboardVisible && (
            <View style={styles.bottomSection}>
              <TouchableOpacity
                onPress={() => {
                  const root = navigation.getParent();
                  if (root) {
                    (root as any).navigate('Auth', { screen: 'JoinViaCode' });
                  } else {
                    navigation.navigate('JoinViaCode');
                  }
                }}
                style={styles.otpButton}
              >
                <View style={styles.otpButtonContent}>
                  <Icon name="account-group-outline" size={20} color={colors.primary[500]} />
                  <Text style={styles.otpButtonText}>Join with Code</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate({ name: 'Register' } as any)}>
                  <Text style={styles.registerLink}>Create account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.legalContainer}>
                <Text style={styles.legalText}>
                  By continuing, you agree to our{' '}
                  <Text 
                    style={styles.legalLink}
                    onPress={() => navigation.navigate('TermsOfService')}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text 
                    style={styles.legalLink}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
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
    justifyContent: 'center',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.light.background,
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.primary[400],
    opacity: 0.08,
  },
  backgroundGlow2: {
    position: 'absolute',
    bottom: 50,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary[300],
    opacity: 0.05,
  },
  backgroundCircles: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  circle: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: colors.primary[500],
    top: 0,
    right: 0,
  },
  circle2: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary[400],
    bottom: 40,
    right: 40,
  },
  circle3: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary[300],
    bottom: 0,
    right: 120,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[400],
    opacity: 0.15,
  },
  logoOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  formCard: {
    padding: spacing[5],
    marginBottom: spacing[2],
    borderRadius: 20,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  inputGroup: {
    marginBottom: spacing[3],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.light.background,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  inputLeftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  countryCode: {
    fontSize: 18,
    marginRight: spacing[1],
  },
  countryCodeText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  dividerVertical: {
    width: 1,
    height: 20,
    backgroundColor: colors.neutral[300],
    marginHorizontal: spacing[2],
  },
  phoneInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    paddingVertical: spacing[3],
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
    paddingVertical: spacing[3],
  },
  inputRightIcon: {
    padding: spacing[1],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.error + '12',
    borderRadius: 8,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing[1],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[3],
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  loginButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingTop: spacing[2],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  otpButton: {
    backgroundColor: colors.light.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    marginBottom: spacing[3],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
    marginLeft: spacing[2],
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  registerText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
  legalContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    marginBottom: spacing[2],
  },
  legalText: {
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
});
