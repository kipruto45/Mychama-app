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
import { Card } from '@/components/ui/Card';
import { MainStackParamList } from '@/navigation/types';
import { meetingService } from '@/services/meetingService';
import { MeetingAttendance } from '@/types';
import { borderRadius, colors, spacing, typography } from '@/theme';

type AttendanceNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Attendance'>;
type AttendanceRouteProp = RouteProp<MainStackParamList, 'Attendance'>;

const STATUS_OPTIONS: Array<MeetingAttendance['status']> = ['present', 'absent', 'late', 'excused'];

export const AttendanceScreen: React.FC = () => {
  const navigation = useNavigation<AttendanceNavigationProp>();
  const route = useRoute<AttendanceRouteProp>();
  const { meetingId, meetingTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getAttendance(meetingId);
      setAttendance(data);
    } catch {
      Alert.alert('Attendance unavailable', 'We could not load attendance records for this meeting right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAttendance();
  }, [meetingId]);

  const updateStatus = async (record: MeetingAttendance, status: MeetingAttendance['status']) => {
    try {
      setSavingId(record.id);
      const updated = await meetingService.markAttendance(meetingId, {
        member_id: record.member_id,
        status,
      });
      setAttendance((prev) => prev.map((item) => (item.id === record.id ? { ...item, ...updated } : item)));
    } catch {
      Alert.alert('Attendance not updated', 'We could not update attendance right now.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>{meetingTitle || 'Meeting attendance'}</Text>
          <Text style={styles.heroSubtitle}>
            Mark or review who was present, absent, late, or excused for this meeting.
          </Text>
        </Card>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.centerText}>Loading attendance...</Text>
          </View>
        ) : (
          attendance.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <View>
                  <Text style={styles.recordName}>{record.member_name || record.member_phone}</Text>
                  <Text style={styles.recordMeta}>{record.member_phone || 'Member record'}</Text>
                </View>
                <Badge label={record.status} variant="info" />
              </View>

              <View style={styles.optionRow}>
                {STATUS_OPTIONS.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionChip,
                      record.status === status ? styles.optionChipActive : null,
                    ]}
                    activeOpacity={0.88}
                    disabled={savingId === record.id}
                    onPress={() => void updateStatus(record, status)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        record.status === status ? styles.optionTextActive : null,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[8] },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  recordCard: { gap: spacing[3] },
  recordTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  recordName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  recordMeta: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  optionChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  optionText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: colors.light.background,
  },
});

