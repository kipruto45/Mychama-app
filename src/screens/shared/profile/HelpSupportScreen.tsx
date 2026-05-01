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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';

type HelpSupportScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'HelpSupport'>;

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I create a new chama?',
    answer: 'Go to the Chamas tab and tap the "+" button. Fill in the chama details and invite members.',
  },
  {
    question: 'How do I make a contribution?',
    answer: 'Navigate to your chama, tap "Make Contribution", select the contribution type and amount, then choose your payment method.',
  },
  {
    question: 'How do I request a loan?',
    answer: 'Go to your chama\'s Finance section, tap "Request Loan", select a loan product, enter the amount and duration, then submit.',
  },
  {
    question: 'How do I invite members?',
    answer: 'Open your chama, tap the invite button, and share the invite link or code with potential members.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the login screen, tap "Forgot Password", enter your phone number, and follow the OTP verification process.',
  },
];

const SUPPORT_PHONE = '+254723484552';
const SUPPORT_PHONE_LINK = SUPPORT_PHONE.replace('+', '');

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation<HelpSupportScreenNavigationProp>();

  const openExternalLink = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn(`Failed to open ${label}`, error);
      Alert.alert('Help & Support', `Unable to open ${label} right now.`);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to contact us',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@mychama.com'),
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL(`https://wa.me/${SUPPORT_PHONE_LINK}`),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleOpenFAQ = (faq: FAQItem) => {
    Alert.alert(faq.question, faq.answer);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={handleContactSupport}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[50] }]}>
              <Icon name="headset" size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.quickActionText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => openExternalLink(`https://wa.me/${SUPPORT_PHONE_LINK}`, 'live chat')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
              <Icon name="chat" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Live Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => openExternalLink(`tel:${SUPPORT_PHONE}`, 'video support line')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '20' }]}>
              <Icon name="video" size={24} color={colors.info} />
            </View>
            <Text style={styles.quickActionText}>Video Call</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Card style={styles.faqCard}>
            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => handleOpenFAQ(faq)}
              >
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Card style={styles.resourcesCard}>
            <TouchableOpacity
              style={styles.resourceItem}
              onPress={() => openExternalLink('https://mychama.com/user-guide', 'user guide')}
            >
              <Icon name="book-open-variant" size={20} color={colors.primary[500]} />
              <Text style={styles.resourceText}>User Guide</Text>
              <Icon name="open-in-new" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resourceItem}
              onPress={() => openExternalLink('https://mychama.com/tutorials', 'video tutorials')}
            >
              <Icon name="video" size={20} color={colors.primary[500]} />
              <Text style={styles.resourceText}>Video Tutorials</Text>
              <Icon name="open-in-new" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resourceItem}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              <Icon name="file-document" size={20} color={colors.primary[500]} />
              <Text style={styles.resourceText}>Terms of Service</Text>
              <Icon name="chevron-right" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resourceItem}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Icon name="shield-lock" size={20} color={colors.primary[500]} />
              <Text style={styles.resourceText}>Privacy Policy</Text>
              <Icon name="chevron-right" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Icon name="email" size={20} color={colors.primary[500]} />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@mychama.com</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Icon name="phone" size={20} color={colors.primary[500]} />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+254 723 484 552</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Icon name="clock" size={20} color={colors.primary[500]} />
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Support Hours</Text>
                <Text style={styles.contactValue}>Mon - Fri: 8AM - 6PM EAT</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MyChama v1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2024 MyChama Technologies</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing[1],
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  faqCard: {
    padding: 0,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  faqContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  faqQuestion: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  resourcesCard: {
    padding: 0,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  resourceText: {
    flex: 1,
    marginLeft: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  contactCard: {
    padding: spacing[4],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  contactContent: {
    marginLeft: spacing[3],
  },
  contactLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  versionSubtext: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
});
