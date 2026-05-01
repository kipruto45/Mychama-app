import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Pressable,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { AuthStackParamList } from '@/navigation/types';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const ANIMATION_DURATION = 700;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const brandFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroFloat1 = useRef(new Animated.Value(0)).current;
  const heroFloat2 = useRef(new Animated.Value(0)).current;
  const headlineFade = useRef(new Animated.Value(0)).current;
  const headlineSlide = useRef(new Animated.Value(25)).current;
  const subheadlineFade = useRef(new Animated.Value(0)).current;
  const trustFade = useRef(new Animated.Value(0)).current;
  const featuresStagger = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Brand fade in
    Animated.timing(brandFade, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Hero entrance
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(heroScale, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat1, {
          toValue: -6,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(heroFloat1, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat2, {
          toValue: 6,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(heroFloat2, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Headline
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(headlineFade, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(headlineSlide, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    // Subheadline
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(subheadlineFade, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Trust
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(trustFade, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Features staggered
    Animated.sequence([
      Animated.delay(750),
      Animated.stagger(80, [
        Animated.timing(featuresStagger[0], {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(featuresStagger[1], {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(featuresStagger[2], {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(featuresStagger[3], {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Buttons
    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Footer
    Animated.sequence([
      Animated.delay(1250),
      Animated.timing(footerFade, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate({ name: 'Register' } as any);
  };

  const handleSignIn = () => {
    navigation.navigate({ name: 'Login' } as any);
  };

  const handleTerms = () => {
    navigation.navigate({ name: 'TermsOfService' } as any);
  };

  const handlePrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleHelp = () => {
    navigation.navigate('HelpSupport');
  };

  const FEATURES = [
    { icon: 'wallet', label: 'Contributions', color: colors.primary[600] },
    { icon: 'cash-fast', label: 'Loans', color: colors.primary[600] },
    { icon: 'calendar-clock', label: 'Meetings', color: colors.primary[600] },
    { icon: 'shield-check', label: 'Secure', color: colors.primary[600] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.light.background} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, { opacity: brandFade }]}>
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/logo_hd.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>MyChama</Text>
          </View>

          <Animated.View
            style={[
              styles.heroSection,
              { opacity: heroOpacity },
            ]}
          >
            <Animated.View
              style={[
                styles.floatingCard1,
                { transform: [{ translateY: heroFloat1 }] },
              ]}
            >
              <View style={styles.floatingCardInner}>
                <Icon name="chart-line" size={16} color={colors.success} />
                <Text style={styles.floatingCardValue}>+18%</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.floatingCard2,
                { transform: [{ translateY: heroFloat2 }] },
              ]}
            >
              <View style={styles.floatingCardInner}>
                <Icon name="account-group" size={16} color={colors.primary[500]} />
                <Text style={styles.floatingCardValueSmall}>12</Text>
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: heroScale }] }}>
              <View style={styles.heroShadow}>
                <Image
                  source={require('../../../assets/imagehero.png')}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.textSection}>
            <Animated.View
              style={[
                { opacity: headlineFade, transform: [{ translateY: headlineSlide }] },
              ]}
            >
              <Text style={styles.headline}>
                Your chama,{'\n'}organized better.
              </Text>
            </Animated.View>

            <Animated.View style={{ opacity: subheadlineFade }}>
              <Text style={styles.subheadline}>
                Track contributions, manage loans, and keep your group connected.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.trustSection, { opacity: trustFade }]}>
              <Icon name="shield-check" size={14} color={colors.success} />
              <Text style={styles.trustText}>Secure • Transparent • Simple</Text>
            </Animated.View>
          </View>

          <Animated.View style={styles.featuresSection}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.label}
                style={{
                  opacity: featuresStagger[index],
                  transform: [
                    {
                      translateY: featuresStagger[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [15, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.featurePill}>
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: `${feature.color}12` },
                    ]}
                  >
                    <Icon name={feature.icon as any} size={14} color={feature.color} />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View style={[styles.ctaSection, { opacity: buttonFade }]}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              style={styles.primaryButton}
              size="lg"
            />

            <Pressable onPress={handleSignIn} style={styles.signInLink}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <Text style={styles.signInAnchor}> Sign In</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.footerSection, { opacity: footerFade }]}>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={handleTerms}>
                <Text style={styles.footerLink}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity onPress={handlePrivacy}>
                <Text style={styles.footerLink}>Privacy</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity onPress={handleHelp}>
                <Text style={styles.footerLink}>Help</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  logo: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: 0.8,
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  floatingCard1: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
  },
  floatingCard2: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    zIndex: 10,
  },
  floatingCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  floatingCardValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  floatingCardValueSmall: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroShadow: {
    ...shadows.md,
  },
  heroImage: {
    width: 300,
    height: 200,
    borderRadius: borderRadius.xl,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  headline: {
    fontSize: 27,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: spacing[2],
  },
  subheadline: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    backgroundColor: colors.success + '12',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  trustText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
    letterSpacing: 0.3,
  },
  featuresSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: 6,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  ctaSection: {
    width: '100%',
    paddingHorizontal: spacing[2],
  },
  primaryButton: {
    marginBottom: spacing[3],
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  signInText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
  },
  signInAnchor: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
  footerSection: {
    paddingBottom: spacing[2],
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  footerLink: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
  },
  footerDot: {
    color: colors.neutral[300],
    fontSize: typography.fontSize.xs,
  },
});

export default WelcomeScreen;
