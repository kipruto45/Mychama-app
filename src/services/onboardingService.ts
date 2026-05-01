/**
 * Onboarding Service
 * 
 * Manages onboarding flows, checklists, and guided setup
 * for both new members and chama creators.
 */

import { apiClient } from '@/api/client';
import { Role } from '@/auth/roles';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
  action?: () => Promise<void>;
  screen?: string;
}

export interface OnboardingChecklist {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  progress: number; // 0-100
  completed: boolean;
}

export interface OnboardingContext {
  userId: string;
  chamaId?: string;
  role: Role;
  isNewUser: boolean;
  isChamaCreator: boolean;
  completedSteps: string[];
}

// ============================================================================
// ONBOARDING SERVICE CLASS
// ============================================================================

class OnboardingService {
  // ==========================================================================
  // MEMBER ONBOARDING
  // ==========================================================================

  /**
   * Get member onboarding checklist
   */
  getMemberOnboardingChecklist(chamaName: string): OnboardingChecklist {
    return {
      id: 'member_onboarding',
      name: 'Welcome to ' + chamaName,
      description: 'Complete these steps to get started',
      progress: 0,
      completed: false,
      steps: [
        {
          id: 'complete_profile',
          title: 'Complete Your Profile',
          description: 'Add your personal information and photo',
          completed: false,
          required: true,
          order: 1,
          screen: 'EditProfile',
        },
        {
          id: 'verify_phone',
          title: 'Verify Your Phone Number',
          description: 'Confirm your phone number with OTP',
          completed: false,
          required: true,
          order: 2,
          screen: 'OTPVerification',
        },
        {
          id: 'view_chama_details',
          title: 'View Chama Details',
          description: 'Learn about your chama\'s rules and structure',
          completed: false,
          required: true,
          order: 3,
          screen: 'ChamaDetail',
        },
        {
          id: 'make_first_contribution',
          title: 'Make Your First Contribution',
          description: 'Start building your savings with your first contribution',
          completed: false,
          required: false,
          order: 4,
          screen: 'MakeContribution',
        },
        {
          id: 'attend_first_meeting',
          title: 'Attend Your First Meeting',
          description: 'Join an upcoming meeting to meet other members',
          completed: false,
          required: false,
          order: 5,
          screen: 'Meetings',
        },
        {
          id: 'explore_dashboard',
          title: 'Explore Your Dashboard',
          description: 'See your savings, contributions, and chama insights',
          completed: false,
          required: false,
          order: 6,
          screen: 'Dashboard',
        },
      ],
    };
  }

  // ==========================================================================
  // CHAMA CREATOR ONBOARDING
  // ==========================================================================

  /**
   * Get chama creator onboarding checklist
   */
  getCreatorOnboardingChecklist(chamaName: string): OnboardingChecklist {
    return {
      id: 'creator_onboarding',
      name: 'Set Up ' + chamaName,
      description: 'Complete these steps to configure your chama',
      progress: 0,
      completed: false,
      steps: [
        {
          id: 'basic_details',
          title: 'Add Basic Details',
          description: 'Set chama name, description, and profile image',
          completed: false,
          required: true,
          order: 1,
          screen: 'CreateChama',
        },
        {
          id: 'contribution_setup',
          title: 'Set Up Contributions',
          description: 'Define contribution amounts, frequency, and due dates',
          completed: false,
          required: true,
          order: 2,
          screen: 'ChamaSettings',
        },
        {
          id: 'finance_settings',
          title: 'Configure Finance Settings',
          description: 'Set up accounts, categories, and financial rules',
          completed: false,
          required: true,
          order: 3,
          screen: 'ChamaSettings',
        },
        {
          id: 'meeting_settings',
          title: 'Set Meeting Preferences',
          description: 'Configure meeting frequency, reminders, and agenda',
          completed: false,
          required: false,
          order: 4,
          screen: 'ChamaSettings',
        },
        {
          id: 'membership_rules',
          title: 'Define Membership Rules',
          description: 'Set join policies, roles, and member limits',
          completed: false,
          required: true,
          order: 5,
          screen: 'ChamaSettings',
        },
        {
          id: 'invite_members',
          title: 'Invite Your First Members',
          description: 'Send invitations to people you want to join',
          completed: false,
          required: false,
          order: 6,
          screen: 'InviteMember',
        },
        {
          id: 'create_first_meeting',
          title: 'Schedule First Meeting',
          description: 'Set up your first chama meeting',
          completed: false,
          required: false,
          order: 7,
          screen: 'CreateMeeting',
        },
        {
          id: 'review_settings',
          title: 'Review All Settings',
          description: 'Double-check all configurations before launch',
          completed: false,
          required: true,
          order: 8,
          screen: 'ChamaSettings',
        },
      ],
    };
  }

  // ==========================================================================
  // ONBOARDING PROGRESS
  // ==========================================================================

  /**
   * Mark onboarding step as completed
   */
  async completeStep(
    checklistId: string,
    stepId: string,
    chamaId?: string
  ): Promise<boolean> {
    try {
      await apiClient.post('/v1/onboarding/complete-step', {
        checklist_id: checklistId,
        step_id: stepId,
        chama_id: chamaId,
      });
      return true;
    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
      return false;
    }
  }

  /**
   * Get onboarding progress for user
   */
  async getOnboardingProgress(chamaId?: string): Promise<{
    completedSteps: string[];
    progress: number;
    isComplete: boolean;
  }> {
    try {
      const response = await apiClient.get<{
        completed_steps: string[];
        progress: number;
        is_complete: boolean;
      }>('/v1/onboarding/progress', {
        params: { chama_id: chamaId },
      });

      return {
        completedSteps: response.completed_steps,
        progress: response.progress,
        isComplete: response.is_complete,
      };
    } catch (error) {
      console.error('Failed to get onboarding progress:', error);
      return {
        completedSteps: [],
        progress: 0,
        isComplete: false,
      };
    }
  }

  /**
   * Skip onboarding
   */
  async skipOnboarding(chamaId?: string): Promise<boolean> {
    try {
      await apiClient.post('/v1/onboarding/skip', {
        chama_id: chamaId,
      });
      return true;
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      return false;
    }
  }

  // ==========================================================================
  // GUIDED SETUP
  // ==========================================================================

  /**
   * Get suggested defaults for chama creation
   */
  getSuggestedDefaults(): {
    contributionAmount: number;
    contributionFrequency: 'weekly' | 'monthly';
    meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
    maxMembers: number;
    joinPolicy: 'open' | 'invite_only' | 'approval_required';
  } {
    return {
      contributionAmount: 1000, // KES
      contributionFrequency: 'monthly',
      meetingFrequency: 'monthly',
      maxMembers: 20,
      joinPolicy: 'approval_required',
    };
  }

  /**
   * Get smart setup recommendations based on chama type
   */
  getSmartRecommendations(chamaType: string): {
    contributionRange: { min: number; max: number };
    recommendedFrequency: string;
    suggestedFeatures: string[];
  } {
    const recommendations: Record<string, {
      contributionRange: { min: number; max: number };
      recommendedFrequency: string;
      suggestedFeatures: string[];
    }> = {
      savings: {
        contributionRange: { min: 500, max: 5000 },
        recommendedFrequency: 'monthly',
        suggestedFeatures: ['loans', 'emergency_fund', 'investments'],
      },
      investment: {
        contributionRange: { min: 2000, max: 20000 },
        recommendedFrequency: 'monthly',
        suggestedFeatures: ['investments', 'dividends', 'portfolio_tracking'],
      },
      welfare: {
        contributionRange: { min: 200, max: 1000 },
        recommendedFrequency: 'monthly',
        suggestedFeatures: ['emergency_fund', 'insurance', 'support'],
      },
      merry_go_round: {
        contributionRange: { min: 1000, max: 10000 },
        recommendedFrequency: 'monthly',
        suggestedFeatures: ['rotation_tracking', 'payout_schedule'],
      },
    };

    return recommendations[chamaType] || recommendations.savings;
  }

  // ==========================================================================
  // TOOLTIPS AND GUIDANCE
  // ==========================================================================

  /**
   * Get tooltip content for onboarding steps
   */
  getTooltipContent(stepId: string): {
    title: string;
    content: string;
    tips: string[];
  } {
    const tooltips: Record<string, {
      title: string;
      content: string;
      tips: string[];
    }> = {
      complete_profile: {
        title: 'Complete Your Profile',
        content: 'A complete profile helps other members know you and builds trust within the chama.',
        tips: [
          'Use a clear profile photo',
          'Add your full name',
          'Verify your phone number',
        ],
      },
      make_first_contribution: {
        title: 'Make Your First Contribution',
        content: 'Contributions are the foundation of your chama\'s savings. Start with your first payment.',
        tips: [
          'Choose your preferred payment method',
          'Set up automatic contributions if possible',
          'Keep your payment receipts',
        ],
      },
      attend_first_meeting: {
        title: 'Attend Your First Meeting',
        content: 'Meetings are where important decisions are made and you can connect with other members.',
        tips: [
          'Check the meeting agenda beforehand',
          'Prepare any questions you have',
          'Arrive on time',
        ],
      },
    };

    return tooltips[stepId] || {
      title: 'Step Information',
      content: 'Complete this step to continue your onboarding.',
      tips: [],
    };
  }

  /**
   * Get next recommended action
   */
  getNextAction(
    checklist: OnboardingChecklist
  ): OnboardingStep | null {
    const incompleteSteps = checklist.steps
      .filter(step => !step.completed)
      .sort((a, b) => a.order - b.order);

    return incompleteSteps.length > 0 ? incompleteSteps[0] : null;
  }

  /**
   * Calculate checklist progress
   */
  calculateProgress(checklist: OnboardingChecklist): number {
    const completedSteps = checklist.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / checklist.steps.length) * 100);
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();
