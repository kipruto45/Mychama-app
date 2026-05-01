import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
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
import { memberLoanService } from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

export type RejectedApplicationStateNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'RejectedApplicationState'
>;
type RejectedApplicationStateRouteProp = RouteProp<MainStackParamList, 'RejectedApplicationState'>;

export const RejectedApplicationStateScreen: React.FC = () => {
  const navigation = useNavigation<RejectedApplicationStateNavigationProp>();
  const route = useRoute<RejectedApplicationStateRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { clearActiveApplication, setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const applicationId = route.params.applicationId;

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedRoute('RejectedApplicationState');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    if (!chamaId || !applicationId) {
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
        clearActiveApplication();
      } catch {
        if (mounted) {
          setError('We couldn’t load your loan details right now. Please try again.');
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
  }, [applicationId, chamaId, clearActiveApplication]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Result" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading the application result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !applicationId || error || !application) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Result" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load application result"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{ label: 'Back to Loans', onPress: () => navigation.navigate('MemberLoans', { chamaId }) }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Application Result" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <Icon name="close-circle-outline" size={40} color={colors.error} />
          </View>
          <Badge label="Rejected" variant="error" size="sm" />
          <Text style={styles.heroTitle}>This application was not approved.</Text>
          <Text style={styles.heroText}>
            Review the summary below and use the guidance to improve your next application.
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Application summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted amount</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(application.requested_amount, activeChama?.currency || 'KES')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted date</Text>
            <Text style={styles.detailValue}>{formatDate(application.submitted_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>APP-{application.id.split('-')[0].toUpperCase()}</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <Text style={styles.sectionText}>
            {application.rejection_reason || 'The application did not meet the current loan rules for this review cycle.'}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.tipRow}>
            <Icon name="arrow-right-circle-outline" size={16} color={colors.primary[500]} />
            <Text style={styles.tipText}>Review your eligibility and current loan rules before trying again.</Text>
          </View>
          <View style={styles.tipRow}>
            <Icon name="arrow-right-circle-outline" size={16} color={colors.primary[500]} />
            <Text style={styles.tipText}>Improve any highlighted conditions such as contribution consistency or existing obligations.</Text>
          </View>
          <View style={styles.tipRow}>
            <Icon name="arrow-right-circle-outline" size={16} color={colors.primary[500]} />
            <Text style={styles.tipText}>Try again later when your eligibility position is stronger.</Text>
          </View>
        </Card>

        <View style={styles.actionColumn}>
          <Button
            title="Review Eligibility"
            onPress={() => navigation.navigate('LoanEligibility', { chamaId })}
          />
          <Button
            title="Back to Loans"
            variant="outline"
            onPress={() => navigation.navigate('MemberLoans', { chamaId })}
          />
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
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
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
  heroCard: {
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  sectionCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  sectionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
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
  tipRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
  },
  actionColumn: {
    gap: spacing[3],
  },
});
