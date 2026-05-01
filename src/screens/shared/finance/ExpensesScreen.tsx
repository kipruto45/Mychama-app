import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/components/ui';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { financeService } from '@/services/financeService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { ExpenseRecord } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type ExpensesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Expenses'>;
type ExpensesScreenRouteProp = RouteProp<MainStackParamList, 'Expenses'>;

type ExpenseFilter = 'all' | 'pending' | 'approved' | 'paid';

const FILTERS: Array<{ key: ExpenseFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
];

const EXPENSE_CATEGORIES = [
  'Meeting',
  'Transport',
  'Welfare',
  'Operations',
  'Investment',
  'Emergency',
];

const getStatusVariant = (status: string) => {
  if (['paid', 'completed'].includes(status)) return 'success' as const;
  if (['approved'].includes(status)) return 'info' as const;
  if (['rejected', 'cancelled'].includes(status)) return 'error' as const;
  return 'warning' as const;
};

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const route = useRoute<ExpensesScreenRouteProp>();
  const routeChamaId = route.params?.chamaId;
  const { activeChama, activeChamaId, isLoading: isLoadingChamaContext } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const currency = activeChama?.currency || 'KES';

  const canSubmitExpense = useCanPerformAction(Permission.CAN_VIEW_FINANCE, chamaId || undefined);
  const canApproveExpense = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, chamaId || undefined);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExpenseFilter>(route.params?.filter || 'all');
  const [formVisible, setFormVisible] = useState(false);
  const [paymentExpenseId, setPaymentExpenseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptReference, setReceiptReference] = useState('');

  const loadExpenses = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const rows = await financeService.getExpenses(chamaId);
      setExpenses(
        rows.sort(
          (left, right) =>
            new Date(right.expense_date || right.created_at || '').getTime() -
            new Date(left.expense_date || left.created_at || '').getTime()
        )
      );
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load expenses.')
          : 'Unable to load expenses.';
      setError(message);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [chamaId, isLoadingChamaContext]);

  useEffect(() => {
    setFilter(route.params?.filter || 'all');
  }, [route.params?.filter]);

  const resetForm = () => {
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setVendorName('');
    setDescription('');
    setNotes('');
    setReceiptReference('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleCreateExpense = async () => {
    if (!chamaId) {
      Alert.alert('Chama required', 'Switch into a chama before submitting an expense request.');
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert('Amount required', 'Enter a valid expense amount.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description required', 'Explain what this expense is for.');
      return;
    }

    setSaving(true);

    try {
      await financeService.createExpense(chamaId, {
        category,
        amount,
        expense_date: expenseDate,
        description: description.trim(),
        vendor_name: vendorName.trim() || undefined,
        notes: notes.trim() || undefined,
        receipt_reference: receiptReference.trim() || undefined,
      });

      setFormVisible(false);
      resetForm();
      await loadExpenses();
      Alert.alert('Expense submitted', 'The request is now waiting for review and payment.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to submit expense.')
          : 'Unable to submit expense.';
      Alert.alert('Expense failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseDecision = (expense: ExpenseRecord, action: 'approve' | 'reject') => {
    const title = action === 'approve' ? 'Approve expense' : 'Reject expense';
    const message =
      action === 'approve'
        ? 'This request will move to the payment stage.'
        : 'This request will be marked as rejected.';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'approve' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            if (action === 'approve') {
              await financeService.approveExpense(chamaId, expense.id);
            } else {
              await financeService.rejectExpense(chamaId, expense.id);
            }

            await loadExpenses();
          } catch (serviceError) {
            const reason =
              typeof serviceError === 'object' && serviceError && 'message' in serviceError
                ? String((serviceError as { message?: string }).message || `Unable to ${action} expense.`)
                : `Unable to ${action} expense.`;
            Alert.alert('Action failed', reason);
          }
        },
      },
    ]);
  };

  const handleRecordPayment = async () => {
    if (!paymentExpenseId) {
      return;
    }

    setSaving(true);

    try {
      await financeService.markExpensePaid(chamaId, paymentExpenseId, {
        payment_reference: paymentReference.trim() || undefined,
      });
      setPaymentExpenseId(null);
      setPaymentReference('');
      await loadExpenses();
      Alert.alert('Payment recorded', 'The expense now appears as paid in the finance trail.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to record payment.')
          : 'Unable to record payment.';
      Alert.alert('Payment failed', message);
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const rows = {
      pending: 0,
      approved: 0,
      paid: 0,
    };

    expenses.forEach((expense) => {
      if (['paid', 'completed'].includes(expense.status)) {
        rows.paid += Number(expense.amount || 0);
      } else if (expense.status === 'approved') {
        rows.approved += Number(expense.amount || 0);
      } else if (!['rejected', 'cancelled'].includes(expense.status)) {
        rows.pending += Number(expense.amount || 0);
      }
    });

    return rows;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (filter === 'all') {
      return expenses;
    }
    if (filter === 'pending') {
      return expenses.filter((expense) => !['approved', 'paid', 'completed', 'rejected', 'cancelled'].includes(expense.status));
    }
    if (filter === 'approved') {
      return expenses.filter((expense) => expense.status === 'approved');
    }
    return expenses.filter((expense) => ['paid', 'completed'].includes(expense.status));
  }, [expenses, filter]);

  const renderExpenseCard = (expense: ExpenseRecord) => (
    <Card key={expense.id} style={styles.expenseCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{expense.description}</Text>
          <Text style={styles.cardSubtitle}>
            {expense.category} {expense.vendor_name ? `• ${expense.vendor_name}` : ''}
          </Text>
        </View>
        <Badge
          label={expense.status.replace(/_/g, ' ')}
          variant={getStatusVariant(expense.status)}
          size="sm"
        />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountValue}>{formatCurrency(expense.amount, currency)}</Text>
        <Text style={styles.dateText}>{formatDate(expense.expense_date)}</Text>
      </View>

      {expense.notes ? <Text style={styles.notesText}>{expense.notes}</Text> : null}

      <View style={styles.metaGroup}>
        {expense.payment_reference ? (
          <Text style={styles.metaText}>Payment ref: {expense.payment_reference}</Text>
        ) : null}
        {expense.receipt_reference ? (
          <Text style={styles.metaText}>Receipt: {expense.receipt_reference}</Text>
        ) : null}
      </View>

      {expense.audit_trail && expense.audit_trail.length > 0 ? (
        <View style={styles.auditSection}>
          <Text style={styles.auditTitle}>Audit trail</Text>
          {expense.audit_trail.slice(0, 3).map((entry) => (
            <Text key={entry.id} style={styles.auditText}>
              {entry.action.replace(/_/g, ' ')} • {formatDate(entry.created_at)}
              {entry.actor_name ? ` • ${entry.actor_name}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {canApproveExpense && ['pending', 'pending_approval'].includes(expense.status) ? (
        <View style={styles.actionRow}>
          <Button
            title="Approve"
            variant="outline"
            onPress={() => handleExpenseDecision(expense, 'approve')}
            style={styles.actionButton}
          />
          <Button
            title="Reject"
            variant="ghost"
            onPress={() => handleExpenseDecision(expense, 'reject')}
            style={styles.actionButton}
          />
        </View>
      ) : null}

      {canApproveExpense && expense.status === 'approved' ? (
        <Button
          title="Record Payment"
          onPress={() => setPaymentExpenseId(expense.id)}
          variant="primary"
        />
      ) : null}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading expenses</Text>
          <Text style={styles.centerText}>Pulling the latest requests, approvals, and payment records.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Expense management becomes available once you switch into a chama context."
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
        <Text style={styles.title}>Expenses</Text>
        {canSubmitExpense ? (
          <TouchableOpacity onPress={() => setFormVisible(true)} style={styles.headerButton}>
            <Icon name="plus" size={22} color={colors.primary[500]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Icon name="receipt-text-check-outline" size={22} color={colors.primary[500]} />
            <Text style={styles.guidanceTitle}>Controlled expense workflow</Text>
          </View>
          <Text style={styles.guidanceText}>
            Every expense should move through request, review, payment, and audit history so chama money
            is not spent informally.
          </Text>
        </Card>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('pending')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.pending.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('approved')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Approved</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.approved.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('paid')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.paid.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <EmptyState
            title="Expense data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadExpenses()} />}
            style={styles.inlineState}
          />
        ) : filteredExpenses.length > 0 ? (
          filteredExpenses.map(renderExpenseCard)
        ) : (
          <EmptyState
            title="No expenses yet"
            description="Expense requests, approvals, and payment records will appear here once the chama starts using this workflow."
            action={
              canSubmitExpense ? <Button title="New Expense Request" onPress={() => setFormVisible(true)} /> : undefined
            }
            style={styles.inlineState}
          />
        )}
      </ScrollView>

      <Modal visible={formVisible} onClose={() => setFormVisible(false)} title="Expense Request">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalHelper}>Choose a category and capture the details that approvers will review.</Text>

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((option) => {
              const isSelected = option === category;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setCategory(option)}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Input
            label="Expense Date"
            value={expenseDate}
            onChangeText={setExpenseDate}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="Vendor or Payee"
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="Optional"
            autoCapitalize="words"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What is this expense for?"
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Receipt Reference"
            value={receiptReference}
            onChangeText={setReceiptReference}
            placeholder="Link, filename, or receipt code"
            autoCapitalize="none"
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional approval context"
            autoCapitalize="sentences"
            multiline
            numberOfLines={2}
          />

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={() => setFormVisible(false)} style={styles.modalButton} />
            <Button title="Submit" onPress={handleCreateExpense} loading={saving} style={styles.modalButton} />
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={Boolean(paymentExpenseId)}
        onClose={() => {
          setPaymentExpenseId(null);
          setPaymentReference('');
        }}
        title="Record Expense Payment"
      >
        <Input
          label="Payment Reference"
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="M-Pesa code, cash receipt, or voucher number"
          autoCapitalize="characters"
        />
        <View style={styles.modalActions}>
          <Button
            title="Close"
            variant="ghost"
            onPress={() => {
              setPaymentExpenseId(null);
              setPaymentReference('');
            }}
            style={styles.modalButton}
          />
          <Button
            title="Save Payment"
            onPress={handleRecordPayment}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>
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
  },
  backButton: {
    padding: spacing[2],
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  guidanceCard: {
    marginBottom: spacing[4],
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  guidanceTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  guidanceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryCardTouch: {
    flex: 1,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  filterLabelActive: {
    color: colors.light.background,
  },
  expenseCard: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  amountValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  metaGroup: {
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  auditSection: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing[1],
  },
  auditTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  auditText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  inlineState: {
    marginTop: spacing[6],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginTop: spacing[3],
  },
  centerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 20,
  },
  modalHelper: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  categoryChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  categoryChipSelected: {
    backgroundColor: colors.primary[100],
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  categoryChipTextSelected: {
    color: colors.primary[700],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  modalButton: {
    flex: 1,
  },
});
