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

type CreateChamaSuccessNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'CreateChamaSuccess'
>;
type CreateChamaSuccessRouteProp = RouteProp<MainStackParamList, 'CreateChamaSuccess'>;

const buildNextSteps = (chamaId: string) => [
  {
    icon: 'account-multiple-plus-outline',
    title: 'Invite members',
    description: 'Share invite links and bring in the first members of your chama.',
    action: 'InviteMember' as const,
    params: { chamaId },
  },
  {
    icon: 'calendar-plus',
    title: 'Schedule the first meeting',
    description: 'Set your opening meeting, agenda, and attendance expectations.',
    action: 'CreateMeeting' as const,
    params: { chamaId },
  },
  {
    icon: 'cog-outline',
    title: 'Review chama settings',
    description: 'Confirm contributions, approvals, notifications, and group rules.',
    action: 'ChamaSettings' as const,
    params: { chamaId },
  },
  {
    icon: 'view-dashboard-outline',
    title: 'Open the dashboard',
    description: 'Start operating from the main overview and role-based admin tools.',
    action: 'MainTabs' as const,
    params: undefined,
  },
];

export const CreateChamaSuccessScreen: React.FC = () => {
  const navigation = useNavigation<CreateChamaSuccessNavigationProp>();
  const route = useRoute<CreateChamaSuccessRouteProp>();
  const {
    chamaId,
    chamaName,
    creatorRole,
    invitesRequested = 0,
    invitesSent = 0,
    inviteFailures = 0,
  } = route.params;
  const nextSteps = buildNextSteps(chamaId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="check-decagram-outline" size={42} color={colors.primary[700]} />
          </View>
          <Text style={styles.heroTitle}>{chamaName || 'Your chama'} is ready</Text>
          <Text style={styles.heroSubtitle}>
            The chama has been created successfully and your workspace is active. You are now
            the {creatorRole || 'Chama Admin'} and this chama is your active context.
          </Text>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Launch summary</Text>
          <Text style={styles.sectionSubtitle}>
            Governance, contributions, finance defaults, and your admin membership are already in place.
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{creatorRole || 'Chama Admin'}</Text>
              <Text style={styles.summaryStatLabel}>Active role</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{invitesSent}</Text>
              <Text style={styles.summaryStatLabel}>Invites sent</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{invitesRequested - invitesSent}</Text>
              <Text style={styles.summaryStatLabel}>Pending retry</Text>
            </View>
          </View>
          {inviteFailures > 0 ? (
            <View style={styles.warningPanel}>
              <Icon name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.warningText}>
                {inviteFailures} invite{inviteFailures === 1 ? '' : 's'} could not be sent during setup.
                You can retry them later from the Invite Members screen.
              </Text>
            </View>
          ) : null}
        </Card>

        {nextSteps.map((step) => (
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
          style={styles.primaryAction}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ChamaDetail', { chamaId })}
        >
          <Icon name="office-building-outline" size={20} color={colors.light.background} />
          <Text style={styles.primaryActionText}>Open Chama Workspace</Text>
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
    paddingTop: spacing[4],
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
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    marginBottom: spacing[4],
  },
  summaryStats: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  summaryStat: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    padding: spacing[3],
  },
  summaryStatValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
    marginBottom: spacing[1],
  },
  summaryStatLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  warningPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.warning + '12',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
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
  primaryAction: {
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  primaryActionText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default CreateChamaSuccessScreen;
