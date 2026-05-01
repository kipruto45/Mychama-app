import React from 'react';
import { View, Text, StyleSheet, Modal as RNModal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { Button } from './Button';

export type FeedbackModalType = 'success' | 'error' | 'warning' | 'info' | 'confirmation';

interface FeedbackModalProps {
  visible: boolean;
  type?: FeedbackModalType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
}

const MODAL_CONFIG: Record<FeedbackModalType, {
  icon: string;
  iconColor: string;
  bgColor: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}> = {
  success: {
    icon: 'check-circle',
    iconColor: colors.primary[500],
    bgColor: colors.primary[50],
    confirmVariant: 'primary',
  },
  error: {
    icon: 'alert-circle',
    iconColor: colors.error,
    bgColor: '#FEF2F2',
    confirmVariant: 'primary',
  },
  warning: {
    icon: 'alert',
    iconColor: colors.warning,
    bgColor: '#FFFBEB',
    confirmVariant: 'secondary',
  },
  info: {
    icon: 'information',
    iconColor: colors.info,
    bgColor: '#EFF6FF',
    confirmVariant: 'primary',
  },
  confirmation: {
    icon: 'help-circle',
    iconColor: colors.primary[500],
    bgColor: colors.primary[50],
    confirmVariant: 'primary',
  },
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  type = 'confirmation',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true,
}) => {
  const config = MODAL_CONFIG[type];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, shadows.lg]}>
              <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                <Icon name={config.icon as any} size={32} color={config.iconColor} />
              </View>

              <Text style={styles.title}>{title}</Text>

              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              <View style={styles.actions}>
                {showCancel && (
                  <Button
                    title={cancelLabel}
                    onPress={onCancel}
                    variant="ghost"
                    style={styles.cancelButton}
                  />
                )}
                <Button
                  title={confirmLabel}
                  onPress={onConfirm}
                  variant={config.confirmVariant || 'primary'}
                  style={styles.confirmButton}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  container: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default FeedbackModal;