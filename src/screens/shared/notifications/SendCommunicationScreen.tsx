import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainStackParamList } from '@/navigation/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { communicationService } from '@/services/communicationService';
import { useActiveChama } from '@/hooks';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'SendCommunication'>;
type RouteProps = RouteProp<MainStackParamList, 'SendCommunication'>;

const priorities = ['normal', 'high', 'critical'] as const;
const channels = ['in_app', 'email', 'sms'] as const;
const targets = ['all', 'role', 'specific'] as const;
const segments = [
  { label: 'Overdue Contributions', value: 'overdue_contributors' },
  { label: 'Upcoming Meetings', value: 'upcoming_meeting_attendees' },
  { label: 'Suspended Members', value: 'suspended_members' },
];

export const SendCommunicationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { activeChamaId } = useActiveChama();
  const chamaId = route.params?.chamaId || activeChamaId || '';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<(typeof priorities)[number]>('normal');
  const [target, setTarget] = useState<(typeof targets)[number]>('all');
  const [selectedChannels, setSelectedChannels] = useState<Array<(typeof channels)[number]>>(['in_app']);
  const [selectedRole, setSelectedRole] = useState('CHAMA_ADMIN');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [memberIdsRaw, setMemberIdsRaw] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const memberIds = useMemo(
    () => memberIdsRaw.split(',').map((item) => item.trim()).filter(Boolean),
    [memberIdsRaw]
  );

  const toggleChannel = (channel: (typeof channels)[number]) => {
    if (channel === 'email' && priority !== 'critical') {
      Alert.alert(
        'Email is critical-only',
        'Set priority to critical before adding email delivery for announcements.'
      );
      return;
    }
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((item) => item !== channel) : [...prev, channel]
    );
  };

  const setPriorityWithChannelGuard = (value: (typeof priorities)[number]) => {
    setPriority(value);
    if (value !== 'critical' && selectedChannels.includes('email')) {
      setSelectedChannels((prev) => prev.filter((item) => item !== 'email'));
    }
  };

  const submit = async () => {
    if (!title.trim() || !message.trim() || selectedChannels.length === 0) {
      Alert.alert('Missing details', 'Title, message, and at least one channel are required.');
      return;
    }

    if (target === 'specific' && memberIds.length === 0 && !selectedSegment) {
      Alert.alert('Audience required', 'Provide member IDs or choose a segment for a specific audience.');
      return;
    }

    setSubmitting(true);
    try {
      await communicationService.sendCampaign({
        chama_id: chamaId,
        title: title.trim(),
        message: message.trim(),
        target,
        segment: selectedSegment || undefined,
        target_roles: target === 'role' ? [selectedRole] : undefined,
        target_member_ids: target === 'specific' && memberIds.length > 0 ? memberIds : undefined,
        channels: selectedChannels,
        action_url: actionUrl.trim() || undefined,
        priority,
        scheduled_at: scheduledAt.trim() || undefined,
      });
      Alert.alert('Queued', 'The communication has been queued successfully.');
      navigation.replace('CommunicationCenter', { chamaId });
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'The communication could not be queued right now.')
          : 'The communication could not be queued right now.';
      Alert.alert('Send failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="account-group-outline" size={64} color={colors.neutral[400]} />}
          title="Choose a chama first"
          description="Broadcast messages require an active chama context before you can send them."
          action={<Button title="Open Chamas" onPress={() => navigation.navigate('Chamas')} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Send Communication</Text>
            <Text style={styles.subtitle}>Compose an in-app, email, or SMS broadcast</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Message title" />
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your message"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Channels</Text>
          <View style={styles.optionRow}>
            {channels.map((channel) => {
              const active = selectedChannels.includes(channel);
              const disabled = channel === 'email' && priority !== 'critical';
              return (
                <TouchableOpacity
                  key={channel}
                  testID={`channel-${channel}`}
                  style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
                  disabled={disabled}
                  activeOpacity={disabled ? 1 : 0.85}
                  onPress={() => toggleChannel(channel)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive, disabled && styles.chipTextDisabled]}>
                    {channel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Audience</Text>
          <View style={styles.optionRow}>
            {targets.map((value) => {
              const active = target === value;
              return (
                <TouchableOpacity key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => setTarget(value)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {target === 'role' ? (
            <>
              <Text style={styles.label}>Role</Text>
              <TextInput style={styles.input} value={selectedRole} onChangeText={setSelectedRole} placeholder="CHAMA_ADMIN" />
            </>
          ) : null}

          {target === 'specific' ? (
            <>
              <Text style={styles.label}>Target Segment</Text>
              <View style={styles.segmentList}>
                {segments.map((segment) => {
                  const active = selectedSegment === segment.value;
                  return (
                    <TouchableOpacity key={segment.value} style={[styles.segmentCard, active && styles.segmentCardActive]} onPress={() => setSelectedSegment(active ? '' : segment.value)}>
                      <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>{segment.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.label}>Specific Member IDs</Text>
              <TextInput
                style={styles.input}
                value={memberIdsRaw}
                onChangeText={setMemberIdsRaw}
                placeholder="uuid-1, uuid-2"
              />
            </>
          ) : null}

          <Text style={styles.label}>Priority</Text>
          <View style={styles.optionRow}>
            {priorities.map((value) => {
              const active = priority === value;
              return (
                <TouchableOpacity
                  key={value}
                  testID={`priority-${value}`}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setPriorityWithChannelGuard(value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hintText}>Email channel is available for critical announcements only.</Text>

          <Text style={styles.label}>Action URL</Text>
          <TextInput style={styles.input} value={actionUrl} onChangeText={setActionUrl} placeholder="/meetings/123 or mychama://invite/..." />
          <Text style={styles.label}>Scheduled ISO Datetime</Text>
          <TextInput style={styles.input} value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-04-01T09:00:00+03:00" />
        </Card>

        <Button title={submitting ? 'Queueing...' : 'Queue Communication'} onPress={() => void submit()} disabled={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[4] },
  backButton: { marginRight: spacing[3], paddingTop: spacing[1] },
  headerText: { flex: 1 },
  title: { fontSize: typography.fontSize['2xl'], fontFamily: typography.fontFamily.bold, color: colors.neutral[900] },
  subtitle: { marginTop: spacing[1], color: colors.neutral[500], fontFamily: typography.fontFamily.regular },
  card: { marginBottom: spacing[4] },
  label: { color: colors.neutral[700], fontFamily: typography.fontFamily.semibold, marginBottom: spacing[2], marginTop: spacing[2] },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.light.card,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.regular,
  },
  messageInput: { minHeight: 120 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.light.card,
  },
  chipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  chipDisabled: { backgroundColor: colors.neutral[100], borderColor: colors.neutral[200] },
  chipText: { color: colors.neutral[700], fontFamily: typography.fontFamily.medium },
  chipTextDisabled: { color: colors.neutral[400] },
  chipTextActive: { color: '#FFFFFF' },
  segmentList: { gap: spacing[2], marginBottom: spacing[2] },
  segmentCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    backgroundColor: colors.light.card,
  },
  segmentCardActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  segmentTitle: { color: colors.neutral[800], fontFamily: typography.fontFamily.medium },
  segmentTitleActive: { color: colors.primary[700] },
  hintText: {
    marginTop: spacing[1],
    marginBottom: spacing[2],
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
  },
});
