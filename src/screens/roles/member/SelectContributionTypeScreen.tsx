import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MainStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

type SelectContributionTypeNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'SelectContributionType'
>;
type SelectContributionTypeRouteProp = RouteProp<MainStackParamList, 'SelectContributionType'>;

export const SelectContributionTypeScreen: React.FC = () => {
  const navigation = useNavigation<SelectContributionTypeNavigationProp>();
  const route = useRoute<SelectContributionTypeRouteProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MemberContributions', {
        chamaId: route.params?.chamaId,
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [navigation, route.params?.chamaId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.title}>Opening contributions</Text>
        <Text style={styles.subtitle}>
          We’re taking you to your contribution overview so you can review what’s due first.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SelectContributionTypeScreen;
