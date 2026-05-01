import React, { useEffect, useRef } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography, spacing } from '@/theme';

type LegalSection = {
  heading: string;
  body: readonly string[];
};

type LegalDocumentScreenProps = {
  title: string;
  summary: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
  onBack: () => void;
  icon?: string;
  accentColor?: string;
};

const SECTION_ICONS: Record<string, string> = {
  'Using MyChama': 'shield-check',
  'Account Responsibilities': 'account-lock',
  'Chama Management': 'account-group',
  'Payments & Transactions': 'cash',
  'Acceptable Use': 'alert-circle',
  'Changes & Support': 'headset',
  'Information We Collect': 'database',
  'How We Use Information': 'cog',
  'Sharing & Disclosure': 'share-variant',
  'Your Chama Data': 'folder-account',
  'Retention & Security': 'shield-lock',
  'Your Choices': 'account-cog',
};

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  title,
  effectiveDate,
  sections,
  onBack,
  icon = 'file-document',
  accentColor = colors.primary[500],
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderSection = (section: LegalSection, index: number) => {
    const sectionIcon = SECTION_ICONS[section.heading] || 'text';

    return (
      <View key={section.heading} style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + '15' }]}>
            <Icon name={sectionIcon as any} size={18} color={accentColor} />
          </View>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
        </View>
        <View style={styles.sectionBody}>
          {section.body.map((paragraph, pIndex) => (
            <Text key={`${section.heading}-${pIndex}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <View style={styles.backButtonInner}>
            <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
          </View>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={[styles.iconBadge, { backgroundColor: accentColor + '12' }]}>
            <Icon name={icon as any} size={24} color={accentColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.effectiveDate, { color: accentColor }]}>
            Effective {effectiveDate}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.trustBanner}>
        <Icon name="shield-check" size={14} color={colors.primary[600]} />
        <Text style={styles.trustText}>Your trust matters to us</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => renderSection(section, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  effectiveDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginHorizontal: spacing[4],
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  trustText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[700],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  sectionCard: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: spacing[4],
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    flex: 1,
  },
  sectionBody: {
    paddingLeft: spacing[6],
    gap: spacing[2],
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 24,
  },
});

export default LegalDocumentScreen;