import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { meetingService } from '@/services/meetingService';
import { Meeting, MeetingAgenda, MeetingAttendance, MeetingResolution } from '@/types';
import { formatDate, formatStatus } from '@/utils/format';

type MeetingDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MeetingDetail'>;
type MeetingDetailScreenRouteProp = RouteProp<MainStackParamList, 'MeetingDetail'>;

interface MeetingSummary {
  total_members: number;
  attendance_marked: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

export const MeetingDetailScreen: React.FC = () => {
  const navigation = useNavigation<MeetingDetailScreenNavigationProp>();
  const route = useRoute<MeetingDetailScreenRouteProp>();
  const { meetingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [agendaItems, setAgendaItems] = useState<MeetingAgenda[]>([]);
  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [resolutions, setResolutions] = useState<MeetingResolution[]>([]);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [chamaName, setChamaName] = useState('');

  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const meetingData = await meetingService.getMeeting(meetingId);
        const [agendaData, attendanceData, resolutionData, summaryData, chama] = await Promise.all([
          meetingService.getAgendaItems(meetingId).catch(() => []),
          meetingService.getAttendance(meetingId).catch(() => []),
          meetingService.getResolutions(meetingId).catch(() => []),
          meetingService.getMeetingSummary(meetingId).catch(() => null),
          chamaService.getChama(meetingData.chama).catch(() => null),
        ]);

        setMeeting(meetingData);
        setAgendaItems(agendaData);
        setAttendance(attendanceData);
        setResolutions(resolutionData);
        setSummary(summaryData);
        setChamaName(chama?.name || '');
      } catch {
        Alert.alert('Error', 'Unable to load meeting details right now.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMeeting();
  }, [meetingId, navigation]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  };

  const showAttendanceQr = () => {
    if (!meeting?.attendance_qr_token) {
      Alert.alert('Attendance QR', 'No attendance QR token is available for this meeting.');
      return;
    }

    Alert.alert('Attendance QR Token', meeting.attendance_qr_token);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading meeting details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!meeting) {
    return null;
  }

  const attendanceRows = [
    { label: 'Present', value: summary?.present_count || 0, color: colors.success },
    { label: 'Absent', value: summary?.absent_count || 0, color: colors.error },
    { label: 'Late', value: summary?.late_count || 0, color: colors.warning },
    { label: 'Excused', value: summary?.excused_count || 0, color: colors.primary[500] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Meeting Details</Text>
        <View style={styles.moreButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.meetingCard}>
          {meeting.cancelled_at ? (
            <View style={styles.cancelledBanner}>
              <Icon name="calendar-remove" size={18} color={colors.error} />
              <Text style={styles.cancelledText}>
                Cancelled {formatDate(meeting.cancelled_at)}
                {meeting.cancellation_reason ? `: ${meeting.cancellation_reason}` : ''}
              </Text>
            </View>
          ) : null}
          <View style={styles.meetingHeader}>
            <Badge
              label={formatStatus(meeting.status)}
              variant={getStatusVariant(meeting.status)}
            />
            <Text style={styles.meetingChama}>{chamaName || 'Chama Meeting'}</Text>
          </View>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Text style={styles.meetingDescription}>
            {meeting.description || 'This meeting does not have a separate description yet.'}
          </Text>

          <View style={styles.meetingDetails}>
            <View style={styles.meetingDetail}>
              <Icon name="calendar" size={16} color={colors.primary[500]} />
              <Text style={styles.meetingDetailText}>
                {formatDate(meeting.date)}
              </Text>
            </View>
            <View style={styles.meetingDetail}>
              <Icon name="clock" size={16} color={colors.primary[500]} />
              <Text style={styles.meetingDetailText}>{meeting.time || formatDate(meeting.date, 'HH:mm')}</Text>
            </View>
            <View style={styles.meetingDetail}>
              <Icon name="account-group" size={16} color={colors.primary[500]} />
              <Text style={styles.meetingDetailText}>Quorum requirement: {meeting.quorum_percentage}%</Text>
            </View>
            <View style={styles.meetingDetail}>
              <Icon name="clipboard-check-outline" size={16} color={colors.primary[500]} />
              <Text style={styles.meetingDetailText}>Minutes: {formatStatus(meeting.minutes_status)}</Text>
            </View>
          </View>

        <View style={styles.actionButtons}>
          <Button
            title="Show Attendance QR"
            onPress={showAttendanceQr}
            style={styles.startButton}
            icon={<Icon name="qrcode" size={16} color="#FFFFFF" />}
          />
        </View>

        <View style={styles.linkActions}>
          <TouchableOpacity
            style={styles.linkAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Attendance', { meetingId, meetingTitle: meeting.title })}
          >
            <Icon name="account-check-outline" size={18} color={colors.primary[700]} />
            <Text style={styles.linkActionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Minutes', { meetingId, meetingTitle: meeting.title })}
          >
            <Icon name="file-document-edit-outline" size={18} color={colors.primary[700]} />
            <Text style={styles.linkActionText}>Minutes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Resolutions', { meetingId, meetingTitle: meeting.title })}
          >
            <Icon name="gavel" size={18} color={colors.primary[700]} />
            <Text style={styles.linkActionText}>Resolutions</Text>
          </TouchableOpacity>
        </View>
      </Card>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary?.attendance_rate || 0}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{agendaItems.length}</Text>
            <Text style={styles.statLabel}>Agenda Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary?.present_count || 0}/{summary?.total_members || 0}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agenda</Text>
          <Card style={styles.agendaCard}>
            {agendaItems.length > 0 ? (
              agendaItems.map((item, index) => (
                <View key={item.id} style={styles.agendaItem}>
                  <View style={styles.agendaNumber}>
                    <Text style={styles.agendaNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.agendaContent}>
                    <Text style={styles.agendaTitle}>{item.title}</Text>
                    {item.description ? (
                      <Text style={styles.agendaDuration}>{item.description}</Text>
                    ) : null}
                  </View>
                  <Badge
                    label={formatStatus(item.status)}
                    variant={
                      item.status === 'done'
                        ? 'success'
                        : item.status === 'approved'
                        ? 'info'
                        : item.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="sm"
                  />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No agenda items have been added yet.
              </Text>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <Card style={styles.attendeesCard}>
            {attendanceRows.map((item) => (
              <View key={item.label} style={styles.attendeeItem}>
                <View style={[styles.attendeeStatusDot, { backgroundColor: item.color }]} />
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeName}>{item.label}</Text>
                  <Text style={styles.attendeeStatusText}>{item.value} members</Text>
                </View>
              </View>
            ))}
            {attendance.length > 0 ? (
              <View style={styles.attendanceDivider}>
                {attendance.slice(0, 6).map((item) => (
                  <View key={item.id} style={styles.attendanceRow}>
                    <Text style={styles.attendanceName}>{item.member_name || item.member_phone}</Text>
                    <Badge label={formatStatus(item.status)} variant="info" size="sm" />
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolutions</Text>
          <Card style={styles.notesCard}>
            {resolutions.length > 0 ? (
              resolutions.map((item) => (
                <View key={item.id} style={styles.resolutionRow}>
                  <View style={styles.resolutionContent}>
                    <Text style={styles.resolutionText}>{item.text}</Text>
                    <Text style={styles.resolutionMeta}>
                      {item.assigned_to_name ? `Assigned to ${item.assigned_to_name}` : 'Unassigned'}
                      {item.due_date ? ` • Due ${formatDate(item.due_date)}` : ''}
                    </Text>
                  </View>
                  <Badge
                    label={formatStatus(item.status)}
                    variant={item.status === 'done' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              ))
            ) : (
              <Text style={styles.notesText}>
                No meeting resolutions have been recorded yet.
              </Text>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Notes</Text>
          <Card style={styles.notesCard}>
            <Text style={styles.notesText}>
              {meeting.minutes?.content || 'No minutes have been uploaded for this meeting yet.'}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
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
  moreButton: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  meetingCard: {
    marginBottom: spacing[4],
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '12',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  cancelledText: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  meetingChama: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  meetingTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  meetingDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[4],
  },
  meetingDetails: {
    marginBottom: spacing[4],
  },
  meetingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  meetingDetailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    marginLeft: spacing[2],
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  startButton: {
    flex: 1,
  },
  linkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  linkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
  },
  linkActionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  agendaCard: {
    gap: spacing[3],
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  agendaNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  agendaNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  agendaContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  agendaTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  agendaDuration: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  attendeesCard: {
    gap: spacing[3],
  },
  attendanceDivider: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing[2],
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceName: {
    flex: 1,
    marginRight: spacing[3],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[800],
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  attendeeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing[3],
  },
  attendeeStatusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginTop: spacing[1],
  },
  notesCard: {
    minHeight: 120,
  },
  resolutionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  resolutionContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  resolutionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  resolutionMeta: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  notesText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
});
