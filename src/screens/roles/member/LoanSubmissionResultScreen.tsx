import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { memberLoanService, normalizeApplicationState } from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { getLoanApplicationMeta } from './loanWorkflowShared';

type LoanSubmissionResultNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'LoanSubmissionResult'
>;
type LoanSubmissionResultRouteProp = RouteProp<MainStackParamList, 'LoanSubmissionResult'>;

export const LoanSubmissionResultScreen: React.FC = () => {
  const navigation = useNavigation<LoanSubmissionResultNavigationProp>();
  const route = useRoute<LoanSubmissionResultRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activeApplication,
    clearActiveApplication,
    setActiveApplication,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();

  const chamaId = route.params?.chamaId || activeApplication?.chamaId || activeChamaId || undefined;
  const applicationId = route.params?.applicationId || activeApplication?.applicationId || undefined;
  const initialFailure = route.params?.status === 'failed';

  const [loading, setLoading] = useState(!initialFailure && !!applicationId);
  const [error, setError] = useState<string | null>(initialFailure ? route.params?.errorMessage || 'We couldn’t submit your application right now.' : null);
  const [application, setApplication] = useState<any | null>(null);

  useEffect(() => {
    setLastVisitedRoute('LoanSubmissionResult');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    if (initialFailure || !applicationId || !chamaId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadApplication = async () => {
      try {
        const response = await memberLoanService.getApplicationDetail(chamaId, applicationId);
        if (!mounted) {
          return;
        }
        setApplication(response);
        setError(null);
        setActiveApplication({
          applicationId: response.id,
          chamaId,
          amount: response.requested_amount,
          status: response.status,
          reference: `APP-${response.id.split('-')[0].toUpperCase()}`,
          submittedAt: response.submitted_at,
          createdLoanId: response.created_loan || null,
        });

        if (['rejected', 'approved', 'disbursed'].includes(response.status)) {
          clearActiveApplication();
        }
      } catch {
        if (mounted) {
          setError('We couldn’t submit your application right now.');
          setApplication(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadApplication();
    return () => {
      mounted = false;
    };
  }, [applicationId, chamaId, clearActiveApplication, initialFailure, setActiveApplication]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Status" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Confirming your application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!initialFailure && !application && error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Status" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Submission status unavailable"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{ label: 'Back to Loans', onPress: () => navigation.navigate('MemberLoans', { chamaId }) }}
        />
      </SafeAreaView>
    );
  }

  const applicationState = application
    ? normalizeApplicationState(application.status)
    : 'cancelled';
  const meta = initialFailure
    ? {
        label: 'Not submitted',
        accent: colors.error,
        tone: 'error' as const,
        icon: 'close-circle',
        title: 'We couldn’t submit your application right now.',
        text: route.params?.errorMessage || 'Please try again when you are ready.',
      }
    : applicationState === 'approved'
    ? {
        ...getLoanApplicationMeta('approved'),
        title: 'Your application has been approved.',
        text: 'Open the active loan details to review the approved amount and repayment plan.',
      }
    : applicationState === 'rejected'
    ? {
        ...getLoanApplicationMeta('rejected'),
        title: 'This application was not approved.',
        text: 'Review the result and next steps before you apply again.',
      }
    : {
        ...getLoanApplicationMeta('submitted_pending_review'),
        title: 'Your application has been submitted.',
        text: 'Your application is under review. You can track it from your loan workspace at any time.',
      };

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Application Status" subtitle={activeChama?.name} showBack />
      <View style={styles.content}>
        <Card style={styles.statusCard}>
          <View style={[styles.iconWrap, { backgroundColor: `${meta.accent}16` }]}>
            <Icon name={meta.icon as any} size={40} color={meta.accent} />
          </View>
          <Badge label={meta.label} variant={meta.tone} size="sm" />
          <Text style={styles.statusTitle}>{meta.title}</Text>
          <Text style={styles.statusText}>{meta.text}</Text>

          {application ? (
            <Card style={styles.summaryCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan amount</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(application.requested_amount, activeChama?.currency || 'KES')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Application reference</Text>
                <Text style={styles.detailValue}>APP-{application.id.split('-')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted</Text>
                <Text style={styles.detailValue}>{formatDate(application.submitted_at)}</Text>
              </View>
            </Card>
          ) : null}
        </Card>

        {initialFailure ? (
          <View style={styles.actionColumn}>
            <Button title="Retry" onPress={() => navigation.replace('LoanReviewConfirm', { chamaId })} />
            <Button
              title="Back to Loans"
              variant="outline"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
          </View>
        ) : applicationState === 'approved' && application?.created_loan ? (
          <View style={styles.actionColumn}>
            <Button
              title="Open Active Loan"
              onPress={() =>
                navigation.replace('LoanDetail', {
                  loanId: application.created_loan as string,
                  chamaId,
                })
              }
            />
            <Button
              title="Back to Loans"
              variant="outline"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
          </View>
        ) : applicationState === 'rejected' ? (
          <View style={styles.actionColumn}>
            <Button
              title="View Result"
              onPress={() =>
                navigation.replace('RejectedApplicationState', {
                  applicationId: application!.id,
                  chamaId,
                })
              }
            />
            <Button
              title="Back to Loans"
              variant="outline"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
          </View>
        ) : (
          <View style={styles.actionColumn}>
            <Button
              title="View Application"
              onPress={() =>
                navigation.replace('LoanApplicationDetails', {
                  applicationId: application!.id,
                  chamaId,
                })
              }
            />
            <Button
              title="Back to Loans"
              variant="outline"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  statusCard: {
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: typography.fontSize['2xl'],
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    gap: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  detailLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'right',
  },
  actionColumn: {
    gap: spacing[3],
  },
});
