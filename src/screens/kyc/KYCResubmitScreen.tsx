import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { kycService } from '@/services/kycService';
import { useKYCFlow } from './KYCFlowContext';
import { getUserMessage } from '@/utils/userMessages';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCResubmit'>;

export function KYCResubmitScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { draft, setKycId, setLastRecord } = useKYCFlow();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('Please review the reason and resubmit.');
  const [note, setNote] = useState('');
  const [retryAllowed, setRetryAllowed] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await kycService.getStatus();
        if (!mounted) return;
        const record = res.data?.record || null;
        setLastRecord(record);
        const kycId = String((record as any)?.id || '').trim();
        if (kycId) setKycId(kycId);
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
  }, [setKycId, setLastRecord]);

  const submitAgain = async () => {
    if (!retryAllowed) {
      Alert.alert('Compliance review', 'Your account is under compliance review.');
      navigation.navigate('KYCStatus');
      return;
    }
    if (!draft.kycId) {
      Alert.alert('Session missing', 'Please restart KYC verification.');
      navigation.navigate('KYCLanding');
      return;
    }

    setSubmitting(true);
    try {
      await kycService.resubmit({ kyc_id: draft.kycId, correction_note: note.trim() || undefined });
      navigation.navigate('KYCProcessing', { kycId: draft.kycId });
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.resubmit');
      Alert.alert('Resubmission failed', userMessage.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Resubmit KYC</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {loading ? 'Loading…' : reason}
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Update your documents</Text>
          <Text style={[styles.row, { color: colors.textSecondary }]}>
            Retake any photos that were unclear or didn’t match your details.
          </Text>
          <View style={{ height: spacing.md }} />
          <Button title="Retake ID photos" onPress={() => navigation.navigate('KYCCaptureIDFront')} />
          <View style={{ height: spacing.sm }} />
          <Button title="Retake selfie" onPress={() => navigation.navigate('KYCLivenessSelfie')} />
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input
            label="Notes (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Tell us what you corrected (e.g., retook clearer photos)."
          />
        </Card>

        <Button title={submitting ? 'Submitting…' : 'Submit again'} onPress={() => void submitAgain()} disabled={submitting || loading} />
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
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  row: { ...typography.body },
});

