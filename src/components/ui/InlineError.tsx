import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface InlineErrorProps {
  message?: string;
  visible?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, visible = true }) => {
  if (!message || !visible) return null;

  return (
    <View style={styles.container}>
      <Icon name="alert-circle" size={16} color={colors.error} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  message: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    lineHeight: 20,
  },
});

export default InlineError;