import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatStatus } from '@/utils/format';
import { Meeting } from '@/types';

interface MeetingCardProps {
  meeting: Meeting;
  onPress: () => void;
  style?: ViewStyle;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onPress,
  style,
}) => {
  const meetingSummary =
    meeting.description ||
    (Array.isArray(meeting.agenda)
      ? meeting.agenda
          .map((agendaItem: any) => agendaItem.title || agendaItem.description)
          .filter(Boolean)
          .join(', ')
      : '');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.day}>{formatDate(meeting.date, 'dd')}</Text>
          <Text style={styles.month}>{formatDate(meeting.date, 'MMM')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {meeting.title}
          </Text>
          <Text style={styles.time}>{meeting.time || formatDate(meeting.date, 'HH:mm')}</Text>
        </View>
        <Badge
          label={formatStatus(meeting.status)}
          variant={getStatusVariant(meeting.status)}
          size="sm"
        />
      </View>

      {meetingSummary ? (
        <Text style={styles.description} numberOfLines={2}>
          {meetingSummary}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.location}>
          <Text style={styles.locationIcon}>👥</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            Quorum {meeting.quorum_percentage}%
          </Text>
        </View>
        <Text style={styles.attendance}>{formatStatus(meeting.minutes_status)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  dateContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  day: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  month: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  time: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: spacing[1],
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    flex: 1,
  },
  attendance: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
});
