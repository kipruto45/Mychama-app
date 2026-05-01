import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormFeedbackBanner } from '@/components/ui/FormFeedbackBanner';
import { useAuth } from '@/providers/AuthProvider';
import { AuthStackParamList, VerificationContext, VerificationData } from '@/navigation/types';
import { getSuccessMessage, getUserMessage } from '@/utils/userMessages';
import { otpVerificationSchema } from '@/utils/validation';
import { resolveVerificationContext, isEmailVerificationContext } from '@/auth/verification';

type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPVerificationScreenNavigationProp>();
  const route = useRoute<OTPVerificationScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const verificationContext: VerificationContext | undefined = route.params?.verificationContext;
  
  const [context, setContext] = useState<VerificationContext>(() => {
    if (!verificationContext) {
      return {
        identifier: '',
        phone: '',
        email: '',
        purpose: 'verify_phone',
        deliveryMethod: 'sms',
        nextRoute: 'ChamaSetup',
      };
    }
    return resolveVerificationContext(verificationContext);
  });
  const [identifier, setIdentifier] = useState(context.identifier);
  const [phone, setPhone] = useState(context.phone);
  const [email, setEmail] = useState(context.email || '');
  const [purpose, setPurpose] = useState(context.purpose);
  const [deliveryMethod, setDeliveryMethod] = useState(context.deliveryMethod);
  const [nextRoute, setNextRoute] = useState(context.nextRoute);
  const [registrationData, setRegistrationData] = useState(context.registrationData);
  const [successTitle, setSuccessTitle] = useState(context.successTitle);
  const [successMessage, setSuccessMessage] = useState(context.successMessage);
  
  // Timer and resend state - driven only by confirmed success
  const [otpWasSentSuccessfully, setOtpWasSentSuccessfully] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [timer, setTimer] = useState(0); // Start at 0, only increment on success
  const [canResend, setCanResend] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [lastTimerState, setLastTimerState] = useState(0); // Preserve timer if resend fails
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const formAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const { verifyOTP, requestOTP, isLoading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    if (!verificationContext) {
      return;
    }
    try {
      const resolved = resolveVerificationContext(verificationContext);
      setContext(resolved);
      setIdentifier(resolved.identifier);
      setPhone(resolved.phone);
      setEmail(resolved.email || '');
      setPurpose(resolved.purpose);
      setDeliveryMethod(resolved.deliveryMethod);
      setNextRoute(resolved.nextRoute);
      setRegistrationData(resolved.registrationData);
      setSuccessTitle(resolved.successTitle);
      setSuccessMessage(resolved.successMessage);
    } catch (error) {
      if (__DEV__) {
        console.warn('OTPVerificationScreen: Failed to resolve verification context', error);
      }
    }
  }, [verificationContext]);

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

  // Timer countdown logic - ONLY runs if OTP was successfully sent
  useEffect(() => {
    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Only start timer if OTP was confirmed sent AND timer > 0
    if (otpWasSentSuccessfully && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      // Timer finished
      setCanResend(true);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timer, otpWasSentSuccessfully]);

  useEffect(() => {
    if (successMessage && successTitle && !otpWasSentSuccessfully) {
      // Backend-confirmed send (OTP_SENT). Never infer success from navigation alone.
      setOtpWasSentSuccessfully(true);
      setTimer(60);
      setCanResend(false);
    }
  }, [otpWasSentSuccessfully, successMessage, successTitle]);

  const handleGoBackToRegister = useCallback(() => {
    const isEmailFlow = isEmailVerificationContext({ deliveryMethod, identifier, purpose });
    const resolvedPhone =
      phone ||
      (isEmailFlow ? registrationData?.normalizedPhone || registrationData?.phone || '' : '') ||
      (!isEmailFlow ? identifier : '');
    const prefilledData: VerificationData = {
      fullName: registrationData?.fullName || '',
      firstName: registrationData?.firstName,
      lastName: registrationData?.lastName,
      phone: resolvedPhone,
      normalizedPhone: resolvedPhone,
      email: registrationData?.email || (isEmailFlow ? (email || identifier) : email) || '',
      password: registrationData?.password,
      confirmPassword: registrationData?.confirmPassword,
      acceptedTerms: registrationData?.acceptedTerms,
    };
    
    if (__DEV__) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔙 OTPVerificationScreen: Navigating back to Register');
      console.log('   Phone:', phone || identifier);
      console.log('   Email:', prefilledData.email);
      console.log('   Full Name:', prefilledData.fullName);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    navigation.navigate('Register', { prefilledData });
  }, [deliveryMethod, identifier, purpose, navigation, registrationData, phone, email]);

  const handleOtpChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = sanitized;
    setOtp(nextOtp);

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (screenError) setScreenError(null);
    if (resendError) setResendError(null);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const validation = otpVerificationSchema.safeParse({ identifier, code });

    if (!validation.success) {
      setScreenError(
        validation.error.issues[0]?.message || 'Please enter the full 6-digit code.'
      );
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      if (__DEV__) {
        console.log('\n🔐 Verifying OTP...');
        console.log('   identifier:', identifier);
        console.log('   code:', code);
        console.log('   purpose:', purpose);
      }
      
      await verifyOTP(identifier, code, purpose);

      if (__DEV__) {
        console.log('\n✅ OTP Verified! Navigating to Chama Setup...');
      }

      const successCopy =
        purpose === 'login_2fa'
          ? getSuccessMessage('otpVerifiedLogin')
          : isEmailVerificationContext({ deliveryMethod, identifier, purpose })
          ? getSuccessMessage('otpVerifiedEmail')
          : getSuccessMessage('otpVerifiedPhone');
      Alert.alert(successCopy.title, successCopy.message);
    } catch (error) {
      if (__DEV__) {
        console.log('\n❌ OTP Verification Failed');
        console.log('Error:', error);
      }
      const userMessage = getUserMessage(error, 'auth.otp.verify');
      setScreenError(userMessage.message);
    }
  };

  const handleResend = async () => {
    // Prevent duplicate requests
    if (!canResend || isResendingOtp) {
      return;
    }

    setIsResendingOtp(true);
    setResendError(null);
    setScreenError(null);
    
    // Save current timer state in case resend fails
    const previousTimerState = timer;

    try {
      if (__DEV__) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📨 RESEND OTP REQUEST');
        console.log('   identifier:', identifier);
        console.log('   phone:', phone);
        console.log('   deliveryMethod:', deliveryMethod);
        console.log('   purpose:', purpose);
        console.log('   previousTimerState:', previousTimerState);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      // For console mode in dev, send as 'sms' to backend (backend will handle console delivery)
      const backendDeliveryMethod = deliveryMethod === 'console' ? 'sms' : deliveryMethod;
      const resendIdentifier = identifier;
      const otpPurpose = purpose;
      
      if (__DEV__) {
        console.log('   Calling requestOTP...');
        console.log('   endpoint: POST /v1/auth/otp/send');
        console.log('   payload:', {
          identifier: resendIdentifier,
          delivery_method: backendDeliveryMethod,
          purpose: otpPurpose,
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      // Make the request
      await requestOTP(resendIdentifier, backendDeliveryMethod as 'sms' | 'email', otpPurpose);
      
      // Only on confirmed SUCCESS: reset timer and clear OTP input
      if (__DEV__) {
        console.log('\n✅ OTP RESEND SUCCESSFUL');
        console.log('   Resetting timer to 60s');
        console.log('   Clearing OTP input');
        console.log('   previousTimerState was:', previousTimerState);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      // SUCCESS-ONLY actions
      setLastTimerState(previousTimerState); // Save for potential future use
      setOtpWasSentSuccessfully(true);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      // Show success message
      const resendCopy = deliveryMethod === 'email'
        ? getSuccessMessage('otpResentEmail')
        : getSuccessMessage('otpResentSms');
      setSuccessTitle(resendCopy.title);
      setSuccessMessage(resendCopy.message);
      Alert.alert(resendCopy.title, resendCopy.message);
      
    } catch (error: any) {
      // FAILURE: Preserve previous timer state
      if (__DEV__) {
        console.log('\n❌ OTP RESEND FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Error:', error?.message);
        console.log('Code:', error?.code);
        console.log('Status:', error?.response?.status);
        console.log('Response:', error?.response?.data);
        console.log('previousTimerState:', previousTimerState);
        console.log('Preserving previous timer state (NOT resetting)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      // Do NOT modify timer state on failure
      // This is the critical fix - preserve the countdown that was already running
      
      const userMessage = getUserMessage(error, 'auth.otp.resend');
      setResendError(userMessage.message);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const isConsoleMode = deliveryMethod === 'console';
  const isEmailVerification = isEmailVerificationContext({ deliveryMethod, identifier, purpose });
  const maskedDestination = context.maskedDestination || (isEmailVerification ? (email || identifier) : (phone || identifier));
  const displayTitle =
    context.displayTitle ||
    (isEmailVerification ? 'Email Verification' : 'Phone Number Verification');

  const sentSubtitle =
    context.displaySubtitle ||
    (isEmailVerification
      ? 'We sent a verification code to your email address.'
      : 'We sent a verification code to your phone number via SMS.');

  const pendingSubtitle = isEmailVerification
    ? 'Request a verification code to continue.'
    : 'Request a verification code to continue.';

  if (__DEV__) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 OTPVerificationScreen LOADED');
    console.log('   verificationContext:', JSON.stringify(verificationContext, null, 2));
    console.log('   identifier:', identifier);
    console.log('   phone:', phone);
    console.log('   email:', email);
    console.log('   purpose:', purpose);
    console.log('   deliveryMethod:', deliveryMethod);
    console.log('   isConsoleMode:', isConsoleMode);
    console.log('   nextRoute:', nextRoute);
    console.log('   otpWasSentSuccessfully:', otpWasSentSuccessfully);
    console.log('   timer:', timer);
    console.log('   canResend:', canResend);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  if (!verificationContext) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Verification Context Missing</Text>
          <Text style={styles.errorMessage}>
            Unable to load verification screen. Please start the registration process again.
          </Text>
          <Button
            title="Go to Register"
            onPress={() => navigation.navigate('Register', {})}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const contextLooksInvalid =
    !identifier ||
    (deliveryMethod === 'email' && purpose === 'verify_phone') ||
    ((deliveryMethod === 'sms' || deliveryMethod === 'console') && purpose === 'verify_email') ||
    (deliveryMethod === 'email' && !identifier.includes('@')) ||
    ((deliveryMethod === 'sms' || deliveryMethod === 'console') && identifier.includes('@'));

  if (contextLooksInvalid) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Invalid Verification Request</Text>
          <Text style={styles.errorMessage}>
            Your verification details don't match the selected delivery method. Please go back and request a new code.
          </Text>
          <Button title="Go Back" onPress={handleGoBackToRegister} style={styles.errorButton} />
        </View>
      </SafeAreaView>
    );
  }

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
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 16 }
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
              onPress={handleGoBackToRegister}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.backButtonCircle}>
                <Icon name="arrow-left" size={20} color={colors.neutral[700]} />
              </View>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Icon name="shield-check" size={32} color={colors.primary[500]} />
            </View>

            <Text style={styles.title}>
              {displayTitle}
            </Text>
            <Text style={styles.subtitle}>
              {isConsoleMode
                ? 'A verification code has been generated. Check the terminal/console for the code.'
                : otpWasSentSuccessfully
                ? sentSubtitle
                : pendingSubtitle}
            </Text>

            {!isConsoleMode ? (
              <Text style={styles.destinationText}>{maskedDestination}</Text>
            ) : null}
            
            {isConsoleMode && (
              <View style={styles.devNote}>
                <Icon name="console" size={16} color={colors.warning[700]} />
                <Text style={styles.devNoteText}>
                  Dev mode: Check terminal for OTP code
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={{
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <Card style={styles.otpCard}>
              {successMessage ? (
                <View style={styles.successBanner}>
                  <Icon name="check-decagram-outline" size={18} color={colors.primary[700]} />
                  <View style={styles.successCopy}>
                    <Text style={styles.successTitle}>{successTitle || 'Almost there'}</Text>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                </View>
              ) : null}
              {screenError ? (
                <FormFeedbackBanner type="error" message={screenError} />
              ) : null}
              {resendError ? (
                <FormFeedbackBanner type="error" message={resendError} />
              ) : null}

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Button
                  title="Verify"
                  onPress={handleVerify}
                  loading={isLoading}
                  loadingTitle="Verifying..."
                  disabled={isLoading}
                  icon={!isLoading ? <Icon name="check" size={18} color={colors.light.background} /> : undefined}
                  style={styles.verifyButton}
                  textStyle={styles.verifyButtonText}
                />
              </Animated.View>

              <View style={styles.resendContainer}>
                {isResendingOtp ? (
                  <Text style={styles.timerText}>Sending new code...</Text>
                ) : canResend ? (
                  <TouchableOpacity onPress={handleResend} disabled={isResendingOtp}>
                    <Text style={styles.resendText}>
                      {isEmailVerification ? 'Resend code to email' : 'Resend code via SMS'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    {isEmailVerification
                      ? `You can resend the code to your email in ${timer}s`
                      : `You can resend the code via SMS in ${timer}s`}
                  </Text>
                )}
              </View>
            </Card>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: formAnim }]}>
            <TouchableOpacity
              onPress={handleGoBackToRegister}
              style={styles.changeNumberButton}
            >
              <Icon name="pencil" size={16} color={colors.primary[600]} />
              <Text style={styles.changeNumberText}>
                {isEmailVerification ? 'Change Email Address' : 'Change Phone Number'}
              </Text>
            </TouchableOpacity>
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
    top: -60,
    right: -60,
    width: 200,
    height: 200,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.08,
  },
  circle1: {
    width: 140,
    height: 140,
    backgroundColor: colors.primary[500],
    bottom: 0,
    right: 0,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary[400],
    bottom: 20,
    right: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: spacing[4],
    zIndex: 10,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    lineHeight: 20,
  },
  destinationText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  phoneText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
  otpCard: {
    padding: spacing[4],
    borderRadius: 16,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  successCopy: {
    flex: 1,
    marginLeft: spacing[2],
  },
  successTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[800],
    marginBottom: spacing[1],
  },
  successText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[700],
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  otpInput: {
    width: 46,
    height: 54,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  otpInputFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.primary[300],
    shadowOpacity: 0.1,
  },
  verifyButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    marginRight: spacing[2],
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
  timerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  footer: {
    paddingTop: spacing[3],
    alignItems: 'center',
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  changeNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginLeft: spacing[2],
  },
  devNote: {
    backgroundColor: colors.warning + '15',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    marginTop: spacing[2],
    gap: spacing[1],
  },
  devNoteText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.warning[700],
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  errorButton: {
    minWidth: 200,
  },
});
