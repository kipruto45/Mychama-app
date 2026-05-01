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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BrandLogo from '@/components/branding/BrandLogo';
import { Button } from '@/components/ui/Button';
import { AuthStackParamList, MainStackParamList } from '@/navigation/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type OnboardingSuccessNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OnboardingSuccess'
>;
type OnboardingSuccessRouteProp = RouteProp<AuthStackParamList, 'OnboardingSuccess'>;

export const OnboardingSuccessScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingSuccessNavigationProp>();
  const route = useRoute<OnboardingSuccessRouteProp>();
  const insets = useSafeAreaInsets();

  const { type, chamaName } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isCreated = type === 'created';

  const handleContinue = () => {
    const root = navigation.getParent() || navigation;
    (root as any).navigate('MainTabs');
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Icon
            name={isCreated ? 'party-popper' : 'account-check'}
            size={48}
            color={colors.light.background}
          />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isCreated ? 'Chama Created!' : 'You\'re In!'}
            </Text>
            <Text style={styles.subtitle}>
              {isCreated
                ? `Your chama "${chamaName || 'New Chama'}" has been created successfully. You are now the admin.`
                : `You have joined ${chamaName || 'the chama'} successfully.`}
            </Text>
          </View>

          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>What's next?</Text>
            
            {isCreated ? (
              <>
                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Invite Members</Text>
                    <Text style={styles.stepDescription}>
                      Share the invite link with members you want in your chama.
                    </Text>
                  </View>
                </View>
                
                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Set Up Contributions</Text>
                    <Text style={styles.stepDescription}>
                      Configure your contribution schedule and amounts.
                    </Text>
                  </View>
                </View>

                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Hold First Meeting</Text>
                    <Text style={styles.stepDescription}>
                      Schedule your first chama meeting to get started.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>View Dashboard</Text>
                    <Text style={styles.stepDescription}>
                      See your chama's overview and activity.
                    </Text>
                  </View>
                </View>

                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Make Contributions</Text>
                    <Text style={styles.stepDescription}>
                      Track and manage your contributions when due.
                    </Text>
                  </View>
                </View>

                <View style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Stay Updated</Text>
                    <Text style={styles.stepDescription}>
                      Get notified about meetings and important updates.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
          <Button
            title={isCreated ? 'Go to Dashboard' : 'Enter Chama'}
            onPress={handleContinue}
            size="lg"
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  nextStepsCard: {
    width: '100%',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  nextStepsTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing[2],
  },
  continueButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    letterSpacing: 0.3,
  },
});

export default OnboardingSuccessScreen;