import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { LegalDocumentScreen } from './LegalDocumentScreen';
import { colors } from '@/theme';

const termsSections = [
  {
    heading: 'Using MyChama',
    body: [
      'MyChama is a digital platform for managing savings groups (chamas), contributions, meetings, loans, and member communication. By using our app, you agree to use it lawfully and provide accurate information when creating or joining a chama.',
      'You are responsible for all actions taken through your account, including approvals, payments, member invitations, and records you create on the platform.',
    ],
  },
  {
    heading: 'Account Responsibilities',
    body: [
      'Keep your phone number, password, and OTP codes secure. Do not share your credentials with unauthorized persons.',
      'You must be at least 18 years old to create an account. If you believe your account has been compromised, change your password immediately and contact support.',
    ],
  },
  {
    heading: 'Chama Management',
    body: [
      'Chama administrators can manage members, contributions, penalties, and meeting records. All financial decisions should be approved according to the group\'s rules.',
      'The app stores records created by members and officials. Review all financial entries carefully before confirming them.',
    ],
  },
  {
    heading: 'Payments & Transactions',
    body: [
      'Some features may involve payment processors or mobile money services. Availability depends on third-party service providers.',
      'Transaction disputes, delays, or reversals may be subject to the rules of your payment provider or mobile money service.',
    ],
  },
  {
    heading: 'Acceptable Use',
    body: [
      'You may not use MyChama for fraud, abuse, data scraping, or any illegal activity. We may suspend accounts that violate these terms or threaten platform security.',
      'Respect other members. Harassment, discrimination, or harmful behavior is not permitted.',
    ],
  },
  {
    heading: 'Changes & Support',
    body: [
      'We may update or retire features over time. Material changes will be published in the app.',
      'For questions or support, use the help section in the app or contact our support team.',
    ],
  },
] as const;

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <LegalDocumentScreen
      title="Terms of Service"
      summary=""
      effectiveDate="April 13, 2026"
      sections={[...termsSections]}
      onBack={() => navigation.goBack()}
      icon="file-document"
      accentColor={colors.primary[500]}
    />
  );
};