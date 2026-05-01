import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';
import { meetingService } from '@/services/meetingService';
import { MeetingMinutes } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/format';

type MinutesNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Minutes'>;
type MinutesRouteProp = RouteProp<MainStackParamList, 'Minutes'>;

export const MinutesScreen: React.FC = () => {
  const navigation = useNavigation<MinutesNavigationProp>();
  const route = useRoute<MinutesRouteProp>();
  const { meetingId, meetingTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);

  const loadMinutes = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMinutes(meetingId);
      setMinutes(data);
    } catch {
      setMinutes(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMinutes();
  }, [meetingId]);

  const handleCreateDraft = async () => {
    try {
      await meetingService.createMinutes(meetingId, {
        content: `Meeting minutes draft for ${meetingTitle || 'this meeting'}.`,
        resolutions: [],
      });
      await loadMinutes();
      Alert.alert('Minutes draft created', 'A draft minutes record has been created for this meeting.');
    } catch {
      Alert.alert('Minutes not saved', 'We could not create the minutes draft right now.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minutes</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{meetingTitle || 'Meeting minutes'}</Text>
          <Text style={styles.heroSubtitle}>
            Review the recorded minutes, see approval status, and keep a clean written record of the meeting.
          </Text>
        </Card>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.centerText}>Loading minutes...</Text>
          </View>
        ) : minutes ? (
          <Card style={styles.minutesCard}>
            <View style={styles.minutesTopRow}>
              <Badge label={minutes.status} variant="info" />
              <Text style={styles.recordedAt}>{formatDateTime(minutes.recorded_at)}</Text>
            </View>
            <Text style={styles.minutesText}>
              {minutes.content || 'Minutes were created, but no written content has been added yet.'}
            </Text>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="file-document-edit-outline" size={28} color={colors.primary[700]} />
            </View>
            <Text style={styles.emptyTitle}>No minutes recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a draft minutes record for this meeting so notes and approvals can follow a proper workflow.
            </Text>
            <Button title="Create Draft Minutes" onPress={() => void handleCreateDraft()} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  content: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] },
  heroCard: { gap: spacing[2] },
  heroTitle: { fontSize: typography.fontSize.xl, fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  heroSubtitle: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, color: colors.neutral[600], lineHeight: 20 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[8] },
  centerText: { marginTop: spacing[3], fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.medium, color: colors.neutral[600] },
  minutesCard: { gap: spacing[3] },
  minutesTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[3] },
  recordedAt: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.medium, color: colors.neutral[500] },
  minutesText: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, color: colors.neutral[700], lineHeight: 22 },
  emptyCard: { alignItems: 'center', gap: spacing[3] },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  emptySubtitle: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, color: colors.neutral[600], textAlign: 'center', lineHeight: 20 },
});

