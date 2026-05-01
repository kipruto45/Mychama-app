import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BrandLogo from '@/components/branding/BrandLogo';
import { Button } from '@/components/ui/Button';
import { ONBOARDING_COMPLETED_STORAGE_KEY } from '@/constants/storageKeys';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { useOnboardingStore } from '@/store/onboardingStore';
import { storage } from '@/utils/storage';
import { borderRadius, colors, spacing, typography } from '@/theme';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  description: string;
  backgroundColor: string;
  accentColor: string;
};

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome',
    headline: 'Welcome to MyChama',
    description: 'Manage your chama with confidence, clarity, and ease. Your digital platform for community savings.',
    backgroundColor: '#F0FDF4',
    accentColor: colors.primary[500],
  },
  {
    id: 'savings',
    eyebrow: 'Save Together',
    headline: 'Save and contribute together',
    description: 'Track group savings, member contributions, and financial progress in one beautiful dashboard.',
    backgroundColor: '#FEFCE8',
    accentColor: colors.accent[500],
  },
  {
    id: 'track',
    eyebrow: 'Stay Organized',
    headline: 'Track meetings, loans, and records',
    description: 'Manage meetings, records, loans, and key chama activities without the stress. Everything in sync.',
    backgroundColor: '#EFF6FF',
    accentColor: colors.info,
  },
  {
    id: 'connect',
    eyebrow: 'Stay Connected',
    headline: 'Built for connection and control',
    description: 'Keep members informed, decisions transparent, and your chama moving forward with confidence.',
    backgroundColor: '#FDF4FF',
    accentColor: colors.accent[600],
  },
];

const PremiumIllustration: React.FC<{ 
  type: 'welcome' | 'savings' | 'track' | 'connect';
  accentColor: string;
}> = ({ type, accentColor }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  if (type === 'welcome') {
    return (
      <View style={styles.illustrationContainer}>
        <Animated.View style={[styles.orb1, { opacity: pulseOpacity }]} />
        <Animated.View style={[styles.orb2, { opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] }) }]} />
        
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCardInner}>
            <View style={[styles.welcomeIconWrap, { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.welcomeIconText, { color: accentColor }]}>MC</Text>
            </View>
            <View style={styles.welcomeLines}>
              <View style={styles.welcomeLine} />
              <View style={[styles.welcomeLine, { width: '60%' }]} />
            </View>
          </View>
        </View>

        <View style={styles.welcomeStats}>
          <View style={[styles.welcomeStatBadge, { borderColor: accentColor }]}>
            <Text style={[styles.welcomeStatText, { color: accentColor }]}>✓ Active</Text>
          </View>
          <View style={[styles.welcomeStatBadge, { borderColor: colors.neutral[300] }]}>
            <Text style={styles.welcomeStatTextDark}>12 Members</Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === 'savings') {
    return (
      <View style={styles.illustrationContainer}>
        <Animated.View style={[styles.orb1, { backgroundColor: accentColor + '15', opacity: pulseOpacity }]} />
        
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsLabel}>Total Savings</Text>
            <Text style={styles.savingsAmount}>KSh 2,450,000</Text>
          </View>
          
          <View style={styles.savingsChart}>
            {[65, 80, 55, 90, 70, 85, 75].map((height, i) => (
              <View key={i} style={styles.chartBar}>
                <View style={[styles.chartBarFill, { height: `${height}%`, backgroundColor: i === 6 ? accentColor : colors.primary[300] }]} />
              </View>
            ))}
          </View>

          <View style={styles.savingsGrowth}>
            <View style={[styles.growthBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={styles.growthText}>↑ 12% this month</Text>
            </View>
          </View>
        </View>

        <View style={styles.memberChips}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.memberChip}>
              <View style={[styles.chipAvatar, { backgroundColor: accentColor }]}>
                <Text style={styles.chipAvatarText}>{i}</Text>
              </View>
            </View>
          ))}
          <View style={[styles.memberChip, { backgroundColor: colors.neutral[100] }]}>
            <Text style={styles.chipMoreText}>+9</Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === 'track') {
    return (
      <View style={styles.illustrationContainer}>
        <Animated.View style={[styles.orb1, { backgroundColor: accentColor + '15', opacity: pulseOpacity }]} />
        
        <View style={styles.trackCard}>
          <View style={styles.trackHeader}>
            <View style={[styles.trackIconBox, { backgroundColor: accentColor + '20' }]}>
              <Text style={{ color: accentColor, fontSize: 20 }}>📋</Text>
            </View>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Monthly Meeting</Text>
              <Text style={styles.trackDate}>Sat, Mar 15 • 10:00 AM</Text>
            </View>
          </View>

          <View style={styles.trackItems}>
            <View style={styles.trackItem}>
              <View style={[styles.trackDot, { backgroundColor: colors.success }]} />
              <Text style={styles.trackItemText}>12 confirmed</Text>
            </View>
            <View style={styles.trackItem}>
              <View style={[styles.trackDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.trackItemText}>3 pending</Text>
            </View>
          </View>
        </View>

        <View style={styles.recordsRow}>
          <View style={styles.recordCard}>
            <Text style={styles.recordValue}>KSh 850K</Text>
            <Text style={styles.recordLabel}>Loans Outstanding</Text>
          </View>
          <View style={styles.recordCard}>
            <Text style={styles.recordValue}>98%</Text>
            <Text style={styles.recordLabel}>Repayment Rate</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.illustrationContainer}>
      <Animated.View style={[styles.orb1, { backgroundColor: accentColor + '15', opacity: pulseOpacity }]} />
      
      <View style={styles.connectCard}>
        <View style={styles.connectHeader}>
          <View style={styles.connectAvatars}>
            <View style={[styles.connectAvatar, { backgroundColor: colors.primary[500], zIndex: 3 }]} />
            <View style={[styles.connectAvatar, { backgroundColor: colors.accent[500], zIndex: 2, marginLeft: -12 }]} />
            <View style={[styles.connectAvatar, { backgroundColor: colors.info, zIndex: 1, marginLeft: -12 }]} />
          </View>
          <Text style={styles.connectCount}>12 members connected</Text>
        </View>

        <View style={styles.notifications}>
          <View style={styles.notification}>
            <View style={[styles.notifIcon, { backgroundColor: colors.primary[50] }]}>
              <Text>💰</Text>
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>Contribution received</Text>
              <Text style={styles.notifTime}>2 min ago</Text>
            </View>
          </View>
          <View style={styles.notification}>
            <View style={[styles.notifIcon, { backgroundColor: colors.accent[50] }]}>
              <Text>📢</Text>
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>New announcement</Text>
              <Text style={styles.notifTime}>1 hour ago</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    []
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const nextIndex = viewableItems[0]?.index;
      if (typeof nextIndex === 'number') {
        setCurrentIndex(nextIndex);
      }
    }
  ).current;

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const markOnboardingSeen = async () => {
    await storage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, 'true');
    useOnboardingStore.getState().markWelcomeSeen();
  };

  const handleAuthRoute = async (route: 'Login' | 'Register' | 'Welcome') => {
    await markOnboardingSeen();
    if (isAuthenticated) {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        (parentNavigation as any).navigate('MainTabs');
        return;
      }
    }
    if (route === 'Register') {
      navigation.navigate('Register', {});
      return;
    }
    navigation.navigate(route);
  };

  const handleNext = async () => {
    if (isLastSlide) {
      await handleAuthRoute('Register');
      return;
    }
    goToSlide(currentIndex + 1);
  };

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, -50],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateX }] }]}>
          <View style={styles.topSection}>
            <View style={styles.brandRow}>
              <BrandLogo size={28} />
              <View style={styles.eyebrowBadge}>
                <Text style={[styles.eyebrowText, { color: item.accentColor }]}>
                  {item.eyebrow}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.illustrationSection}>
            <PremiumIllustration 
              type={item.id as any} 
              accentColor={item.accentColor} 
            />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              void handleAuthRoute('Login');
            }}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingSlides.map((_, index) => {
              const inputRange = [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ];

              const dotScale = scrollX.interpolate({
                inputRange,
                outputRange: [1, 3, 1],
                extrapolate: 'clamp',
              });

              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      transform: [{ scaleX: dotScale }],
                      opacity: dotOpacity,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isLastSlide ? 'Get Started' : 'Continue'}
              onPress={() => {
                void handleNext();
              }}
              size="lg"
              style={styles.primaryButton}
            />
            
            {isLastSlide && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    void handleAuthRoute('Login');
                  }}
                  style={styles.signInLink}
                >
                  <Text style={styles.signInText}>
                    Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  skipText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  topSection: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  eyebrowBadge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  eyebrowText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  illustrationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -20,
    right: -30,
  },
  orb2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 20,
    left: -20,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['3xl'],
    padding: spacing[6],
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  welcomeCardInner: {
    alignItems: 'center',
  },
  welcomeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  welcomeIconText: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  welcomeLines: {
    width: '100%',
    gap: spacing[2],
  },
  welcomeLine: {
    height: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
    width: '80%',
  },
  welcomeStats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  welcomeStatBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  welcomeStatText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  welcomeStatTextDark: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  savingsHeader: {
    marginBottom: spacing[4],
  },
  savingsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
  },
  savingsAmount: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  savingsChart: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    marginBottom: spacing[4],
  },
  chartBar: {
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: borderRadius.md,
    minHeight: 8,
  },
  savingsGrowth: {
    alignItems: 'flex-start',
  },
  growthBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  growthText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.success,
  },
  memberChips: {
    flexDirection: 'row',
    marginTop: spacing[5],
    gap: -8,
  },
  memberChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  chipAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  chipMoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  trackIconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  trackDate: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  trackItems: {
    gap: spacing[2],
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  recordsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  recordValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  recordLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  connectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  connectHeader: {
    marginBottom: spacing[5],
  },
  connectAvatars: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  connectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  connectCount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  notifications: {
    gap: spacing[3],
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
    marginBottom: 2,
  },
  notifTime: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontFamily: typography.fontFamily.regular,
  },
  textSection: {
    paddingVertical: spacing[6],
    paddingBottom: spacing[4],
  },
  headline: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    lineHeight: 40,
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    paddingTop: spacing[4],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  dot: {
    height: 8,
    width: 24,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  buttonContainer: {
    gap: spacing[4],
  },
  primaryButton: {
    width: '100%',
  },
  signInLink: {
    alignItems: 'center',
  },
  joinCodeLink: {
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.lg,
  },
  joinCodeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
  },
  signInText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
  },
  signInHighlight: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
  },
});

export default OnboardingScreen;
