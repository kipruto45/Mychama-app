import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { LegalDocumentScreen } from './LegalDocumentScreen';
import { colors } from '@/theme';

const privacySections = [
  {
    heading: 'Information We Collect',
    body: [
      'We collect information you provide: phone number, full name, email, profile details, chama memberships, payment activity, meeting records, and support messages.',
      'We also collect technical data: device identifiers, session data, notification tokens, IP addresses, and app usage data needed for security and reliability.',
    ],
  },
  {
    heading: 'How We Use Information',
    body: [
      'Your information is used to authenticate your account, deliver chama features, send OTPs and alerts, process transactions, and help groups maintain accurate records.',
      'We use service and audit data to detect abuse, investigate suspicious activity, enforce platform rules, and provide customer support.',
    ],
  },
  {
    heading: 'Sharing & Disclosure',
    body: [
      'Information may be shared with trusted service providers (hosting, messaging, analytics, push notifications, storage, payment partners) who help us operate the platform.',
      'We may disclose information when required by law, to protect member safety and platform security, or to complete services you request.',
    ],
  },
  {
    heading: 'Your Chama Data',
    body: [
      'Data you create in a chama (contributions, approvals, member actions, meeting records) may be visible to group members according to their roles and permissions.',
      'Chama administrators and officers can review records needed to manage the group responsibly.',
    ],
  },
  {
    heading: 'Retention & Security',
    body: [
      'We take reasonable steps to protect your information and secure sessions. No system can guarantee absolute security—please protect your device and credentials.',
      'We retain information for operational, compliance, fraud prevention, and support purposes as long as needed under our legal obligations.',
    ],
  },
  {
    heading: 'Your Choices',
    body: [
      'You can update profile information and notification preferences in the app settings. Contact support for account access, data export, or deletion requests.',
      'If material changes are made to this policy, the updated version will be published in the app.',
    ],
  },
] as const;

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      summary=""
      effectiveDate="April 13, 2026"
      sections={[...privacySections]}
      onBack={() => navigation.goBack()}
      icon="shield-lock"
      accentColor={colors.primary[600]}
    />
  );
};