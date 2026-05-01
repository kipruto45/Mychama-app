import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { RoleAwarePageShell } from '@/components/system/RoleAwarePageShell';
import { Card } from '@/components/ui/Card';
import { useActiveChama } from '@/hooks';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { notificationService } from '@/services/notificationService';
import { profileService } from '@/services/profileService';
import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';

type SettingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  destructive?: boolean;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { toggleTheme, isDark } = useTheme();
  const { logout } = useAuth();
  const { activeChamaId } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const { experience, visibleTabs, visibleColumns, dataScope } = useScreenRBAC('settings', activeChamaId || undefined);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [contributionReminders, setContributionReminders] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = await notificationService.getPreferences();
        setNotificationsEnabled(preferences.push_enabled);
        setEmailNotifications(preferences.email_enabled);
        setSmsNotifications(preferences.sms_enabled);
        setContributionReminders(preferences.contribution_reminders);
        setMeetingReminders(preferences.meeting_reminders);
        setAnnouncementAlerts(preferences.announcements);
        setPaymentAlerts(preferences.payment_notifications);
      } catch (error) {
        console.warn('Failed to load settings preferences', error);
      }
    };

    loadPreferences();
  }, []);

  const updateNotificationPreferences = async (changes: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    sms_enabled?: boolean;
    contribution_reminders?: boolean;
    meeting_reminders?: boolean;
    announcements?: boolean;
    payment_notifications?: boolean;
  }) => {
    try {
      await notificationService.updatePreferences({
        push_enabled: changes.push_enabled ?? notificationsEnabled,
        email_enabled: changes.email_enabled ?? emailNotifications,
        sms_enabled: changes.sms_enabled ?? smsNotifications,
        contribution_reminders: changes.contribution_reminders ?? contributionReminders,
        meeting_reminders: changes.meeting_reminders ?? meetingReminders,
        announcements: changes.announcements ?? announcementAlerts,
        payment_notifications: changes.payment_notifications ?? paymentAlerts,
      });
    } catch (error) {
      console.warn('Failed to update notification settings', error);
      Alert.alert('Settings', 'Unable to update notification preferences right now.');
    }
  };

  const openLink = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn(`Failed to open ${label}`, error);
      Alert.alert('Settings', `Unable to open ${label} right now.`);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will not delete your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            queryClient.clear();
            Alert.alert('Cache Cleared', 'Local app cache has been cleared successfully.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await profileService.deleteAccount();
                      await logout();
                      Alert.alert('Account Deleted', 'Your account has been deleted.');
                    } catch (error) {
                      console.warn('Failed to delete account', error);
                      Alert.alert('Delete Account', 'Unable to delete your account right now.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const operationalAlertItems: MenuItem[] = [
    {
      icon: 'alert-outline',
      title: activeRole === Role.TREASURER ? 'Finance Escalations' : activeRole === Role.SECRETARY ? 'Records & Reminder Alerts' : 'Operational Alerts',
      subtitle:
        activeRole === Role.TREASURER
          ? 'Verification, reconciliation, overdue loan, and cashflow alerts'
          : activeRole === Role.SECRETARY
          ? 'Agenda, attendance, communications, and meeting workflow alerts'
          : activeRole === Role.CHAMA_ADMIN
          ? 'Approvals, member issues, governance, and chama health alerts'
          : activeRole === Role.AUDITOR
          ? 'Compliance, anomaly, and review alerts'
          : 'Moderation, support, and system workflow alerts',
      onPress: () => navigation.navigate('Notifications'),
      showArrow: true,
    },
  ];

  const menuSections: { title: string; items: MenuItem[] }[] = useMemo(() => [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'theme-light-dark',
          title: 'Dark Mode',
          subtitle: isDark ? 'Enabled' : 'Disabled',
          onPress: toggleTheme,
          rightComponent: (
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          title: 'Push Notifications',
          subtitle: 'Receive push notifications',
          onPress: () => {
            const nextValue = !notificationsEnabled;
            setNotificationsEnabled(nextValue);
            void updateNotificationPreferences({ push_enabled: nextValue });
          },
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                updateNotificationPreferences({ push_enabled: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive email notifications',
          onPress: () => {
            const nextValue = !emailNotifications;
            setEmailNotifications(nextValue);
            void updateNotificationPreferences({ email_enabled: nextValue });
          },
          rightComponent: (
            <Switch
              value={emailNotifications}
              onValueChange={(value) => {
                setEmailNotifications(value);
                updateNotificationPreferences({ email_enabled: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'message-text',
          title: 'SMS Notifications',
          subtitle: 'Receive SMS notifications',
          onPress: () => {
            const nextValue = !smsNotifications;
            setSmsNotifications(nextValue);
            void updateNotificationPreferences({ sms_enabled: nextValue });
          },
          rightComponent: (
            <Switch
              value={smsNotifications}
              onValueChange={(value) => {
                setSmsNotifications(value);
                updateNotificationPreferences({ sms_enabled: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'cash-clock',
          title: 'Contribution Reminders',
          subtitle: 'Due and overdue contribution alerts',
          onPress: () => {
            const nextValue = !contributionReminders;
            setContributionReminders(nextValue);
            void updateNotificationPreferences({ contribution_reminders: nextValue });
          },
          rightComponent: (
            <Switch
              value={contributionReminders}
              onValueChange={(value) => {
                setContributionReminders(value);
                updateNotificationPreferences({ contribution_reminders: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'calendar-clock',
          title: 'Meeting Reminders',
          subtitle: 'Meeting schedule and reminder alerts',
          onPress: () => {
            const nextValue = !meetingReminders;
            setMeetingReminders(nextValue);
            void updateNotificationPreferences({ meeting_reminders: nextValue });
          },
          rightComponent: (
            <Switch
              value={meetingReminders}
              onValueChange={(value) => {
                setMeetingReminders(value);
                updateNotificationPreferences({ meeting_reminders: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'bullhorn-outline',
          title: 'Announcement Alerts',
          subtitle: 'SMS alerts for announcements (email for critical only)',
          onPress: () => {
            const nextValue = !announcementAlerts;
            setAnnouncementAlerts(nextValue);
            void updateNotificationPreferences({ announcements: nextValue });
          },
          rightComponent: (
            <Switch
              value={announcementAlerts}
              onValueChange={(value) => {
                setAnnouncementAlerts(value);
                updateNotificationPreferences({ announcements: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'receipt-text-check-outline',
          title: 'Payment Alerts',
          subtitle: 'Payment success, failure, and receipts',
          onPress: () => {
            const nextValue = !paymentAlerts;
            setPaymentAlerts(nextValue);
            void updateNotificationPreferences({ payment_notifications: nextValue });
          },
          rightComponent: (
            <Switch
              value={paymentAlerts}
              onValueChange={(value) => {
                setPaymentAlerts(value);
                updateNotificationPreferences({ payment_notifications: value });
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
      ],
    },
    ...(activeRole !== Role.MEMBER
      ? [
          {
            title: 'Operational Alerts',
            items: operationalAlertItems,
          },
        ]
      : []),
    {
      title: 'Security',
      items: [
        {
          icon: 'fingerprint',
          title: 'Biometric Login',
          subtitle: 'Available when secure device authentication is wired',
          onPress: () => {
            Alert.alert(
              'Biometric Login Unavailable',
              'Biometric sign-in is not enabled in this build yet.'
            );
          },
          rightComponent: (
            <Switch
              value={false}
              onValueChange={() => {
                Alert.alert(
                  'Biometric Login Unavailable',
                  'Biometric sign-in is not enabled in this build yet.'
                );
              }}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor="#FFFFFF"
            />
          ),
        },
        {
          icon: 'lock',
          title: 'Change Password',
          subtitle: 'Update your password',
          onPress: () => navigation.navigate('ChangePassword'),
          showArrow: true,
        },
        {
          icon: 'two-factor-authentication',
          title: 'Two-Factor Authentication',
          subtitle: 'Add an extra layer of security',
          onPress: () => navigation.navigate('TwoFactorAuth'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: 'cached',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          onPress: handleClearCache,
          showArrow: true,
        },
        {
          icon: 'download',
          title: 'Download My Data',
          subtitle: 'Export your data',
          onPress: () =>
            Share.share({
              message: 'Request your MyChama data export from support@mychama.com.',
            }),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help Center',
          subtitle: 'Get help and support',
          onPress: () => navigation.navigate('HelpSupport'),
          showArrow: true,
        },
        {
          icon: 'message-text',
          title: 'Contact Us',
          subtitle: 'Send us feedback',
          onPress: () => openLink('mailto:support@mychama.com', 'support email'),
          showArrow: true,
        },
        {
          icon: 'star',
          title: 'Rate Us',
          subtitle: 'Rate us on the app store',
          onPress: () => openLink('https://mychama.com', 'MyChama website'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'file-document',
          title: 'Terms of Service',
          onPress: () => navigation.navigate('TermsOfService'),
          showArrow: true,
        },
        {
          icon: 'shield-lock',
          title: 'Privacy Policy',
          onPress: () => navigation.navigate('PrivacyPolicy'),
          showArrow: true,
        },
        {
          icon: 'cookie',
          title: 'Cookie Policy',
          onPress: () => navigation.navigate('PrivacyPolicy'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'delete',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          onPress: handleDeleteAccount,
          showArrow: true,
          destructive: true,
        },
      ],
    },
  ], [activeRole, announcementAlerts, contributionReminders, emailNotifications, isDark, meetingReminders, notificationsEnabled, paymentAlerts, smsNotifications, toggleTheme, navigation]);

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuItemIcon,
            item.destructive && styles.menuItemIconDestructive,
          ]}
        >
          <Icon
            name={item.icon}
            size={22}
            color={item.destructive ? colors.error : colors.primary[500]}
          />
        </View>
        <View style={styles.menuItemContent}>
          <Text
            style={[
              styles.menuItemTitle,
              item.destructive && styles.menuItemTitleDestructive,
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {item.rightComponent}
        {item.showArrow && (
          <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <RequireRouteAccess route="Settings" chamaId={activeChamaId || undefined}>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RoleAwarePageShell
          eyebrow={`${ROLE_DISPLAY_NAMES[activeRole]} workspace`}
          title="Settings"
          description={`${experience.does[0] || 'Manage app, privacy, and security preferences.'} Data scope: ${dataScope.replace(/_/g, ' ')}.`}
          accessLabel={experience.access.replace(/_/g, ' ')}
          accessMode={experience.access}
          scopeLabel={dataScope.replace(/_/g, ' ')}
          tabs={visibleTabs}
          columns={visibleColumns}
          badges={[...experience.sees.slice(0, 2), ...visibleTabs.slice(0, 1), ...visibleColumns.slice(0, 1)]}
          actions={[
            { key: 'profile', label: 'Profile', icon: 'account-circle-outline', onPress: () => navigation.navigate('Profile') },
            { key: 'security', label: 'Security', icon: 'shield-key-outline', onPress: () => navigation.navigate('TwoFactorAuth') },
          ]}
        />

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderMenuItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MyChama</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
          <Text style={styles.versionBuild}>Build 2024.01.15</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </RequireRouteAccess>
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
    paddingBottom: spacing[6],
  },
  menuSection: {
    marginTop: spacing[4],
  },
  menuSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[500],
    marginLeft: spacing[4],
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    marginHorizontal: spacing[4],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuItemIconDestructive: {
    backgroundColor: colors.error + '20',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  menuItemTitleDestructive: {
    color: colors.error,
  },
  menuItemSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginLeft: spacing[4] + 40 + spacing[3],
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  versionText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  versionNumber: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  versionBuild: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
});
