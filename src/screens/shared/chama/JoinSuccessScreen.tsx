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
import { colors, spacing, typography } from '@/theme';

type JoinSuccessNavigationProp = NativeStackNavigationProp<MainStackParamList, 'JoinSuccess'>;
type JoinSuccessRouteProp = RouteProp<MainStackParamList, 'JoinSuccess'>;

const NEXT_STEPS = [
  {
    icon: 'account-check-outline',
    title: 'Complete your profile',
    description: 'Add your details so other members can recognize you easily.',
    route: 'BasicProfileSetup',
  },
  {
    icon: 'cash-plus',
    title: 'Make your first contribution',
    description: 'Stay on track early by making your first payment on time.',
    route: 'MemberContributions',
  },
  {
    icon: 'calendar-clock-outline',
    title: 'See the next meeting',
    description: 'Check what is coming up and plan to attend the next session.',
    route: 'Meetings',
  },
  {
    icon: 'book-open-page-variant-outline',
    title: 'Read chama rules',
    description: 'Understand how this chama runs, contributes, votes, and lends.',
    route: 'ChamaDetail',
  },
];

export const JoinSuccessScreen: React.FC = () => {
  const navigation = useNavigation<JoinSuccessNavigationProp>();
  const route = useRoute<JoinSuccessRouteProp>();
  const { chamaId, chamaName, role } = route.params;

  const handleGoToDashboard = () => {
    navigation.navigate('MainTabs');
  };

  const handlePostJoinSetup = () => {
    navigation.navigate('PostJoinSetup', {
      chamaId,
      chamaName,
      role,
    });
  };

  const handleViewChama = () => {
    navigation.navigate('ChamaDetail', { chamaId });
  };

  const handleCompleteProfile = () => {
    navigation.navigate('BasicProfileSetup', { source: 'join' });
  };

  const handleStepPress = (targetRoute: string) => {
    switch (targetRoute) {
      case 'BasicProfileSetup':
        navigation.navigate('BasicProfileSetup', { source: 'join' });
        break;
      case 'MemberContributions':
        navigation.navigate('MemberContributions', { chamaId });
        break;
      case 'Meetings':
        navigation.navigate('Meetings');
        break;
      case 'ChamaDetail':
      default:
        navigation.navigate('ChamaDetail', { chamaId });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="party-popper" size={42} color={colors.primary[700]} />
          </View>
          <Text style={styles.heroTitle}>You&apos;ve joined {chamaName || 'your chama'}</Text>
          <Text style={styles.heroSubtitle}>
            Your membership is ready. You can now explore the chama, prepare your profile, and take your first actions.
          </Text>
          {role ? (
            <View style={styles.roleChip}>
              <Icon name="shield-account-outline" size={16} color={colors.primary[700]} />
              <Text style={styles.roleChipText}>Role: {role}</Text>
            </View>
          ) : null}
        </View>

        <Card style={styles.actionCard}>
          <Text style={styles.sectionTitle}>What would you like to do next?</Text>
          <View style={styles.primaryActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handlePostJoinSetup} activeOpacity={0.9}>
              <Icon name="rocket-launch-outline" size={20} color={colors.light.background} />
              <Text style={styles.primaryButtonText}>Start Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoToDashboard} activeOpacity={0.9}>
              <Icon name="view-dashboard-outline" size={20} color={colors.primary[700]} />
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} onPress={handleViewChama} activeOpacity={0.9}>
              <Icon name="account-group-outline" size={20} color={colors.primary[700]} />
              <Text style={styles.secondaryButtonText}>View Chama</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} onPress={handleCompleteProfile} activeOpacity={0.9}>
              <Icon name="account-edit-outline" size={20} color={colors.neutral[700]} />
              <Text style={styles.ghostButtonText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Helpful next steps</Text>
          <Text style={styles.sectionSubtitle}>Start with any of these and we&apos;ll keep your progress moving.</Text>
        </View>

        {NEXT_STEPS.map((step) => (
          <TouchableOpacity
            key={step.title}
            style={styles.stepCard}
            activeOpacity={0.88}
            onPress={() => handleStepPress(step.route)}
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
    paddingBottom: spacing[6],
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
    maxWidth: 560,
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
  actionCard: {
    marginBottom: spacing[5],
  },
  primaryActions: {
    gap: spacing[3],
    marginTop: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 18,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  primaryButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.primary[50],
    borderRadius: 18,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  secondaryButtonText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 18,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  ghostButtonText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  sectionHeader: {
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  stepCard: {
    backgroundColor: colors.light.card,
    borderRadius: 20,
    padding: spacing[4],
    marginBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.neutral[500],
    lineHeight: 20,
  },
});
