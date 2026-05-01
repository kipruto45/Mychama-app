import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useActiveRole } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { RoleAwarePageShell } from '@/components/system/RoleAwarePageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { reportService, FinanceReportType } from '@/services/reportService';
import { borderRadius, colors, spacing, typography } from '@/theme';

type ReportsHubNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ReportsHub'>;
type ReportsHubRouteProp = RouteProp<MainStackParamList, 'ReportsHub'>;

const REPORTS: Array<{
  type: FinanceReportType;
  category: 'finance' | 'contributions' | 'loans';
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    type: 'chama-summary',
    category: 'finance',
    title: 'Chama Summary',
    subtitle: 'High-level financial health, balances, and operating summary.',
    icon: 'chart-box-outline',
  },
  {
    type: 'member-statement',
    category: 'contributions',
    title: 'Member Statement',
    subtitle: 'Member-level statement data for contributions, balances, and obligations.',
    icon: 'account-card-outline',
  },
  {
    type: 'loan-statement',
    category: 'loans',
    title: 'Loan Statement',
    subtitle: 'Loan activity, repayment movement, and outstanding exposure.',
    icon: 'file-document-outline',
  },
  {
    type: 'loan-schedule',
    category: 'loans',
    title: 'Loan Schedule',
    subtitle: 'Installment schedules, due dates, and repayment planning views.',
    icon: 'calendar-clock-outline',
  },
];

export const ReportsHubScreen: React.FC = () => {
  const navigation = useNavigation<ReportsHubNavigationProp>();
  const route = useRoute<ReportsHubRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const [exportingType, setExportingType] = useState<FinanceReportType | null>(null);

  const scopedChamaId = route.params?.chamaId || activeChamaId || undefined;
  const activeRole = useActiveRole(scopedChamaId);
  const { experience, visibleTabs, visibleColumns, dataScope } = useScreenRBAC('reports', scopedChamaId);
  const visibleReports = REPORTS.filter((report) => {
    if (experience.access === 'self_service') {
      return report.type !== 'chama-summary';
    }
    if (experience.access === 'read_only') {
      return true;
    }
    if (visibleTabs.includes('Finance') && report.category === 'finance') {
      return true;
    }
    if (visibleTabs.includes('Contributions') && report.category === 'contributions') {
      return true;
    }
    if (visibleTabs.includes('Loans') && report.category === 'loans') {
      return true;
    }
    if (visibleTabs.includes('Attendance') || visibleTabs.includes('Meetings') || visibleTabs.includes('Governance')) {
      return report.type === 'member-statement' || report.type === 'chama-summary';
    }
    return true;
  });

  const reportsMeta = {
    title:
      activeRole === Role.TREASURER
        ? 'Finance reports'
        : activeRole === Role.SECRETARY
        ? 'Meeting and governance reports'
        : activeRole === Role.AUDITOR
        ? 'Audit and compliance reports'
        : activeRole === Role.MEMBER
        ? 'My statements'
        : 'Reports hub',
    subtitle: `${experience.does[0] || 'Open reports and exports from one place.'} ${experience.sees[0] ? `You can see ${experience.sees[0]}.` : ''}`.trim(),
  };

  const handleOpenReport = (type: FinanceReportType) => {
    navigation.navigate('FinanceReportDetail', {
      reportType: type,
      chamaId: scopedChamaId,
    });
  };

  const handleExport = async (type: FinanceReportType) => {
    if (!scopedChamaId) {
      Alert.alert('Select a chama', 'Choose a chama first so we can prepare the right report.');
      return;
    }

    try {
      setExportingType(type);
      const report = await reportService.getReport(type, { chama_id: scopedChamaId });
      const lines = [
        report.title,
        activeChama?.name ? `Workspace: ${activeChama.name}` : null,
        '',
        ...report.summary.map((item) => `${item.label}: ${item.value}`),
      ].filter(Boolean);

      await Share.share({
        title: report.title,
        message: lines.join('\n'),
      });
    } catch (error) {
      Alert.alert('Export unavailable', 'We could not prepare that report for sharing right now.');
    } finally {
      setExportingType(null);
    }
  };

  if (!scopedChamaId) {
    return (
      <RequireRouteAccess route="ReportsHub" chamaId={scopedChamaId}>
      <SafeAreaView style={styles.container}>
        <EmptyState
          title={dataScope.startsWith('platform') ? 'No chama context selected' : 'No chama selected'}
          description={
            dataScope.startsWith('platform')
              ? 'Choose a chama workspace first so this report view can load the right records.'
              : 'Choose or join a chama first to access reports and exports.'
          }
          action={{
            label: 'Go to Chamas',
            onPress: () => navigation.navigate('Chamas'),
          }}
        />
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  return (
    <RequireRouteAccess route="ReportsHub" chamaId={scopedChamaId}>
    <SafeAreaView style={styles.container}>
      <RoleAwarePageShell
        eyebrow={activeRole ? `${ROLE_DISPLAY_NAMES[activeRole]} workspace` : 'Reports workspace'}
        title={reportsMeta.title}
        description={`${reportsMeta.subtitle} Data scope: ${dataScope.replace(/_/g, ' ')}.`}
        accessLabel={experience.access.replace(/_/g, ' ')}
        accessMode={experience.access}
        scopeLabel={dataScope.replace(/_/g, ' ')}
        tabs={visibleTabs}
        columns={visibleColumns}
        badges={[...visibleTabs.slice(0, 3), ...visibleColumns.slice(0, 2)]}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.compactHeader}>
          <Text style={styles.sectionTitle}>Available reports</Text>
          <Text style={styles.sectionSubtitle}>Open a report or share a quick export.</Text>
        </View>

        {visibleReports.map((report) => {
          const isExporting = exportingType === report.type;
          return (
            <Card key={report.type} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportIcon}>
                  <Icon name={report.icon} size={22} color={colors.primary[700]} />
                </View>
                <View style={styles.reportCopy}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportSubtitle}>{report.subtitle}</Text>
                </View>
              </View>

              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  activeOpacity={0.88}
                  onPress={() => handleOpenReport(report.type)}
                >
                  <Icon name="open-in-new" size={18} color={colors.light.background} />
                  <Text style={styles.primaryActionText}>Open report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryAction}
                  activeOpacity={0.88}
                  onPress={() => void handleExport(report.type)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.primary[700]} />
                  ) : (
                    <Icon name="export-variant" size={18} color={colors.primary[700]} />
                  )}
                  <Text style={styles.secondaryActionText}>
                    {isExporting ? 'Preparing...' : 'Share export'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <Card style={styles.linkCard}>
          <Text style={styles.sectionTitle}>Operations reports</Text>
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AuditLogs', { chamaId: scopedChamaId })}
          >
            <View style={styles.linkIcon}>
              <Icon name="history" size={18} color={colors.info} />
            </View>
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>Audit Logs</Text>
              <Text style={styles.linkSubtitle}>Review actions, approvals, and change history.</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Transactions')}
          >
            <View style={styles.linkIcon}>
              <Icon name="swap-horizontal" size={18} color={colors.success} />
            </View>
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>Transaction trail</Text>
              <Text style={styles.linkSubtitle}>Open ledger and transaction history for deeper review.</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        </Card>
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
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  compactHeader: {
    gap: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  reportCard: {
    gap: spacing[4],
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginRight: spacing[3],
  },
  reportCopy: {
    flex: 1,
  },
  reportTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  reportSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
  },
  primaryActionText: {
    color: colors.light.background,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  secondaryActionText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  linkCard: {
    gap: spacing[2],
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    marginRight: spacing[3],
  },
  linkCopy: {
    flex: 1,
  },
  linkTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  linkSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 18,
  },
});
