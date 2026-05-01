import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { kycService } from '@/services/kycService';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';
import { authService } from '@/services/authService';
import { useAuth } from '@/providers/AuthProvider';

type ScreenRoute = RouteProp<KYCFlowStackParamList, 'KYCProcessing'>;
type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCProcessing'>;

export function KYCProcessingScreen() {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<Nav>();
  const { colors: themeColors } = useTheme();
  const { setLastRecord } = useKYCFlow();
  const { updateUser } = useAuth();

  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState('We are verifying your information.');

  const kycId = route.params?.kycId;

  const isFinalStatus = (status: string) =>
    ['approved', 'rejected', 'resubmit_required', 'under_review', 'frozen'].includes(status);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (mounted) setTick((t) => t + 1);
    }, 4500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await kycService.getStatus();
        if (cancelled) return;
        const record = res.data?.record || null;
        if (record) setLastRecord(record);
        const status = String(record?.status || '').toLowerCase();

        if (!status || status === 'draft') {
          setMessage('Preparing your submission…');
          return;
        }

        if (status === 'queued' || status === 'processing' || status === 'pending') {
          setMessage('We are verifying your information.');
          return;
        }

        if (isFinalStatus(status)) {
          // Refresh auth profile to pick up tier/unlock flags.
          try {
            const profile = await authService.getProfile();
            updateUser(profile);
          } catch {}

          if (status === 'approved') {
            navigation.reset({ index: 0, routes: [{ name: 'KYCStatus' }] });
            return;
          }
          if (status === 'frozen') {
            navigation.reset({ index: 0, routes: [{ name: 'AccountFrozen' }] });
            return;
          }
          if (status === 'under_review') {
            navigation.reset({ index: 0, routes: [{ name: 'KYCStatus' }] });
            return;
          }
          navigation.reset({ index: 0, routes: [{ name: 'KYCRejected' }] });
        }
      } catch {
        // Keep polling; do not block.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick, kycId, navigation, setLastRecord, updateUser]);

  const subtitle = useMemo(
    () => 'This usually takes a short moment. You can leave this screen and check status later from KYC.',
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.title, { color: themeColors.text }]}>{message}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { ...typography.h3, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
});
