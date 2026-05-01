import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { kycService } from '@/services/kycService';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCLanding'>;

export function KYCLandingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { reset } = useKYCFlow();

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [ctaLabel, setCtaLabel] = useState<string>('Start verification');
  const [ctaRoute, setCtaRoute] = useState<keyof KYCFlowStackParamList>('KYCPersonalDetails');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await kycService.getStatus();
        if (!mounted) return;

        const record = res.data?.record || null;
        const access = res.data?.access;

        if (access?.account_frozen) {
          setStatusMessage('Your account is currently restricted due to a compliance check.');
          setCtaLabel('View details');
          setCtaRoute('AccountFrozen');
          return;
        }

        const recordStatus = String(record?.status || '').toLowerCase();
        if (recordStatus === 'approved') {
          setStatusMessage('Your identity is verified. Full access is unlocked.');
          setCtaLabel('View status');
          setCtaRoute('KYCStatus');
          return;
        }

        if (recordStatus === 'under_review' || recordStatus === 'processing' || recordStatus === 'queued' || recordStatus === 'pending') {
          setStatusMessage('We are verifying your information.');
          setCtaLabel('View status');
          setCtaRoute('KYCStatus');
          return;
        }

        if (recordStatus === 'resubmit_required' || recordStatus === 'rejected') {
          setStatusMessage('Your KYC needs attention. Please review the reason and resubmit.');
          setCtaLabel('Review & resubmit');
          setCtaRoute('KYCRejected');
          return;
        }

        setStatusMessage('To unlock financial features, we need to verify your identity.');
      } catch {
        setStatusMessage('To unlock financial features, we need to verify your identity.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const checklist = useMemo(
    () => [
      'A clear photo of your ID (front and back)',
      'A live selfie in good lighting',
      'A few minutes of uninterrupted time',
    ],
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>KYC Verification</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {loading ? 'Checking your status…' : statusMessage}
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>What you’ll need</Text>
          {checklist.map((item) => (
            <Text key={item} style={[styles.bullet, { color: colors.textSecondary }]}>
              • {item}
            </Text>
          ))}
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            You can browse the app after phone verification, but financial actions stay locked until KYC is approved.
          </Text>
        </Card>

        <Button
          title={ctaLabel}
          onPress={() => {
            reset();
            navigation.navigate(ctaRoute as any);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  title: { ...typography.h2 },
  subtitle: { ...typography.body },
  card: { padding: spacing.lg, borderWidth: 1 },
  cardTitle: { ...typography.h3, marginBottom: spacing.md },
  bullet: { ...typography.body, marginBottom: spacing.xs },
  note: { ...typography.caption, marginTop: spacing.md },
});

