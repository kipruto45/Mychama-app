import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card } from '@/components/ui';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const InvestmentLearnScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sections = [
    {
      id: 'how-investing-works',
      title: 'How Investing Works',
      icon: 'lightbulb',
      content: 'Investing is putting your money into financial products that have the potential to grow over time. With MyChama, you can invest in carefully selected products that match your financial goals and risk appetite.',
    },
    {
      id: 'risk-levels',
      title: 'Understanding Risk Levels',
      icon: 'shield-alert',
      content: 'Low Risk: Stable returns, minimal volatility. Medium Risk: Moderate returns, some volatility. High Risk: Higher potential returns, more volatility. Choose based on your comfort level.',
    },
    {
      id: 'returns-generated',
      title: 'How Returns Are Generated',
      icon: 'trending-up',
      content: 'Returns come from the underlying asset performance. Your initial investment (principal) grows based on the product performance. Some returns are credited periodically, others at maturity.',
    },
    {
      id: 'lock-periods',
      title: 'Lock Periods Explained',
      icon: 'lock',
      content: 'A lock period is the time your investment is locked and cannot be withdrawn. This ensures stable returns. After the lock period ends, you can redeem or continue investing.',
    },
    {
      id: 'early-redemption',
      title: 'Early Redemption Penalties',
      icon: 'alert-circle',
      content: 'If you withdraw before maturity, you may face penalties. Early redemption fees are calculated as a percentage of your investment. The penalty reduces your net payout.',
    },
    {
      id: 'utilization-vs-reinvestment',
      title: 'Utilization vs Reinvestment',
      icon: 'compare',
      content: 'Utilization: Use your earned returns for other purposes. Reinvestment: Put returns back into investments to earn more. Both options compound your wealth over time.',
    },
  ];

  const faqs = [
    {
      q: 'Can I withdraw my investment anytime?',
      a: 'Withdrawals depend on the product lock period. Most products allow withdrawals after the lock period ends.',
    },
    {
      q: 'How are returns calculated?',
      a: 'Returns are calculated based on the product terms and market performance. Your statement shows detailed breakdowns.',
    },
    {
      q: 'Is my investment safe?',
      a: 'Yes, investments are CMA regulated and your funds are held securely in verified institutions.',
    },
    {
      q: 'Can I invest multiple times?',
      a: 'Yes, you can create multiple investments in different products simultaneously.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Investment Education" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Hero */}
        <Card
	          style={[
	            styles.heroCard,
	            {
	              backgroundColor: themeColors.accent[200],
	              marginHorizontal: spacing[4],
	              marginTop: spacing[4],
	            },
	          ]}
	        >
          <MaterialCommunityIcons
            name="book-open"
            size={40}
            color="#000"
          />
          <Text style={[styles.heroTitle, { color: '#000' }]}>
            Learn About Investing
          </Text>
          <Text style={[styles.heroDesc, { color: 'rgba(0,0,0,0.7)' }]}>
            Master the fundamentals to make smarter financial decisions
          </Text>
        </Card>

        {/* Education Sections */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Topics
          </Text>
          {sections.map(section => (
            <TouchableOpacity
              key={section.id}
              onPress={() =>
                setExpandedId(expandedId === section.id ? null : section.id)
              }
            >
              <Card
                style={[
                  styles.educationCard,
                  {
                    backgroundColor: themeColors.card,
                    marginBottom: spacing[2],
                  },
                ]}
              >
                <View style={styles.cardHeader}>
	                  <View
	                    style={[
	                      styles.cardIcon,
	                      { backgroundColor: themeColors.primary[500] + '20' },
	                    ]}
	                  >
                    <MaterialCommunityIcons
	                      name={section.icon as any}
	                      size={20}
	                      color={themeColors.primary[500]}
	                    />
	                  </View>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    {section.title}
                  </Text>
                  <MaterialCommunityIcons
                    name={
                      expandedId === section.id ? 'chevron-up' : 'chevron-down'
                    }
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </View>
                {expandedId === section.id && (
                  <Text style={[styles.cardContent, { color: themeColors.text }]}>
                    {section.content}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[6] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: spacing[3] }]}>
            Frequently Asked Questions
          </Text>
          {faqs.map((faq, idx) => (
            <Card
              key={idx}
              style={[
                styles.faqCard,
                {
                  backgroundColor: themeColors.card,
                  marginBottom: spacing[2],
                },
              ]}
            >
              <Text style={[styles.faqQ, { color: themeColors.text }]}>
                {faq.q}
              </Text>
              <Text style={[styles.faqA, { color: themeColors.textSecondary }]}>
                {faq.a}
              </Text>
            </Card>
          ))}
        </View>

        {/* Support */}
        <Card
          style={[
            styles.supportCard,
            {
              backgroundColor: themeColors.card,
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
	          <MaterialCommunityIcons
	            name="help-circle"
	            size={24}
	            color={themeColors.primary[500]}
	          />
          <Text style={[styles.supportTitle, { color: themeColors.text }]}>
            Still have questions?
          </Text>
          <Text style={[styles.supportDesc, { color: themeColors.textSecondary }]}>
            Contact our support team for personalized guidance
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: { padding: spacing[4], borderRadius: 12, alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700', marginTop: spacing[2] },
  heroDesc: { fontSize: 14, marginTop: spacing[1], textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  educationCard: { padding: spacing[3], borderRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cardIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  cardContent: { fontSize: 13, lineHeight: 20, marginTop: spacing[3] },
  faqCard: { padding: spacing[3], borderRadius: 8 },
  faqQ: { fontSize: 13, fontWeight: '600', marginBottom: spacing[2] },
  faqA: { fontSize: 12, lineHeight: 18 },
  supportCard: { padding: spacing[4], borderRadius: 8, alignItems: 'center' },
  supportTitle: { fontSize: 14, fontWeight: '600', marginTop: spacing[2] },
  supportDesc: { fontSize: 12, marginTop: spacing[1], textAlign: 'center' },
});
