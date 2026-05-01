import React, { useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { borderRadius, colors, spacing, typography } from '@/theme';

type RequestJoinNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RequestJoin'>;
type RequestJoinRouteProp = RouteProp<MainStackParamList, 'RequestJoin'>;

export const RequestJoinScreen: React.FC = () => {
  const navigation = useNavigation<RequestJoinNavigationProp>();
  const route = useRoute<RequestJoinRouteProp>();
  const { chamaId, chamaName } = route.params;

  const [requestNote, setRequestNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await chamaService.requestJoin(chamaId, {
        request_note: requestNote.trim() || undefined,
      });
      navigation.replace('JoinRequestStatus');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not submit your join request right now.';
      Alert.alert('Join request not sent', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
            </TouchableOpacity>
            <Text style={styles.title}>Request to Join</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Card style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Icon name="account-arrow-right-outline" size={28} color={colors.primary[700]} />
            </View>
            <Text style={styles.heroTitle}>Request access to {chamaName || 'this chama'}</Text>
            <Text style={styles.heroSubtitle}>
              Send a short note to the admins. If the chama requires approval, they will review your request and notify you.
            </Text>
          </Card>

          <Card>
            <Input
              label="Why do you want to join?"
              placeholder="Add a short note about your interest or connection to this chama"
              value={requestNote}
              onChangeText={setRequestNote}
              multiline
              numberOfLines={5}
              leftIcon={<Icon name="text-box-outline" size={20} color={colors.neutral[400]} />}
            />
          </Card>

          <Card style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Before you continue</Text>
            <View style={styles.checklistRow}>
              <Icon name="check-circle-outline" size={18} color={colors.primary[700]} />
              <Text style={styles.checklistText}>Admins will review your request if approval is required.</Text>
            </View>
            <View style={styles.checklistRow}>
              <Icon name="check-circle-outline" size={18} color={colors.primary[700]} />
              <Text style={styles.checklistText}>You will see the request status inside the app after submitting.</Text>
            </View>
            <View style={styles.checklistRow}>
              <Icon name="check-circle-outline" size={18} color={colors.primary[700]} />
              <Text style={styles.checklistText}>If approved, you will be added with the right workspace role automatically.</Text>
            </View>
          </Card>

          <Button title="Submit Join Request" onPress={() => void handleSubmit()} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroCard: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  checklistCard: {
    gap: spacing[2],
  },
  checklistTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  checklistRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  checklistText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
});

