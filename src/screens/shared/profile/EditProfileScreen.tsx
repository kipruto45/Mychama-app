import React from 'react';
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
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/providers/AuthProvider';
import { MainStackParamList } from '@/navigation/types';
import { ProfileUpdateFormData, profileUpdateSchema } from '@/utils/validation';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, updateProfile, isLoading } = useAuth();

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
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Failed to update profile.')
          : 'Failed to update profile.';

      Alert.alert('Update Failed', message);
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
            <Text style={styles.title}>Edit Profile</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.avatarSection}>
            <Avatar
              name={user?.full_name || 'User'}
              size="xl"
              imageUri={user?.avatar || undefined}
            />
            <View style={styles.avatarCaption}>
              <Icon name="camera-outline" size={16} color={colors.neutral[500]} />
              <Text style={styles.avatarCaptionText}>
                Photo upload will appear here when profile photo updates are available.
              </Text>
            </View>
          </View>

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
                  leftIcon={<Icon name="account" size={20} color={colors.neutral[400]} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email (Optional)"
                  placeholder="Enter your email address"
                  value={value || ''}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  leftIcon={<Icon name="email" size={20} color={colors.neutral[400]} />}
                />
              )}
            />

            <View style={styles.phoneContainer}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <View style={styles.phoneDisplay}>
                <Icon name="phone" size={20} color={colors.neutral[400]} />
                <Text style={styles.phoneNumber}>{user?.phone || 'Unavailable'}</Text>
                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={14} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.phoneNote}>
                Phone number changes are not available here yet.
              </Text>
            </View>
          </Card>

          <Button
            title="Save Changes"
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  avatarCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
  },
  avatarCaptionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing[4],
  },
  phoneContainer: {
    marginBottom: spacing[4],
  },
  phoneLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  phoneNumber: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    marginLeft: spacing[1],
  },
  phoneNote: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  submitButton: {
    marginTop: spacing[2],
  },
});
