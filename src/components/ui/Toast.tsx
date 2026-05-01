import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onClose?: () => void;
  duration?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOAST_CONFIG: Record<ToastType, {
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  success: {
    icon: 'check-circle',
    iconColor: colors.primary[500],
    bgColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  error: {
    icon: 'alert-circle',
    iconColor: colors.error,
    bgColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  warning: {
    icon: 'alert',
    iconColor: colors.warning,
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  info: {
    icon: 'information',
    iconColor: colors.info,
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'info',
  title,
  message,
  action,
  onClose,
  duration = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0 && onClose) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDismiss = () => {
    hideToast();
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: config.iconColor + '20' }]}>
          <Icon name={config.icon as any} size={20} color={config.iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.neutral[900] }]} numberOfLines={1}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: colors.neutral[600] }]} numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {action && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: config.iconColor + '15' }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: config.iconColor }]}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {onClose && (
            <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
              <Icon name="close" size={18} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    right: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  message: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  closeButton: {
    padding: spacing[1],
  },
});

export default Toast;