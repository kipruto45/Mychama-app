import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from './Button';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FullScreenFeedbackProps {
  type: FeedbackType;
  title: string;
  message?: string;
  icon?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

const FEEDBACK_CONFIG: Record<FeedbackType, {
  icon: string;
  bgColor: string;
  iconColor: string;
}> = {
  success: {
    icon: 'check-circle',
    bgColor: colors.primary[50],
    iconColor: colors.primary[500],
  },
  error: {
    icon: 'alert-circle',
    bgColor: '#FEF2F2',
    iconColor: colors.error,
  },
  warning: {
    icon: 'alert',
    bgColor: '#FFFBEB',
    iconColor: colors.warning,
  },
  info: {
    icon: 'information',
    bgColor: '#EFF6FF',
    iconColor: colors.info,
  },
};

export const FullScreenFeedback: React.FC<FullScreenFeedbackProps> = ({
  type,
  title,
  message,
  icon,
  primaryAction,
  secondaryAction,
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = FEEDBACK_CONFIG[type];
  const displayIcon = icon || config.icon;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Icon name={displayIcon as any} size={64} color={config.iconColor} />
        </View>

        <Text style={styles.title}>{title}</Text>

        {message && (
          <Text style={styles.message}>{message}</Text>
        )}

        <View style={styles.actions}>
          {primaryAction && (
            <Button
              title={primaryAction.label}
              onPress={primaryAction.onPress}
              style={styles.primaryButton}
            />
          )}

          {secondaryAction && (
            <Button
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="outline"
              style={styles.secondaryButton}
            />
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  message: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  actions: {
    width: '100%',
    gap: spacing[3],
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});

export default FullScreenFeedback;