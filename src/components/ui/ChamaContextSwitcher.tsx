import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { borderRadius, colors, spacing, typography } from '@/theme';

interface ChamaOption {
  id: string;
  name: string;
  roleLabel?: string | null;
}

interface ChamaContextSwitcherProps {
  chamas?: ChamaOption[];
  availableChamas?: ChamaOption[];
  activeChamaId: string | null;
  isSwitching?: boolean;
  isLoading?: boolean;
  onSelectChama?: (chamaId: string) => void;
  onSwitch?: (chamaId: string) => Promise<unknown> | void;
  onClearError?: () => void;
  helperText?: string | null;
  switchError?: string | null;
  style?: StyleProp<ViewStyle>;
}

export const ChamaContextSwitcher: React.FC<ChamaContextSwitcherProps> = ({
  chamas,
  availableChamas,
  activeChamaId,
  isSwitching = false,
  isLoading = false,
  onSelectChama,
  onSwitch,
  onClearError,
  helperText,
  switchError,
  style,
}) => {
  const chamaOptions = chamas || availableChamas || [];
  const resolvedHelperText = helperText ?? switchError ?? null;

  const handleSelect = (chamaId: string) => {
    onClearError?.();

    if (onSelectChama) {
      onSelectChama(chamaId);
      return;
    }

    void onSwitch?.(chamaId);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }

  if (chamaOptions.length <= 1) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Current Chama Context</Text>
          <Text style={styles.caption}>Switch once and keep the whole app in the same chama.</Text>
        </View>
        {isSwitching ? <ActivityIndicator size="small" color={colors.primary[500]} /> : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chamaOptions.map((chama) => {
          const isActive = chama.id === activeChamaId;

          return (
            <TouchableOpacity
              key={chama.id}
              style={[styles.chamaPill, isActive ? styles.chamaPillActive : null]}
              onPress={() => handleSelect(chama.id)}
              activeOpacity={0.8}
            >
              <View style={styles.pillHeader}>
                <Text style={[styles.chamaName, isActive ? styles.chamaNameActive : null]}>
                  {chama.name}
                </Text>
                {isActive ? <Icon name="check-circle" size={16} color="#FFFFFF" /> : null}
              </View>
              {chama.roleLabel ? (
                <Text style={[styles.roleText, isActive ? styles.roleTextActive : null]}>
                  {chama.roleLabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {resolvedHelperText ? <Text style={styles.helperText}>{resolvedHelperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  caption: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  scrollContent: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  chamaPill: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    minWidth: 170,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  chamaPillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pillHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  chamaName: {
    color: colors.neutral[900],
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  chamaNameActive: {
    color: '#FFFFFF',
  },
  roleText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
  },
  roleTextActive: {
    color: colors.primary[50],
  },
  helperText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
});
