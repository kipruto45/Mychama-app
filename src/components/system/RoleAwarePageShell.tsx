import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { AccessBadge } from './AccessBadge';
import { QuickActionBar, RoleAwareShellAction } from './QuickActionBar';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { RoleAwareTabBar } from './RoleAwareTabBar';
import { ScopeBadge } from './ScopeBadge';

type AccessMode = 'full' | 'limited' | 'read_only' | 'self_service' | 'support' | 'inspect_only';

export interface RoleAwarePageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  accessLabel?: string;
  scopeLabel?: string;
  accessMode?: AccessMode;
  badges?: string[];
  actions?: RoleAwareShellAction[];
  tabs?: string[];
  filters?: string[];
  columns?: string[];
  readOnlyHint?: string;
  children?: React.ReactNode;
}

export const RoleAwarePageShell: React.FC<RoleAwarePageShellProps> = ({
  eyebrow,
  title,
  description,
  accessLabel,
  scopeLabel,
  accessMode,
  badges = [],
  actions = [],
  tabs = [],
  filters = [],
  columns = [],
  readOnlyHint,
  children,
}) => {
  const isReadOnly =
    accessMode === 'read_only' ||
    accessMode === 'inspect_only' ||
    accessLabel?.toLowerCase().includes('read only') ||
    accessLabel?.toLowerCase().includes('inspect only');

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {(accessLabel || scopeLabel) ? (
          <View style={styles.metaColumn}>
            {accessLabel ? <AccessBadge label={accessLabel} tone={accessMode || 'limited'} /> : null}
            {scopeLabel ? <ScopeBadge label={scopeLabel} /> : null}
          </View>
        ) : null}
      </View>

      {isReadOnly ? (
        <ReadOnlyBanner
          description={
            readOnlyHint ||
            'You can inspect this workspace safely, but editing and operational actions are restricted for the current role.'
          }
        />
      ) : null}

      {badges.length > 0 ? (
        <View style={styles.badges}>
          {badges.map((badge) => (
            <View key={badge} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <QuickActionBar actions={actions} />
      <RoleAwareTabBar title="Visible tabs" items={tabs} />
      <RoleAwareTabBar title="Active filters" items={filters} />
      <RoleAwareTabBar title="Priority columns" items={columns} />

      {children}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing[2],
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  description: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
    color: colors.neutral[600],
  },
  metaColumn: {
    gap: spacing[2],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  badge: {
    backgroundColor: colors.light.background,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    flexShrink: 1,
  },
});
