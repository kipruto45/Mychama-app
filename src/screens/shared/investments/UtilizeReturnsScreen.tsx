import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentDetail, useUtilizeReturns } from './hooks';
import {
  ReturnsAvailableCard,
  DestinationSelector,
  InvestmentBreakdownCard,
  SkeletonLoader,
} from './components';
import { formatCurrency } from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { TextInput } from 'react-native';
import type { MainStackParamList } from '@/navigation/types';

type UtilizeReturnsRouteProp = RouteProp<MainStackParamList, 'UtilizeReturns'>;
type UtilizeReturnsNavProp = NativeStackNavigationProp<MainStackParamList>;

export const UtilizeReturnsScreen: React.FC = () => {
  const route = useRoute<UtilizeReturnsRouteProp>();
  const navigation = useNavigation<UtilizeReturnsNavProp>();
  const { colors: themeColors } = useTheme();

  const investmentId = route.params?.investmentId || '';
  const chamaId = route.params?.chamaId;
  const { investment, isLoading } = useInvestmentDetail(investmentId, chamaId);
  const { utilizeReturns, isLoading: isUtilizing } = useUtilizeReturns();

  const [selectedAction, setSelectedAction] = useState<'wallet' | 'mpesa'>('wallet');
  const [phoneNumber, setPhoneNumber] = useState('');

  const breakdown = useMemo(() => {
    if (!investment) return null;
    const returns = parseFloat(investment.available_returns || '0') || 0;
    const fee = (returns * 0.05) / 100; // 0.5% processing fee
    return {
      principal: returns,
      fee,
      total: returns + fee,
      netPayout: returns - fee,
    };
  }, [investment]);

  const handleConfirm = () => {
    if (!investment) return;
    utilizeReturns(
      {
        investmentId,
        amount: investment.available_returns,
        actionType: selectedAction,
        beneficiaryPhone: selectedAction === 'mpesa' ? phoneNumber : undefined,
      },
      {
        onSuccess: () => {
          navigation.navigate('Dashboard');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Use Returns" />
        <View style={{ paddingHorizontal: spacing[4] }}>
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </View>
      </SafeAreaView>
    );
  }

  if (!investment || (parseFloat(investment.available_returns || '0') || 0) <= 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ModernHeader title="Use Returns" />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="information"
            size={48}
            color={themeColors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            No returns available
          </Text>
          <Text style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
            Returns will be available when your investment matures.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="Use Returns" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Returns Available */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[4] }}>
          <ReturnsAvailableCard
            amount={formatCurrency(investment.available_returns)}
            onUtilize={() => {}}
          />
        </View>

        {/* Action Selection */}
        <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            What would you like to do?
          </Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: selectedAction === 'wallet' ? themeColors.primary[500] + '20' : themeColors.card,
                  borderColor: selectedAction === 'wallet' ? themeColors.primary[500] : themeColors.border,
                },
              ]}
              onPress={() => setSelectedAction('wallet')}
            >
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color={themeColors.primary[500]}
              />
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Move to Wallet
              </Text>
              <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                Instant access
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: selectedAction === 'mpesa' ? themeColors.primary[500] + '20' : themeColors.card,
                  borderColor: selectedAction === 'mpesa' ? themeColors.primary[500] : themeColors.border,
                },
              ]}
              onPress={() => setSelectedAction('mpesa')}
            >
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={themeColors.primary[500]}
              />
              <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                Withdraw to M-Pesa
              </Text>
              <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                To your phone
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Input if M-Pesa */}
        {selectedAction === 'mpesa' && (
          <Card
            style={[
              styles.phoneCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[4],
              },
            ]}
          >
            <TextInput
              placeholder="Enter M-Pesa phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.phoneInput, { color: themeColors.text }]}
              keyboardType="phone-pad"
            />
          </Card>
        )}

        {/* Breakdown */}
        {breakdown && (
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5] }}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Payment Breakdown
            </Text>
            <InvestmentBreakdownCard
              items={[
                { label: 'Returns', value: formatCurrency(breakdown.principal) },
                { label: 'Fee', value: `-${formatCurrency(breakdown.fee)}` },
                { label: 'Net Payout', value: formatCurrency(breakdown.netPayout), highlighted: true },
              ]}
            />
          </View>
        )}

        {/* Info Card */}
        <Card
          style={[
            styles.infoCard,
            {
              backgroundColor: themeColors.success + '10',
              marginHorizontal: spacing[4],
              marginTop: spacing[5],
            },
          ]}
        >
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="information"
              size={18}
              color={themeColors.success}
            />
            <Text style={[styles.infoText, { color: themeColors.text }]}>
              Returns are transferred immediately after confirmation
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* CTA */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
        <Button
          title="Confirm"
          size="lg"
          onPress={handleConfirm}
          loading={isUtilizing}
          disabled={selectedAction === 'mpesa' && !phoneNumber}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing[4] },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: spacing[3], textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: spacing[2], textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  optionsContainer: { gap: spacing[3] },
  optionCard: {
    padding: spacing[4],
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontSize: 14, fontWeight: '600', marginTop: spacing[2] },
  optionDesc: { fontSize: 12, marginTop: spacing[1] },
  phoneCard: { padding: spacing[4], borderRadius: 8 },
  phoneInput: { padding: spacing[3], fontSize: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  infoCard: { padding: spacing[3], borderRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
