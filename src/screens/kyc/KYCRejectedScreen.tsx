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

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCRejected'>;

export function KYCRejectedScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setLastRecord } = useKYCFlow();

  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('Your KYC was rejected. Please review the reason and resubmit.');
  const [retryAllowed, setRetryAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await kycService.getStatus();
        if (!mounted) return;
        const record = res.data?.record || null;
        setLastRecord(record);
        setRetryAllowed(Boolean((record as any)?.retry_allowed));
        const r = String((record as any)?.last_rejection_reason || (record as any)?.review_note || '').trim();
        if (r) setReason(r);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setLastRecord]);

  const cta = useMemo(() => {
    if (retryAllowed) {
      return { label: 'Resubmit', action: () => navigation.navigate('KYCResubmit') };
    }
    return { label: 'View status', action: () => navigation.navigate('KYCStatus') };
  }, [navigation, retryAllowed]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>KYC update</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {loading ? 'Loading…' : reason}
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.row, { color: colors.textSecondary }]}>Retry allowed: {retryAllowed ? 'Yes' : 'No'}</Text>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            If you retry, use clearer photos and make sure your details match your ID.
          </Text>
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
  row: { ...typography.body, marginBottom: spacing.sm },
  note: { ...typography.caption },
});

