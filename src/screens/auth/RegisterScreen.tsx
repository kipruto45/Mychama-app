import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormFeedbackBanner } from '@/components/ui/FormFeedbackBanner';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { getUserMessage } from '@/utils/userMessages';
import { normalizeKenyanPhone, validateKenyanPhone } from '@/utils/phoneUtils';
import { parseApiFormError } from '@/utils/apiErrorParser';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterScreenRouteProp = RouteProp<AuthStackParamList, 'Register'>;

interface RegisterFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  otpDeliveryMethod: 'sms' | 'email';
}

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute<RegisterScreenRouteProp>();
  const { register, isLoading, clearAuthError } = useAuth();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const prefilledData = route.params?.prefilledData;
  
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: prefilledData?.fullName || '',
    phone: prefilledData?.phone || '',
    email: prefilledData?.email || '',
    password: prefilledData?.password || '',
    confirmPassword: prefilledData?.confirmPassword || '',
    otpDeliveryMethod: (prefilledData as any)?.otpDeliveryMethod || 'email',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [screenError, setScreenError] = useState<string | null>(null);
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    clearAuthError();
    setScreenError(null);
  }, [clearAuthError]);

  useEffect(() => {
    if (__DEV__ && prefilledData) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 RegisterScreen: Hydrating from prefilled data');
      console.log('   prefilledData:', JSON.stringify(prefilledData, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }, [prefilledData]);

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateFormData = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    const phoneValidation = validateKenyanPhone(formData.phone);
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error || 'Enter a valid Kenyan phone number';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    handleButtonPress();
    clearAuthError();
    setScreenError(null);
    
    try {
      const normalizedPhone = normalizeKenyanPhone(formData.phone);
      
      if (__DEV__) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 REGISTRATION REQUEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('URL: POST /v1/auth/register');
        console.log('Payload:', {
          phone: normalizedPhone,
          full_name: formData.fullName,
          email: formData.email,
          password: '[REDACTED]',
          password_confirm: '[REDACTED]',
          otp_delivery_method: formData.otpDeliveryMethod,
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      await register({
        phone: normalizedPhone,
        password: formData.password,
        full_name: formData.fullName,
        email: formData.email || undefined,
        password_confirm: formData.confirmPassword,
        otp_delivery_method: formData.otpDeliveryMethod,
      });
      
      if (__DEV__) {
        console.log('\n✅ Registration successful!');
        console.log('Check Django terminal for OTP code');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const parsed = parseApiFormError<keyof RegisterFormData>(error, {
        fieldMap: {
          full_name: 'fullName',
          phone: 'phone',
          email: 'email',
          password: 'password',
          password_confirm: 'confirmPassword',
          otp_delivery_method: 'otpDeliveryMethod',
        },
        fallbackFormError: getUserMessage(error, 'auth.register').message,
      });
      
      if (__DEV__) {
        console.log('\n❌ REGISTRATION FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Status:', axiosError?.response?.status || 'N/A');
        console.log('Response Data:', axiosError?.response?.data || parsed.raw.generalMessage);
        console.log('Field Errors:', parsed.raw.fieldErrors);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
      }
      setScreenError(parsed.formError);
    }
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    fieldKey: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      secureTextEntry?: boolean;
      showPassword?: boolean;
      onTogglePassword?: () => void;
      leftIcon?: React.ReactNode;
    },
    errorMessage?: string
  ) => {
    const isFocused = focusedField === fieldKey;
    const hasValue = value.length > 0;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Animated.View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          errorMessage && styles.inputContainerError,
        ]}>
          {options?.leftIcon && (
            <View style={styles.inputLeftIcon}>
              {options.leftIcon}
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.neutral[400]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={options?.keyboardType || 'default'}
            secureTextEntry={options?.secureTextEntry && !options?.showPassword}
            autoCapitalize="none"
            onFocus={() => handleFocus(fieldKey)}
            onBlur={handleBlur}
          />
          {options?.secureTextEntry !== undefined && (
            <TouchableOpacity 
              style={styles.inputRightIcon}
              onPress={options?.onTogglePassword}
            >
              <Icon
                name={options?.showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          )}
          {fieldKey === 'phone' && hasValue && (
            <TouchableOpacity 
              style={styles.inputRightIcon}
              onPress={() => onChangeText('')}
            >
              <Icon name="close-circle" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </Animated.View>
        {errorMessage ? (
          <View style={styles.fieldErrorRow}>
            <Icon name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.fieldErrorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const passwordValue = formData.password || '';
  const passwordRules = {
    minLength: passwordValue.length >= 8,
    hasUpper: /[A-Z]/.test(passwordValue),
    hasLower: /[a-z]/.test(passwordValue),
    hasNumber: /\d/.test(passwordValue),
    hasSpecial: /[^A-Za-z0-9]/.test(passwordValue),
  };
  const shouldShowPasswordHelper =
    focusedField === 'password' || passwordValue.length > 0;

  const renderRule = (ok: boolean, label: string) => (
    <View key={label} style={styles.ruleRow}>
      <Icon
        name={ok ? 'check-circle' : 'circle-outline'}
        size={16}
        color={ok ? colors.success : colors.neutral[400]}
      />
      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.backgroundGradient}>
          <View style={styles.backgroundCircles}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 12 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            styles.header,
            { 
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }
          ]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.backButtonCircle}>
                <Icon name="arrow-left" size={20} color={colors.neutral[700]} />
              </View>
            </TouchableOpacity>

            <View style={styles.logoSection}>
              <View style={styles.logoOuterRing}>
                <View style={styles.logoInner}>
                  <Icon name="shield-plus" size={28} color={colors.primary[500]} />
                </View>
              </View>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join thousands of members saving together
            </Text>
          </Animated.View>

          <Animated.View style={{
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <Card style={styles.formCard}>
              {screenError ? (
                <FormFeedbackBanner
                  type="error"
                  message={screenError}
                  testID="register-form-error"
                />
              ) : null}
              {renderInput(
                'Full Name',
                'Enter your full name',
                formData.fullName,
                (text) => updateFormData('fullName', text),
                'full_name',
                {
                  leftIcon: <Icon name="account-outline" size={20} color={colors.neutral[400]} />,
                },
                errors.fullName
              )}

              {renderInput(
                'Phone Number',
                '0712345678',
                formData.phone,
                (text) => updateFormData('phone', text.replace(/\D/g, '')),
                'phone',
                {
                  keyboardType: 'phone-pad',
                  leftIcon: (
                    <View style={styles.phoneCodeContainer}>
                      <Text style={styles.flag}>🇰🇪</Text>
                      <Text style={styles.phoneCode}>+254</Text>
                      <View style={styles.divider} />
                    </View>
                  ),
                },
                errors.phone
              )}

              {renderInput(
                'Email Address',
                'your@email.com',
                formData.email,
                (text) => updateFormData('email', text),
                'email',
                {
                  keyboardType: 'email-address',
                  leftIcon: <Icon name="email-outline" size={20} color={colors.neutral[400]} />,
                },
                errors.email
              )}

              {/* OTP Delivery Method Selection */}
              <View style={styles.otpDeliveryContainer}>
                <Text style={styles.otpDeliveryLabel}>How should we send your verification code?</Text>
                <View style={styles.otpDeliveryOptions}>
                  <TouchableOpacity
                    style={[
                      styles.otpDeliveryButton,
                      formData.otpDeliveryMethod === 'email' && styles.otpDeliveryButtonActive,
                    ]}
                    onPress={() => updateFormData('otpDeliveryMethod', 'email')}
                  >
                    <Icon
                      name="email-outline"
                      size={20}
                      color={formData.otpDeliveryMethod === 'email' ? colors.primary[500] : colors.neutral[400]}
                    />
                    <Text
                      style={[
                        styles.otpDeliveryButtonText,
                        formData.otpDeliveryMethod === 'email' && styles.otpDeliveryButtonTextActive,
                      ]}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.otpDeliveryButton,
                      formData.otpDeliveryMethod === 'sms' && styles.otpDeliveryButtonActive,
                    ]}
                    onPress={() => updateFormData('otpDeliveryMethod', 'sms')}
                  >
                    <Icon
                      name="message-outline"
                      size={20}
                      color={formData.otpDeliveryMethod === 'sms' ? colors.primary[500] : colors.neutral[400]}
                    />
                    <Text
                      style={[
                        styles.otpDeliveryButtonText,
                        formData.otpDeliveryMethod === 'sms' && styles.otpDeliveryButtonTextActive,
                      ]}
                    >
                      SMS
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {renderInput(
                'Password',
                'Create a strong password',
                formData.password,
                (text) => updateFormData('password', text),
                'password',
                {
                  secureTextEntry: true,
                  showPassword,
                  onTogglePassword: () => setShowPassword(!showPassword),
                  leftIcon: <Icon name="lock-outline" size={20} color={colors.neutral[400]} />,
                },
                errors.password
              )}

              {shouldShowPasswordHelper ? (
                <View style={styles.passwordHelper}>
                  <Text style={styles.helperTitle}>Password requirements</Text>
                  {renderRule(passwordRules.minLength, 'At least 8 characters')}
                  {renderRule(passwordRules.hasUpper, 'One uppercase letter')}
                  {renderRule(passwordRules.hasLower, 'One lowercase letter')}
                  {renderRule(passwordRules.hasNumber, 'One number')}
                  {renderRule(passwordRules.hasSpecial, 'One special character')}
                </View>
              ) : null}

              {renderInput(
                'Confirm Password',
                'Re-enter your password',
                formData.confirmPassword,
                (text) => updateFormData('confirmPassword', text),
                'password_confirm',
                {
                  secureTextEntry: true,
                  showPassword: showConfirmPassword,
                  onTogglePassword: () => setShowConfirmPassword(!showConfirmPassword),
                  leftIcon: <Icon name="lock-check-outline" size={20} color={colors.neutral[400]} />,
                },
                errors.confirmPassword
              )}

              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  loading={isLoading}
                  loadingTitle="Creating account..."
                  disabled={isLoading}
                  icon={!isLoading ? <Icon name="arrow-right" size={20} color={colors.light.background} /> : undefined}
                  style={styles.createButton}
                  textStyle={styles.createButtonText}
                />
              </Animated.View>

              <View style={styles.trustIndicator}>
                <Icon name="shield-check" size={14} color={colors.success} />
                <Text style={styles.trustText}>Your account is protected with bank-grade security</Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View style={[
            styles.footer,
            { opacity: formAnim }
          ]}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
            </Text>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.light.background,
    overflow: 'hidden',
  },
  backgroundCircles: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 250,
    height: 250,
  },
  circle: {
    position: 'absolute',
    borderRadius: 125,
    opacity: 0.08,
  },
  circle1: {
    width: 180,
    height: 180,
    backgroundColor: colors.primary[500],
    bottom: 0,
    left: 0,
  },
  circle2: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary[400],
    bottom: 20,
    left: 60,
  },
  circle3: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary[300],
    bottom: 80,
    left: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: spacing[4],
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
  logoOuterRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  formCard: {
    padding: spacing[4],
    borderRadius: 16,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  inputGroup: {
    marginBottom: spacing[3],
  },
  inputGroupMargin: {
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
    minHeight: 46,
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
    backgroundColor: '#FEF2F2',
  },
  inputLeftIcon: {
    marginRight: spacing[2],
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
  fieldErrorText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    lineHeight: 18,
  },
  passwordHelper: {
    marginTop: -spacing[2],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  helperTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 2,
  },
  ruleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  ruleTextOk: {
    color: colors.neutral[700],
  },
  phoneCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  phoneCode: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginRight: spacing[2],
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.neutral[300],
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
    paddingVertical: spacing[3],
  },
  inputRightIcon: {
    padding: spacing[1],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    marginTop: spacing[2],
    marginBottom: spacing[3],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: colors.primary[300],
    shadowOpacity: 0.1,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    marginRight: spacing[2],
    letterSpacing: 0.5,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
  },
  trustText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    marginLeft: spacing[1],
  },
  footer: {
    paddingTop: spacing[2],
  },
  termsText: {
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },
  termsLink: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing[2],
  },
  loginText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  loginLink: {
    color: colors.primary[600],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
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
  otpDeliveryContainer: {
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  otpDeliveryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
  otpDeliveryOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  otpDeliveryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.background,
  },
  otpDeliveryButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  otpDeliveryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[600],
  },
  otpDeliveryButtonTextActive: {
    color: colors.primary[500],
  },
});
