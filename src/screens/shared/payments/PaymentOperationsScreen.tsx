import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import {
  ManualPaymentApprovalPolicyRecord,
  PaymentDisputeRecord,
  paymentService,
  PaymentReconciliationIssueRecord,
  PaymentRefundRecord,
  PaymentSettlementRecord,
  PaymentStatementImportRecord,
} from '@/services/paymentService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/utils/format';

type PaymentOperationsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'PaymentOperations'
>;
type PaymentOperationsRouteProp = RouteProp<MainStackParamList, 'PaymentOperations'>;

type PolicyDraft = Pick<
  ManualPaymentApprovalPolicyRecord,
  | 'cash_maker_checker_enabled'
  | 'block_payer_self_approval'
  | 'require_cash_receipt_number'
>;

const defaultPolicyDraft: PolicyDraft = {
  cash_maker_checker_enabled: true,
  block_payer_self_approval: true,
  require_cash_receipt_number: false,
};

export const PaymentOperationsScreen: React.FC = () => {
  const navigation = useNavigation<PaymentOperationsNavigationProp>();
  const route = useRoute<PaymentOperationsRouteProp>();
  const routeChamaId = route.params?.chamaId;
  const {
    activeChamaId,
    availableChamas,
    clearSwitchError,
    getScopedChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const scopedChamaId = routeChamaId || activeChamaId || undefined;
  const canViewFinance = useCanPerformAction(Permission.CAN_VIEW_FINANCE, scopedChamaId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<PaymentRefundRecord[]>([]);
  const [disputes, setDisputes] = useState<PaymentDisputeRecord[]>([]);
  const [issues, setIssues] = useState<PaymentReconciliationIssueRecord[]>([]);
  const [policy, setPolicy] = useState<ManualPaymentApprovalPolicyRecord | null>(null);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(defaultPolicyDraft);
  const [dualApprovalThreshold, setDualApprovalThreshold] = useState('0.00');
  const [statementImports, setStatementImports] = useState<PaymentStatementImportRecord[]>([]);
  const [settlements, setSettlements] = useState<PaymentSettlementRecord[]>([]);
  const [selectedStatementImportId, setSelectedStatementImportId] = useState<string | null>(null);
  const [settlementReference, setSettlementReference] = useState('');
  const [settlementGrossAmount, setSettlementGrossAmount] = useState('');
  const [settlementFeeAmount, setSettlementFeeAmount] = useState('');
  const [settlementProvider, setSettlementProvider] = useState('');
  const [settlementMethod, setSettlementMethod] = useState<'mpesa'>('mpesa');

  const selectedImport = useMemo(
    () => statementImports.find((item) => item.id === selectedStatementImportId) || null,
    [selectedStatementImportId, statementImports]
  );

  const loadData = async () => {
    if (isLoadingChamaContext || !scopedChamaId) {
      return;
    }

    setError(null);
    try {
      const [refundRows, disputeRows, issueRows, policyRow, importRows, settlementRows] = await Promise.all([
        paymentService.getPaymentRefunds({ chama_id: scopedChamaId, limit: 30 }).catch(() => []),
        paymentService.getPaymentDisputes({ chama_id: scopedChamaId, limit: 30 }).catch(() => []),
        paymentService.getPaymentReconciliationQueue({ chama_id: scopedChamaId, limit: 30 }).catch(() => []),
        paymentService.getManualPaymentApprovalPolicy(scopedChamaId).catch(() => null),
        paymentService.getPaymentStatementImports({ chama_id: scopedChamaId, limit: 10 }).catch(() => []),
        paymentService.getPaymentSettlements({ chama_id: scopedChamaId, limit: 10 }).catch(() => []),
      ]);

      setRefunds(refundRows);
      setDisputes(disputeRows);
      setIssues(issueRows);
      setStatementImports(importRows);
      setSettlements(settlementRows);

      if (policyRow) {
        setPolicy(policyRow);
        setPolicyDraft({
          cash_maker_checker_enabled: policyRow.cash_maker_checker_enabled,
          block_payer_self_approval: policyRow.block_payer_self_approval,
          require_cash_receipt_number: policyRow.require_cash_receipt_number,
        });
        setDualApprovalThreshold(policyRow.dual_approval_threshold || '0.00');
      } else {
        setPolicy(null);
        setPolicyDraft(defaultPolicyDraft);
        setDualApprovalThreshold('0.00');
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'We could not load payment operations right now.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [scopedChamaId, isLoadingChamaContext]);

  useEffect(() => {
    if (selectedImport) {
      if (selectedImport.payment_method === 'mpesa') {
        setSettlementMethod(selectedImport.payment_method);
      }
      setSettlementProvider(selectedImport.provider_name || '');
    }
  }, [selectedImport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const withBusyAction = async (key: string, action: () => Promise<void>) => {
    try {
      setBusyAction(key);
      await action();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : 'This action could not be completed.';
      Alert.alert('Payment Operations', message);
    } finally {
      setBusyAction(null);
    }
  };

  const updatePolicyField = <K extends keyof PolicyDraft>(key: K, value: PolicyDraft[K]) => {
    setPolicyDraft((current) => ({ ...current, [key]: value }));
  };

  const savePolicy = async () => {
    if (!scopedChamaId) {
      return;
    }
    await withBusyAction('save-policy', async () => {
      const updated = await paymentService.updateManualPaymentApprovalPolicy({
        chama_id: scopedChamaId,
        ...policyDraft,
        dual_approval_threshold: dualApprovalThreshold.trim() || '0.00',
      });
      setPolicy(updated);
      Alert.alert('Payment Operations', 'Manual payment policy updated.');
      await loadData();
    });
  };

  const handleRefundDecision = async (refundId: string, approve: boolean) => {
    await withBusyAction(`${approve ? 'approve' : 'reject'}-refund-${refundId}`, async () => {
      await paymentService.approvePaymentRefund(refundId, {
        approve,
        note: approve ? 'Approved from payment operations center' : 'Rejected from payment operations center',
      });
      await loadData();
    });
  };

  const handleProcessRefund = async (refundId: string) => {
    await withBusyAction(`process-refund-${refundId}`, async () => {
      await paymentService.processPaymentRefund(refundId);
      await loadData();
    });
  };

  const handleResolveIssue = async (
    issueId: string,
    action: 'retry_verification' | 'mark_reconciled' | 'mark_failed'
  ) => {
    await withBusyAction(`${action}-${issueId}`, async () => {
      await paymentService.resolvePaymentReconciliationIssue(issueId, {
        action,
        notes: `Resolved from payment operations center with action ${action}.`,
      });
      await loadData();
    });
  };

  const handleResolveDispute = async (
    disputeId: string,
    nextStatus: 'IN_REVIEW' | 'RESOLVED' | 'REJECTED' | 'WON' | 'LOST'
  ) => {
    await withBusyAction(`${nextStatus}-${disputeId}`, async () => {
      await paymentService.resolvePaymentDispute(disputeId, {
        status: nextStatus,
        resolution_notes: `Updated from payment operations center as ${nextStatus}.`,
      });
      await loadData();
    });
  };

  const handlePostSettlement = async () => {
    if (!scopedChamaId) {
      return;
    }
    if (!selectedStatementImportId) {
      Alert.alert('Settlement Posting', 'Select a statement import first.');
      return;
    }
    if (!settlementReference.trim() || !settlementGrossAmount.trim()) {
      Alert.alert('Settlement Posting', 'Settlement reference and gross amount are required.');
      return;
    }

    await withBusyAction('create-settlement', async () => {
      await paymentService.createPaymentSettlement({
        chama_id: scopedChamaId,
        payment_method: settlementMethod,
        provider_name: settlementProvider.trim() || undefined,
        settlement_reference: settlementReference.trim(),
        gross_amount: settlementGrossAmount.trim(),
        fee_amount: settlementFeeAmount.trim() || '0.00',
        statement_import_id: selectedStatementImportId,
      });
      setSettlementReference('');
      setSettlementGrossAmount('');
      setSettlementFeeAmount('');
      Alert.alert('Settlement Posting', 'Settlement posted successfully.');
      await loadData();
    });
  };

  const isIssueActionable = (issue: PaymentReconciliationIssueRecord) =>
    Boolean(issue.id) &&
    issue.issue_type !== 'pending_payment' &&
    issue.issue_type !== 'webhook_processing_error';

  const renderRefund = (refund: PaymentRefundRecord) => (
    <Card key={refund.id} style={styles.queueCard}>
      <View style={styles.queueHeader}>
        <View>
          <Text style={styles.queueTitle}>{formatCurrency(refund.amount, 'KES')}</Text>
          <Text style={styles.queueSubtitle}>{refund.reason || 'Refund request'}</Text>
        </View>
        <View style={[styles.statusChip, getStatusChipStyle(refund.status)]}>
          <Text style={styles.statusChipText}>{refund.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <Text style={styles.queueMeta}>
        Requested {formatRelativeTime(refund.created_at)}
        {refund.requested_by_name ? ` by ${refund.requested_by_name}` : ''}
      </Text>
      <Text style={styles.queueMeta}>Intent: {refund.payment_intent}</Text>
      <View style={styles.actionRow}>
        {refund.status === 'requested' ? (
          <>
            <Button
              title="Approve"
              size="sm"
              onPress={() => void handleRefundDecision(refund.id, true)}
              loading={busyAction === `approve-refund-${refund.id}`}
              style={styles.flexButton}
            />
            <Button
              title="Reject"
              size="sm"
              variant="outline"
              onPress={() => void handleRefundDecision(refund.id, false)}
              loading={busyAction === `reject-refund-${refund.id}`}
              style={styles.flexButton}
            />
          </>
        ) : null}
        {refund.status === 'approved' ? (
          <Button
            title="Process"
            size="sm"
            onPress={() => void handleProcessRefund(refund.id)}
            loading={busyAction === `process-refund-${refund.id}`}
            style={styles.flexButton}
          />
        ) : null}
      </View>
    </Card>
  );

  const renderIssue = (issue: PaymentReconciliationIssueRecord) => (
    <Card key={`${issue.issue_type}-${issue.id || issue.provider_reference || issue.summary}`} style={styles.queueCard}>
      <View style={styles.queueHeader}>
        <View style={styles.queueTitleWrap}>
          <Text style={styles.queueTitle}>{issue.summary}</Text>
          <Text style={styles.queueSubtitle}>
            {issue.issue_type.replace(/_/g, ' ')}
            {issue.payment_method ? ` • ${issue.payment_method.toUpperCase()}` : ''}
          </Text>
        </View>
        <View style={[styles.statusChip, getSeverityChipStyle(issue.severity)]}>
          <Text style={styles.statusChipText}>{issue.severity}</Text>
        </View>
      </View>
      <Text style={styles.queueMeta}>
        {issue.amount && issue.currency ? `${formatCurrency(issue.amount, issue.currency)} • ` : ''}
        {issue.reference || issue.provider_reference || 'No reference'}
      </Text>
      {issue.created_at ? <Text style={styles.queueMeta}>{formatRelativeTime(issue.created_at)}</Text> : null}
      {isIssueActionable(issue) ? (
        <View style={styles.actionRow}>
          <Button
            title="Retry"
            size="sm"
            variant="outline"
            onPress={() => void handleResolveIssue(issue.id as string, 'retry_verification')}
            loading={busyAction === `retry_verification-${issue.id}`}
            style={styles.flexButton}
          />
          <Button
            title="Reconciled"
            size="sm"
            onPress={() => void handleResolveIssue(issue.id as string, 'mark_reconciled')}
            loading={busyAction === `mark_reconciled-${issue.id}`}
            style={styles.flexButton}
          />
          <Button
            title="Fail"
            size="sm"
            variant="ghost"
            onPress={() => void handleResolveIssue(issue.id as string, 'mark_failed')}
            loading={busyAction === `mark_failed-${issue.id}`}
            style={styles.compactButton}
          />
        </View>
      ) : (
        <Text style={styles.helperText}>This item needs manual follow-up or a provider callback, not a direct resolution action.</Text>
      )}
    </Card>
  );

  const renderDispute = (dispute: PaymentDisputeRecord) => (
    <Card key={dispute.id} style={styles.queueCard}>
      <View style={styles.queueHeader}>
        <View style={styles.queueTitleWrap}>
          <Text style={styles.queueTitle}>{dispute.category.replace(/_/g, ' ')}</Text>
          <Text style={styles.queueSubtitle}>{dispute.reason}</Text>
        </View>
        <View style={[styles.statusChip, getStatusChipStyle(dispute.status)]}>
          <Text style={styles.statusChipText}>{dispute.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <Text style={styles.queueMeta}>
        {dispute.amount ? `${formatCurrency(dispute.amount, 'KES')} • ` : ''}
        {dispute.provider_case_reference || dispute.reference || 'No external reference'}
      </Text>
      <Text style={styles.queueMeta}>
        Opened {formatRelativeTime(dispute.created_at)}
        {dispute.opened_by_name ? ` by ${dispute.opened_by_name}` : ''}
      </Text>
      <View style={styles.actionRow}>
        {dispute.status === 'OPEN' ? (
          <Button
            title="Review"
            size="sm"
            variant="outline"
            onPress={() => void handleResolveDispute(dispute.id, 'IN_REVIEW')}
            loading={busyAction === `IN_REVIEW-${dispute.id}`}
            style={styles.flexButton}
          />
        ) : null}
        {dispute.status === 'IN_REVIEW' ? (
          <>
            <Button
              title="Win"
              size="sm"
              variant="outline"
              onPress={() => void handleResolveDispute(dispute.id, 'WON')}
              loading={busyAction === `WON-${dispute.id}`}
              style={styles.flexButton}
            />
            <Button
              title="Lose"
              size="sm"
              onPress={() => void handleResolveDispute(dispute.id, 'LOST')}
              loading={busyAction === `LOST-${dispute.id}`}
              style={styles.flexButton}
            />
            <Button
              title="Reject"
              size="sm"
              variant="ghost"
              onPress={() => void handleResolveDispute(dispute.id, 'REJECTED')}
              loading={busyAction === `REJECTED-${dispute.id}`}
              style={styles.compactButton}
            />
          </>
        ) : null}
      </View>
      {dispute.financial_reversal_entry ? (
        <Text style={styles.helperText}>Financial reversal entry linked: {dispute.financial_reversal_entry}</Text>
      ) : null}
    </Card>
  );

  const renderSettlement = (settlement: PaymentSettlementRecord) => (
    <Card key={settlement.id} style={styles.queueCard}>
      <View style={styles.queueHeader}>
        <View>
          <Text style={styles.queueTitle}>{settlement.settlement_reference}</Text>
          <Text style={styles.queueSubtitle}>
            {settlement.payment_method.toUpperCase()} • {settlement.provider_name || 'Provider not captured'}
          </Text>
        </View>
        <View style={[styles.statusChip, getStatusChipStyle(settlement.status)]}>
          <Text style={styles.statusChipText}>{settlement.status}</Text>
        </View>
      </View>
      <Text style={styles.queueMeta}>
        Net {formatCurrency(settlement.net_amount, settlement.currency)} from gross{' '}
        {formatCurrency(settlement.gross_amount, settlement.currency)}
      </Text>
      <Text style={styles.queueMeta}>
        Fee {formatCurrency(settlement.fee_amount, settlement.currency)} • {formatDateTime(settlement.created_at)}
      </Text>
      {settlement.allocations?.length ? (
        <Text style={styles.helperText}>{settlement.allocations.length} transaction allocations linked.</Text>
      ) : null}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading payment operations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scopedChamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Select a chama to manage payment operations."
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (!canViewFinance) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="shield-lock-outline" size={64} color={colors.neutral[400]} />}
          title="Payment operations unavailable"
          description="Your current chama role does not have finance access for this workspace."
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Payment Operations</Text>
            <Text style={styles.title}>Run refunds, reconciliation, and settlements</Text>
          </View>
        </View>

        <View style={styles.contextSwitcher}>
          <ChamaContextSwitcher
            chamas={availableChamas}
            activeChamaId={activeChamaId}
            isSwitching={isSwitching}
            onSelectChama={(chamaId) => {
              clearSwitchError();
              void switchChama(chamaId)
                .then(() => {
                  if (route.params?.chamaId) {
                    navigation.setParams({ chamaId });
                  }
                  void loadData();
                })
                .catch(() => undefined);
            }}
            helperText={switchError}
          />
        </View>

        {error ? (
          <EmptyState
            icon={<Icon name="alert-circle-outline" size={64} color={colors.error} />}
            title="Could not load payment operations"
            description={error}
            action={<Button title="Retry" onPress={() => void loadData()} />}
            style={styles.inlineEmpty}
          />
        ) : null}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manual approval policy</Text>
            <Text style={styles.sectionSubtitle}>Tune cash verification safeguards for this chama.</Text>
          </View>

          <View style={styles.toggleGrid}>
            {[
              ['Cash maker-checker', 'cash_maker_checker_enabled'],
              ['Block self-approval', 'block_payer_self_approval'],
              ['Cash receipt required', 'require_cash_receipt_number'],
            ].map(([label, key]) => {
              const typedKey = key as keyof PolicyDraft;
              const enabled = policyDraft[typedKey];
              return (
                <TouchableOpacity
                  key={typedKey}
                  style={[styles.toggleCard, enabled && styles.toggleCardActive]}
                  onPress={() => updatePolicyField(typedKey, !enabled)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.toggleTitle, enabled && styles.toggleTitleActive]}>{label}</Text>
                  <Text style={[styles.toggleState, enabled && styles.toggleStateActive]}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Dual approval threshold</Text>
          <TextInput
            value={dualApprovalThreshold}
            onChangeText={setDualApprovalThreshold}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.input}
            placeholderTextColor={colors.neutral[400]}
          />
          <Text style={styles.helperText}>
            Payments above this amount require a second verifier before final manual approval.
          </Text>

          <Button
            title="Save Policy"
            onPress={() => void savePolicy()}
            loading={busyAction === 'save-policy'}
            style={styles.primaryAction}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Refund queue</Text>
            <Text style={styles.sectionSubtitle}>Approve and process member refund requests after policy checks.</Text>
          </View>
          {refunds.length > 0 ? refunds.map(renderRefund) : <EmptyInline title="No refund requests pending." />}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dispute queue</Text>
            <Text style={styles.sectionSubtitle}>Review member disputes and provider chargebacks from one operational queue.</Text>
          </View>
          {disputes.length > 0 ? disputes.map(renderDispute) : <EmptyInline title="No payment disputes are open right now." />}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reconciliation queue</Text>
            <Text style={styles.sectionSubtitle}>Triage mismatches, stale pending payments, and provider verification gaps.</Text>
          </View>
          {issues.length > 0 ? issues.map(renderIssue) : <EmptyInline title="No reconciliation issues right now." />}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settlement posting</Text>
            <Text style={styles.sectionSubtitle}>Select an M-Pesa statement import, then post cleared funds into settlement records.</Text>
          </View>

          <Text style={styles.inputLabel}>Choose statement import</Text>
          <View style={styles.selectionList}>
            {statementImports.length > 0 ? (
              statementImports.map((item) => {
                const selected = item.id === selectedStatementImportId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.selectionCard, selected && styles.selectionCardActive]}
                    onPress={() => setSelectedStatementImportId(item.id)}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.selectionTitle, selected && styles.selectionTitleActive]}>
                      {item.source_name || item.provider_name || item.payment_method.toUpperCase()}
                    </Text>
                    <Text style={[styles.selectionMeta, selected && styles.selectionMetaActive]}>
                      {item.payment_method.toUpperCase()} • {item.matched_rows}/{item.total_rows} matched •{' '}
                      {item.statement_date || 'No statement date'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyInline title="Import a payment statement first to post settlements safely." />
            )}
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.flexInput}>
              <Text style={styles.inputLabel}>Settlement method</Text>
              <View style={styles.methodSwitchRow}>
                {(['mpesa'] as const).map((method) => {
                  const active = settlementMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodChip, active && styles.methodChipActive]}
                      onPress={() => setSettlementMethod(method)}
                    >
                      <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                        {method.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.flexInput}>
              <Text style={styles.inputLabel}>Provider</Text>
              <TextInput
                value={settlementProvider}
                onChangeText={setSettlementProvider}
                placeholder="safaricom"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Settlement reference</Text>
          <TextInput
            value={settlementReference}
            onChangeText={setSettlementReference}
            placeholder="SETTLE-2026-0001"
            style={styles.input}
            placeholderTextColor={colors.neutral[400]}
          />

          <View style={styles.rowInputs}>
            <View style={styles.flexInput}>
              <Text style={styles.inputLabel}>Gross amount</Text>
              <TextInput
                value={settlementGrossAmount}
                onChangeText={setSettlementGrossAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.flexInput}>
              <Text style={styles.inputLabel}>Fee amount</Text>
              <TextInput
                value={settlementFeeAmount}
                onChangeText={setSettlementFeeAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </View>

          <Button
            title="Post Settlement"
            onPress={() => void handlePostSettlement()}
            loading={busyAction === 'create-settlement'}
            disabled={!selectedStatementImportId}
            style={styles.primaryAction}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent settlements</Text>
            <Text style={styles.sectionSubtitle}>Review recent M-Pesa settlement postings and fee capture.</Text>
          </View>
          {settlements.length > 0 ? settlements.map(renderSettlement) : <EmptyInline title="No settlements have been posted yet." />}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const EmptyInline = ({ title }: { title: string }) => (
  <View style={styles.inlineEmptyState}>
    <Text style={styles.inlineEmptyText}>{title}</Text>
  </View>
);

const SUCCESS_TINT = '#D1FAE5';
const ERROR_TINT = '#FEE2E2';
const WARNING_TINT = '#FEF3C7';
const INFO_TINT = '#DBEAFE';

const getStatusChipStyle = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('approved') || normalized.includes('success') || normalized.includes('reconciled') || normalized.includes('posted')) {
    return { backgroundColor: SUCCESS_TINT };
  }
  if (normalized.includes('failed') || normalized.includes('rejected')) {
    return { backgroundColor: ERROR_TINT };
  }
  return { backgroundColor: WARNING_TINT };
};

const getSeverityChipStyle = (severity: string) => {
  switch (severity) {
    case 'high':
      return { backgroundColor: ERROR_TINT };
    case 'medium':
      return { backgroundColor: WARNING_TINT };
    default:
      return { backgroundColor: INFO_TINT };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  title: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  inlineEmpty: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  metricCard: {
    width: '47%',
    padding: spacing[4],
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  metricValue: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  metricLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  sectionCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[4],
  },
  sectionHeader: {
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
  },
  toggleGrid: {
    gap: spacing[3],
  },
  toggleCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    backgroundColor: '#FFFFFF',
  },
  toggleCardActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  toggleTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
  },
  toggleTitleActive: {
    color: colors.primary[800],
  },
  toggleState: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  toggleStateActive: {
    color: colors.primary[700],
  },
  inputLabel: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[2],
    lineHeight: 19,
  },
  primaryAction: {
    marginTop: spacing[4],
  },
  queueCard: {
    marginTop: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowOpacity: 0,
    elevation: 0,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  queueTitleWrap: {
    flex: 1,
  },
  queueTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  queueSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[1],
  },
  queueMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[2],
  },
  statusChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  statusChipText: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
    flexWrap: 'wrap',
  },
  flexButton: {
    flex: 1,
    minWidth: 100,
  },
  compactButton: {
    minWidth: 88,
  },
  inlineEmptyState: {
    paddingVertical: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineEmptyText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  selectionList: {
    gap: spacing[2],
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    backgroundColor: '#FFFFFF',
  },
  selectionCardActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  selectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  selectionTitleActive: {
    color: colors.primary[800],
  },
  selectionMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[1],
  },
  selectionMetaActive: {
    color: colors.primary[700],
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  flexInput: {
    flex: 1,
  },
  methodSwitchRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  methodChip: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  methodChipActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  methodChipText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  methodChipTextActive: {
    color: colors.primary[800],
  },
});
