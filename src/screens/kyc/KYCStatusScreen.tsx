import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { kycService } from '@/services/kycService';
import { useKYCFlow } from './KYCFlowContext';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCStatus'>;

export function KYCStatusScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setLastRecord } = useKYCFlow();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('pending');
  const [memberMessage, setMemberMessage] = useState<string>('We are verifying your information.');
  const [retryAllowed, setRetryAllowed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await kycService.getStatus();
        if (!mounted) return;
        const record = res.data?.record || null;
        setLastRecord(record);
        const st = String(record?.status || 'not_started').toLowerCase();
        setStatus(st);
        setRetryAllowed(Boolean((record as any)?.retry_allowed));

        const reason = String((record as any)?.last_rejection_reason || (record as any)?.review_note || '').trim();
        if (st === 'approved') {
          setMemberMessage('Your KYC has been approved. Full access is now unlocked.');
        } else if (st === 'under_review') {
          setMemberMessage('Your account is under compliance review.');
        } else if (st === 'frozen') {
          setMemberMessage('Your account has been restricted due to a compliance check.');
        } else if (st === 'resubmit_required' || st === 'rejected') {
          setMemberMessage(reason || 'Your KYC was rejected. Please review the reason and resubmit.');
        } else if (st === 'queued' || st === 'processing' || st === 'pending') {
          setMemberMessage('We are verifying your information.');
        } else {
          setMemberMessage('To unlock financial features, complete KYC verification.');
        }
      } catch {
        setMemberMessage('Unable to load KYC status right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setLastRecord]);

  const cta = useMemo(() => {
    if (status === 'approved') {
      return { label: 'Done', action: () => navigation.goBack() };
    }
    if (status === 'frozen') {
      return { label: 'View details', action: () => navigation.navigate('AccountFrozen') };
    }
    if (status === 'resubmit_required' || status === 'rejected') {
      return { label: 'Review & resubmit', action: () => navigation.navigate('KYCRejected') };
    }
    return { label: 'Refresh', action: () => navigation.replace('KYCStatus') };
  }, [navigation, status]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>KYC Status</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {loading ? 'Checking…' : memberMessage}
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.row, { color: colors.textSecondary }]}>Status: {status.replace(/_/g, ' ')}</Text>
          {retryAllowed && (status === 'resubmit_required' || status === 'rejected') ? (
            <Text style={[styles.row, { color: colors.textSecondary }]}>Retry allowed: Yes</Text>
          ) : null}
        </Card>

        <Button title={cta.label} onPress={cta.action} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { ...typography.h2 },
  subtitle: { ...typography.body },
  card: { padding: spacing.lg, borderWidth: 1 },
  row: { ...typography.body, marginBottom: spacing.xs },
});
