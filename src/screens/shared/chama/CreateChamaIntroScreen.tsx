import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BrandLogo from '@/components/branding/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type CreateChamaIntroNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'CreateChamaIntro'
>;

interface SetupStep {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 1,
    icon: 'text-box-outline',
    title: 'Basic Details',
    description: 'Name, description, and category',
  },
  {
    id: 2,
    icon: 'cash-multiple',
    title: 'Contributions',
    description: 'Amount, frequency, and due dates',
  },
  {
    id: 3,
    icon: 'scale-balance',
    title: 'Rules & Finance',
    description: 'Loans, fines, and obligations',
  },
  {
    id: 4,
    icon: 'calendar-clock',
    title: 'Meetings',
    description: 'Frequency and preferences',
  },
  {
    id: 5,
    icon: 'account-multiple-plus',
    title: 'Invite Members',
    description: 'Add first members (optional)',
  },
  {
    id: 6,
    icon: 'check-circle-outline',
    title: 'Review & Create',
    description: 'Confirm and create your chama',
  },
];

export const CreateChamaIntroScreen: React.FC = () => {
  const navigation = useNavigation<CreateChamaIntroNavigationProp>();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    navigation.navigate('CreateChama');
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconBadge}>
            <Icon name="home-group" size={40} color={colors.primary[600]} />
          </View>

          <Text style={styles.title}>Set Up Your Chama</Text>
          <Text style={styles.subtitle}>
            Let's configure your chama step by step. You can always adjust these settings later from the settings page.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Card style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>What's included</Text>
            
            {SETUP_STEPS.map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.id}</Text>
                </View>
                <View style={styles.stepIcon}>
                  <Icon name={step.icon as any} size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Button
            title="Get Started"
            onPress={handleStart}
            size="lg"
            style={styles.startButton}
            icon={<Icon name="arrow-right" size={20} color={colors.light.background} />}
          />

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Go back</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <Icon name="shield-check" size={14} color={colors.success} />
            <Text style={styles.trustText}>Your data is secure</Text>
          </View>
        </View>
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
    paddingHorizontal: spacing[4],
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  stepsCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  stepsTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  stepNumberText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  stepIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing[2],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  stepDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  startButton: {
    marginBottom: spacing[3],
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  skipButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    marginLeft: spacing[1],
  },
});

export default CreateChamaIntroScreen;
