/**
 * Chama Setup Service
 * 
 * Manages multi-step chama creation wizard with validation,
 * transactional creation, and smart defaults.
 */

import { apiClient } from '@/api/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ChamaBasicDetails {
  name: string;
  description: string;
  category: 'savings' | 'investment' | 'welfare' | 'merry_go_round' | 'other';
  profileImage?: string;
}

export interface ContributionSetup {
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dueDay: number; // Day of week (0-6) or day of month (1-31)
  gracePeriodDays: number;
  lateFeePercentage: number;
  allowPartialPayments: boolean;
}

export interface FinanceSettings {
  currency: string;
  initialBalance: number;
  reservePercentage: number;
  enableLoans: boolean;
  maxLoanMultiplier: number; // Multiple of contributions
  loanInterestRate: number;
  enableEmergencyFund: boolean;
  emergencyFundPercentage: number;
}

export interface MeetingSettings {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  duration: number; // minutes
  enableReminders: boolean;
  reminderDaysBefore: number;
}

export interface MembershipRules {
  joinPolicy: 'open' | 'invite_only' | 'approval_required';
  maxMembers: number;
  requireKYC: boolean;
  requirePhoneVerification: boolean;
  allowRoleDelegation: boolean;
}

export interface ChamaDraft {
  id?: string;
  basicDetails: ChamaBasicDetails;
  contributionSetup: ContributionSetup;
  financeSettings: FinanceSettings;
  meetingSettings: MeetingSettings;
  membershipRules: MembershipRules;
  currentStep: number;
  isComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// CHAMA SETUP SERVICE CLASS
// ============================================================================

class ChamaSetupService {
  private draft: ChamaDraft | null = null;

  // ==========================================================================
  // DRAFT MANAGEMENT
  // ==========================================================================

  /**
   * Initialize new chama draft with smart defaults
   */
  initializeDraft(): ChamaDraft {
    this.draft = {
      basicDetails: {
        name: '',
        description: '',
        category: 'savings',
      },
      contributionSetup: {
        amount: 1000,
        frequency: 'monthly',
        dueDay: 1,
        gracePeriodDays: 7,
        lateFeePercentage: 5,
        allowPartialPayments: false,
      },
      financeSettings: {
        currency: 'KES',
        initialBalance: 0,
        reservePercentage: 10,
        enableLoans: true,
        maxLoanMultiplier: 3,
        loanInterestRate: 10,
        enableEmergencyFund: true,
        emergencyFundPercentage: 5,
      },
      meetingSettings: {
        frequency: 'monthly',
        dayOfWeek: 6, // Saturday
        time: '10:00',
        duration: 120,
        enableReminders: true,
        reminderDaysBefore: 3,
      },
      membershipRules: {
        joinPolicy: 'approval_required',
        maxMembers: 20,
        requireKYC: true,
        requirePhoneVerification: true,
        allowRoleDelegation: false,
      },
      currentStep: 1,
      isComplete: false,
    };

    return this.draft;
  }

  /**
   * Get current draft
   */
  getDraft(): ChamaDraft | null {
    return this.draft;
  }

  /**
   * Update draft step
   */
  updateDraftStep(
    step: number,
    data: Partial<ChamaDraft>
  ): ChamaDraft {
    if (!this.draft) {
      this.initializeDraft();
    }

    this.draft = {
      ...this.draft!,
      ...data,
      currentStep: step,
      updatedAt: new Date().toISOString(),
    };

    return this.draft;
  }

  /**
   * Save draft to backend
   */
  async saveDraft(): Promise<boolean> {
    if (!this.draft) return false;

    try {
      const response = await apiClient.post<{ id: string }>(
        '/v1/chamas/draft',
        this.draft
      );

      this.draft.id = response.id;
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  }

  /**
   * Load draft from backend
   */
  async loadDraft(draftId: string): Promise<ChamaDraft | null> {
    try {
      const response = await apiClient.get<ChamaDraft>(
        `/v1/chamas/draft/${draftId}`
      );

      this.draft = response;
      return this.draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/v1/chamas/draft/${draftId}`);
      this.draft = null;
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate basic details step
   */
  validateBasicDetails(details: ChamaBasicDetails): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!details.name || details.name.trim().length < 3) {
      errors.name = 'Chama name must be at least 3 characters';
    }

    if (details.name && details.name.length > 100) {
      errors.name = 'Chama name must be less than 100 characters';
    }

    if (details.description && details.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate contribution setup step
   */
  validateContributionSetup(setup: ContributionSetup): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!setup.amount || setup.amount <= 0) {
      errors.amount = 'Contribution amount must be greater than 0';
    }

    if (setup.amount > 1000000) {
      errors.amount = 'Contribution amount is too high';
    }

    if (setup.gracePeriodDays < 0 || setup.gracePeriodDays > 30) {
      errors.gracePeriodDays = 'Grace period must be between 0 and 30 days';
    }

    if (setup.lateFeePercentage < 0 || setup.lateFeePercentage > 100) {
      errors.lateFeePercentage = 'Late fee must be between 0 and 100 percent';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate finance settings step
   */
  validateFinanceSettings(settings: FinanceSettings): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (settings.initialBalance < 0) {
      errors.initialBalance = 'Initial balance cannot be negative';
    }

    if (settings.reservePercentage < 0 || settings.reservePercentage > 100) {
      errors.reservePercentage = 'Reserve percentage must be between 0 and 100';
    }

    if (settings.enableLoans) {
      if (settings.maxLoanMultiplier <= 0) {
        errors.maxLoanMultiplier = 'Loan multiplier must be greater than 0';
      }

      if (settings.loanInterestRate < 0 || settings.loanInterestRate > 100) {
        errors.loanInterestRate = 'Interest rate must be between 0 and 100';
      }
    }

    if (settings.enableEmergencyFund) {
      if (settings.emergencyFundPercentage < 0 || settings.emergencyFundPercentage > 100) {
        errors.emergencyFundPercentage = 'Emergency fund percentage must be between 0 and 100';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate membership rules step
   */
  validateMembershipRules(rules: MembershipRules): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (rules.maxMembers < 2) {
      errors.maxMembers = 'Chama must have at least 2 members';
    }

    if (rules.maxMembers > 100) {
      errors.maxMembers = 'Maximum members cannot exceed 100';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate entire draft
   */
  validateDraft(): {
    valid: boolean;
    errors: Record<string, Record<string, string>>;
  } {
    if (!this.draft) {
      return { valid: false, errors: { general: { draft: 'No draft found' } } };
    }

    const errors: Record<string, Record<string, string>> = {};

    const basicValidation = this.validateBasicDetails(this.draft.basicDetails);
    if (!basicValidation.valid) {
      errors.basicDetails = basicValidation.errors;
    }

    const contributionValidation = this.validateContributionSetup(
      this.draft.contributionSetup
    );
    if (!contributionValidation.valid) {
      errors.contributionSetup = contributionValidation.errors;
    }

    const financeValidation = this.validateFinanceSettings(
      this.draft.financeSettings
    );
    if (!financeValidation.valid) {
      errors.financeSettings = financeValidation.errors;
    }

    const membershipValidation = this.validateMembershipRules(
      this.draft.membershipRules
    );
    if (!membershipValidation.valid) {
      errors.membershipRules = membershipValidation.errors;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // ==========================================================================
  // CHAMA CREATION
  // ==========================================================================

  /**
   * Create chama from draft (transactional)
   */
  async createChama(): Promise<{
    success: boolean;
    chamaId?: string;
    errors?: string[];
  }> {
    if (!this.draft) {
      return { success: false, errors: ['No draft found'] };
    }

    // Validate draft
    const validation = this.validateDraft();
    if (!validation.valid) {
      const errorMessages = Object.values(validation.errors)
        .flatMap(stepErrors => Object.values(stepErrors));
      return { success: false, errors: errorMessages };
    }

    try {
      const response = await apiClient.post<{ id: string }>(
        '/v1/chamas',
        this.draft
      );

      this.draft = null;
      return { success: true, chamaId: response.id };
    } catch (error: any) {
      console.error('Failed to create chama:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to create chama'],
      };
    }
  }

  // ==========================================================================
  // SMART DEFAULTS
  // ==========================================================================

  /**
   * Get smart defaults based on chama category
   */
  getSmartDefaults(category: string): Partial<ChamaDraft> {
    const defaults: Record<string, Partial<ChamaDraft>> = {
      savings: {
        contributionSetup: {
          amount: 1000,
          frequency: 'monthly',
          dueDay: 1,
          gracePeriodDays: 7,
          lateFeePercentage: 5,
          allowPartialPayments: false,
        },
        financeSettings: {
          currency: 'KES',
          initialBalance: 0,
          reservePercentage: 10,
          enableLoans: true,
          maxLoanMultiplier: 3,
          loanInterestRate: 10,
          enableEmergencyFund: true,
          emergencyFundPercentage: 5,
        },
      },
      investment: {
        contributionSetup: {
          amount: 5000,
          frequency: 'monthly',
          dueDay: 1,
          gracePeriodDays: 7,
          lateFeePercentage: 5,
          allowPartialPayments: false,
        },
        financeSettings: {
          currency: 'KES',
          initialBalance: 0,
          reservePercentage: 20,
          enableLoans: false,
          maxLoanMultiplier: 0,
          loanInterestRate: 0,
          enableEmergencyFund: false,
          emergencyFundPercentage: 0,
        },
      },
      welfare: {
        contributionSetup: {
          amount: 500,
          frequency: 'monthly',
          dueDay: 1,
          gracePeriodDays: 14,
          lateFeePercentage: 0,
          allowPartialPayments: true,
        },
        financeSettings: {
          currency: 'KES',
          initialBalance: 0,
          reservePercentage: 5,
          enableLoans: false,
          maxLoanMultiplier: 0,
          loanInterestRate: 0,
          enableEmergencyFund: true,
          emergencyFundPercentage: 10,
        },
      },
      merry_go_round: {
        contributionSetup: {
          amount: 2000,
          frequency: 'monthly',
          dueDay: 1,
          gracePeriodDays: 7,
          lateFeePercentage: 10,
          allowPartialPayments: false,
        },
        financeSettings: {
          currency: 'KES',
          initialBalance: 0,
          reservePercentage: 0,
          enableLoans: false,
          maxLoanMultiplier: 0,
          loanInterestRate: 0,
          enableEmergencyFund: false,
          emergencyFundPercentage: 0,
        },
      },
    };

    return defaults[category] || defaults.savings;
  }
}

// Export singleton instance
export const chamaSetupService = new ChamaSetupService();
