import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';

export const getRiskTone = (risk?: string) => {
  switch (String(risk || '').toLowerCase()) {
    case 'low':
      return { background: '#E8F7ED', text: '#156F3D' };
    case 'high':
      return { background: '#FDEAEA', text: '#A52A2A' };
    default:
      return { background: '#FFF4E5', text: '#9A5B00' };
  }
};

export const getStatusTone = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (['active', 'completed'].includes(normalized)) {
    return { background: '#E8F7ED', text: '#156F3D' };
  }
  if (['matured', 'processing', 'pending', 'pending_funding'].includes(normalized)) {
    return { background: '#FFF4E5', text: '#9A5B00' };
  }
  if (['failed', 'rejected', 'cancelled'].includes(normalized)) {
    return { background: '#FDEAEA', text: '#A52A2A' };
  }
  return { background: '#EEF2FF', text: colors.primary[600] };
};

export const StatusPill = ({ label, tone }: { label: string; tone?: { background: string; text: string } }) => {
  const resolved = tone ?? getStatusTone(label);
  return (
    <View style={[styles.pill, { backgroundColor: resolved.background }]}>
      <Text style={[styles.pillText, { color: resolved.text }]}>{label}</Text>
    </View>
  );
};

export const MetricTile = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.metricTile, { backgroundColor: themeColors.surface }]}>
      <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: themeColors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.metricHint, { color: themeColors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
};

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
};

export const ActionRow = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => {
  const { colors: themeColors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Card style={[styles.actionRow, { backgroundColor: themeColors.card }]}>
        <View style={styles.actionIconWrap}>
          <Icon name={icon as any} size={22} color={colors.primary[500]} />
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, { color: themeColors.text }]}>{title}</Text>
          <Text style={[styles.actionSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={22} color={themeColors.textSecondary} />
      </Card>
    </TouchableOpacity>
  );
};

export const PremiumHeroCard = ({
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}) => (
  <Card style={styles.heroCard}>
    <Text style={styles.heroEyebrow}>{eyebrow}</Text>
    <Text style={styles.heroTitle}>{title}</Text>
    <Text style={styles.heroSubtitle}>{subtitle}</Text>
    {footer ? <View style={styles.heroFooter}>{footer}</View> : null}
  </Card>
);

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  sectionHeader: {
    marginBottom: spacing[3],
    gap: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  metricTile: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    minWidth: '47%',
    gap: spacing[1],
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontFamily: typography.fontFamily.medium,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  metricHint: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
  },
  heroCard: {
    backgroundColor: colors.primary[600],
    padding: spacing[5],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.semibold,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
  },
  heroFooter: {
    marginTop: spacing[2],
  },
});
