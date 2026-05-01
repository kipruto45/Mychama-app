import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type PostJoinSetupNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PostJoinSetup'>;
type PostJoinSetupRouteProp = RouteProp<MainStackParamList, 'PostJoinSetup'>;

const buildSetupSteps = (chamaId: string) => [
  {
    icon: 'account-edit-outline',
    title: 'Complete your profile',
    description: 'Add your details so members know who joined and how to reach you.',
    action: 'BasicProfileSetup' as const,
    params: { source: 'join' as const },
  },
  {
    icon: 'cash-plus',
    title: 'Make your first contribution',
    description: 'Start strong by clearing any dues, penalties, or required first payments.',
    action: 'MemberContributions' as const,
    params: { chamaId },
  },
  {
    icon: 'calendar-check-outline',
    title: 'See the next meeting',
    description: 'Check attendance expectations, agenda, and upcoming group activities.',
    action: 'Meetings' as const,
    params: undefined,
  },
  {
    icon: 'book-open-page-variant-outline',
    title: 'Read chama rules',
    description: 'Understand how contributions, voting, approvals, and loans work in this group.',
    action: 'ChamaDetail' as const,
    params: { chamaId },
  },
];

export const PostJoinSetupScreen: React.FC = () => {
  const navigation = useNavigation<PostJoinSetupNavigationProp>();
  const route = useRoute<PostJoinSetupRouteProp>();
  const { chamaId, chamaName, role } = route.params;
  const steps = buildSetupSteps(chamaId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="rocket-launch-outline" size={40} color={colors.primary[700]} />
          </View>
          <Text style={styles.title}>Welcome to {chamaName || 'your chama'}</Text>
          <Text style={styles.subtitle}>
            You have joined successfully. Here are the best next steps to settle in quickly and
            start participating with confidence.
          </Text>
          {role ? (
            <View style={styles.roleChip}>
              <Icon name="shield-account-outline" size={16} color={colors.primary[700]} />
              <Text style={styles.roleChipText}>You joined as {role}</Text>
            </View>
          ) : null}
        </View>

        <Card style={styles.primaryCard}>
          <Text style={styles.primaryTitle}>Your next actions</Text>
          <Text style={styles.primarySubtitle}>
            We recommend starting with profile setup, then reviewing the chama and contribution expectations.
          </Text>
        </Card>

        {steps.map((step) => (
          <TouchableOpacity
            key={step.title}
            style={styles.stepCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(step.action as any, step.params as any)}
          >
            <View style={styles.stepIcon}>
              <Icon name={step.icon as any} size={22} color={colors.primary[700]} />
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.neutral[400]} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.dashboardButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Icon name="view-dashboard-outline" size={20} color={colors.light.background} />
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  heroBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.primary[50],
  },
  roleChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  primaryCard: {
    marginBottom: spacing[4],
  },
  primaryTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  primarySubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: colors.light.surface,
    marginBottom: spacing[3],
  },
  stepIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginRight: spacing[3],
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  dashboardButton: {
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  dashboardButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
});
