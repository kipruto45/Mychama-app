import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';
import { useKYCFlow } from './KYCFlowContext';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'KYCPersonalDetails'>;

export function KYCPersonalDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { draft, setDraft } = useKYCFlow();

  const [legalName, setLegalName] = useState(draft.legalName);
  const [dateOfBirth, setDateOfBirth] = useState(draft.dateOfBirth);
  const [gender, setGender] = useState(draft.gender);
  const [nationality, setNationality] = useState(draft.nationality);

  const onNext = () => {
    if (!legalName.trim() || !dateOfBirth.trim() || !gender.trim() || !nationality.trim()) {
      Alert.alert('Missing details', 'Please fill in all personal details to continue.');
      return;
    }

    setDraft((prev) => ({
      ...prev,
      legalName: legalName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender.trim(),
      nationality: nationality.trim(),
    }));
    navigation.navigate('KYCSelectIDType');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Personal details</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use your legal details exactly as they appear on your identification document.
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input label="Full legal name" value={legalName} onChangeText={setLegalName} autoCapitalize="words" />
          <View style={{ height: spacing.md }} />
          <DatePickerInput
            label="Date of birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="Select date of birth"
          />
          <View style={{ height: spacing.md }} />
          <GenderSelect
            label="Gender"
            value={gender}
            onChangeText={setGender}
            placeholder="Select gender"
          />
          <View style={{ height: spacing.md }} />
          <Input label="Nationality" value={nationality} onChangeText={setNationality} placeholder="Kenyan" />
        </Card>

        <Button title="Continue" onPress={onNext} />
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
});
