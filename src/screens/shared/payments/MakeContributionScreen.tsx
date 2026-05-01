import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { memberContributionService } from '@/services/memberContributionService';
import { paymentService } from '@/services/paymentService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { ContributionType } from '@/types';
import { useActiveChama } from '@/hooks';

type MakeContributionScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MakeContribution'>;
type MakeContributionScreenRouteProp = RouteProp<MainStackParamList, 'MakeContribution'>;

const PAYMENT_METHODS = [
  {
    key: 'mpesa',
    label: 'M-Pesa',
    icon: 'cellphone',
    description: 'Pay via STK push to your phone',
    color: colors.primary[500],
  },
  {
    key: 'cash',
    label: 'Cash at Meeting',
    icon: 'cash',
    description: 'Pay in person at the next meeting',
    color: colors.success,
  },
];

export const MakeContributionScreen: React.FC = () => {
  const navigation = useNavigation<MakeContributionScreenNavigationProp>();
  const route = useRoute<MakeContributionScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { activeChamaId, activeChama } = useActiveChama();
  const currentUser = useAuthStore((state) => state.user);

  const chamaId = route.params?.chamaId || activeChamaId;
  const preselectedPurpose = route.params?.purpose;
  const preselectedContributionId = route.params?.contributionId;
  const preselectedDueDate = route.params?.dueDate;

  const currency = activeChama?.currency || 'KES';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [obligations, setObligations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [chamaId]);

  useEffect(() => {
    if (preselectedContributionId && contributionTypes.length > 0) {
      const type = contributionTypes.find((t) => t.id === preselectedContributionId);
      if (type) {
        setSelectedType(type);
        setAmount(type.default_amount);
      }
    }
  }, [preselectedContributionId, contributionTypes]);

  useEffect(() => {
    if (!selectedType && contributionTypes.length > 0) {
      const firstActive = contributionTypes[0];
      setSelectedType(firstActive);
      setAmount(firstActive.default_amount);
    }
  }, [contributionTypes, selectedType]);

  const loadData = async () => {
    if (!chamaId) {
      setLoading(false);
      return;
    }

    try {
      const [types, contributions, workspace] = await Promise.all([
        financeService.getContributionTypes(chamaId),
        financeService.getContributions(chamaId),
        memberContributionService.getWorkspace(chamaId).catch(() => null),
      ]);

      const activeTypes = types.filter((t) => t.is_active);
      setContributionTypes(activeTypes);
      setUserContributions(contributions);
      setObligations(workspace?.obligations || []);
      setError(null);
    } catch (loadError) {
      console.error('Error loading contribution data:', loadError);
      setError('Failed to load contribution options');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: ContributionType) => {
    setSelectedType(type);
    if (!amount || amount === '0') {
      setAmount(type.default_amount);
    }
  };

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    setAmount(digits);
  };

  const getCurrentCycleInfo = useMemo(() => {
    if (!selectedType) return null;

    const typeContributions = userContributions
      .filter((c) => c.contribution_type === selectedType.id)
      .sort((a, b) => new Date(b.date_paid).getTime() - new Date(a.date_paid).getTime());

    const totalPaid = typeContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const required = Number(selectedType.default_amount);
    const remaining = Math.max(0, required - totalPaid);

    let dueDate: string;
    const hasContributions = typeContributions.length > 0;
    const hasPreselectedDueDate = preselectedDueDate && preselectedDueDate.length > 0;

    const matchingObligation = obligations.find(
      (ob) => ob.contribution_type_id === selectedType.id
    );

    if (hasPreselectedDueDate && !hasContributions) {
      dueDate = preselectedDueDate;
    } else if (matchingObligation?.due_date) {
      dueDate = matchingObligation.due_date;
    } else if (hasContributions) {
      const lastDate = new Date(typeContributions[0].date_paid);
      const freq = selectedType.frequency;
      if (freq === 'daily') lastDate.setDate(lastDate.getDate() + 1);
      else if (freq === 'weekly') lastDate.setDate(lastDate.getDate() + 7);
      else if (freq === 'biweekly') lastDate.setDate(lastDate.getDate() + 14);
      else if (freq === 'monthly') lastDate.setMonth(lastDate.getMonth() + 1);
      else if (freq === 'quarterly') lastDate.setMonth(lastDate.getMonth() + 3);
      else if (freq === 'annual') lastDate.setFullYear(lastDate.getFullYear() + 1);
      dueDate = lastDate.toISOString();
    } else {
      const now = new Date();
      const freq = selectedType.frequency;
      if (freq === 'daily') now.setDate(now.getDate() + 1);
      else if (freq === 'weekly') now.setDate(now.getDate() + 7);
      else if (freq === 'biweekly') now.setDate(now.getDate() + 14);
      else if (freq === 'monthly') now.setMonth(now.getMonth() + 1);
      else if (freq === 'quarterly') now.setMonth(now.getMonth() + 3);
      else if (freq === 'annual') now.setFullYear(now.getFullYear() + 1);
      dueDate = now.toISOString();
    }

    const isComplete = totalPaid >= required;
    const isOverdue = new Date() > new Date(dueDate) && !isComplete;

    return {
      totalPaid,
      required,
      remaining,
      isComplete,
      dueDate,
      isOverdue,
      lastPaid: typeContributions[0]?.date_paid,
    };
  }, [selectedType, userContributions, preselectedDueDate, obligations]);

  const isValidAmount = useMemo(() => {
    if (!selectedType) return false;
    const numAmount = parseFloat(amount);
    const defaultAmount = parseFloat(selectedType.default_amount);
    return !isNaN(numAmount) && numAmount >= defaultAmount;
  }, [amount, selectedType]);

  const isOverdue = useMemo(() => {
    if (!getCurrentCycleInfo) return false;
    const now = new Date();
    const due = new Date(getCurrentCycleInfo.dueDate);
    return now > due && !getCurrentCycleInfo.isComplete;
  }, [getCurrentCycleInfo]);

  const handleContinue = async () => {
    if (!selectedType || !isValidAmount) return;

    setSubmitting(true);
    try {
      if (selectedMethod === 'mpesa') {
        const normalizedPhone = phoneNumber.replace(/\D/g, '');
        const formattedPhone = normalizedPhone.startsWith('254')
          ? normalizedPhone
          : normalizedPhone.startsWith('0')
          ? `254${normalizedPhone.slice(1)}`
          : `254${normalizedPhone}`;

        const result = await paymentService.initiateMpesaPayment({
          chamaId: chamaId || '',
          phone: formattedPhone,
          amount: amount,
          referenceId: selectedType.id,
        });

        if (result.created) {
          navigation.navigate('PaymentStatus', {
            intentId: result.payment_intent.id,
            status: result.payment_intent.status,
            amount: amount,
            currency: currency,
            purpose: selectedType.name,
          });
        } else {
          Alert.alert('Payment Issue', 'Unable to initiate payment. Please try again.');
        }
      } else {
        await paymentService.createPayment({
          chama: chamaId || '',
          amount: amount,
          method: 'cash',
          reference_id: selectedType.id,
        });

        Alert.alert(
          'Payment Recorded',
          'Your cash payment has been recorded. Please hand over the cash to the treasurer.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (submitError) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={styles.loadingText}>Loading contribution options...</Text>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="cash-off"
      title="No contribution types available"
      message="This chama hasn't set up any contribution types yet. Contact your chama admin to get started."
    />
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.error}14` }]}>
        <Icon name="alert-circle" size={48} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Button title="Try Again" onPress={loadData} variant="secondary" style={styles.retryButton} />
    </View>
  );

  const renderChamaContext = () => (
    <Card style={styles.contextCard}>
      <View style={styles.contextHeader}>
        <Avatar name={activeChama?.name || 'Chama'} size="lg" />
        <View style={styles.contextInfo}>
          <Text style={styles.contextChamaName} numberOfLines={1}>
            {activeChama?.name || 'Loading...'}
          </Text>
          <View style={styles.contextMeta}>
            <Badge
              label="Member"
              variant="primary"
              size="sm"
              style={styles.memberBadge}
            />
            <Text style={styles.contextFrequency}>
              {selectedType ? `${selectedType.frequency} contribution` : 'Select contribution type'}
            </Text>
          </View>
        </View>
      </View>
      {selectedType && (
        <View style={styles.contextFooter}>
          <Text style={styles.contextHint}>
            Stay up to date with your {selectedType.name.toLowerCase()} contributions
          </Text>
        </View>
      )}
    </Card>
  );

  const renderDueStatus = () => {
    if (!getCurrentCycleInfo) {
      return (
        <Card style={styles.dueCard}>
          <View style={styles.dueHeader}>
            <Icon name="calendar-blank" size={20} color={colors.neutral[500]} />
            <Text style={styles.dueTitle}>Contribution Status</Text>
          </View>
          <Text style={styles.dueNone}>No contributions recorded yet for this cycle</Text>
          <Text style={styles.dueHint}>
            Select an amount and make your first payment
          </Text>
        </Card>
      );
    }

    const progress = (getCurrentCycleInfo.totalPaid / getCurrentCycleInfo.required) * 100;
    const statusColor = getCurrentCycleInfo.isComplete ? colors.success : isOverdue ? colors.error : colors.warning;
    const statusText = getCurrentCycleInfo.isComplete ? 'Paid' : isOverdue ? 'Overdue' : 'Upcoming';
    const statusVariant = getCurrentCycleInfo.isComplete ? 'success' : isOverdue ? 'error' : 'warning';

    return (
      <Card style={styles.dueCard}>
        <View style={styles.dueHeader}>
          <Text style={styles.dueTitle}>Contribution Status</Text>
          <Badge label={statusText} variant={statusVariant} size="sm" />
        </View>

        <View style={styles.dueProgressRow}>
          <View style={styles.dueProgressLabels}>
            <Text style={styles.dueLabel}>Paid</Text>
            <Text style={styles.dueAmount}>{formatCurrency(getCurrentCycleInfo.totalPaid.toString(), currency)}</Text>
          </View>
          <Text style={styles.dueLabel}>of {formatCurrency(getCurrentCycleInfo.required.toString(), currency)}</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={Math.min(progress / 100, 1)}
            color={statusColor}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.dueFooter}>
          <View style={styles.dueItem}>
            <Icon name="calendar" size={16} color={colors.neutral[500]} />
            <Text style={styles.dueItemText}>
              Due: {formatDate(getCurrentCycleInfo.dueDate, 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.dueItem}>
            <Icon name="clock-outline" size={16} color={colors.neutral[500]} />
            <Text style={styles.dueItemText}>
              {getCurrentCycleInfo.isComplete ? 'Completed' : `${getCurrentCycleInfo.remaining} remaining`}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderAmountSection = () => (
    <View style={styles.amountSection}>
      <Text style={styles.sectionLabel}>Payment Amount</Text>

      <View style={styles.amountCard}>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencyLabel}>{currency}</Text>
          <Text
            style={styles.amountValue}
            onPress={() => {
              Alert.alert('Enter Amount', 'Use the keyboard to edit amount', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => {/* Focus input would go here */} },
              ]);
            }}
          >
            {parseFloat(amount || '0').toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountQuickRow}>
          <TouchableOpacity
            style={[styles.quickChip, parseFloat(amount) === getCurrentCycleInfo?.required && styles.quickChipActive]}
            onPress={() => setAmount(getCurrentCycleInfo?.required?.toString() || selectedType?.default_amount || '')}
          >
            <Text style={[styles.quickChipText, parseFloat(amount) === getCurrentCycleInfo?.required && styles.quickChipTextActive]}>
              Full
            </Text>
          </TouchableOpacity>
          {getCurrentCycleInfo && getCurrentCycleInfo.remaining > 0 && (
            <TouchableOpacity
              style={[styles.quickChip, parseFloat(amount) === Math.ceil(getCurrentCycleInfo.remaining / 2) && styles.quickChipActive]}
              onPress={() => setAmount(Math.ceil(getCurrentCycleInfo.remaining / 2).toString())}
            >
              <Text style={[styles.quickChipText, parseFloat(amount) === Math.ceil(getCurrentCycleInfo.remaining / 2) && styles.quickChipTextActive]}>
                Half
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedType && (
        <View style={styles.amountInfo}>
          <Icon name="information" size={14} color={colors.neutral[500]} />
          <Text style={styles.amountInfoText}>
            Minimum: {formatCurrency(selectedType.default_amount, currency)} ({selectedType.frequency})
          </Text>
        </View>
      )}
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.methodSection}>
      <Text style={styles.sectionLabel}>Payment Method</Text>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedMethod === method.key;
        return (
          <TouchableOpacity
            key={method.key}
            style={[styles.methodCard, isSelected && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(method.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIconCircle, { backgroundColor: method.color + '14' }]}>
              <Icon name={method.icon as any} size={22} color={method.color} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <Text style={styles.methodDescription} numberOfLines={1}>
                {method.description}
              </Text>
            </View>
            <View style={[styles.methodCheck, isSelected && styles.methodCheckSelected]}>
              {isSelected && <Icon name="check" size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        );
      })}

      {selectedMethod === 'mpesa' && (
        <View style={styles.phoneSection}>
          <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phonePrefix}>+254</Text>
            <View style={styles.phoneInputWrapper}>
              <Text
                style={styles.phoneInput}
                suppressHighlighting
              >
                {phoneNumber.replace(/[^0-9]/g, '').slice(-9) || '7xxxxxxxx'}
              </Text>
            </View>
          </View>
          <Text style={styles.phoneHint}>
            You'll receive an STK push to confirm payment
          </Text>
        </View>
      )}

      {selectedMethod === 'cash' && (
        <Card style={styles.cashInfoCard}>
          <Icon name="information-outline" size={20} color={colors.info} />
          <Text style={styles.cashInfoText}>
            Your cash payment will be recorded. Please bring the exact amount to the next chama meeting.
          </Text>
        </Card>
      )}
    </View>
  );

  const renderSummary = () => {
    if (!selectedType) return null;

    return (
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Chama</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>{activeChama?.name}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Contribution Type</Text>
          <Text style={styles.summaryValue}>{selectedType.name}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Frequency</Text>
          <Text style={styles.summaryValue}>{selectedType.frequency}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount to Pay</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(amount, currency)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Method</Text>
          <Text style={styles.summaryValue}>
            {PAYMENT_METHODS.find((m) => m.key === selectedMethod)?.label}
          </Text>
        </View>

        {selectedMethod === 'mpesa' && phoneNumber && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone</Text>
            <Text style={styles.summaryValue}>+254 {phoneNumber.replace(/[^0-9]/g, '').slice(-9)}</Text>
          </View>
        )}
      </Card>
    );
  };

  const renderFooterNote = () => (
    <View style={styles.footerNote}>
      <Icon name="shield-check-outline" size={16} color={colors.success} />
      <Text style={styles.footerNoteText}>
        Your payment is secure. You'll receive a receipt immediately after confirmation.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Contribution</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Contribution</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  if (contributionTypes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Contribution</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderEmpty()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Contribution</Text>
        <TouchableOpacity onPress={() => Alert.alert('Help', 'Select a contribution type, enter amount, choose payment method, and confirm.')} style={styles.helpButton}>
          <Icon name="help-circle-outline" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Chama Context Card */}
        {renderChamaContext()}

        {/* Due Status */}
        {renderDueStatus()}

        {/* Contribution Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Contribution Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typesScroll}
          >
            {contributionTypes.map((type) => {
              const isSelected = selectedType?.id === type.id;
              const typeColor = getTypeColor(type.name);
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleSelectType(type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeCard, isSelected && styles.typeCardSelected]}>
                    <View style={[styles.typeIcon, { backgroundColor: `${typeColor}14` }]}>
                      <Icon name={getTypeIcon(type.name) as any} size={22} color={typeColor} />
                    </View>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeAmount}>{formatCurrency(type.default_amount, currency)}</Text>
                    <Text style={styles.typeFrequency}>{type.frequency}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Amount Section */}
        {selectedType && renderAmountSection()}

        {/* Payment Method */}
        <View style={styles.section}>
          {renderPaymentMethod()}
        </View>

        {/* Summary */}
        {selectedType && renderSummary()}

        {/* Footer Note */}
        {renderFooterNote()}

        {/* Bottom spacer for safe area */}
        <View style={{ height: insets.bottom || spacing[6] }} />
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={[styles.footer, { borderTopWidth: 1, borderTopColor: colors.neutral[100] }]}>
        <View style={styles.footerContent}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total to Pay</Text>
            <Text style={styles.footerTotalAmount}>
              {formatCurrency(amount, currency)}
            </Text>
          </View>
          <Button
            title="Pay Now"
            onPress={handleContinue}
            loading={submitting}
            loadingTitle="Processing payment..."
            disabled={!selectedType || !isValidAmount || submitting}
            style={styles.payButton}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// Icon helpers
const getTypeIcon = (name: string) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('regular') || lowerName.includes('saving')) return 'piggy-bank';
  if (lowerName.includes('welfare')) return 'heart-circle';
  if (lowerName.includes('loan') || lowerName.includes('repayment')) return 'cash-fast';
  if (lowerName.includes('emergency')) return 'alert-circle';
  if (lowerName.includes('meeting') || lowerName.includes('levy')) return 'calendar-clock';
  if (lowerName.includes('special')) return 'star-circle';
  if (lowerName.includes('fine') || lowerName.includes('penalty')) return 'alert';
  if (lowerName.includes('development') || lowerName.includes('fund')) return 'bank';
  return 'cash';
};

const getTypeColor = (name: string) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('regular') || lowerName.includes('saving')) return colors.success;
  if (lowerName.includes('welfare')) return colors.info;
  if (lowerName.includes('loan') || lowerName.includes('repayment')) return colors.primary[500];
  if (lowerName.includes('emergency')) return colors.error;
  if (lowerName.includes('fine') || lowerName.includes('penalty')) return colors.error;
  return colors.neutral[500];
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
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.light.surface,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerSpacer: {
    width: 32,
  },
  helpButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
  },
  section: {
    marginTop: spacing[5],
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[3],
  },
  contextCard: {
    padding: spacing[4],
    backgroundColor: colors.light.card,
    ...shadows.sm,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  contextChamaName: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  contextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  memberBadge: {
    alignSelf: 'flex-start',
  },
  contextFrequency: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  contextFooter: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  contextHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  dueCard: {
    padding: spacing[4],
    marginTop: spacing[4],
  },
  dueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  dueTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  dueNone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  dueHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  dueProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  dueProgressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dueLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.05,
  },
  dueAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  progressContainer: {
    marginBottom: spacing[3],
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  dueFooter: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  dueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dueItemText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  typesScroll: {
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  typeCard: {
    width: 140,
    padding: spacing[4],
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[50],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: colors.primary[500] + '08',
    borderColor: colors.primary[500],
    ...shadows.sm,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  typeName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  typeAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  typeFrequency: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  amountSection: {
    marginTop: spacing[5],
  },
  amountCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  currencyLabel: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[500],
    marginRight: spacing[2],
  },
  amountValue: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -1,
  },
  amountDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[3],
  },
  amountQuickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  quickChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  quickChipActive: {
    backgroundColor: colors.primary[500],
  },
  quickChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  quickChipTextActive: {
    color: colors.light.background,
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[3],
    gap: spacing[1],
  },
  amountInfoText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  methodSection: {
    marginTop: spacing[5],
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '08',
  },
  methodIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  methodCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCheckSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  phoneSection: {
    marginTop: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  phonePrefix: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[100],
  },
  phoneInputWrapper: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingRight: spacing[4],
  },
  phoneInput: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  phoneHint: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[2],
    marginLeft: spacing[1],
  },
  cashInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    marginTop: spacing[3],
    backgroundColor: colors.info + '10',
  },
  cashInfoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    marginLeft: spacing[2],
  },
  summaryCard: {
    padding: spacing[4],
    marginTop: spacing[5],
    backgroundColor: colors.light.card,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    textTransform: 'capitalize',
  },
  summaryAmount: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[600],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[3],
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    gap: spacing[2],
    paddingHorizontal: spacing[4],
  },
  footerNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  footerTotalAmount: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  payButton: {
    minWidth: 150,
    paddingHorizontal: spacing[6],
  },
});
