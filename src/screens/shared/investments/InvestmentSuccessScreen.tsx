import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { Card, Button } from '@/components/ui';
import { useInvestmentDetail } from './hooks';
import { formatCurrency, formatDate } from './utils';
import { spacing } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';

import { TouchableOpacity } from 'react-native';

type Route = RouteProp<any, 'InvestmentSuccess'>;

export const InvestmentSuccessScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();

  const investmentId = route.params?.investmentId || '';
  const { investment } = useInvestmentDetail(investmentId);

  const handleCopyRef = async () => {
    if (investment?.id) {
      await Clipboard.setStringAsync(investment.id);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ModernHeader title="" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing[6],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: themeColors.success + '10' }]}>
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color={themeColors.success}
          />
        </View>

        {/* Success Message */}
        <Text style={[styles.successTitle, { color: themeColors.text }]}>
          Investment Successful!
        </Text>
        <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>
          Your investment has been created and is now being processed.
        </Text>

        {/* Details Card */}
        {investment && (
          <Card
            style={[
              styles.detailsCard,
              {
                backgroundColor: themeColors.card,
                marginHorizontal: spacing[4],
                marginTop: spacing[6],
              },
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                Product
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>
                {investment.product_name}
              </Text>
            </View>
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: themeColors.border, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                Amount
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.primary[500] }]}>
                {formatCurrency(investment.principal_amount)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                Reference
              </Text>
              <TouchableOpacity onPress={handleCopyRef}>
                <Text style={[styles.detailValue, { color: themeColors.primary[500] }]}>
                  {investment.id.substring(0, 8)}...
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Next Steps */}
	        <Card
	          style={[
	            styles.stepsCard,
	            {
	              backgroundColor: themeColors.accent[200],
	              marginHorizontal: spacing[4],
	              marginTop: spacing[5],
	            },
	          ]}
	        >
          <Text style={[styles.stepsTitle, { color: '#000' }]}>
            What Happens Next?
          </Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <Text style={{ color: '#000', fontWeight: '600' }}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: '#000' }]}>
              Funds will be transferred from your account
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <Text style={{ color: '#000', fontWeight: '600' }}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: '#000' }]}>
              Your investment will begin accruing returns
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <Text style={{ color: '#000', fontWeight: '600' }}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: '#000' }]}>
              Track progress in My Investments section
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* CTA Buttons */}
      <View
        style={[
          styles.footerContainer,
          { backgroundColor: themeColors.background, borderTopColor: themeColors.border },
        ]}
      >
        <Button
          title="View Investment"
          size="lg"
          onPress={() => {
            (navigation.navigate as any)('InvestmentDetail', {
              investmentId,
            });
          }}
        />
        <Button
          title="Back to Dashboard"
          size="lg"
          variant="outline"
          onPress={() => {
            (navigation.navigate as any)('Dashboard');
          }}
          style={{ marginTop: spacing[2] }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconContainer: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginTop: spacing[6] },
  successTitle: { fontSize: 28, fontWeight: '700', marginTop: spacing[5], textAlign: 'center' },
  successSubtitle: { fontSize: 14, textAlign: 'center', marginTop: spacing[2], paddingHorizontal: spacing[4] },
  detailsCard: { padding: spacing[4], borderRadius: 8, marginBottom: spacing[4] },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[3] },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  stepsCard: { padding: spacing[4], borderRadius: 12, marginBottom: spacing[4] },
  stepsTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing[3] },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] },
  stepNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontSize: 13, flex: 1, lineHeight: 20, marginTop: spacing[1] },
  footerContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderTopWidth: 1 },
});
