import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';

export type ScreenOverviewCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightMeta?: string;
};

export const ScreenOverviewCard: React.FC<ScreenOverviewCardProps> = ({
  eyebrow,
  title,
  subtitle,
  rightMeta,
}) => {
  const { colors: themeColors } = useTheme();

  return (
    <Card
      variant="outlined"
      padding="md"
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.copy}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightMeta ? (
          <View style={[styles.metaPill, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
            <Text style={[styles.metaText, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {rightMeta}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    maxWidth: 140,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
});

