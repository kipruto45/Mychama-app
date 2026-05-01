import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';

export type GenderOption = 'Male' | 'Female' | 'Other';

const GENDER_OPTIONS: GenderOption[] = ['Male', 'Female', 'Other'];

interface GenderSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

interface GenderItem {
  label: GenderOption;
  value: GenderOption;
}

export const GenderSelect: React.FC<GenderSelectProps> = ({
  label,
  placeholder = 'Select gender',
  value,
  onChangeText,
  error,
  disabled = false,
  style,
}) => {
  const { colors: themeColors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const genderItems: GenderItem[] = GENDER_OPTIONS.map((option) => ({
    label: option,
    value: option,
  }));

  const displayValue = value || placeholder;
  const isSelected = GENDER_OPTIONS.includes(value as GenderOption);

  const handleSelectGender = (option: GenderOption) => {
    onChangeText(option);
    setShowPicker(false);
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
          name="account-outline"
          size={20}
          color={colors.primary[600]}
          style={styles.icon}
        />
        <Text
          style={[
            styles.genderText,
            {
              color: isSelected ? themeColors.text : themeColors.textSecondary,
            },
          ]}
        >
          {displayValue}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={themeColors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonText, { color: colors.primary[600] }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Select your gender
              </Text>
              <View style={styles.modalButton} />
            </View>

            <FlatList
              data={genderItems}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        value === item.value ? colors.primary[100] : themeColors.surface,
                      borderBottomColor: themeColors.border,
                    },
                  ]}
                  onPress={() => handleSelectGender(item.value)}
                >
                  <View style={styles.optionContent}>
                    <MaterialCommunityIcons
                      name={
                        item.value === 'Male'
                          ? 'gender-male'
                          : item.value === 'Female'
                            ? 'gender-female'
                            : 'account'
                      }
                      size={24}
                      color={value === item.value ? colors.primary[600] : themeColors.textSecondary}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            value === item.value ? colors.primary[600] : themeColors.text,
                          fontWeight: value === item.value ? '600' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {value === item.value && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={colors.primary[600]}
                    />
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
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
  genderText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  chevron: {
    marginLeft: spacing[2],
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
    maxHeight: '70%',
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
    flex: 1,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    minWidth: 60,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: spacing[3],
  },
  optionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
});
