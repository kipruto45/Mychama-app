import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';

type SessionExpiredScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SessionExpired'
>;
type SessionExpiredScreenRouteProp = RouteProp<AuthStackParamList, 'SessionExpired'>;

export const SessionExpiredScreen: React.FC = () => {
  const navigation = useNavigation<SessionExpiredScreenNavigationProp>();
  const route = useRoute<SessionExpiredScreenRouteProp>();
  const { clearSessionExpired } = useAuth();

  const message =
    route.params?.message || 'Your session expired. Please sign in again to keep managing your chama.';

  const handleContinue = () => {
    clearSessionExpired();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconShell}>
          <Icon name="shield-alert-outline" size={34} color={colors.warning} />
        </View>
        <Text style={styles.title}>Session Expired</Text>
        <Text style={styles.message}>{message}</Text>
        <Button title="Sign In Again" onPress={handleContinue} style={styles.button} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    padding: spacing[5],
  },
  card: {
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.light.surface,
    padding: spacing[6],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  iconShell: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '14',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  button: {
    marginTop: spacing[5],
  },
});
