import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { colors } from '@/theme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  message?: string;
  description?: string;
  action?: EmptyStateAction | React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'alert-circle-outline',
  title,
  message,
  description,
  action,
  style,
}) => {
  const { colors: themeColors } = useTheme();
  const displayMessage = message || description || '';

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <View style={styles.iconContainer}>
          <Icon name={icon as any} size={48} color={colors.primary[500]} />
        </View>
      );
    }
    return <View style={styles.iconContainer}>{icon}</View>;
  };

  const renderAction = () => {
    if (!action) return null;
    
    // Check if action is a React element
    if (React.isValidElement(action)) {
      return action;
    }
    
    // Otherwise treat it as EmptyStateAction
    const actionObj = action as EmptyStateAction;
    return (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary[500] }]}
        onPress={actionObj.onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionText, { color: themeColors.surface }]}>
          {actionObj.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderIcon()}

      <Text style={[styles.title, { color: themeColors.text }]}>
        {title}
      </Text>
      
      {displayMessage ? (
        <Text style={[styles.message, { color: themeColors.textSecondary }]}>
          {displayMessage}
        </Text>
      ) : null}
      
      {renderAction()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
