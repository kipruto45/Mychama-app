import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { profileService } from '@/services/profileService';

type TwoFactorAuthScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'TwoFactorAuth'>;

export const TwoFactorAuthScreen: React.FC = () => {
  const navigation = useNavigation<TwoFactorAuthScreenNavigationProp>();
  const { user, updateUser } = useAuth();
  
  const [isEnabled, setIsEnabled] = useState(user?.two_factor_enabled || false);
  const [method, setMethod] = useState<'sms' | 'authenticator'>(
    user?.two_factor_method === 'authenticator' ? 'authenticator' : 'sms'
  );
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggle = (value: boolean) => {
    if (value) {
      setShowSetup(true);
    } else {
      Alert.alert(
        'Disable 2FA',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setIsEnabled(false);
              setShowSetup(false);
            },
          },
        ]
      );
    }
  };

  const handleMethodSelect = (selectedMethod: 'sms' | 'authenticator') => {
    setMethod(selectedMethod);
  };

  const handleSendCode = async () => {
    setLoading(true);
    try {
      await profileService.requestTwoFactorCode('sms');
      Alert.alert('Code Sent', 'A verification code has been sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }
    
    setLoading(true);
    try {
      await profileService.verifyTwoFactorCode(verificationCode.trim());
      setIsEnabled(true);
      setShowSetup(false);
      if (user) {
        updateUser({
          ...user,
          two_factor_enabled: true,
          two_factor_method: method,
        });
      }
      Alert.alert('Success', 'Two-factor authentication has been enabled');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <Icon
                name={isEnabled ? 'shield-check' : 'shield-outline'}
                size={32}
                color={isEnabled ? colors.success : colors.neutral[400]}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                Two-Factor Authentication
              </Text>
              <Badge
                label={isEnabled ? 'Enabled' : 'Disabled'}
                variant={isEnabled ? 'success' : 'warning'}
              />
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.neutral[300], true: colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.statusDescription}>
            Add an extra layer of security to your account by requiring a verification code in addition to your password.
          </Text>
        </Card>

        {/* Setup Section */}
        {showSetup && !isEnabled && (
          <Card style={styles.setupCard}>
            <Text style={styles.sectionTitle}>Setup Two-Factor Authentication</Text>
            <Text style={styles.sectionDescription}>
              Choose how you want to receive verification codes
            </Text>

            {/* Method Selection */}
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  method === 'sms' && styles.methodOptionSelected,
                ]}
                onPress={() => handleMethodSelect('sms')}
              >
                <View style={styles.methodIconContainer}>
                  <Icon
                    name="cellphone"
                    size={24}
                    color={method === 'sms' ? colors.primary[500] : colors.neutral[500]}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodTitle,
                      method === 'sms' && styles.methodTitleSelected,
                    ]}
                  >
                    SMS
                  </Text>
                  <Text style={styles.methodDescription}>
                    Receive codes via text message
                  </Text>
                </View>
                {method === 'sms' && (
                  <Icon name="check-circle" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  method === 'authenticator' && styles.methodOptionSelected,
                ]}
                onPress={() => handleMethodSelect('authenticator')}
              >
                <View style={styles.methodIconContainer}>
                  <Icon
                    name="key"
                    size={24}
                    color={method === 'authenticator' ? colors.primary[500] : colors.neutral[500]}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodTitle,
                      method === 'authenticator' && styles.methodTitleSelected,
                    ]}
                  >
                    Authenticator App
                  </Text>
                  <Text style={styles.methodDescription}>
                    Use Google Authenticator or similar
                  </Text>
                </View>
                {method === 'authenticator' && (
                  <Icon name="check-circle" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
            </View>

            {/* Verification */}
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationTitle}>Verify Your Identity</Text>
              <Text style={styles.verificationDescription}>
                {method === 'sms'
                  ? 'Enter the code sent to your phone'
                  : 'Enter the code from your authenticator app'}
              </Text>

              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={
                  <Icon name="key" size={20} color={colors.neutral[400]} />
                }
              />

              {method === 'sms' && (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>
                    {loading ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}

              <Button
                title="Verify & Enable"
                onPress={handleVerify}
                loading={loading}
                style={styles.verifyButton}
              />
            </View>
          </Card>
        )}

        {/* Info Section */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>1</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Choose Method</Text>
                <Text style={styles.infoItemDescription}>
                  Select SMS or authenticator app for verification
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>2</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Verify Identity</Text>
                <Text style={styles.infoItemDescription}>
                  Enter the verification code to confirm setup
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>3</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Extra Security</Text>
                <Text style={styles.infoItemDescription}>
                  Your account is now protected with 2FA
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Security Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>
              Never share your verification codes with anyone
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>
              Keep your authenticator app backed up
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>
              Use a strong, unique password
            </Text>
          </View>
        </Card>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  statusCard: {
    marginBottom: spacing[4],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statusDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  setupCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[4],
  },
  methodContainer: {
    marginBottom: spacing[4],
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[3],
  },
  methodOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  methodTitleSelected: {
    color: colors.primary[700],
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  verificationContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  verificationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  verificationDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[4],
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  verifyButton: {
    width: '100%',
  },
  infoCard: {
    marginBottom: spacing[4],
  },
  infoList: {
    marginTop: spacing[2],
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  infoNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  infoItemDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  tipsCard: {
    backgroundColor: colors.success + '10',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    marginLeft: spacing[2],
    flex: 1,
  },
});
