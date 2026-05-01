import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

export function ReKYCRequiredBanner() {
  const { colors: themeColors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  if (!user) return null;
  if (user.account_frozen) return null;

  const kycStatus = String(user.kyc_status || '').toLowerCase();
  const financialUnlocked = Boolean(user.financial_access_enabled);

  const shouldShow =
    Boolean(user.otp_verified) &&
    (!financialUnlocked || kycStatus === 'rekyc_required' || kycStatus === 'rejected' || kycStatus === 'not_started');

  if (!shouldShow) return null;

  const title =
    kycStatus === 'rekyc_required'
      ? 'Re-verification required'
      : financialUnlocked
      ? 'KYC update required'
      : 'KYC required';

  const message =
    kycStatus === 'rekyc_required'
      ? 'Please complete KYC again to keep full access.'
      : 'Complete KYC verification to unlock financial features.';

  return (
    <TouchableOpacity onPress={() => navigation.navigate('KYC')} activeOpacity={0.9}>
      <View style={[styles.banner, { backgroundColor: colors.primary[50], borderColor: colors.primary[600] }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.message, { color: themeColors.textSecondary }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <Text style={[styles.cta, { color: colors.primary[700] }]}>Open</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  title: { ...typography.bodySemiBold },
  message: { ...typography.caption },
  cta: { ...typography.bodySemiBold },
});
