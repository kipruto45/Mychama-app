import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainStackParamList } from '@/navigation/types';
import { meetingService } from '@/services/meetingService';
import { MeetingResolution } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDate } from '@/utils/format';

type ResolutionsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Resolutions'>;
type ResolutionsRouteProp = RouteProp<MainStackParamList, 'Resolutions'>;

export const ResolutionsScreen: React.FC = () => {
  const navigation = useNavigation<ResolutionsNavigationProp>();
  const route = useRoute<ResolutionsRouteProp>();
  const { meetingId, meetingTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [resolutions, setResolutions] = useState<MeetingResolution[]>([]);

  const loadResolutions = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getResolutions(meetingId);
      setResolutions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResolutions();
  }, [meetingId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resolutions</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{meetingTitle || 'Meeting resolutions'}</Text>
          <Text style={styles.heroSubtitle}>
            Follow decisions, assigned actions, and due dates that came out of this meeting.
          </Text>
        </Card>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.centerText}>Loading resolutions...</Text>
          </View>
        ) : resolutions.length === 0 ? (
          <EmptyState
            title="No resolutions recorded"
            description="Once action items or formal decisions are captured for this meeting, they will appear here."
          />
        ) : (
          resolutions.map((resolution) => (
            <Card key={resolution.id} style={styles.resolutionCard}>
              <View style={styles.resolutionTopRow}>
                <Badge label={resolution.status} variant={resolution.status === 'done' ? 'success' : 'warning'} />
                {resolution.due_date ? (
                  <Text style={styles.dueDate}>Due {formatDate(resolution.due_date)}</Text>
                ) : null}
              </View>
              <Text style={styles.resolutionText}>{resolution.text}</Text>
              <Text style={styles.resolutionMeta}>
                {resolution.assigned_to_name ? `Assigned to ${resolution.assigned_to_name}` : 'No assignee yet'}
              </Text>
            </Card>
          ))
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
  resolutionCard: { gap: spacing[2] },
  resolutionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[3] },
  dueDate: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.medium, color: colors.neutral[500] },
  resolutionText: { fontSize: typography.fontSize.base, fontFamily: typography.fontFamily.semibold, color: colors.neutral[900], lineHeight: 22 },
  resolutionMeta: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, color: colors.neutral[600] },
});
