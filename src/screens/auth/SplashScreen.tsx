import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 88;
const RING_SIZE = 112;

export const SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  
  const ringRotation = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 10,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(loaderOpacity, {
      toValue: 1,
      duration: 400,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const ringInterpolation = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.backgroundContainer}>
        <View style={styles.topGradient} />
        <View style={styles.bottomGradient} />
        
        <View style={styles.decorativeCircles}>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: contentTranslateY }
            ]
          }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: logoPulse }] }}>
          <View style={styles.logoWrapper}>
            <View style={styles.glowRing}>
              <View style={styles.outerGlow} />
            </View>
            
            <Animated.View style={[
              styles.rotatingRing,
              { transform: [{ rotate: ringInterpolation }] }
            ]}>
              <View style={styles.ringArcStart} />
              <View style={styles.ringArcEnd} />
            </Animated.View>
            
            <View style={styles.logoInner}>
              <Icon name="shield-check" size={38} color={colors.primary[500]} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.appName}>MyChama</Text>
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Your savings, synchronized
          </Animated.Text>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.loaderContainer, 
          { 
            paddingBottom: insets.bottom + spacing[12],
            opacity: loaderOpacity 
          }
        ]}
      >
        <View style={styles.loaderLine}>
          <View style={styles.loaderProgress} />
        </View>
        <Text style={styles.loadingText}>Preparing your experience</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: -height * 0.15,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: colors.primary[50],
    opacity: 0.4,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: colors.primary[50],
    opacity: 0.25,
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 200,
  },
  blob1: {
    width: 320,
    height: 320,
    backgroundColor: colors.primary[400],
    opacity: 0.04,
    top: -100,
    left: -80,
  },
  blob2: {
    width: 160,
    height: 160,
    backgroundColor: colors.primary[500],
    opacity: 0.03,
    top: 60,
    right: -40,
  },
  blob3: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary[300],
    opacity: 0.025,
    bottom: height * 0.2,
    right: width * 0.15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  logoWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    borderRadius: (RING_SIZE + 20) / 2,
    backgroundColor: colors.primary[400],
    opacity: 0.08,
  },
  rotatingRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringArcStart: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: colors.primary[500],
    borderRightColor: colors.primary[300],
  },
  ringArcEnd: {
    position: 'absolute',
    width: RING_SIZE - 16,
    height: RING_SIZE - 16,
    borderRadius: (RING_SIZE - 16) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomColor: colors.primary[200],
    borderLeftColor: colors.primary[100],
    top: 8,
    left: 8,
  },
  logoInner: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -1.5,
    marginBottom: spacing[2],
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    letterSpacing: 0.3,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  loaderLine: {
    width: 120,
    height: 3,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  loaderProgress: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
