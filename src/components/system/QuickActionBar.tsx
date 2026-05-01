import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export interface RoleAwareShellAction {
  key: string;
  label: string;
  icon?: string;
  onPress?: () => void;
}

export const QuickActionBar: React.FC<{
  actions: RoleAwareShellAction[];
}> = ({ actions }) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          onPress={action.onPress}
          disabled={!action.onPress}
          activeOpacity={0.85}
          style={styles.chip}
        >
          {action.icon ? <Icon name={action.icon as never} size={16} color={colors.primary[700]} /> : null}
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.light.background,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  label: {
    color: colors.primary[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
});
