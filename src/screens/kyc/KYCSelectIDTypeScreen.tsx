import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { kycService, type DocumentType } from '@/services/kycService';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';
import { getUserMessage } from '@/utils/userMessages';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCSelectIDType'>;

export function KYCSelectIDTypeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: themeColors } = useTheme();
  const { draft, setDraft, setKycId, setLastRecord } = useKYCFlow();

  const [documentType, setDocumentType] = useState<DocumentType>(draft.documentType);
  const [idNumber, setIdNumber] = useState(draft.idNumber);
  const [loading, setLoading] = useState(false);

  const options = useMemo(
    () =>
      [
        { value: 'national_id', label: 'National ID' },
        { value: 'passport', label: 'Passport' },
        { value: 'alien_id', label: 'Alien ID' },
        { value: 'military_id', label: 'Military ID' },
      ] as Array<{ value: DocumentType; label: string }>,
    []
  );

  const onNext = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Missing ID number', 'Please enter your ID number to continue.');
      return;
    }

    setLoading(true);
    try {
      let kycId = draft.kycId || null;
      if (!kycId) {
        const started = await kycService.startSession({
          onboarding_path: draft.onboardingPath,
          chama_id: draft.chamaId ?? null,
        });
        kycId = started.data?.record?.id || null;
        if (!kycId) {
          throw new Error('Unable to start KYC session.');
        }
        setKycId(kycId);
      }

      const saved = await kycService.saveDetails({
        kyc_id: kycId,
        legal_name: draft.legalName,
        date_of_birth: draft.dateOfBirth,
        gender: String(draft.gender || ''),
        nationality: draft.nationality || 'Kenyan',
        id_number: idNumber.trim(),
        document_type: documentType,
      });

      setLastRecord(saved.data?.record || null);
      setDraft((prev) => ({ ...prev, documentType, idNumber: idNumber.trim() }));

      navigation.navigate('KYCCaptureIDFront');
    } catch (error) {
      const userMessage = getUserMessage(error, 'kyc.details');
      Alert.alert('Unable to continue', userMessage.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>Select ID type</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Choose the document you’ll use for verification.
        </Text>

        <View style={styles.optionGrid}>
          {options.map((option) => {
            const selected = option.value === documentType;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setDocumentType(option.value)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? colors.primary[50] : themeColors.surface,
                    borderColor: selected ? colors.primary[600] : themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { color: themeColors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Input label="ID number" value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
        </Card>

        <Button title={loading ? 'Saving…' : 'Continue'} onPress={onNext} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { ...typography.h2 },
  subtitle: { ...typography.body },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, minWidth: '48%' as any },
  optionLabel: { ...typography.bodySemiBold },
  card: { padding: spacing.lg, borderWidth: 1 },
});
