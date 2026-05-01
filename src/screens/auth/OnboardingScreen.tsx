import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { AuthStackParamList } from '@/navigation/types';

type OnboardingNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  headline: string;
  description: string;
  icon: string;
  accentColor: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    headline: 'Welcome to MyChama',
    description: 'Manage your chama with confidence, clarity, and ease. Your group savings, simplified.',
    icon: 'shield-check',
    accentColor: colors.primary[500],
  },
  {
    id: 'savings',
    headline: 'Save and grow together',
    description: 'Track contributions, monitor savings goals, and watch your group wealth — all in one secure place.',
    icon: 'cash-multiple',
    accentColor: colors.primary[600],
  },
  {
    id: 'organize',
    headline: 'Stay organized',
    description: 'Manage meetings, records, loans, and key chama activities without the stress.',
    icon: 'calendar-check',
    accentColor: colors.accent[500],
  },
  {
    id: 'connect',
    headline: 'Built for connection',
    description: 'Keep members informed, decisions transparent, and your chama moving forward.',
    icon: 'account-group',
    accentColor: colors.info,
  },
];

const OnboardingCard: React.FC<{ slide: OnboardingSlide; index: number }> = ({ slide, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View
      style={[
        styles.slideContent,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.heroVisualContainer}>
        <Animated.View
          style={[
            styles.floatingOrb,
            {
              backgroundColor: slide.accentColor,
              transform: [{ translateY: floatY }],
            },
          ]}
        />
        
        <View style={[styles.visualCard, { borderColor: slide.accentColor + '30' }]}>
          <View style={[styles.visualHeader, { backgroundColor: slide.accentColor + '15' }]}>
            <Icon name={slide.icon as any} size={28} color={slide.accentColor} />
          </View>
          
          <View style={styles.visualContent}>
            {index === 0 && (
              <View style={styles.visualGrid}>
                <View style={[styles.gridDot, { backgroundColor: colors.primary[200] }]} />
                <View style={[styles.gridDot, { backgroundColor: colors.primary[300] }]} />
                <View style={[styles.gridDot, { backgroundColor: colors.primary[400] }]} />
                <View style={[styles.gridDot, { backgroundColor: colors.primary[500] }]} />
              </View>
            )}
            {index === 1 && (
              <View style={styles.savingsVisual}>
                <View style={styles.savingsBar}>
                  <View style={[styles.savingsFill, { width: '65%', backgroundColor: slide.accentColor }]} />
                </View>
                <Text style={styles.savingsLabel}>65% of goal</Text>
              </View>
            )}
            {index === 2 && (
              <View style={styles.meetingVisual}>
                <View style={[styles.meetingCard, { borderLeftColor: slide.accentColor }]}>
                  <Text style={styles.meetingTitle}>Monthly Meeting</Text>
                  <Text style={styles.meetingDate}>Sat, Apr 15 • 10:00 AM</Text>
                </View>
              </View>
            )}
            {index === 3 && (
              <View style={styles.membersVisual}>
                <View style={styles.memberRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.memberDot, { backgroundColor: i <= 3 ? colors.primary[500] : colors.neutral[200] }]} />
                  ))}
                </View>
                <Text style={styles.membersLabel}>12 active members</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.floatingPill, { backgroundColor: slide.accentColor }]}>
          <Icon name={slide.icon as any} size={14} color="#FFFFFF" />
          <Text style={styles.floatingPillText}>MyChama</Text>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.headline}>{slide.headline}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>
    </Animated.View>
  );
};

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    navigation.replace('Register', {});
  };

  const handleSignIn = () => {
    navigation.replace('Login');
  };

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <OnboardingCard slide={item} index={index} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && [
                  styles.indicatorActive,
                  { backgroundColor: colors.primary[500] },
                ],
                index !== currentIndex && styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex === ONBOARDING_SLIDES.length - 1 ? (
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              size="lg"
              style={styles.primaryButton}
            />
          ) : (
            <Button
              title="Continue"
              onPress={handleNext}
              size="lg"
              style={styles.primaryButton}
            />
          )}
          
          {currentIndex === ONBOARDING_SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <Text style={styles.signInHighlight}>Sign In</Text>
            </TouchableOpacity>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  skipButton: {
    padding: spacing[2],
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  slideContent: {
    alignItems: 'center',
  },
  heroVisualContainer: {
    width: 240,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing[6],
  },
  floatingOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.12,
  },
  visualCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  visualHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualContent: {
    padding: spacing[4],
    alignItems: 'center',
  },
  visualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 100,
    gap: spacing[2],
  },
  gridDot: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  savingsVisual: {
    width: '100%',
  },
  savingsBar: {
    height: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  savingsFill: {
    height: '100%',
    borderRadius: 6,
  },
  savingsLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  meetingVisual: {
    width: '100%',
  },
  meetingCard: {
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
  },
  meetingTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  meetingDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  membersVisual: {
    alignItems: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  memberDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  membersLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  floatingPill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  floatingPillText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  headline: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[3],
    letterSpacing: -0.5,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    maxWidth: 24,
  },
  indicatorActive: {
    backgroundColor: colors.primary[500],
  },
  indicatorInactive: {
    backgroundColor: colors.neutral[200],
  },
  buttonContainer: {
    gap: spacing[4],
  },
  primaryButton: {
    width: '100%',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
  },
  signInText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  signInHighlight: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
});

export default OnboardingScreen;
