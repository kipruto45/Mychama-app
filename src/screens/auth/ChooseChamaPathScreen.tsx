import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BrandLogo from '@/components/branding/BrandLogo';
import { Card } from '@/components/ui/Card';
import { AuthStackParamList } from '@/navigation/types';
import { useOnboardingStore } from '@/store/onboardingStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

type ChooseChamaPathNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ChooseChamaPath'
>;

interface PathOption {
  id: 'create' | 'join';
  icon: string;
  title: string;
  description: string;
  features: string[];
  accentColor: string;
  bgColor: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: 'create',
    icon: 'plus-circle-outline',
    title: 'Create a Chama',
    description: 'Start your own chama and invite members to join you.',
    features: [
      'Full control over settings',
      'Invite and manage members',
      'Set contribution schedules',
      'Assign member roles',
    ],
    accentColor: colors.primary[600],
    bgColor: colors.primary[50],
  },
  {
    id: 'join',
    icon: 'account-group-outline',
    title: 'Join a Chama',
    description: 'Join an existing chama using an invite link or code.',
    features: [
      'Enter invite link or code',
      'Review chama details',
      'Confirm your membership',
      'Access member dashboard',
    ],
    accentColor: colors.accent[600],
    bgColor: colors.accent[50],
  },
];

export const ChooseChamaPathScreen: React.FC = () => {
  const navigation = useNavigation<ChooseChamaPathNavigationProp>();
  const { path, selectPath } = useOnboardingStore();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.timing(card1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(card2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSelectPath = async (selectedPath: 'create' | 'join') => {
    selectPath(selectedPath);

    if (selectedPath === 'create') {
      const root = navigation.getParent() || navigation;
      (root as any).navigate('CreateChamaIntro');
    } else {
      navigation.navigate('JoinChamaEntry');
    }
  };

  const renderPathCard = (option: PathOption, index: number) => {
    const anim = index === 0 ? card1Anim : card2Anim;
    const isSelected = path === option.id;

    return (
      <Animated.View
        key={option.id}
        style={[
          styles.cardWrapper,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleSelectPath(option.id)}
          activeOpacity={0.9}
          style={styles.cardTouchable}
        >
          <Card
            style={StyleSheet.flatten([
              styles.pathCard,
              { borderColor: isSelected ? option.accentColor : colors.neutral[200] },
            ])}
          >
            <View style={[styles.cardHeader, { backgroundColor: option.bgColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: option.accentColor }]}>
                <Icon name={option.icon as any} size={24} color={colors.light.background} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {option.features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Icon
                    name="check-circle"
                    size={16}
                    color={option.accentColor}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: option.accentColor }]}>
                {option.id === 'create' ? 'Get Started' : 'Use Code or Link'}
              </Text>
              <Icon
                name="arrow-right"
                size={18}
                color={option.accentColor}
              />
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <BrandLogo size={36} />
          </View>

          <Text style={styles.title}>How do you want to start?</Text>
          <Text style={styles.subtitle}>
            Choose to create your own chama or join an existing one with friends, family, or community members.
          </Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {PATH_OPTIONS.map((option, index) => renderPathCard(option, index))}
        </View>

        <View style={styles.footer}>
          <View style={styles.trustIndicator}>
            <Icon name="shield-check" size={14} color={colors.success} />
            <Text style={styles.trustText}>
              Your data is secure and private
            </Text>
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
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: spacing[3],
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[4],
  },
  cardWrapper: {
    marginBottom: spacing[1],
  },
  cardTouchable: {
    width: '100%',
  },
  pathCard: {
    padding: 0,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  featuresList: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginLeft: spacing[2],
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cardActionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginRight: spacing[1],
  },
  footer: {
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    alignItems: 'center',
  },
  trustIndicator: {
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

export default ChooseChamaPathScreen;
