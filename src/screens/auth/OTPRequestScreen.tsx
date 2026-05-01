import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { AuthStackParamList } from '@/navigation/types';
import { getSuccessMessage, getUserMessage } from '@/utils/userMessages';
import { resolveVerificationContext } from '@/auth/verification';
import { formatPhoneDisplay, normalizeKenyanPhone } from '@/utils/phoneUtils';

type OTPRequestScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPRequest'
>;

export const OTPRequestScreen: React.FC = () => {
  const navigation = useNavigation<OTPRequestScreenNavigationProp>();
  const { requestOTP, isLoading, clearAuthError } = useAuth();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'sms' | 'email'>('sms');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const formAnim = React.useRef(new Animated.Value(0)).current;

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

  const handleSendOTP = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      Alert.alert('Error', method === 'sms' ? 'Enter a phone number.' : 'Enter an email address.');
      return;
    }

    let normalizedIdentifier = '';
    let normalizedPhone = '';
    let normalizedEmail = '';

    if (method === 'email') {
      normalizedEmail = trimmed.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        Alert.alert('Invalid email', 'Enter a valid email address.');
        return;
      }
      normalizedIdentifier = normalizedEmail;
    } else {
      try {
        normalizedPhone = normalizeKenyanPhone(trimmed);
      } catch (err) {
        Alert.alert('Invalid phone number', err instanceof Error ? err.message : 'Enter a valid phone number.');
        return;
      }
      normalizedIdentifier = normalizedPhone;
    }

    try {
      clearAuthError();
      await requestOTP(normalizedIdentifier, method, 'login_2fa');
      const successCopy = getSuccessMessage(
        method === 'email' ? 'otpResentEmail' : 'otpResentSms'
      );
      Alert.alert(successCopy.title, successCopy.message);
      navigation.navigate('OTPVerification', {
        verificationContext: {
          ...resolveVerificationContext({
            identifier: normalizedIdentifier,
            phone: normalizedPhone,
            email: normalizedEmail,
            deliveryMethod: method,
            purpose: 'login_2fa',
            nextRoute: 'ChamaSetup',
            successTitle: successCopy.title,
            successMessage: successCopy.message,
          }),
        },
      });
    } catch (error) {
      const userMessage = getUserMessage(error, 'auth.otp.request');
      Alert.alert(userMessage.title, userMessage.message);
    }
  };

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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.backButtonCircle}>
                <Icon name="arrow-left" size={20} color={colors.neutral[700]} />
              </View>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Icon name="message-text" size={28} color={colors.primary[500]} />
            </View>

            <Text style={styles.title}>Sign in with OTP</Text>
            <Text style={styles.subtitle}>
              {method === 'sms'
                ? 'Enter your phone number and we\'ll send a secure code to sign in'
                : 'Enter your email and we\'ll send a secure code to sign in'}
            </Text>
          </Animated.View>

          <Animated.View style={{
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <Card style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {method === 'sms' ? 'Phone Number' : 'Email Address'}
                </Text>
                <Animated.View style={[
                  styles.inputContainer,
                  focusedField === 'identifier' && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputLeftIcon}>
                    <Icon
                      name={method === 'sms' ? 'phone-outline' : 'email-outline'}
                      size={20}
                      color={colors.neutral[400]}
                    />
                  </View>
                  {method === 'sms' && (
                    <View style={styles.phoneCodeContainer}>
                      <Text style={styles.flag}>🇰🇪</Text>
                      <Text style={styles.phoneCode}>+254</Text>
                      <View style={styles.divider} />
                    </View>
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder={method === 'sms' ? '0XX XXX XXXX' : 'your@email.com'}
                    placeholderTextColor={colors.neutral[400]}
                    value={identifier}
                    onChangeText={(text) =>
                      setIdentifier(method === 'sms' ? formatPhoneDisplay(text) : text)
                    }
                    keyboardType={method === 'sms' ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                  />
                </Animated.View>
              </View>

              <View style={styles.methodSelector}>
                <Text style={styles.methodLabel}>Delivery Method</Text>
                <View style={styles.methodOptions}>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      method === 'sms' && styles.methodOptionActive
                    ]}
                    onPress={() => setMethod('sms')}
                  >
                    <Icon
                      name="cellphone"
                      size={18}
                      color={method === 'sms' ? colors.primary[600] : colors.neutral[500]}
                    />
                    <Text style={[
                      styles.methodOptionText,
                      method === 'sms' && styles.methodOptionTextActive
                    ]}>
                      SMS
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      method === 'email' && styles.methodOptionActive
                    ]}
                    onPress={() => setMethod('email')}
                  >
                    <Icon
                      name="email-outline"
                      size={18}
                      color={method === 'email' ? colors.primary[600] : colors.neutral[500]}
                    />
                    <Text style={[
                      styles.methodOptionText,
                      method === 'email' && styles.methodOptionTextActive
                    ]}>
                      Email
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={isLoading}
                disabled={!identifier.trim()}
                icon={!isLoading ? <Icon name="arrow-right" size={18} color={colors.light.background} /> : undefined}
                style={styles.submitButton}
              />

              <View style={styles.trustNote}>
                <Icon name="shield-check" size={14} color={colors.success} />
                <Text style={styles.trustNoteText}>
                  We'll send a secure code to your {method === 'sms' ? 'phone' : 'email'}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: formAnim }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.backToLoginButton}
            >
              <Icon name="arrow-left" size={16} color={colors.primary[600]} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
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
  formCard: {
    padding: spacing[4],
    borderRadius: 16,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: spacing[4],
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
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.light.background,
  },
  inputLeftIcon: {
    marginRight: spacing[2],
  },
  phoneCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  flag: {
    fontSize: 14,
    marginRight: 2,
  },
  phoneCode: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginRight: spacing[1],
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.neutral[300],
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    paddingVertical: spacing[2],
  },
  methodSelector: {
    marginBottom: spacing[4],
  },
  methodLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  methodOptions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.card,
  },
  methodOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  methodOptionText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  methodOptionTextActive: {
    color: colors.primary[700],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    marginRight: spacing[2],
    letterSpacing: 0.3,
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  trustNoteText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    marginLeft: spacing[1],
  },
  footer: {
    paddingTop: spacing[3],
    alignItems: 'center',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  backToLoginText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginLeft: spacing[1],
  },
});
