import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Membership } from '@/types';

interface MemberListProps {
  members: Membership[];
  onMemberPress?: (member: Membership) => void;
  style?: ViewStyle;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onMemberPress,
  style,
}) => {
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'treasurer':
        return 'success';
      case 'secretary':
        return 'info';
      case 'auditor':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const renderMember = ({ item }: { item: Membership }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => onMemberPress?.(item)}
      activeOpacity={0.7}
      disabled={!onMemberPress}
    >
      <Avatar name={item.user.full_name} size="md" />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user.full_name}</Text>
        <Text style={styles.memberPhone}>{item.user.phone}</Text>
      </View>
      <View style={styles.memberStatus}>
        <Badge
          label={item.role}
          variant={getRoleVariant(item.role)}
          size="sm"
        />
        {!item.is_approved && (
          <Badge label="Pending" variant="warning" size="sm" style={{ marginTop: spacing[1] }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={members}
      renderItem={renderMember}
      keyExtractor={(item) => item.id}
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  memberPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  memberStatus: {
    alignItems: 'flex-end',
  },
});
