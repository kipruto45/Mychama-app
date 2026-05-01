import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { format, parse } from 'date-fns';

interface DatePickerInputProps {
  label?: string;
  placeholder?: string;
  value: string; // ISO format: YYYY-MM-DD
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  minDate?: Date;
  maxDate?: Date;
}

// Generate years, months, and days for the picker
const YEARS = Array.from({ length: 130 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  placeholder = 'Select date',
  value,
  onChangeText,
  error,
  disabled = false,
  style,
  minDate,
  maxDate,
}) => {
  const { colors: themeColors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const displayDate = value
    ? format(parse(value, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy')
    : placeholder;

  const handleDateChange = (text: string) => {
    setInputValue(text);
    // Validate format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      try {
        parse(text, 'yyyy-MM-dd', new Date());
        onChangeText(text);
      } catch {
        // Invalid date, don't update
      }
    }
  };

  const handleConfirm = () => {
    if (inputValue && /^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      try {
        parse(inputValue, 'yyyy-MM-dd', new Date());
        onChangeText(inputValue);
        setShowPicker(false);
      } catch {
        // Invalid date
      }
    }
  };

  const containerStyles = [
    styles.container,
    { backgroundColor: themeColors.surface, borderColor: themeColors.border },
    error && styles.error,
    disabled && styles.disabled,
    style,
  ];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={containerStyles}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={20}
          color={colors.primary[600]}
          style={styles.icon}
        />
        <Text
          style={[
            styles.dateText,
            {
              color: value ? themeColors.text : themeColors.textSecondary,
            },
          ]}
        >
          {displayDate}
        </Text>
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setInputValue(value);
                  setShowPicker(false);
                }}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Select date of birth
              </Text>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonText, { color: colors.primary[600], fontWeight: '600' }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={inputValue}
                onChangeText={handleDateChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textSecondary}
                style={[
                  styles.dateInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              />
            </View>

            <ScrollView style={styles.helperContainer}>
              <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
                Quick select:
              </Text>
              <View style={styles.quickSelectGrid}>
                {['1995-01-01', '2000-01-01', '2005-01-01', '2010-01-01'].map((date) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => {
                      setInputValue(date);
                      onChangeText(date);
                      setShowPicker(false);
                    }}
                    style={[
                      styles.quickSelectBtn,
                      { borderColor: colors.primary[600] },
                    ]}
                  >
                    <Text style={[styles.quickSelectBtnText, { color: colors.primary[600] }]}>
                      {format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM yyyy')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  icon: {
    marginRight: spacing[2],
  },
  dateText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  error: {
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    fontFamily: typography.fontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing[4],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  modalButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  inputContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  helperContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  quickSelectBtn: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
  },
  quickSelectBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});
