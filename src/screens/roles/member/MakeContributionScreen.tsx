import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { memberContributionService } from '@/services/memberContributionService';
import { useAuthStore } from '@/store/authStore';
import { useMemberContributionFlowStore } from '@/store/memberContributionFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  amountToDisplay,
  getContributionTypeColor,
  getContributionTypeIcon,
  getObligationStateMeta,
} from './contributionWorkflowShared';

type MakeContributionNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MakeContribution'>;
type MakeContributionRouteProp = RouteProp<MainStackParamList, 'MakeContribution'>;

const sanitizeAmountInput = (value: string) => value.replace(/[^0-9.]/g, '');

export const MakeContributionScreen: React.FC = () => {
  const navigation = useNavigation<MakeContributionNavigationProp>();
  const route = useRoute<MakeContributionRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const currentUser = useAuthStore((state) => state.user);
  const { draft, patchDraft, setDraft, setLastVisitedRoute } = useMemberContributionFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const mode = route.params?.mode || draft?.mode || 'contribution';
  const [workspace, setWorkspace] = useState<any>(null);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(
    route.params?.contributionTypeId || draft?.contributionTypeId || null
  );
  const [amount, setAmount] = useState(route.params?.prefilledAmount || draft?.amount || '');

  useEffect(() => {
    setLastVisitedRoute('MakeContribution');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    if (!chamaId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const [workspaceResponse, penaltiesResponse] = await Promise.all([
          memberContributionService.getWorkspace(chamaId),
          memberContributionService.getPenalties(chamaId).catch(() => []),
        ]);
        if (!mounted) {
          return;
        }
        setWorkspace(workspaceResponse);
        setPenalties(penaltiesResponse);
        setError(null);

        if (!selectedTypeId && workspaceResponse.obligations?.length) {
          const firstDue =
            workspaceResponse.obligations.find((item: any) =>
              ['overdue', 'due', 'partially_paid', 'upcoming'].includes(item.state)
            ) || workspaceResponse.obligations[0];
          setSelectedTypeId(firstDue.contribution_type_id);
          if (!amount) {
            setAmount(firstDue.remaining_amount || firstDue.required_amount);
          }
        }
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your contributions right now. Please try again.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [chamaId]);

  const selectedPenalty = useMemo(
    () => penalties.find((item) => item.id === route.params?.penaltyId) || null,
    [penalties, route.params?.penaltyId]
  );

  const selectedObligation = useMemo(
    () =>
      workspace?.obligations?.find((item: any) => item.contribution_type_id === selectedTypeId) || null,
    [selectedTypeId, workspace]
  );

  const selectedTypeName = selectedPenalty
    ? 'Fine / Penalty'
    : selectedObligation?.contribution_type_name || route.params?.contributionTypeName || 'Contribution';

  const amountOptions = useMemo(() => {
    const options: string[] = [];
    if (selectedPenalty?.outstanding_amount) {
      options.push(selectedPenalty.outstanding_amount);
    } else if (selectedObligation?.remaining_amount) {
      options.push(selectedObligation.remaining_amount);
    }
    if (selectedObligation?.required_amount && !options.includes(selectedObligation.required_amount)) {
      options.push(selectedObligation.required_amount);
    }
    return options.filter(Boolean).slice(0, 3);
  }, [selectedObligation, selectedPenalty]);

  const validationMessage = useMemo(() => {
    const numericAmount = Number(amount || 0);
    if (!numericAmount) {
      return 'Enter a valid amount to continue.';
    }
    if (selectedPenalty && numericAmount > Number(selectedPenalty.outstanding_amount || 0)) {
      return 'Enter an amount within the outstanding penalty balance.';
    }
    return null;
  }, [amount, selectedPenalty]);

  useEffect(() => {
    if (!chamaId) {
      return;
    }

    setDraft({
      chamaId,
      mode,
      contributionTypeId: selectedPenalty ? null : selectedTypeId,
      contributionTypeName: selectedTypeName,
      amount,
      dueDate: selectedPenalty?.due_date || selectedObligation?.due_date || route.params?.dueDate || null,
      cycleLabel: selectedPenalty
        ? 'Penalty payment'
        : selectedObligation?.due_date
        ? formatDate(selectedObligation.due_date)
        : null,
      penaltyId: selectedPenalty?.id || route.params?.penaltyId || null,
      paymentMethod: 'mpesa',
      phone: draft?.phone || currentUser?.phone || '',
    });
  }, [
    amount,
    chamaId,
    currentUser?.phone,
    draft?.phone,
    mode,
    route.params?.dueDate,
    route.params?.penaltyId,
    selectedObligation,
    selectedPenalty,
    selectedTypeId,
    selectedTypeName,
    setDraft,
  ]);

  const handleContinue = () => {
    if (!chamaId || validationMessage) {
      return;
    }

    navigation.navigate('PaymentMethod', {
      chamaId,
      amount,
      currency: workspace?.summary?.currency || activeChama?.currency || 'KES',
      contributionTypeId: selectedPenalty ? undefined : selectedTypeId || undefined,
      contributionTypeName: selectedTypeName,
      dueDate: selectedPenalty?.due_date || selectedObligation?.due_date || undefined,
      mode: selectedPenalty ? 'penalty' : 'contribution',
      penaltyId: selectedPenalty?.id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Make Contribution" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Preparing your payment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Make Contribution" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can prepare the right contribution options."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Make Contribution" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load contribution options"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Make Contribution" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.contextCard}>
          <Text style={styles.contextEyebrow}>{activeChama?.name || 'Current chama'}</Text>
          <Text style={styles.contextTitle}>Make your contribution securely.</Text>
          <Text style={styles.contextText}>
            Review the contribution type, confirm the amount, and continue to payment.
          </Text>
        </Card>

        {!selectedPenalty ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contribution type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeChipRow}
            >
              {workspace?.obligations?.map((item: any) => {
                const selected = item.contribution_type_id === selectedTypeId;
                const state = getObligationStateMeta(item.state);
                return (
                  <TouchableOpacity
                    key={item.contribution_type_id}
                    activeOpacity={0.85}
                    style={[
                      styles.typeChip,
                      selected && styles.typeChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedTypeId(item.contribution_type_id);
                      setAmount(item.remaining_amount || item.required_amount);
                    }}
                  >
                    <View
                      style={[
                        styles.typeChipIcon,
                        {
                          backgroundColor: `${getContributionTypeColor(item.contribution_type_name)}1A`,
                        },
                      ]}
                    >
                      <Icon
                        name={getContributionTypeIcon(item.contribution_type_name) as any}
                        size={18}
                        color={getContributionTypeColor(item.contribution_type_name)}
                      />
                    </View>
                    <View style={styles.typeChipCopy}>
                      <Text style={styles.typeChipTitle}>{item.contribution_type_name}</Text>
                      <Text style={styles.typeChipMeta}>
                        {formatCurrency(item.required_amount, workspace?.summary?.currency || 'KES')}
                      </Text>
                    </View>
                    <Badge label={state.label} variant={state.variant} size="sm" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Card>
        ) : (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Penalty to clear</Text>
            <View style={styles.typeChipSelected}>
              <Text style={styles.typeChipTitle}>Fine / Penalty</Text>
              <Text style={styles.typeChipMeta}>
                Due {formatDate(selectedPenalty.due_date)} • {selectedPenalty.reason || selectedPenalty.issued_reason}
              </Text>
            </View>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount to pay</Text>
            <Text style={styles.amountValue}>
              {(workspace?.summary?.currency || 'KES')} {amountToDisplay(amount || '0')}
            </Text>
            <Text style={styles.amountHelp}>
              {selectedPenalty
                ? 'Pay the outstanding fine amount or a smaller amount if partial fine payment is supported.'
                : selectedObligation?.remaining_amount && Number(selectedObligation.remaining_amount) > 0
                ? `You have an outstanding balance of ${formatCurrency(
                    selectedObligation.remaining_amount,
                    workspace?.summary?.currency || 'KES'
                  )}.`
                : 'Confirm the amount you want to contribute for this cycle.'}
            </Text>
          </View>

          {amountOptions.length ? (
            <View style={styles.amountOptionsRow}>
              {amountOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.amountOptionChip}
                  onPress={() => setAmount(option)}
                >
                  <Text style={styles.amountOptionText}>
                    {formatCurrency(option, workspace?.summary?.currency || 'KES')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Input
            label="Custom amount"
            value={amount}
            onChangeText={(value) => setAmount(sanitizeAmountInput(value))}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            error={validationMessage || undefined}
          />
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Contribution summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>{selectedTypeName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Due date</Text>
            <Text style={styles.summaryValue}>
              {selectedPenalty?.due_date
                ? formatDate(selectedPenalty.due_date)
                : selectedObligation?.due_date
                ? formatDate(selectedObligation.due_date)
                : 'No due date'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(amount || '0', workspace?.summary?.currency || 'KES')}
            </Text>
          </View>
        </Card>

        <Button
          title="Continue to payment"
          onPress={handleContinue}
          disabled={!!validationMessage}
        />
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
    color: colors.neutral[500],
  },
  contextCard: {
    backgroundColor: '#F4FAF6',
    borderWidth: 1,
    borderColor: '#DDEDD9',
  },
  contextEyebrow: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    color: colors.primary[700],
    marginBottom: spacing[1],
    fontFamily: typography.fontFamily.medium,
  },
  contextTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  contextText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
  },
  sectionCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  typeChipRow: {
    gap: spacing[3],
  },
  typeChip: {
    width: 280,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: colors.light.background,
    gap: spacing[3],
  },
  typeChipSelected: {
    borderWidth: 1,
    borderColor: '#CBE6D4',
    backgroundColor: '#F7FCF8',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    ...shadows.sm,
  },
  typeChipIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipCopy: {
    gap: spacing[1],
  },
  typeChipTitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  typeChipMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  amountCard: {
    backgroundColor: '#123524',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  amountLabel: {
    color: '#C4DDCF',
    fontSize: typography.fontSize.sm,
  },
  amountValue: {
    marginTop: spacing[2],
    color: colors.light.background,
    fontSize: 32,
    fontFamily: typography.fontFamily.bold,
  },
  amountHelp: {
    marginTop: spacing[2],
    color: '#DDEDD9',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  amountOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  amountOptionChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.full,
  },
  amountOptionText: {
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  summaryCard: {
    gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});

export default MakeContributionScreen;
