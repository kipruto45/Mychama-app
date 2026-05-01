import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { MainStackParamList } from '@/navigation/types';
import { PasswordChangeFormData, passwordChangeSchema } from '@/utils/validation';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const { changePassword, isLoading } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const onSubmit = async (values: PasswordChangeFormData) => {
    if (values.old_password === values.new_password) {
      Alert.alert('Invalid Password', 'Your new password must be different from the current password.');
      return;
    }

    try {
      await changePassword(values.old_password, values.new_password);
      Alert.alert(
        'Password Changed',
        'Your password has been changed successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Failed to change password.')
          : 'Failed to change password.';

      Alert.alert('Change Failed', message);
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
            <Text style={styles.title}>Change Password</Text>
            <View style={styles.headerRight} />
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="information" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Password Requirements</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoListItem}>
                <Icon name="check-circle" size={14} color={colors.success} />
                <Text style={styles.infoListItemText}>At least 8 characters</Text>
              </View>
              <View style={styles.infoListItem}>
                <Icon name="check-circle" size={14} color={colors.success} />
                <Text style={styles.infoListItemText}>Use a unique password you do not reuse elsewhere</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="old_password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showCurrentPassword}
                  error={errors.old_password?.message}
                  leftIcon={<Icon name="lock" size={20} color={colors.neutral[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowCurrentPassword((prev) => !prev)}>
                      <Icon
                        name={showCurrentPassword ? 'eye-off' : 'eye'}
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
              name="new_password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Enter your new password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showNewPassword}
                  error={errors.new_password?.message}
                  leftIcon={<Icon name="lock-plus" size={20} color={colors.neutral[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)}>
                      <Icon
                        name={showNewPassword ? 'eye-off' : 'eye'}
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
                  label="Confirm New Password"
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
          </Card>

          <Button
            title="Change Password"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading || isSubmitting}
            style={styles.submitButton}
            icon={<Icon name="check" size={20} color="#FFFFFF" />}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  infoCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.info + '10',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.info,
    marginLeft: spacing[2],
  },
  infoList: {
    gap: spacing[2],
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  infoListItemText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  formCard: {
    marginBottom: spacing[4],
  },
  submitButton: {
    marginTop: spacing[2],
  },
});
