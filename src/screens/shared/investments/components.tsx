/**
 * Reusable Investment Components
 * Premium, modern, fintech-style components for the investments feature
 */

import React, { useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius, colors, spacing, typography } from '@/theme';
import {
  AssetAllocationData,
  FeeBreakdown,
  PortfolioDisplayState,
  ProjectionBreakdown,
  TimelineEvent,
} from './types';

// Import Animated at the top of the file
import { Animated } from 'react-native';

// ============================================================================
// 1. PORTFOLIO SUMMARY CARD
// ============================================================================

interface PortfolioSummaryCardProps {
  portfolio: PortfolioDisplayState;
  onViewPortfolio: () => void;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({
  portfolio,
  onViewPortfolio,
}) => {
  const { colors: themeColors } = useTheme();
  const isPositiveGain = portfolio.gainsTrend === 'up';
  
  return (
    <Card style={styles.portfolioCard}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioGradient}
      >
        <View style={styles.portfolioContent}>
          <View style={styles.portfolioHeader}>
            <Text style={styles.portfolioLabel}>Your Portfolio</Text>
            <TouchableOpacity onPress={onViewPortfolio}>
              <Icon name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.portfolioMainValue}>{portfolio.currentValue}</Text>
          
          <View style={styles.portfolioMetrics}>
            <View style={styles.portfolioMetric}>
              <Text style={styles.portfolioMetricLabel}>Invested</Text>
              <Text style={styles.portfolioMetricValue}>{portfolio.totalInvested}</Text>
            </View>
            <View
              style={[
                styles.portfolioMetric,
                {
                  borderLeftColor: 'rgba(255,255,255,0.2)',
                  borderLeftWidth: 1,
                  paddingStart: spacing[4],
                },
              ]}
            >
              <View style={styles.portfolioGainRow}>
                <Icon
                  name={isPositiveGain ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={isPositiveGain ? '#4ADE80' : '#F87171'}
                />
                <Text style={styles.portfolioMetricLabel}>Gains</Text>
              </View>
              <Text
                style={[
                  styles.portfolioMetricValue,
                  { color: isPositiveGain ? '#4ADE80' : '#F87171' },
                ]}
              >
                {portfolio.totalGains} ({portfolio.gainsPercentage.toFixed(1)}%)
              </Text>
            </View>
          </View>

          {portfolio.availableReturns !== '0' && (
            <View style={styles.portfolioAvailableReturns}>
              <Icon name="gift-outline" size={16} color="#FCD34D" />
              <Text style={styles.portfolioAvailableReturnsText}>
                KES {portfolio.availableReturns} available to withdraw
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Card>
  );
};

// ============================================================================
// 2. INVESTMENT QUICK ACTIONS
// ============================================================================

interface QuickAction {
  id: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}

interface InvestmentQuickActionsProps {
  actions: QuickAction[];
}

export const InvestmentQuickActions: React.FC<InvestmentQuickActionsProps> = ({ actions }) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.quickActionsTitle, { color: themeColors.text }]}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionButton, action.disabled && styles.quickActionButtonDisabled]}
            onPress={action.onPress}
            disabled={action.disabled}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: colors.primary[50] }]}>
              <Icon
                name={action.icon}
                size={24}
                color={colors.primary[600]}
              />
            </View>
            <Text style={[styles.quickActionLabel, { color: themeColors.text }]}>
              {action.label}
            </Text>
            <Text style={[styles.quickActionSubtitle, { color: themeColors.textSecondary }]}>
              {action.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// 3. INVESTMENT PRODUCT CARD
// ============================================================================

interface InvestmentProductCardProps {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  minAmount: string;
  expectedReturn: string;
  duration: string;
  lockPeriod: string;
  onPress: () => void;
}

export const InvestmentProductCard: React.FC<InvestmentProductCardProps> = ({
  name,
  description,
  riskLevel,
  minAmount,
  expectedReturn,
  duration,
  lockPeriod,
  onPress,
}) => {
  const { colors: themeColors } = useTheme();
  const riskColor = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  }[riskLevel];

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card style={[styles.productCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.productHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: themeColors.text }]}>{name}</Text>
            <Text style={[styles.productDescription, { color: themeColors.textSecondary }]}>
              {description}
            </Text>
          </View>
          <View style={[styles.productRiskBadge, { backgroundColor: `${riskColor}15` }]}>
            <Text style={[styles.productRiskLabel, { color: riskColor }]}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Text>
          </View>
        </View>

        <View style={styles.productMetrics}>
          <View style={styles.productMetric}>
            <Text style={[styles.productMetricLabel, { color: themeColors.textSecondary }]}>
              Min Investment
            </Text>
            <Text style={[styles.productMetricValue, { color: themeColors.text }]}>
              {minAmount}
            </Text>
          </View>
          <View style={styles.productMetric}>
            <Text style={[styles.productMetricLabel, { color: themeColors.textSecondary }]}>
              Expected Return
            </Text>
            <Text style={[styles.productMetricValue, { color: colors.primary[600] }]}>
              {expectedReturn}
            </Text>
          </View>
          <View style={styles.productMetric}>
            <Text style={[styles.productMetricLabel, { color: themeColors.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.productMetricValue, { color: themeColors.text }]}>
              {duration}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.productFooter,
            { borderTopColor: themeColors.border, borderTopWidth: 1 },
          ]}
        >
          <Text style={[styles.productLockLabel, { color: themeColors.textSecondary }]}>
            Lock Period: <Text style={{ fontWeight: '600' }}>{lockPeriod}</Text>
          </Text>
          <Icon name="chevron-right" size={20} color={themeColors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

// ============================================================================
// 4. INVESTMENT RISK BADGE
// ============================================================================

interface InvestmentRiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const InvestmentRiskBadge: React.FC<InvestmentRiskBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
}) => {
  const riskConfig = (
    {
      low: { bg: '#E8F7ED', text: '#156F3D', icon: 'shield-check' },
      medium: { bg: '#FFF4E5', text: '#9A5B00', icon: 'alert-circle' },
      high: { bg: '#FDEAEA', text: '#A52A2A', icon: 'alert' },
    } satisfies Record<
      InvestmentRiskBadgeProps['level'],
      { bg: string; text: string; icon: React.ComponentProps<typeof Icon>['name'] }
    >
  )[level];

  const sizeConfig = {
    sm: { padding: spacing[2], iconSize: 14, textSize: typography.fontSize.xs },
    md: { padding: spacing[3], iconSize: 16, textSize: typography.fontSize.sm },
    lg: { padding: spacing[4], iconSize: 20, textSize: typography.fontSize.base },
  }[size];

  return (
    <View
      style={[
        styles.riskBadge,
        { backgroundColor: riskConfig.bg, padding: sizeConfig.padding },
      ]}
    >
      <Icon name={riskConfig.icon} size={sizeConfig.iconSize} color={riskConfig.text} />
      {showLabel && (
        <Text
          style={[
            styles.riskLabel,
            { color: riskConfig.text, fontSize: sizeConfig.textSize },
          ]}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)} Risk
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// 5. INVESTMENT PROGRESS CARD
// ============================================================================

interface InvestmentProgressCardProps {
  title: string;
  principalAmount: string;
  currentAmount: string;
  progressPercentage: number;
  startDate: string;
  maturityDate: string;
}

export const InvestmentProgressCard: React.FC<InvestmentProgressCardProps> = ({
  title,
  principalAmount,
  currentAmount,
  progressPercentage,
  startDate,
  maturityDate,
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <Card style={[styles.progressCard, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.progressTitle, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progressPercentage, 100)}%` },
          ]}
        />
      </View>
      
      <View style={styles.progressMetrics}>
        <View>
          <Text style={[styles.progressMetricLabel, { color: themeColors.textSecondary }]}>
            Principal
          </Text>
          <Text style={[styles.progressMetricValue, { color: themeColors.text }]}>
            {principalAmount}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.progressMetricLabel, { color: themeColors.textSecondary }]}>
            Current Value
          </Text>
          <Text style={[styles.progressMetricValue, { color: colors.primary[600] }]}>
            {currentAmount}
          </Text>
        </View>
      </View>
      
      <View
        style={[
          styles.progressDates,
          { borderTopColor: themeColors.border, borderTopWidth: 1 },
        ]}
      >
        <View>
          <Text style={[styles.progressDateLabel, { color: themeColors.textSecondary }]}>
            Started
          </Text>
          <Text style={[styles.progressDateValue, { color: themeColors.text }]}>
            {startDate}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.progressDateLabel, { color: themeColors.textSecondary }]}>
            Matures
          </Text>
          <Text style={[styles.progressDateValue, { color: themeColors.text }]}>
            {maturityDate}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// ============================================================================
// 6. RETURNS AVAILABLE CARD
// ============================================================================

interface ReturnsAvailableCardProps {
  amount: string;
  daysUntilPayout?: number;
  onUtilize: () => void;
}

export const ReturnsAvailableCard: React.FC<ReturnsAvailableCardProps> = ({
  amount,
  daysUntilPayout,
  onUtilize,
}) => {
  return (
    <LinearGradient
      colors={['#FBBF24', '#F59E0B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.returnsCard}
    >
      <View style={styles.returnsCardContent}>
        <View style={styles.returnsCardIcon}>
          <Icon name="gift" size={28} color="white" />
        </View>
        <View style={styles.returnsCardText}>
          <Text style={styles.returnsCardLabel}>Returns Available</Text>
          <Text style={styles.returnsCardAmount}>{amount}</Text>
          {daysUntilPayout && (
            <Text style={styles.returnsCardHint}>
              Next payout in {daysUntilPayout} {daysUntilPayout === 1 ? 'day' : 'days'}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onUtilize} activeOpacity={0.8}>
          <Text style={styles.returnsCardCTA}>Use →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// ============================================================================
// 7. FUNDING SOURCE SELECTOR
// ============================================================================

interface FundingSourceOption {
  id: 'wallet' | 'mpesa' | 'hybrid';
  label: string;
  availableBalance: string;
  fees?: string;
  icon: React.ComponentProps<typeof Icon>['name'];
}

interface FundingSourceSelectorProps {
  options: FundingSourceOption[];
  selected: 'wallet' | 'mpesa' | 'hybrid';
  onSelect: (source: 'wallet' | 'mpesa' | 'hybrid') => void;
}

export const FundingSourceSelector: React.FC<FundingSourceSelectorProps> = ({
  options,
  selected,
  onSelect,
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.fundingSourcesContainer}>
      <Text style={[styles.fundingSourcesTitle, { color: themeColors.text }]}>
        Funding Source
      </Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.fundingSourceOption,
            {
              backgroundColor: themeColors.card,
              borderColor:
                selected === option.id ? colors.primary[600] : themeColors.border,
              borderWidth: 2,
            },
          ]}
          onPress={() => onSelect(option.id)}
          activeOpacity={0.8}
        >
          <View style={styles.fundingSourceOptionLeft}>
            <Icon name={option.icon} size={24} color={colors.primary[600]} />
            <View style={styles.fundingSourceOptionLabels}>
              <Text style={[styles.fundingSourceOptionLabel, { color: themeColors.text }]}>
                {option.label}
              </Text>
              <Text
                style={[styles.fundingSourceOptionBalance, { color: themeColors.textSecondary }]}
              >
                Available: {option.availableBalance}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.fundingSourceCheckbox,
              {
                borderColor: selected === option.id ? colors.primary[600] : themeColors.border,
                backgroundColor:
                  selected === option.id ? colors.primary[600] : 'transparent',
              },
            ]}
          >
            {selected === option.id && (
              <Icon name="check" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================================================
// 8. INVESTMENT AMOUNT INPUT
// ============================================================================

interface InvestmentAmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minAmount?: string;
  maxAmount?: string;
  error?: string;
  currency?: string;
  showFeePreview?: boolean;
  estimatedFee?: string;
}

export const InvestmentAmountInput: React.FC<InvestmentAmountInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Enter amount',
  minAmount,
  maxAmount,
  error,
  currency = 'KES',
  showFeePreview,
  estimatedFee,
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.amountInputContainer}>
      <Text style={[styles.amountInputLabel, { color: themeColors.text }]}>
        Investment Amount
      </Text>
      <View
        style={[
          styles.amountInputBox,
          {
            backgroundColor: themeColors.surface,
            borderColor: error ? colors.error : themeColors.border,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[styles.amountInputCurrency, { color: themeColors.textSecondary }]}>
          {currency}
        </Text>
        <TextInput
          style={[styles.amountInput, { color: themeColors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={themeColors.textSecondary}
          keyboardType="decimal-pad"
        />
      </View>

      {(minAmount || maxAmount || error) && (
        <View style={styles.amountInputHints}>
          {minAmount && (
            <Text style={[styles.amountInputHint, { color: themeColors.textSecondary }]}>
              Minimum: {currency} {minAmount}
            </Text>
          )}
          {maxAmount && (
            <Text style={[styles.amountInputHint, { color: themeColors.textSecondary }]}>
              Maximum: {currency} {maxAmount}
            </Text>
          )}
          {error && (
            <Text style={[styles.amountInputError, { color: colors.error }]}>
              {error}
            </Text>
          )}
        </View>
      )}

      {showFeePreview && estimatedFee && (
        <View style={styles.amountInputFeePreview}>
          <Text style={[styles.amountInputFeeLabel, { color: themeColors.textSecondary }]}>
            Estimated Fee:
          </Text>
          <Text style={[styles.amountInputFeeValue, { color: themeColors.text }]}>
            {currency} {estimatedFee}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// 9. INVESTMENT BREAKDOWN CARD
// ============================================================================

interface BreakdownItem {
  label: string;
  value: string;
  highlighted?: boolean;
}

interface InvestmentBreakdownCardProps {
  items: BreakdownItem[];
  currency?: string;
}

export const InvestmentBreakdownCard: React.FC<InvestmentBreakdownCardProps> = ({
  items,
  currency = 'KES',
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <Card style={[styles.breakdownCard, { backgroundColor: themeColors.card }]}>
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.breakdownRow,
            index < items.length - 1 && {
              borderBottomColor: themeColors.border,
              borderBottomWidth: 1,
            },
            item.highlighted && { backgroundColor: `${colors.primary[600]}08` },
          ]}
        >
          <Text
            style={[
              styles.breakdownLabel,
              { color: item.highlighted ? colors.primary[600] : themeColors.textSecondary },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              styles.breakdownValue,
              {
                color: item.highlighted ? colors.primary[600] : themeColors.text,
                fontFamily: item.highlighted ? typography.fontFamily.bold : typography.fontFamily.semibold,
              },
            ]}
          >
            {currency} {item.value}
          </Text>
        </View>
      ))}
    </Card>
  );
};

// ============================================================================
// 10. DESTINATION SELECTOR
// ============================================================================

interface DestinationOption {
  id: 'wallet' | 'mpesa';
  label: string;
  description: string;
  fees: string;
  processingTime: string;
  icon: React.ComponentProps<typeof Icon>['name'];
}

interface DestinationSelectorProps {
  options: DestinationOption[];
  selected: 'wallet' | 'mpesa';
  onSelect: (destination: 'wallet' | 'mpesa') => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  options,
  selected,
  onSelect,
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.destinationContainer}>
      <Text style={[styles.destinationTitle, { color: themeColors.text }]}>
        Payout Destination
      </Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.destinationOption,
            {
              backgroundColor: themeColors.card,
              borderColor:
                selected === option.id ? colors.primary[600] : themeColors.border,
              borderWidth: 2,
            },
          ]}
          onPress={() => onSelect(option.id)}
          activeOpacity={0.8}
        >
          <View style={styles.destinationOptionContent}>
            <Icon name={option.icon} size={24} color={colors.primary[600]} />
            <View style={styles.destinationOptionText}>
              <Text style={[styles.destinationOptionLabel, { color: themeColors.text }]}>
                {option.label}
              </Text>
              <Text
                style={[styles.destinationOptionDescription, { color: themeColors.textSecondary }]}
              >
                {option.description}
              </Text>
            </View>
          </View>
          <View style={styles.destinationOptionDetails}>
            <Text
              style={[styles.destinationOptionFee, { color: themeColors.textSecondary }]}
            >
              {option.fees} fee
            </Text>
            <Text
              style={[styles.destinationOptionTime, { color: themeColors.textSecondary }]}
            >
              {option.processingTime}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================================================
// 11. SKELETON LOADER
// ============================================================================

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 40,
  borderRadius: radius = 8,
  style,
  animated = true,
}) => {
  const [opacity] = useState(new Animated.Value(0.5));

  React.useEffect(() => {
    if (!animated) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.neutral[200],
          opacity: animated ? opacity : 1,
        },
        style,
      ]}
    />
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  portfolioCard: {
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  portfolioGradient: {
    padding: spacing[5],
  },
  portfolioContent: {
    gap: spacing[4],
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portfolioMainValue: {
    color: 'white',
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
  },
  portfolioMetrics: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  portfolioMetric: {
    flex: 1,
  },
  portfolioMetricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
  },
  portfolioMetricValue: {
    color: 'white',
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  portfolioGainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  portfolioAvailableReturns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  portfolioAvailableReturnsText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },

  quickActionsContainer: {
    marginBottom: spacing[5],
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[3],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  quickActionButton: {
    width: '30%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    padding: spacing[2],
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  quickActionSubtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 14,
  },

  productCard: {
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  productName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  productDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  productRiskBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  productRiskLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  productMetric: {
    flex: 1,
  },
  productMetricLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productMetricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  productLockLabel: {
    fontSize: typography.fontSize.sm,
  },

  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: borderRadius.full,
  },
  riskLabel: {
    fontFamily: typography.fontFamily.semibold,
  },

  progressCard: {
    padding: spacing[4],
    gap: spacing[4],
  },
  progressTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
  },
  progressMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetricLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
  },
  progressMetricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  progressDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
  },
  progressDateLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
  },
  progressDateValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },

  returnsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  returnsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  returnsCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnsCardText: {
    flex: 1,
  },
  returnsCardLabel: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  returnsCardAmount: {
    color: 'white',
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  returnsCardHint: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  returnsCardCTA: {
    color: 'white',
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },

  fundingSourcesContainer: {
    marginBottom: spacing[5],
  },
  fundingSourcesTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[3],
  },
  fundingSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  fundingSourceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  fundingSourceOptionLabels: {
    flex: 1,
  },
  fundingSourceOptionLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  fundingSourceOptionBalance: {
    fontSize: typography.fontSize.sm,
  },
  fundingSourceCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  amountInputContainer: {
    marginBottom: spacing[5],
  },
  amountInputLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[2],
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  amountInputCurrency: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginRight: spacing[2],
  },
  amountInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  amountInputHints: {
    gap: spacing[1],
  },
  amountInputHint: {
    fontSize: typography.fontSize.xs,
  },
  amountInputError: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  amountInputFeePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    marginTop: spacing[2],
  },
  amountInputFeeLabel: {
    fontSize: typography.fontSize.sm,
  },
  amountInputFeeValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },

  breakdownCard: {
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  breakdownLabel: {
    fontSize: typography.fontSize.base,
  },
  breakdownValue: {
    fontSize: typography.fontSize.base,
  },

  destinationContainer: {
    marginBottom: spacing[5],
  },
  destinationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[3],
  },
  destinationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  destinationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  destinationOptionText: {
    flex: 1,
  },
  destinationOptionLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  destinationOptionDescription: {
    fontSize: typography.fontSize.sm,
  },
  destinationOptionDetails: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  destinationOptionFee: {
    fontSize: typography.fontSize.xs,
  },
  destinationOptionTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
});
