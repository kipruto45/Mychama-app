import React, { useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormFeedbackBanner } from '@/components/ui/FormFeedbackBanner';
import { useAuth } from '@/providers/AuthProvider';
import { AuthStackParamList } from '@/navigation/types';
import { getSuccessMessage, getUserMessage } from '@/utils/userMessages';
import { ResetPasswordFormData, resetPasswordSchema } from '@/utils/validation';
import { parseApiFormError } from '@/utils/apiErrorParser';
import { ErrorCodes } from '@/api/errors';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { identifier, deliveryMethod, successMessage } = route.params;
  const { resetPassword, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [screenSuccess, setScreenSuccess] = useState<string | null>(successMessage || null);
  const [didReset, setDidReset] = useState(false);

  const isPhoneReset = deliveryMethod === 'sms';
  const displayIdentifier = isPhoneReset ? identifier : identifier;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormData) => {
    setScreenError(null);
    clearErrors();
    try {
      await resetPassword(identifier, values.code, values.new_password);
      const successMessage = getSuccessMessage('passwordResetSuccess');
      setScreenSuccess(successMessage.message);
      setDidReset(true);
    } catch (error) {
      const userMessage = getUserMessage(error, 'auth.passwordReset.confirm');
      const parsed = parseApiFormError<keyof ResetPasswordFormData>(error, {
        fieldMap: {
          code: 'code',
          new_password: 'new_password',
          new_password_confirm: 'new_password_confirm',
        },
        fallbackFormError: userMessage.message,
      });

      for (const [field, message] of Object.entries(parsed.fieldErrors)) {
        setError(field as keyof ResetPasswordFormData, { type: 'server', message });
      }

      if (!Object.keys(parsed.fieldErrors).length && parsed.code) {
        if (parsed.code === 'INVALID_OTP' || parsed.code === 'OTP_EXPIRED') {
          setError('code', { type: 'server', message: userMessage.message });
          return;
        }
        if (parsed.code === ErrorCodes.WEAK_PASSWORD) {
          setError('new_password', { type: 'server', message: userMessage.message });
          return;
        }
      }

      setScreenError(parsed.formError || userMessage.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={48} color={colors.primary[500]} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the reset code sent to{' '}
              <Text style={styles.phoneText}>{displayIdentifier}</Text>
              {' '}and create a new password
            </Text>
          </View>

          <Card style={styles.formCard}>
            {screenSuccess ? (
              <FormFeedbackBanner type="success" message={screenSuccess} />
            ) : null}
            {screenError ? (
              <FormFeedbackBanner type="error" message={screenError} />
            ) : null}
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Reset Code"
                  placeholder="Enter 6-digit code"
                  value={value}
                  onChangeText={(text) => {
                    setScreenError(null);
                    setScreenSuccess(null);
                    onChange(text);
                  }}
                  keyboardType="number-pad"
                  error={errors.code?.message}
                  leftIcon={<Icon name="shield-check" size={20} color={colors.neutral[400]} />}
                />
              )}
            />

            <Controller
              control={control}
              name="new_password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Create a new password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  error={errors.new_password?.message}
                  leftIcon={<Icon name="lock" size={20} color={colors.neutral[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.neutral[400]}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="new_password_confirm"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  error={errors.new_password_confirm?.message}
                  leftIcon={<Icon name="lock-check" size={20} color={colors.neutral[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                      <Icon
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.neutral[400]}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Button
              title={didReset ? 'Continue to Login' : 'Reset Password'}
              onPress={didReset ? () => navigation.navigate('Login') : handleSubmit(onSubmit)}
              loading={!didReset && (isLoading || isSubmitting)}
              style={styles.submitButton}
            />
          </Card>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLoginButton}
          >
            <Icon name="arrow-left" size={16} color={colors.primary[600]} />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing[4],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing[2],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  phoneText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
  formCard: {
    marginBottom: spacing[4],
  },
  submitButton: {
    marginTop: spacing[2],
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
  },
  backToLoginText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginLeft: spacing[2],
  },
});
