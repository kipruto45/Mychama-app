import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useRoute } from '@react-navigation/native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { ProfileUpdateFormData, profileUpdateSchema } from '@/utils/validation';

type BasicProfileSetupRouteProp = RouteProp<MainStackParamList, 'BasicProfileSetup'>;

const PROFILE_CHECKLIST = [
  'Confirm your display name',
  'Add an email for updates and recovery',
  'Review where you want to go next',
];

export const BasicProfileSetupScreen: React.FC = () => {
  const route = useRoute<BasicProfileSetupRouteProp>();
  const { user, updateProfile, isLoading } = useAuth();
  const { activeChamaId } = useActiveChama();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (values: ProfileUpdateFormData) => {
    try {
      await updateProfile({
        full_name: values.full_name.trim(),
        email: values.email?.trim() || undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not save your profile right now.';
      Alert.alert('Profile setup not complete', message);
    }
  };

  const sourceLabel =
    route.params?.source === 'join'
      ? 'Finish your member setup'
      : route.params?.source === 'settings'
      ? 'Update your basic profile'
      : 'Finish setting up your account';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Avatar
              name={user?.full_name || 'Member'}
              size="xl"
              imageUri={user?.avatar || undefined}
            />
            <Text style={styles.eyebrow}>Basic Profile Setup</Text>
            <Text style={styles.title}>{sourceLabel}</Text>
            <Text style={styles.subtitle}>
              A complete profile makes invites, approvals, and communication feel more personal
              and professional across your chama.
            </Text>
          </View>

          <Card style={styles.checklistCard}>
            {PROFILE_CHECKLIST.map((item) => (
              <View key={item} style={styles.checklistRow}>
                <Icon name="check-circle-outline" size={18} color={colors.primary[700]} />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </Card>

          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  error={errors.full_name?.message}
                  leftIcon={<Icon name="account-outline" size={20} color={colors.neutral[400]} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={value || ''}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  leftIcon={<Icon name="email-outline" size={20} color={colors.neutral[400]} />}
                />
              )}
            />

            <View style={styles.phoneBlock}>
              <Text style={styles.phoneLabel}>Verified phone number</Text>
              <View style={styles.phonePill}>
                <Icon name="phone-check-outline" size={18} color={colors.success} />
                <Text style={styles.phoneValue}>{user?.phone || 'Not available'}</Text>
              </View>
            </View>
          </Card>

          <Button
            title={activeChamaId ? 'Continue to Dashboard' : 'Continue'}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading || isSubmitting}
            style={styles.primaryButton}
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
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  eyebrow: {
    marginTop: spacing[3],
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  checklistCard: {
    marginBottom: spacing[4],
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  checklistText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  formCard: {
    marginBottom: spacing[4],
  },
  phoneBlock: {
    marginTop: spacing[1],
  },
  phoneLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
    backgroundColor: colors.success + '10',
  },
  phoneValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
  },
  primaryButton: {
    marginBottom: spacing[3],
  },
});
