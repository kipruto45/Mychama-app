import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { AuthStackParamList } from '@/navigation/types';
import { colors, typography, spacing, borderRadius } from '@/theme';

type HelpSupportScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'HelpSupport'>;

const FAQ_ITEMS = [
  {
    question: 'What is MyChama?',
    answer: 'MyChama is a mobile app that helps chama groups manage their savings, contributions, loans, and meetings all in one place.',
  },
  {
    question: 'How do I join a chama?',
    answer: 'Ask your chama admin or treasurer for an invite code, then enter it on the app to join.',
  },
  {
    question: 'How do I create a new chama?',
    answer: 'Tap "Get Started" on the welcome screen, create your account, then select "Create a Chama" to start a new group.',
  },
  {
    question: 'How do I make contributions?',
    answer: 'Open your chama, go to Contributions, select the type and amount, then pay using M-Pesa or cash.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the login screen, tap "Forgot Password" and follow the OTP verification steps.',
  },
];

const SUPPORT_OPTIONS = [
  {
    icon: 'phone',
    label: 'Call Us',
    subtitle: '+254 723 484 552',
    action: () => Linking.openURL('tel:+254723484552'),
  },
  {
    icon: 'email',
    label: 'Email',
    subtitle: 'support@mychama.com',
    action: () => Linking.openURL('mailto:support@mychama.com'),
  },
  {
    icon: 'whatsapp',
    label: 'WhatsApp',
    subtitle: 'Chat with us',
    action: () => Linking.openURL('https://wa.me/254723484552'),
  },
];

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation<HelpSupportScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Help & Support" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Contact Support</Text>

        <View style={styles.supportOptions}>
          {SUPPORT_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.supportOption}
              onPress={option.action}
              activeOpacity={0.7}
            >
              <View style={styles.supportIcon}>
                <Icon name={option.icon as any} size={24} color={colors.primary[500]} />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportLabel}>{option.label}</Text>
                <Text style={styles.supportSubtitle}>{option.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.neutral[300]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  faqList: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  faqItem: {
    backgroundColor: colors.light.card,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  faqQuestion: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  supportOptions: {
    gap: spacing[3],
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing[3],
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportContent: {
    flex: 1,
  },
  supportLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  supportSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
});

export default HelpSupportScreen;
