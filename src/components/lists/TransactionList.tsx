import React from 'react';
import { View, Text, StyleSheet, FlatList, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { TransactionCard } from '@/components/cards/TransactionCard';
import { LedgerEntry } from '@/types';
import { formatCurrency } from '@/utils/format';

interface TransactionListProps {
  transactions: LedgerEntry[];
  onTransactionPress?: (transaction: LedgerEntry) => void;
  style?: ViewStyle;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onTransactionPress,
  style,
}) => {
  const getTransactionType = (entry: LedgerEntry) => {
    if (entry.entry_type === 'contribution') return 'contribution';
    if (entry.entry_type === 'loan') return 'loan';
    if (entry.entry_type === 'repayment') return 'repayment';
    if (entry.entry_type === 'penalty') return 'penalty';
    return 'contribution';
  };

  const renderTransaction = ({ item }: { item: LedgerEntry }) => (
    <TransactionCard
      type={getTransactionType(item)}
      amount={item.amount}
      currency={item.currency}
      description={item.narration}
      date={item.created_at}
      status={item.status}
      onPress={() => onTransactionPress?.(item)}
      style={styles.transactionCard}
    />
  );

  if (transactions.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={(item) => item.id}
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing[4],
  },
  transactionCard: {
    marginBottom: spacing[2],
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
});
