import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { KYCFlowStackParamList } from './KYCFlowNavigator';

type Nav = NativeStackNavigationProp<KYCFlowStackParamList, 'AccountFrozen'>;

export function AccountFrozenScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Account restricted</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your account has been restricted due to a compliance check. Financial features are temporarily unavailable.
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.row, { color: colors.textSecondary }]}>
            If you believe this is a mistake, contact support from the Help & Support section.
          </Text>
          <Text style={[styles.row, { color: colors.textSecondary }]}>
            You can still access non-financial parts of the app while we review your account.
          </Text>
        </Card>

        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
  card: { padding: spacing.lg, borderWidth: 1 },
  row: { ...typography.body, marginBottom: spacing.sm },
});

