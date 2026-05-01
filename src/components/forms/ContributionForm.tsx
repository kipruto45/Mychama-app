import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { contributionSchema, ContributionFormData } from '@/utils/validation';
import { PAYMENT_METHODS } from '@/constants';

interface ContributionFormProps {
  onSubmit: (data: ContributionFormData) => void;
  loading?: boolean;
  contributionTypes?: Array<{ id: string; name: string; default_amount: string }>;
  members?: Array<{ id: string; full_name: string }>;
}

export const ContributionForm: React.FC<ContributionFormProps> = ({
  onSubmit,
  loading = false,
  contributionTypes = [],
  members = [],
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      member_id: '',
      contribution_type_id: '',
      amount: '',
      date_paid: new Date().toISOString().split('T')[0],
      method: 'mpesa',
      receipt_code: '',
    },
  });

  const selectedMethod = watch('method');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Contribution</Text>
      <Text style={styles.subtitle}>Enter contribution details</Text>

      <Controller
        control={control}
        name="member_id"
        render={({ field: { onChange, value } }) => (
          <View style={styles.selectContainer}>
            <Text style={styles.label}>Member</Text>
            <View style={styles.selectOptions}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.selectOption,
                    value === member.id && styles.selectOptionActive,
                  ]}
                  onPress={() => onChange(member.id)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      value === member.id && styles.selectOptionTextActive,
                    ]}
                  >
                    {member.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.member_id && (
              <Text style={styles.errorText}>{errors.member_id.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="contribution_type_id"
        render={({ field: { onChange, value } }) => (
          <View style={styles.selectContainer}>
            <Text style={styles.label}>Contribution Type</Text>
            <View style={styles.selectOptions}>
              {contributionTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.selectOption,
                    value === type.id && styles.selectOptionActive,
                  ]}
                  onPress={() => onChange(type.id)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      value === type.id && styles.selectOptionTextActive,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.contribution_type_id && (
              <Text style={styles.errorText}>
                {errors.contribution_type_id.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Amount (KES)"
            placeholder="Enter amount"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.amount?.message}
            keyboardType="numeric"
          />
        )}
      />

      <Controller
        control={control}
        name="date_paid"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Date Paid"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.date_paid?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="method"
        render={({ field: { onChange, value } }) => (
          <View style={styles.selectContainer}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    value === method.id && styles.paymentMethodActive,
                    { borderColor: method.color },
                  ]}
                  onPress={() => onChange(method.id as any)}
                >
                  <Text style={styles.paymentMethodIcon}>{method.icon === 'phone' ? '📱' : '💵'}</Text>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      value === method.id && { color: method.color },
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.method && (
              <Text style={styles.errorText}>{errors.method.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="receipt_code"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Receipt Code"
            placeholder="Enter receipt code"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.receipt_code?.message}
          />
        )}
      />

      <Button
        title="Record Contribution"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[6],
  },
  selectContainer: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  selectOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.light.surface,
  },
  selectOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  selectOptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
  },
  selectOptionTextActive: {
    color: colors.primary[700],
    fontFamily: typography.fontFamily.medium,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.light.surface,
  },
  paymentMethodActive: {
    backgroundColor: colors.primary[50],
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  paymentMethodText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    marginTop: spacing[1],
  },
  button: {
    marginTop: spacing[4],
  },
});
