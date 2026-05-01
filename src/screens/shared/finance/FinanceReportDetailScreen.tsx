import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { FinanceReportResult, reportService } from '@/services/reportService';
import { formatDateTime } from '@/utils/format';

type FinanceReportDetailNavigationProp = NativeStackNavigationProp<MainStackParamList, 'FinanceReportDetail'>;
type FinanceReportDetailRouteProp = RouteProp<MainStackParamList, 'FinanceReportDetail'>;

export const FinanceReportDetailScreen: React.FC = () => {
  const navigation = useNavigation<FinanceReportDetailNavigationProp>();
  const route = useRoute<FinanceReportDetailRouteProp>();
  const { reportType, chamaId, memberId, loanId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FinanceReportResult | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getReport(reportType, {
        chama_id: chamaId,
        member_id: memberId,
        loan_id: loanId,
      });
      setReport(data);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load this report.')
          : 'Unable to load this report.';
      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [reportType, chamaId, memberId, loanId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Report unavailable"
          description={
            error ||
            'This report could not be loaded right now. It may need more information before it can be shown.'
          }
          action={
            <Button
              title="Retry"
              onPress={() => void loadReport()}
              icon={<Icon name="refresh" size={18} color="#FFFFFF" />}
            />
          }
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Finance Report</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="file-chart-outline" size={30} color={colors.primary[500]} />
          </View>
          <Text style={styles.heroTitle}>{report.title}</Text>
          <Text style={styles.heroSubtitle}>
            {report.generatedAt ? `Generated ${formatDateTime(report.generatedAt)}` : 'Live report data'}
          </Text>
        </Card>

        {report.summary.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Summary</Text>
            {report.summary.map((item) => (
              <View key={`${item.label}-${item.value}`} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState
            title="No summary returned"
            description="This report is available, but no summary was included."
            style={styles.inlineEmpty}
          />
        )}

        {report.sections.length > 0 ? (
          report.sections.map((section) => (
            <Card key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <View key={`${section.title}-${item.label}-${item.value}`} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </Card>
          ))
        ) : (
          <EmptyState
            title="No detailed sections returned"
            description="This report endpoint returned only summary-level data."
            style={styles.inlineEmpty}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textAlign: 'center',
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
    gap: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing[2],
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  sectionCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
  },
  inlineEmpty: {
    paddingVertical: spacing[5],
  },
});
