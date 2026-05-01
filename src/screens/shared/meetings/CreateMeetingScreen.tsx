import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { meetingService } from '@/services/meetingService';
import { formatDate } from '@/utils/format';

type CreateMeetingScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreateMeeting'>;
type CreateMeetingScreenRouteProp = RouteProp<MainStackParamList, 'CreateMeeting'>;

interface Chama {
  id: string;
  name: string;
}

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
}

export const CreateMeetingScreen: React.FC = () => {
  const navigation = useNavigation<CreateMeetingScreenNavigationProp>();
  const route = useRoute<CreateMeetingScreenRouteProp>();
  const chamaId = route.params?.chamaId;
  
  const [loading, setLoading] = useState(false);
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [selectedChama, setSelectedChama] = useState<Chama | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'physical' | 'online' | 'hybrid'>('physical');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { id: '1', title: '', duration: 15 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChamas();
  }, []);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDateTime(selectedDate);
      setDate(format(selectedDate, 'yyyy-MM-dd'));
      
      // If we're on iOS and time picker is not shown, close the date picker
      if (Platform.OS === 'ios' && !showTimePicker) {
        setShowDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDateTime(selectedDate);
      setTime(format(selectedDate, 'HH:mm'));
      
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  const clearDate = () => {
    setDate('');
    setShowDatePicker(false);
  };

  const clearTime = () => {
    setTime('');
    setShowTimePicker(false);
  };

  const loadChamas = async () => {
    try {
      const apiChamas = await chamaService.getChamas();
      const mappedChamas = apiChamas.map((chama) => ({
        id: chama.id,
        name: chama.name,
      }));
      setChamas(mappedChamas);
      
      if (chamaId) {
        const chama = mappedChamas.find((item) => item.id === chamaId);
        if (chama) {
          setSelectedChama(chama);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load chamas.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedChama) {
      newErrors.chama = 'Please select a chama';
    }
    
    if (!title.trim()) {
      newErrors.title = 'Meeting title is required';
    }
    
    if (!date) {
      newErrors.date = 'Meeting date is required';
    }
    
    if (!time) {
      newErrors.time = 'Meeting time is required';
    }
    
    const validAgenda = agenda.filter((item) => item.title.trim());
    if (validAgenda.length === 0) {
      newErrors.agenda = 'At least one agenda item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (!selectedChama) {
        throw new Error('Please select a chama.');
      }

      await meetingService.createMeeting({
        chama: selectedChama.id,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        location_type: locationType,
        meeting_link: meetingLink.trim() || undefined,
        agenda: agenda
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            title: item.title.trim(),
            description: '',
            order: index + 1,
            duration_minutes: item.duration,
          })),
      });
      
      Alert.alert(
        'Meeting Created',
        'Your meeting has been scheduled successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Failed to create meeting. Please try again.')
          : 'Failed to create meeting. Please try again.';

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const addAgendaItem = () => {
    setAgenda((prev) => [
      ...prev,
      { id: Date.now().toString(), title: '', duration: 15 },
    ]);
  };

  const removeAgendaItem = (id: string) => {
    if (agenda.length > 1) {
      setAgenda((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateAgendaItem = (id: string, field: 'title' | 'duration', value: string | number) => {
    setAgenda((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const getTotalDuration = () => {
    return agenda.reduce((total, item) => total + item.duration, 0);
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
        <Text style={styles.title}>Create Meeting</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Chama Selection */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Chama</Text>
            <View style={styles.chamaOptions}>
              {chamas.map((chama) => (
                <TouchableOpacity
                  key={chama.id}
                  style={[
                    styles.chamaOption,
                    selectedChama?.id === chama.id && styles.chamaOptionSelected,
                  ]}
                  onPress={() => setSelectedChama(chama)}
                >
                  <Icon name="account-group" size={20} color={colors.primary[500]} />
                  <Text
                    style={[
                      styles.chamaOptionText,
                      selectedChama?.id === chama.id && styles.chamaOptionTextSelected,
                    ]}
                  >
                    {chama.name}
                  </Text>
                  {selectedChama?.id === chama.id && (
                    <Icon name="check-circle" size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.chama && <Text style={styles.errorText}>{errors.chama}</Text>}
          </Card>

          {/* Meeting Details */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Meeting Details</Text>
            
            <Input
              label="Meeting Title"
              placeholder="Enter meeting title"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              leftIcon={
                <Icon name="calendar-text" size={20} color={colors.neutral[400]} />
              }
            />

            <Input
              label="Description"
              placeholder="Describe the meeting purpose"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              leftIcon={
                <Icon name="text" size={20} color={colors.neutral[400]} />
              }
            />

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateTimeButton,
                    errors.date && styles.dateTimeButtonError
                  ]}
                  onPress={openDatePicker}
                >
                  <Icon name="calendar" size={20} color={colors.primary[500]} />
                  <Text style={[
                    styles.dateTimeButtonText,
                    !date && styles.dateTimeButtonPlaceholder
                  ]}>
                    {date || 'Select date'}
                  </Text>
                  {date && (
                    <TouchableOpacity onPress={clearDate} style={styles.clearButton}>
                      <Icon name="close-circle" size={18} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={styles.inputLabel}>Time</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateTimeButton,
                    errors.time && styles.dateTimeButtonError
                  ]}
                  onPress={openTimePicker}
                >
                  <Icon name="clock-outline" size={20} color={colors.primary[500]} />
                  <Text style={[
                    styles.dateTimeButtonText,
                    !time && styles.dateTimeButtonPlaceholder
                  ]}>
                    {time || 'Select time'}
                  </Text>
                  {time && (
                    <TouchableOpacity onPress={clearTime} style={styles.clearButton}>
                      <Icon name="close-circle" size={18} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>
            </View>
          </Card>

          {/* Meeting Notes */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Meeting Notes</Text>
            
            <View style={styles.locationTypeContainer}>
              {[
                { key: 'physical', label: 'Physical', icon: 'map-marker' },
                { key: 'online', label: 'Online', icon: 'video' },
                { key: 'hybrid', label: 'Hybrid', icon: 'account-group' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.locationTypeOption,
                    locationType === type.key && styles.locationTypeOptionSelected,
                  ]}
                  onPress={() => setLocationType(type.key as any)}
                >
                  <Icon
                    name={type.icon}
                    size={20}
                    color={locationType === type.key ? colors.primary[500] : colors.neutral[500]}
                  />
                  <Text
                    style={[
                      styles.locationTypeText,
                      locationType === type.key && styles.locationTypeTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Location or Venue"
              placeholder={locationType === 'online' ? 'Meeting platform or online venue' : 'Enter meeting venue'}
              value={location}
              onChangeText={setLocation}
              leftIcon={
                <Icon
                  name={locationType === 'online' ? 'video' : 'map-marker'}
                  size={20}
                  color={colors.neutral[400]}
                />
              }
            />

            {(locationType === 'online' || locationType === 'hybrid') && (
              <Input
                label="Meeting Link"
                placeholder="Enter meeting URL"
                value={meetingLink}
                onChangeText={setMeetingLink}
                leftIcon={
                  <Icon name="link" size={20} color={colors.neutral[400]} />
                }
              />
            )}
          </Card>

          {/* Agenda */}
          <Card style={styles.sectionCard}>
            <View style={styles.agendaHeader}>
              <Text style={styles.sectionTitle}>Agenda</Text>
              <Text style={styles.totalDuration}>Total: {getTotalDuration()} min</Text>
            </View>
            
            {agenda.map((item, index) => (
              <View key={item.id} style={styles.agendaItem}>
                <View style={styles.agendaItemHeader}>
                  <Text style={styles.agendaItemNumber}>{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeAgendaItem(item.id)}
                    style={styles.removeAgendaButton}
                  >
                    <Icon name="close" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Input
                  placeholder="Agenda item title"
                  value={item.title}
                  onChangeText={(value) => updateAgendaItem(item.id, 'title', value)}
                  style={styles.agendaInput}
                />
                <View style={styles.durationContainer}>
                  <Text style={styles.durationLabel}>Duration:</Text>
                  <TouchableOpacity
                    style={styles.durationButton}
                    onPress={() => updateAgendaItem(item.id, 'duration', Math.max(5, item.duration - 5))}
                  >
                    <Icon name="minus" size={16} color={colors.neutral[600]} />
                  </TouchableOpacity>
                  <Text style={styles.durationValue}>{item.duration} min</Text>
                  <TouchableOpacity
                    style={styles.durationButton}
                    onPress={() => updateAgendaItem(item.id, 'duration', item.duration + 5)}
                  >
                    <Icon name="plus" size={16} color={colors.neutral[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {errors.agenda && <Text style={styles.errorText}>{errors.agenda}</Text>}
            
            <TouchableOpacity style={styles.addAgendaButton} onPress={addAgendaItem}>
              <Icon name="plus" size={20} color={colors.primary[500]} />
              <Text style={styles.addAgendaText}>Add Agenda Item</Text>
            </TouchableOpacity>
          </Card>

          {/* Submit Button */}
          <Button
            title="Create Meeting"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            icon={<Icon name="check" size={20} color="#FFFFFF" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  sectionCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  chamaOptions: {
    gap: spacing[2],
  },
  chamaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.card,
  },
  chamaOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  chamaOptionText: {
    flex: 1,
    marginLeft: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  chamaOptionTextSelected: {
    color: colors.primary[700],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing[1],
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dateTimeItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.light.card,
    gap: spacing[2],
  },
  dateTimeButtonError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
  },
  dateTimeButtonPlaceholder: {
    color: colors.neutral[400],
  },
  clearButton: {
    padding: spacing[1],
  },
  locationTypeContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  locationTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.light.card,
  },
  locationTypeOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  locationTypeText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  locationTypeTextSelected: {
    color: colors.primary[700],
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  totalDuration: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  agendaItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  agendaItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  agendaItemNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    lineHeight: 24,
  },
  removeAgendaButton: {
    padding: spacing[1],
  },
  agendaInput: {
    marginBottom: spacing[2],
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginRight: spacing[2],
  },
  durationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginHorizontal: spacing[3],
  },
  addAgendaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderStyle: 'dashed',
  },
  addAgendaText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  submitButton: {
    marginTop: spacing[2],
  },
});
