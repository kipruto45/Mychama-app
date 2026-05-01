import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { aiService } from '@/services/aiService';
import { borderRadius, colors, spacing, typography } from '@/theme';

type PlatformDashboardNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PlatformDashboard'>;
type PlatformDashboardRouteProp = RouteProp<MainStackParamList, 'PlatformDashboard'>;

export const PlatformDashboardScreen: React.FC = () => {
  const navigation = useNavigation<PlatformDashboardNavigationProp>();
  const route = useRoute<PlatformDashboardRouteProp>();
  const { activeChamaId } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<
    Array<{ id: string; type: string; severity: string; description: string }>
  >([]);

  const scopedChamaId = route.params?.chamaId || activeChamaId || undefined;

  const loadPlatformData = async () => {
    try {
      setLoading(true);
      setError(null);
      const fraudData = await (scopedChamaId
        ? aiService.getFraudDetection(scopedChamaId).catch(() => null)
        : Promise.resolve(null));
      setFraudAlerts(fraudData?.alerts || []);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : 'We could not load platform operations right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlatformData();
  }, [scopedChamaId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Dashboard</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => void loadPlatformData()}>
          <Icon name="refresh" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.centerText}>Loading platform data...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Platform dashboard unavailable"
            description={error}
            action={{ label: 'Retry', onPress: () => void loadPlatformData() }}
          />
        ) : (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Fraud and risk flags</Text>
              {fraudAlerts.length === 0 ? (
                <Text style={styles.sectionSubtitle}>No active fraud flags were returned for this workspace.</Text>
              ) : (
                fraudAlerts.slice(0, 5).map((alert) => (
                  <View key={alert.id} style={styles.alertRow}>
                    <View style={styles.alertIcon}>
                      <Icon name="shield-alert-outline" size={18} color={colors.error} />
                    </View>
                    <View style={styles.alertCopy}>
                      <Text style={styles.alertTitle}>{alert.type.replace(/_/g, ' ')}</Text>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quick controls</Text>
              <View style={styles.actionStack}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PaymentOperations', { chamaId: scopedChamaId })}
                >
                  <Icon name="cog-transfer-outline" size={18} color={colors.primary[700]} />
                  <Text style={styles.actionText}>Payment operations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('ApprovalsCenter', { chamaId: scopedChamaId })}
                >
                  <Icon name="clipboard-check-multiple-outline" size={18} color={colors.primary[700]} />
                  <Text style={styles.actionText}>Approvals center</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AuditLogs', { chamaId: scopedChamaId })}
                >
                  <Icon name="history" size={18} color={colors.primary[700]} />
                  <Text style={styles.actionText}>Audit logs</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  metricCard: {
    width: '31%',
    minWidth: 100,
  },
  metricValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  metricTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  metricSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  sectionCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  alertDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  workspaceCopy: {
    flex: 1,
    marginRight: spacing[3],
  },
  workspaceTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  workspaceSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  workspaceMetric: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  actionStack: {
    gap: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
});
