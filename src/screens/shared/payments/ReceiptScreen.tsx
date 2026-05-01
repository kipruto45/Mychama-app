import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MainStackParamList } from '@/navigation/types';
import {
  UnifiedPaymentReceiptRecord,
  paymentService,
} from '@/services/paymentService';

type ReceiptScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Receipt'>;
type ReceiptScreenRouteProp = RouteProp<MainStackParamList, 'Receipt'>;

export const ReceiptScreen: React.FC = () => {
  const navigation = useNavigation<ReceiptScreenNavigationProp>();
  const route = useRoute<ReceiptScreenRouteProp>();
  const { intentId, paymentId } = route.params || {};

  const [receipt, setReceipt] = useState<UnifiedPaymentReceiptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void fetchReceipt();
  }, [intentId, paymentId]);

  const fetchReceipt = async () => {
    try {
      if (intentId) {
        const data = await paymentService.getUnifiedPaymentReceipt(intentId);
        setReceipt(data);
      } else if (paymentId) {
        const status = await paymentService.getUnifiedPaymentStatus(paymentId);
        if (status.receipt) {
          setReceipt(status.receipt);
        }
      }
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
      Alert.alert('Error', 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;

    try {
      const message = `
Payment Receipt
---------------
Receipt Number: ${receipt.receipt_number}
Reference: ${receipt.reference_number}
Amount: ${receipt.currency} ${parseFloat(receipt.amount).toLocaleString()}
Method: ${(receipt.payment_method || 'payment').toUpperCase()}
Date: ${new Date(receipt.issued_at).toLocaleString()}
      `.trim();

      await Share.share({
        message,
        title: 'Payment Receipt',
      });
    } catch (error) {
      console.error('Failed to share receipt:', error);
    }
  };

  const handleDownload = () => {
    const resolvedIntentId = intentId || receipt?.payment_intent_id || paymentId;
    if (!resolvedIntentId) {
      Alert.alert('Download', 'We couldn’t prepare this receipt right now.');
      return;
    }

    void (async () => {
      try {
        setDownloading(true);
        const link = await paymentService.createUnifiedPaymentReceiptPdfLink(resolvedIntentId);
        if (!link.download_url) {
          throw new Error('Missing download link');
        }
        await WebBrowser.openBrowserAsync(link.download_url);
      } catch (error) {
        console.error('Failed to download receipt pdf:', error);
        Alert.alert('Download failed', 'We couldn’t generate a PDF link right now. Please try again.');
      } finally {
        setDownloading(false);
      }
    })();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Receipt Not Found</Text>
          <Text style={styles.errorText}>
            The receipt for this payment could not be found.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Receipt Card */}
        <Card style={styles.receiptCard}>
          {/* Success Icon */}
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={64} color={colors.success} />
            <Text style={styles.successTitle}>Payment Successful</Text>
          </View>

          {/* Receipt Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Receipt Number</Text>
              <Text style={styles.detailValue}>{receipt.receipt_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{receipt.reference_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                {receipt.currency} {parseFloat(receipt.amount).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>
                {(receipt.payment_method || 'payment').toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(receipt.issued_at).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Thank you for your payment
            </Text>
            <Text style={styles.footerSubtext}>
              MyChama - Empowering Communities
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Share Receipt"
            onPress={handleShare}
            icon="share-variant"
            style={styles.shareButton}
          />
          <Button
            title="Download PDF"
            onPress={handleDownload}
            icon="download"
            variant="outline"
            style={styles.downloadButton}
            loading={downloading}
          />
          <Button
            title="Done"
            onPress={() => navigation.navigate('Dashboard')}
            variant="outline"
            style={styles.doneButton}
          />
        </View>

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="information" size={24} color={colors.info} />
            <Text style={styles.infoTitle}>Receipt Information</Text>
          </View>
          <Text style={styles.infoText}>
            This receipt serves as proof of your payment. Please keep it for
            your records. If you have any questions about this payment,
            please contact your chama treasurer.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  receiptCard: {
    marginBottom: spacing.lg,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: spacing.md,
  },
  detailsContainer: {
    paddingVertical: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  shareButton: {
    marginBottom: spacing.md,
  },
  downloadButton: {
    marginBottom: spacing.md,
  },
  doneButton: {
    marginBottom: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ReceiptScreen;
