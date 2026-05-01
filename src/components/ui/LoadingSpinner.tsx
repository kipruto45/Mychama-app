import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography, spacing } from '@/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const SIZES = {
  small: { ring: 24, dot: 4, gap: 4 },
  medium: { ring: 40, dot: 6, gap: 6 },
  large: { ring: 56, dot: 8, gap: 8 },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = colors.primary[500],
  text,
}) => {
  const config = SIZES[size];
  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const createDotAnimation = (opacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 350,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDotAnimation(dot1Opacity, 0).start();
    createDotAnimation(dot2Opacity, 120).start();
    createDotAnimation(dot3Opacity, 240).start();
  }, []);

  const ringInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerContent = (
    <View style={styles.container}>
      <View style={[styles.ringContainer, { width: config.ring, height: config.ring }]}>
        <Animated.View
          style={[
            styles.gradientRing,
            {
              width: config.ring,
              height: config.ring,
              borderRadius: config.ring / 2,
              borderWidth: 2.5,
              borderColor: color,
              transform: [{ rotate: ringInterpolation }],
            },
          ]}
        />
        <View style={[styles.innerDot, { backgroundColor: color }]} />
      </View>

      {text && (
        <View style={styles.textContainer}>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  width: config.dot,
                  height: config.dot,
                  borderRadius: config.dot / 2,
                  backgroundColor: color,
                  opacity: dot1Opacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  width: config.dot,
                  height: config.dot,
                  borderRadius: config.dot / 2,
                  backgroundColor: color,
                  opacity: dot2Opacity,
                  marginHorizontal: config.gap,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  width: config.dot,
                  height: config.dot,
                  borderRadius: config.dot / 2,
                  backgroundColor: color,
                  opacity: dot3Opacity,
                },
              ]}
            />
          </View>
          <Text style={[styles.text, { color: colors.neutral[500] }]}>{text}</Text>
        </View>
      )}
    </View>
  );

  if (size === 'large') {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {spinnerContent}
      </Animated.View>
    );
  }

  return spinnerContent;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientRing: {
    position: 'absolute',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  textContainer: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  dot: {},
  text: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
});

export default LoadingSpinner;