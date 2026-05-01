import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export const RoleAwareTabBar: React.FC<{
  title: string;
  items: string[];
}> = ({ title, items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => (
          <View key={item} style={styles.itemChip}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: spacing[4],
  },
  sectionTitle: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  row: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  itemChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.background,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  itemText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
});
