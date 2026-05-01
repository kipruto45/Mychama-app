import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCanCreateChama } from '@/auth/guards';
import { COUNTIES } from '@/constants';
import { MainStackParamList } from '@/navigation/types';
import { authService } from '@/services/authService';
import { chamaService } from '@/services/chamaService';
import { profileService } from '@/services/profileService';
import { useOnboardingStore, type CreateChamaSetupState } from '@/store/onboardingStore';
import { getCreateChamaErrorMessage } from '@/screens/shared/chama/createChamaFeedback';
import {
  type CreateChamaInviteDraft,
  type CreateChamaPayload,
  type CreateChamaWorkflowDraft,
} from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type CreateChamaScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreateChama'>;

type SetupStepKey =
  | 'intro'
  | 'basic_details'
  | 'contributions'
  | 'rules'
  | 'loans_and_fines'
  | 'meetings'
  | 'invites'
  | 'review';

type SetupStep = {
  key: SetupStepKey;
  title: string;
  description: string;
  state: CreateChamaSetupState;
};

const SETUP_STEPS: SetupStep[] = [
  {
    key: 'intro',
    title: 'Set Up Your Chama',
    description: 'We will guide you through the structure, governance, and first member setup.',
    state: 'chama_setup_not_started',
  },
  {
    key: 'basic_details',
    title: 'Chama Basics',
    description: 'Name the chama and give members clear context before they join.',
    state: 'chama_setup_basic_details',
  },
  {
    key: 'contributions',
    title: 'Contribution Setup',
    description: 'Define contribution amounts, frequency, and payment expectations.',
    state: 'chama_setup_contributions',
  },
  {
    key: 'rules',
    title: 'Rules and Obligations',
    description: 'Set contribution obligations and attendance expectations.',
    state: 'chama_setup_rules',
  },
  {
    key: 'loans_and_fines',
    title: 'Loans and Fines',
    description: 'Decide how lending and penalties should work from day one.',
    state: 'chama_setup_loans_and_fines',
  },
  {
    key: 'meetings',
    title: 'Meeting Preferences',
    description: 'Set governance rhythm, reminders, and attendance support.',
    state: 'chama_setup_meetings',
  },
  {
    key: 'invites',
    title: 'Invite Members',
    description: 'Optionally line up the first members before launch.',
    state: 'chama_setup_invites',
  },
  {
    key: 'review',
    title: 'Review Setup',
    description: 'Confirm the setup before your chama goes live.',
    state: 'chama_setup_review',
  },
];

const CATEGORY_OPTIONS: Array<CreateChamaWorkflowDraft['category']> = ['savings', 'investment', 'welfare', 'mixed'];
const PRIVACY_OPTIONS: Array<CreateChamaWorkflowDraft['privacy']> = ['private', 'invite_only', 'open'];
const CONTRIBUTION_FREQUENCIES: Array<CreateChamaWorkflowDraft['contribution_setup']['frequency']> = [
  'weekly',
  'biweekly',
  'monthly',
];
const CONTRIBUTION_TYPES: Array<CreateChamaWorkflowDraft['contribution_type']> = [
  'monthly',
  'welfare',
  'development',
  'special',
];
const PAYMENT_OPTIONS: Array<CreateChamaWorkflowDraft['finance_settings']['payment_methods'][number]> = ['mpesa', 'cash'];
const PAYOUT_ROTATION_OPTIONS: Array<CreateChamaWorkflowDraft['payout_rules']['rotation_order']> = [
  'member_join_order',
  'manual_sequence',
  'randomized',
];
const PAYOUT_TRIGGER_OPTIONS: Array<CreateChamaWorkflowDraft['payout_rules']['trigger_mode']> = ['manual', 'auto'];
const PAYOUT_METHOD_OPTIONS: Array<CreateChamaWorkflowDraft['payout_rules']['payout_method']> = [
  'mpesa',
  'bank_transfer',
  'wallet',
];
const MEETING_FREQUENCIES: Array<CreateChamaWorkflowDraft['meeting_settings']['meeting_frequency']> = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
];
const MEETING_DAYS: Array<CreateChamaWorkflowDraft['preferred_meeting_day']> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const ATTENDANCE_EXPECTATIONS: Array<CreateChamaWorkflowDraft['attendance_expectation']> = [
  'required',
  'recommended',
  'flexible',
];
const INVITE_ROLE_OPTIONS: Array<CreateChamaInviteDraft['role_to_assign']> = [
  'MEMBER',
  'TREASURER',
  'SECRETARY',
  'AUDITOR',
];

const INITIAL_DRAFT: CreateChamaWorkflowDraft = {
  name: '',
  description: '',
  category: 'savings',
  location: {
    county: '',
    subcounty: '',
  },
  privacy: 'invite_only',
  contribution_setup: {
    amount: '1000',
    frequency: 'monthly',
    due_day: 5,
    grace_period_days: 3,
    late_fine_amount: '100',
  },
  finance_settings: {
    currency: 'KES',
    payment_methods: ['mpesa'],
    loans_enabled: true,
    fines_enabled: true,
    approval_rule: 'maker_checker',
  },
  meeting_settings: {
    meeting_frequency: 'monthly',
    quorum_percentage: 50,
    voting_enabled: true,
  },
  membership_rules: {
    invite_only: true,
    approval_required: true,
    max_members: 100,
  },
  notification_defaults: {
    member_join_alerts: true,
    payment_received_alerts: true,
    meeting_reminders: true,
    loan_updates: true,
  },
  logo_uri: null,
  contribution_type: 'monthly',
  partial_payments_allowed: false,
  attendance_expectation: 'required',
  rules_summary: '',
  payout_rules: {
    rotation_order: 'member_join_order',
    trigger_mode: 'manual',
    payout_method: 'mpesa',
  },
  loan_rules: {
    loans_enabled: true,
    max_loan_amount: '10000',
    interest_rate: '10',
    repayment_period_months: 6,
    approval_layers: 2,
  },
  governance_rules: {
    minimum_members_to_start: 3,
    quorum_percentage: 50,
    missed_payment_penalty_amount: '100',
    constitution_summary: '',
  },
  preferred_meeting_day: 'saturday',
  preferred_meeting_time: '10:00',
  meeting_reminders_enabled: true,
  attendance_tracking_enabled: true,
};

const emptyInviteDraft = (): CreateChamaInviteDraft => ({
  id: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  phone: '',
  email: '',
  role_to_assign: 'MEMBER',
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toPayload = (draft: CreateChamaWorkflowDraft): CreateChamaPayload => ({
  name: draft.name.trim(),
  description: draft.description.trim(),
  category: draft.category,
  location: {
    county: draft.location.county.trim(),
    subcounty: draft.location.subcounty.trim(),
  },
  privacy: draft.privacy,
  contribution_setup: draft.contribution_setup,
  finance_settings: draft.finance_settings,
  meeting_settings: draft.meeting_settings,
  membership_rules: draft.membership_rules,
  notification_defaults: draft.notification_defaults,
  payout_rules: draft.payout_rules,
  loan_rules: draft.loan_rules,
  governance_rules: {
    ...draft.governance_rules,
    constitution_summary: draft.governance_rules?.constitution_summary?.trim() || '',
  },
});

const hydrateDraft = (draft: CreateChamaWorkflowDraft | null): CreateChamaWorkflowDraft => {
  if (!draft) {
    return INITIAL_DRAFT;
  }

  return {
    ...INITIAL_DRAFT,
    ...draft,
    location: {
      ...INITIAL_DRAFT.location,
      ...(draft.location || {}),
    },
    contribution_setup: {
      ...INITIAL_DRAFT.contribution_setup,
      ...(draft.contribution_setup || {}),
    },
    finance_settings: {
      ...INITIAL_DRAFT.finance_settings,
      ...(draft.finance_settings || {}),
    },
    meeting_settings: {
      ...INITIAL_DRAFT.meeting_settings,
      ...(draft.meeting_settings || {}),
    },
    membership_rules: {
      ...INITIAL_DRAFT.membership_rules,
      ...(draft.membership_rules || {}),
    },
    notification_defaults: {
      ...INITIAL_DRAFT.notification_defaults,
      ...(draft.notification_defaults || {}),
    },
    payout_rules: {
      ...INITIAL_DRAFT.payout_rules,
      ...(draft.payout_rules || {}),
    },
    loan_rules: {
      ...INITIAL_DRAFT.loan_rules,
      ...(draft.loan_rules || {}),
      loans_enabled: Boolean(draft.loan_rules?.loans_enabled ?? draft.finance_settings?.loans_enabled ?? true),
    },
    governance_rules: {
      ...INITIAL_DRAFT.governance_rules,
      ...(draft.governance_rules || {}),
    },
  };
};

const getStepIndexForState = (state: CreateChamaSetupState): number => {
  const index = SETUP_STEPS.findIndex((step) => step.state === state);
  return index >= 0 ? index : 0;
};

const sanitizeInviteError = (): string =>
  'Some invites could not be sent right now. You can continue and resend them later from your chama workspace.';

export const CreateChamaScreen: React.FC = () => {
  const navigation = useNavigation<CreateChamaScreenNavigationProp>();
  const queryClient = useQueryClient();
  const canAccessChamaCreation = useCanCreateChama();
  const { createChamaProgress, setCreateChamaProgress, completeChamaCreation } = useOnboardingStore();

  const restoredStepIndex = useMemo(() => {
    if (typeof createChamaProgress.currentStep === 'number' && createChamaProgress.currentStep >= 0) {
      return Math.min(createChamaProgress.currentStep, SETUP_STEPS.length - 1);
    }
    return getStepIndexForState(createChamaProgress.setupState);
  }, [createChamaProgress.currentStep, createChamaProgress.setupState]);

  const [stepIndex, setStepIndex] = useState(restoredStepIndex);
  const [draft, setDraft] = useState<CreateChamaWorkflowDraft>(hydrateDraft(createChamaProgress.draft));
  const [inviteDrafts, setInviteDrafts] = useState<CreateChamaInviteDraft[]>(
    createChamaProgress.inviteDrafts.length > 0 ? createChamaProgress.inviteDrafts : [emptyInviteDraft()]
  );
  const [inviteFormError, setInviteFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingKycEligibility, setCheckingKycEligibility] = useState(true);
  const [kycEligible, setKycEligible] = useState(false);

  const currentStep = SETUP_STEPS[stepIndex];
  const completedSteps = stepIndex;

  useEffect(() => {
    if (!canAccessChamaCreation) {
      Alert.alert(
        'Access denied',
        'You do not have permission to create a chama from this account context.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [canAccessChamaCreation, navigation]);

  useEffect(() => {
    let isMounted = true;
    const verifyKycEligibility = async () => {
      try {
        const records = await profileService.getKYCStatus();
        const hasApprovedKyc = records.some((record) => {
          const status = String(record.status || '').toLowerCase();
          const frozen = Boolean((record as { account_frozen_for_compliance?: boolean }).account_frozen_for_compliance);
          const needsReverification = Boolean((record as { requires_reverification?: boolean }).requires_reverification);
          return status === 'approved' && !frozen && !needsReverification;
        });
        if (isMounted) {
          setKycEligible(hasApprovedKyc);
        }
        if (isMounted && !hasApprovedKyc) {
          Alert.alert(
            'KYC required',
            'Complete and pass KYC verification before creating a chama.',
            [{ text: 'Go to KYC', onPress: () => navigation.replace('KYC') }]
          );
        }
      } catch {
        if (isMounted) {
          Alert.alert(
            'Unable to verify KYC',
            'We could not confirm your KYC status right now. Please try again shortly.'
          );
          navigation.goBack();
        }
      } finally {
        if (isMounted) {
          setCheckingKycEligibility(false);
        }
      }
    };
    verifyKycEligibility();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  useEffect(() => {
    setCreateChamaProgress({
      currentStep: stepIndex,
      setupState: currentStep.state,
      draft,
      inviteDrafts,
      lastSubmissionError: null,
    });
  }, [currentStep.state, draft, inviteDrafts, setCreateChamaProgress, stepIndex]);

  const setFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateDraft = <K extends keyof CreateChamaWorkflowDraft>(
    key: K,
    value: CreateChamaWorkflowDraft[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateInvite = (id: string, patch: Partial<CreateChamaInviteDraft>) => {
    setInviteDrafts((prev) =>
      prev.map((invite) => (invite.id === id ? { ...invite, ...patch } : invite))
    );
    if (inviteFormError) {
      setInviteFormError(null);
    }
  };

  const addInviteRow = () => {
    setInviteDrafts((prev) => [...prev, emptyInviteDraft()]);
  };

  const removeInviteRow = (id: string) => {
    setInviteDrafts((prev) => {
      const next = prev.filter((invite) => invite.id !== id);
      return next.length > 0 ? next : [emptyInviteDraft()];
    });
  };

  const renderOptionPills = <T extends string>(
    label: string,
    options: T[],
    value: T,
    onSelect: (next: T) => void
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillGrid}>
        {options.map((option) => {
          const active = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {option.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderToggleCard = ({
    title,
    description,
    value,
    onToggle,
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: (next: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.toggleCard, value && styles.toggleCardActive]}
      onPress={() => onToggle(!value)}
      activeOpacity={0.9}
    >
      <Text style={[styles.toggleTitle, value && styles.toggleTitleActive]}>{title}</Text>
      <Text style={[styles.toggleDescription, value && styles.toggleDescriptionActive]}>
        {description}
      </Text>
      <Text style={[styles.toggleState, value && styles.toggleStateActive]}>
        {value ? 'Enabled' : 'Disabled'}
      </Text>
    </TouchableOpacity>
  );

  const validateCurrentStep = (): boolean => {
    const nextErrors: Record<string, string> = {};

    switch (currentStep.key) {
      case 'basic_details':
        if (!draft.name.trim()) nextErrors.name = 'Enter a chama name to continue.';
        if (!draft.location.county.trim()) nextErrors.county = 'Choose a county to continue.';
        if (!draft.location.subcounty.trim()) nextErrors.subcounty = 'Enter a subcounty to continue.';
        break;
      case 'contributions':
        if (!draft.contribution_setup.amount || Number(draft.contribution_setup.amount) <= 0) {
          nextErrors.amount = 'Choose a contribution amount to continue.';
        }
        if (draft.contribution_setup.due_day < 1 || draft.contribution_setup.due_day > 31) {
          nextErrors.due_day = 'Choose a due day between 1 and 31.';
        }
        break;
      case 'rules':
        if (!draft.rules_summary.trim()) {
          nextErrors.rules_summary = 'Add a short rules summary to continue.';
        }
        break;
      case 'loans_and_fines':
        if (draft.loan_rules.loans_enabled && Number(draft.loan_rules.max_loan_amount) <= 0) {
          nextErrors.max_loan_amount = 'Enter the maximum loan amount to continue.';
        }
        if (Number(draft.loan_rules.interest_rate) < 0) {
          nextErrors.interest_rate = 'Enter a valid interest rate.';
        }
        if (draft.governance_rules.missed_payment_penalty_amount && Number(draft.governance_rules.missed_payment_penalty_amount) < 0) {
          nextErrors.missed_payment_penalty_amount = 'Enter a valid penalty amount.';
        }
        break;
      case 'meetings':
        if (draft.governance_rules.quorum_percentage < 1 || draft.governance_rules.quorum_percentage > 100) {
          nextErrors.quorum_percentage = 'Choose a quorum between 1% and 100%.';
        }
        if (draft.governance_rules.minimum_members_to_start < 2) {
          nextErrors.minimum_members_to_start = 'Set at least 2 members before first round starts.';
        }
        if (!draft.preferred_meeting_time.trim()) {
          nextErrors.preferred_meeting_time = 'Enter the preferred meeting time.';
        }
        break;
      default:
        break;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, SETUP_STEPS.length - 1));
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const buildValidInvitePayloads = () =>
    inviteDrafts
      .map((invite) => ({
        ...invite,
        phone: invite.phone.trim(),
        email: invite.email.trim(),
      }))
      .filter((invite) => invite.phone || invite.email);

  const ensureChamaContext = async (chamaId: string) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const membershipOptions = await authService.refreshMembershipContext(chamaId);
      if (membershipOptions?.active_chama === chamaId) {
        return;
      }
      await sleep(350 * (attempt + 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    setCreateChamaProgress({
      setupState: 'chama_setup_submitting',
      lastSubmissionError: null,
    });

    try {
      const createdChama = await chamaService.createChama(toPayload(draft));
      await ensureChamaContext(createdChama.id);

      const validInvites = buildValidInvitePayloads();
      const inviteResults = await Promise.allSettled(
        validInvites.map((invite) =>
          chamaService.createInvite(createdChama.id, {
            invitee_phone: invite.phone || undefined,
            invitee_email: invite.email || undefined,
            role_to_assign: invite.role_to_assign,
            expires_in_days: 7,
            max_uses: 1,
          })
        )
      );

      const invitesSent = inviteResults.filter((result) => result.status === 'fulfilled').length;
      const inviteFailures = inviteResults.length - invitesSent;

      completeChamaCreation(createdChama.id, createdChama.name, 'chama_admin');

      await queryClient.invalidateQueries({ queryKey: ['chamas'] });
      await queryClient.invalidateQueries({ queryKey: ['chamas', createdChama.id] });
      await queryClient.refetchQueries({ queryKey: ['chamas'] });

      navigation.replace('CreateChamaSuccess', {
        chamaId: createdChama.id,
        chamaName: createdChama.name,
        creatorRole: 'Chama Admin',
        invitesRequested: validInvites.length,
        invitesSent,
        inviteFailures,
      });

      if (inviteFailures > 0) {
        Alert.alert('Chama created', sanitizeInviteError());
      }
    } catch (error) {
      const message = getCreateChamaErrorMessage(error);
      setCreateChamaProgress({
        setupState: currentStep.state,
        lastSubmissionError: message,
      });
      Alert.alert('Creation failed', message);
    } finally {
      setLoading(false);
    }
  };

  const renderIntroStep = () => (
    <Card style={styles.card}>
      <View style={styles.heroBadge}>
        <Icon name="account-group-outline" size={28} color={colors.primary[700]} />
      </View>
      <Text style={styles.sectionTitle}>Let&apos;s set up your chama.</Text>
      <Text style={styles.sectionDescription}>
        You&apos;ll define contributions, rules, meetings, and optional invites before the chama goes live.
      </Text>

      {createChamaProgress.currentStep > 0 ? (
        <View style={styles.resumeBanner}>
          <Icon name="progress-clock" size={18} color={colors.primary[700]} />
          <Text style={styles.resumeBannerText}>
            Your setup progress has been restored. You can continue from where you left off.
          </Text>
        </View>
      ) : null}

      <View style={styles.summaryPanel}>
        {[
          'Name and position your chama clearly',
          'Choose how contributions and penalties work',
          'Set meetings, governance, and first invites',
          'Review everything before launch',
        ].map((item) => (
          <View key={item} style={styles.summaryBulletRow}>
            <Icon name="check-circle" size={16} color={colors.primary[600]} />
            <Text style={styles.summaryBulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderBasicDetailsStep = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Chama basic details</Text>
      <Text style={styles.sectionDescription}>
        Give the chama a clear identity so members immediately understand what they are joining.
      </Text>
      <Input
        label="Chama name"
        placeholder="Eg. Rongai Growth Circle"
        value={draft.name}
        onChangeText={(value) => {
          updateDraft('name', value);
          setFieldError('name');
        }}
        error={errors.name}
        leftIcon={<Icon name="account-group" size={20} color={colors.neutral[400]} />}
      />
      <Input
        label="Short description"
        placeholder="What is this chama for?"
        value={draft.description}
        onChangeText={(value) => updateDraft('description', value)}
        multiline
        numberOfLines={4}
        leftIcon={<Icon name="text-box-outline" size={20} color={colors.neutral[400]} />}
      />
      {renderOptionPills('Chama category', CATEGORY_OPTIONS, draft.category, (value) =>
        updateDraft('category', value)
      )}
      {renderOptionPills('Privacy', PRIVACY_OPTIONS, draft.privacy, (value) =>
        updateDraft('privacy', value)
      )}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>County</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {COUNTIES.map((county) => {
            const active = county === draft.location.county;
            return (
              <TouchableOpacity
                key={county}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => {
                  updateDraft('location', { ...draft.location, county });
                  setFieldError('county');
                }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{county}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {errors.county ? <Text style={styles.errorText}>{errors.county}</Text> : null}
      </View>
      <Input
        label="Subcounty"
        placeholder="Eg. Ongata Rongai"
        value={draft.location.subcounty}
        onChangeText={(value) => {
          updateDraft('location', { ...draft.location, subcounty: value });
          setFieldError('subcounty');
        }}
        error={errors.subcounty}
        leftIcon={<Icon name="map-marker-outline" size={20} color={colors.neutral[400]} />}
      />
    </Card>
  );

  const renderContributionStep = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Contribution setup</Text>
      <Text style={styles.sectionDescription}>
        Choose how members contribute, when payments are due, and how flexible the collection should feel.
      </Text>
      <Input
        label="Default contribution amount"
        placeholder="1000"
        value={draft.contribution_setup.amount}
        onChangeText={(value) => {
          updateDraft('contribution_setup', { ...draft.contribution_setup, amount: value });
          setFieldError('amount');
        }}
        keyboardType="decimal-pad"
        error={errors.amount}
        leftIcon={<Icon name="cash" size={20} color={colors.neutral[400]} />}
      />
      {renderOptionPills(
        'Contribution frequency',
        CONTRIBUTION_FREQUENCIES,
        draft.contribution_setup.frequency,
        (value) => updateDraft('contribution_setup', { ...draft.contribution_setup, frequency: value })
      )}
      {renderOptionPills('Contribution type', CONTRIBUTION_TYPES, draft.contribution_type, (value) =>
        updateDraft('contribution_type', value)
      )}
      <Input
        label="Due day"
        placeholder="5"
        value={String(draft.contribution_setup.due_day)}
        onChangeText={(value) => {
          updateDraft('contribution_setup', {
            ...draft.contribution_setup,
            due_day: Number(value || 0),
          });
          setFieldError('due_day');
        }}
        keyboardType="number-pad"
        error={errors.due_day}
      />
      {renderToggleCard({
        title: 'Allow partial payments',
        description: 'Members can settle contributions in smaller chunks before the due date.',
        value: draft.partial_payments_allowed,
        onToggle: (next) => updateDraft('partial_payments_allowed', next),
      })}
    </Card>
  );

  const renderRulesStep = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Payout and participation rules</Text>
      <Text style={styles.sectionDescription}>
        Configure payout behavior and member obligations from day one.
      </Text>
      {renderOptionPills('Payout rotation order', PAYOUT_ROTATION_OPTIONS, draft.payout_rules.rotation_order, (value) =>
        updateDraft('payout_rules', { ...draft.payout_rules, rotation_order: value })
      )}
      {renderOptionPills('Payout trigger', PAYOUT_TRIGGER_OPTIONS, draft.payout_rules.trigger_mode, (value) =>
        updateDraft('payout_rules', { ...draft.payout_rules, trigger_mode: value })
      )}
      {renderOptionPills('Payout method', PAYOUT_METHOD_OPTIONS, draft.payout_rules.payout_method, (value) =>
        updateDraft('payout_rules', { ...draft.payout_rules, payout_method: value })
      )}
      {renderOptionPills(
        'Attendance expectation',
        ATTENDANCE_EXPECTATIONS,
        draft.attendance_expectation,
        (value) => updateDraft('attendance_expectation', value)
      )}
      {renderToggleCard({
        title: 'Approval required for new members',
        description: 'New members wait for approval before full activation.',
        value: draft.membership_rules.approval_required,
        onToggle: (next) =>
          updateDraft('membership_rules', { ...draft.membership_rules, approval_required: next }),
      })}
      {renderToggleCard({
        title: 'Invite-only joins',
        description: 'Keep the chama private until an admin or delegated leader invites members.',
        value: draft.membership_rules.invite_only,
        onToggle: (next) =>
          updateDraft('membership_rules', { ...draft.membership_rules, invite_only: next }),
      })}
      <Input
        label="Rules summary"
        placeholder="Eg. Contributions are due by the 5th, attendance is expected, and missed payments attract fines."
        value={draft.rules_summary}
        onChangeText={(value) => {
          updateDraft('rules_summary', value);
          setFieldError('rules_summary');
        }}
        multiline
        numberOfLines={5}
        error={errors.rules_summary}
        leftIcon={<Icon name="file-document-edit-outline" size={20} color={colors.neutral[400]} />}
      />
    </Card>
  );

  const renderLoansStep = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Loans and fines settings</Text>
      <Text style={styles.sectionDescription}>
        Keep lending and penalties simple from the start. You can refine the policy later inside the admin area.
      </Text>
      <View style={styles.booleanGrid}>
        {renderToggleCard({
          title: 'Enable loans',
          description: 'Allow the chama to operate a basic loan product from launch.',
          value: draft.loan_rules.loans_enabled,
          onToggle: (next) => {
            updateDraft('loan_rules', { ...draft.loan_rules, loans_enabled: next });
            updateDraft('finance_settings', { ...draft.finance_settings, loans_enabled: next });
          },
        })}
        {renderToggleCard({
          title: 'Enable fines',
          description: 'Use late-payment penalties and enforcement from the start.',
          value: draft.finance_settings.fines_enabled,
          onToggle: (next) =>
            updateDraft('finance_settings', { ...draft.finance_settings, fines_enabled: next }),
        })}
      </View>
      {draft.loan_rules.loans_enabled ? (
        <>
          <Input
            label="Maximum loan amount"
            placeholder="10000"
            value={draft.loan_rules.max_loan_amount}
            onChangeText={(value) => {
              updateDraft('loan_rules', { ...draft.loan_rules, max_loan_amount: value });
              setFieldError('max_loan_amount');
            }}
            keyboardType="decimal-pad"
            error={errors.max_loan_amount}
            leftIcon={<Icon name="bank-transfer-out" size={20} color={colors.neutral[400]} />}
          />
          <Input
            label="Interest rate (%)"
            placeholder="10"
            value={draft.loan_rules.interest_rate}
            onChangeText={(value) => {
              updateDraft('loan_rules', { ...draft.loan_rules, interest_rate: value });
              setFieldError('interest_rate');
            }}
            keyboardType="decimal-pad"
            error={errors.interest_rate}
          />
          <Input
            label="Repayment period (months)"
            placeholder="6"
            value={String(draft.loan_rules.repayment_period_months)}
            onChangeText={(value) =>
              updateDraft('loan_rules', {
                ...draft.loan_rules,
                repayment_period_months: Number(value || 0),
              })
            }
            keyboardType="number-pad"
          />
          <Input
            label="Approval layers"
            placeholder="2"
            value={String(draft.loan_rules.approval_layers)}
            onChangeText={(value) =>
              updateDraft('loan_rules', {
                ...draft.loan_rules,
                approval_layers: Number(value || 0),
              })
            }
            keyboardType="number-pad"
          />
        </>
      ) : null}
      {draft.finance_settings.fines_enabled ? (
        <Input
          label="Late payment fine"
          placeholder="100"
          value={draft.governance_rules.missed_payment_penalty_amount}
          onChangeText={(value) => {
            updateDraft('governance_rules', {
              ...draft.governance_rules,
              missed_payment_penalty_amount: value,
            });
            setFieldError('missed_payment_penalty_amount');
          }}
          keyboardType="decimal-pad"
          error={errors.missed_payment_penalty_amount}
        />
      ) : (
        <View style={styles.disabledPanel}>
          <Icon name="information-outline" size={18} color={colors.neutral[500]} />
          <Text style={styles.disabledPanelText}>
            Fines are currently disabled. Members will not be penalized automatically for late payments.
          </Text>
        </View>
      )}
    </Card>
  );

  const renderMeetingsStep = () => (
    (() => {
      const baseNotificationDefaults = draft.notification_defaults || INITIAL_DRAFT.notification_defaults;
      const notificationDefaults = {
        member_join_alerts: Boolean(baseNotificationDefaults?.member_join_alerts),
        payment_received_alerts: Boolean(baseNotificationDefaults?.payment_received_alerts),
        meeting_reminders: Boolean(baseNotificationDefaults?.meeting_reminders),
        loan_updates: Boolean(baseNotificationDefaults?.loan_updates),
      };
      return (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Governance and meetings</Text>
          <Text style={styles.sectionDescription}>
            Set governance controls, quorum, and meeting rhythm for launch.
          </Text>
          {renderOptionPills(
            'Meeting frequency',
            MEETING_FREQUENCIES,
            draft.meeting_settings.meeting_frequency,
            (value) => updateDraft('meeting_settings', { ...draft.meeting_settings, meeting_frequency: value })
          )}
          {renderOptionPills('Preferred day', MEETING_DAYS, draft.preferred_meeting_day, (value) =>
            updateDraft('preferred_meeting_day', value)
          )}
          <Input
            label="Preferred meeting time"
            placeholder="10:00"
            value={draft.preferred_meeting_time}
            onChangeText={(value) => {
              updateDraft('preferred_meeting_time', value);
              setFieldError('preferred_meeting_time');
            }}
            error={errors.preferred_meeting_time}
            leftIcon={<Icon name="clock-outline" size={20} color={colors.neutral[400]} />}
          />
          <Input
            label="Quorum percentage"
            placeholder="50"
            value={String(draft.governance_rules.quorum_percentage)}
            onChangeText={(value) => {
              const quorum = Number(value || 0);
              updateDraft('meeting_settings', {
                ...draft.meeting_settings,
                quorum_percentage: quorum,
              });
              updateDraft('governance_rules', {
                ...draft.governance_rules,
                quorum_percentage: quorum,
              });
              setFieldError('quorum_percentage');
            }}
            keyboardType="number-pad"
            error={errors.quorum_percentage}
          />
          <Input
            label="Minimum members to start"
            placeholder="3"
            value={String(draft.governance_rules.minimum_members_to_start)}
            onChangeText={(value) => {
              updateDraft('governance_rules', {
                ...draft.governance_rules,
                minimum_members_to_start: Number(value || 0),
              });
              setFieldError('minimum_members_to_start');
            }}
            keyboardType="number-pad"
            error={errors.minimum_members_to_start}
          />
          <Input
            label="Constitution summary (optional)"
            placeholder="Outline governance principles or upload details later."
            value={draft.governance_rules.constitution_summary || ''}
            onChangeText={(value) =>
              updateDraft('governance_rules', {
                ...draft.governance_rules,
                constitution_summary: value,
              })
            }
            multiline
            numberOfLines={4}
            leftIcon={<Icon name="book-open-page-variant-outline" size={20} color={colors.neutral[400]} />}
          />
          <View style={styles.booleanGrid}>
            {renderToggleCard({
              title: 'Meeting reminders',
              description: 'Notify members ahead of the preferred meeting schedule.',
              value: draft.meeting_reminders_enabled,
              onToggle: (next) => {
                updateDraft('meeting_reminders_enabled', next);
                updateDraft('notification_defaults', {
                  ...notificationDefaults,
                  meeting_reminders: next,
                });
              },
            })}
            {renderToggleCard({
              title: 'Attendance tracking',
              description: 'Track who attended and use attendance as part of governance.',
              value: draft.attendance_tracking_enabled,
              onToggle: (next) => updateDraft('attendance_tracking_enabled', next),
            })}
          </View>
        </Card>
      );
    })()
  );

  const renderInvitesStep = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Invite first members</Text>
      <Text style={styles.sectionDescription}>
        This step is optional. You can create the chama now and invite members later from the admin workspace.
      </Text>
      {inviteDrafts.map((invite, index) => (
        <View key={invite.id} style={styles.inviteCard}>
          <View style={styles.inviteHeaderRow}>
            <Text style={styles.inviteTitle}>Invite {index + 1}</Text>
            {inviteDrafts.length > 1 ? (
              <TouchableOpacity onPress={() => removeInviteRow(invite.id)}>
                <Text style={styles.linkText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Input
            label="Phone number"
            placeholder="0712345678"
            value={invite.phone}
            onChangeText={(value) => updateInvite(invite.id, { phone: value })}
            keyboardType="phone-pad"
            leftIcon={<Icon name="cellphone" size={20} color={colors.neutral[400]} />}
          />
          <Input
            label="Email address"
            placeholder="member@example.com"
            value={invite.email}
            onChangeText={(value) => updateInvite(invite.id, { email: value })}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Icon name="email-outline" size={20} color={colors.neutral[400]} />}
          />
          {renderOptionPills('Assigned role', INVITE_ROLE_OPTIONS, invite.role_to_assign, (value) =>
            updateInvite(invite.id, { role_to_assign: value })
          )}
        </View>
      ))}
      {inviteFormError ? <Text style={styles.errorText}>{inviteFormError}</Text> : null}
      <TouchableOpacity style={styles.secondaryAction} onPress={addInviteRow} activeOpacity={0.9}>
        <Icon name="account-plus-outline" size={18} color={colors.primary[700]} />
        <Text style={styles.secondaryActionText}>Add another invite</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryAction, styles.secondaryGhostAction]}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <Text style={styles.secondaryGhostText}>Skip for now</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderReviewStep = () => {
    const summaryRows: Array<[string, string]> = [
      ['Chama name', draft.name],
      ['Category', draft.category],
      ['Location', `${draft.location.subcounty}, ${draft.location.county}`],
      ['Contribution', `KES ${draft.contribution_setup.amount} / ${draft.contribution_setup.frequency}`],
      ['Contribution type', draft.contribution_type],
      ['Partial payments', draft.partial_payments_allowed ? 'Allowed' : 'Not allowed'],
      ['Rules summary', draft.rules_summary],
      ['Payout', `${draft.payout_rules.trigger_mode} via ${draft.payout_rules.payout_method}`],
      ['Loans', draft.loan_rules.loans_enabled ? `Enabled, cap KES ${draft.loan_rules.max_loan_amount}` : 'Disabled'],
      ['Loan interest', `${draft.loan_rules.interest_rate}%`],
      ['Approval layers', String(draft.loan_rules.approval_layers)],
      ['Fines', draft.finance_settings.fines_enabled ? `Enabled, KES ${draft.governance_rules.missed_payment_penalty_amount}` : 'Disabled'],
      ['Governance quorum', `${draft.governance_rules.quorum_percentage}%`],
      ['Start threshold', `${draft.governance_rules.minimum_members_to_start} members`],
      ['Meetings', `${draft.meeting_settings.meeting_frequency} on ${draft.preferred_meeting_day} at ${draft.preferred_meeting_time}`],
      ['Invites', `${buildValidInvitePayloads().length} prepared`],
    ];

    return (
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Review your setup before creating your chama.</Text>
        <Text style={styles.sectionDescription}>
          You will become the Chama Admin immediately after creation and this chama will become your active workspace.
        </Text>
        <View style={styles.reviewBanner}>
          <Icon name="shield-check" size={20} color={colors.success} />
          <Text style={styles.reviewBannerText}>
            Creator role, finance defaults, RBAC, and governance settings will be activated automatically.
          </Text>
        </View>
        {summaryRows.map(([label, value]) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
        <View style={styles.editSection}>
          {SETUP_STEPS.slice(1, -1).map((step, index) => (
            <TouchableOpacity
              key={step.key}
              style={styles.editShortcut}
              onPress={() => setStepIndex(index + 1)}
              activeOpacity={0.9}
            >
              <Text style={styles.editShortcutText}>Edit {step.title}</Text>
              <Icon name="chevron-right" size={18} color={colors.primary[700]} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.key) {
      case 'intro':
        return renderIntroStep();
      case 'basic_details':
        return renderBasicDetailsStep();
      case 'contributions':
        return renderContributionStep();
      case 'rules':
        return renderRulesStep();
      case 'loans_and_fines':
        return renderLoansStep();
      case 'meetings':
        return renderMeetingsStep();
      case 'invites':
        return renderInvitesStep();
      case 'review':
      default:
        return renderReviewStep();
    }
  };

  if (!canAccessChamaCreation || checkingKycEligibility || !kycEligible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Create Chama</Text>
          <Text style={styles.subtitle}>{currentStep.title}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>
          Step {stepIndex + 1} of {SETUP_STEPS.length}
        </Text>
        <Text style={styles.progressDescription}>{currentStep.description}</Text>
      </View>

      <View style={styles.progressWrap}>
        {SETUP_STEPS.map((step, index) => (
          <View key={step.key} style={styles.progressItem}>
            <View style={[styles.progressDot, index <= completedSteps && styles.progressDotActive]}>
              {index < completedSteps ? (
                <Icon name="check" size={14} color={colors.light.surface} />
              ) : (
                <Text style={[styles.progressText, index <= completedSteps && styles.progressTextActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < SETUP_STEPS.length - 1 ? (
              <View style={[styles.progressLine, index < completedSteps && styles.progressLineActive]} />
            ) : null}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {currentStep.key === 'review' ? (
          <Button
            title="Create chama"
            onPress={handleSubmit}
            loading={loading}
            loadingTitle="Creating chama..."
            disabled={loading}
            style={styles.primaryButton}
            icon={!loading ? <Icon name="check" size={18} color="#FFFFFF" /> : undefined}
          />
        ) : (
          <Button
            title={currentStep.key === 'intro' ? 'Start setup' : 'Continue'}
            onPress={handleNext}
            style={styles.primaryButton}
            icon={<Icon name="arrow-right" size={18} color="#FFFFFF" />}
          />
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  progressMeta: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
    marginBottom: spacing[1],
  },
  progressDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  progressItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[200],
    zIndex: 2,
  },
  progressDotActive: {
    backgroundColor: colors.primary[500],
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing[1],
  },
  progressLineActive: {
    backgroundColor: colors.primary[500],
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[500],
  },
  progressTextActive: {
    color: colors.light.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  card: {
    marginBottom: spacing[4],
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  fieldBlock: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  pillRow: {
    gap: spacing[2],
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
  },
  pillActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    textTransform: 'capitalize',
  },
  pillTextActive: {
    color: colors.primary[700],
  },
  summaryPanel: {
    gap: spacing[3],
  },
  summaryBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  summaryBulletText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  resumeBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[700],
  },
  booleanGrid: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  toggleCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
    padding: spacing[4],
  },
  toggleCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  toggleTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  toggleTitleActive: {
    color: colors.primary[700],
  },
  toggleDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
    lineHeight: 20,
  },
  toggleDescriptionActive: {
    color: colors.primary[700],
  },
  toggleState: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  toggleStateActive: {
    color: colors.primary[600],
  },
  disabledPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  disabledPanelText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  inviteCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  inviteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  inviteTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    marginTop: spacing[1],
  },
  secondaryGhostAction: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
  },
  secondaryActionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  secondaryGhostText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[600],
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  reviewBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  summaryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  editSection: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  editShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  editShortcutText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing[1],
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
  },
  primaryButton: {
    width: '100%',
  },
});

export default CreateChamaScreen;
