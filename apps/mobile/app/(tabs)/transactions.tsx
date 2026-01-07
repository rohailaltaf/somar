import { useMemo, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  TextInput,
  Pressable,
} from "react-native";
import { useColorScheme } from "nativewind";
import { Search, X } from "lucide-react-native";
import { useTransactions, useTotalSpending } from "@somar/shared/hooks";
import type { TransactionWithRelations } from "@somar/shared";
import { getCurrentMonth } from "@somar/shared";
import {
  TransactionsEmptyState,
  SearchEmptyState,
  TransactionsLoadingState,
  DateSectionHeader,
} from "../../src/components/ui";
import { TransactionRow } from "../../src/components/transactions";
import { themeColors } from "../../src/lib/theme";

interface TransactionSection {
  date: string;
  data: TransactionWithRelations[];
}

/**
 * Group transactions by date for SectionList.
 */
function groupTransactionsByDate(
  transactions: TransactionWithRelations[]
): TransactionSection[] {
  const grouped = new Map<string, TransactionWithRelations[]>();

  // Data already sorted by date DESC, created_at DESC from DB
  for (const transaction of transactions) {
    const existing = grouped.get(transaction.date);
    if (existing) {
      existing.push(transaction);
    } else {
      grouped.set(transaction.date, [transaction]);
    }
  }

  return Array.from(grouped.entries()).map(([date, data]) => ({ date, data }));
}

export default function Transactions() {
  const { colorScheme } = useColorScheme();
  const colors = themeColors[colorScheme ?? "light"];

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const { data: monthlySpending = 0 } = useTotalSpending(currentMonth);
  const { data: transactions = [], isLoading, refetch } = useTransactions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter transactions by search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase();
    return transactions.filter(
      t =>
        t.description.toLowerCase().includes(query) ||
        t.category?.name.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  const sections = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  if (isLoading && transactions.length === 0) {
    return <TransactionsLoadingState />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-background">
        {/* Summary row */}
        <View className="flex-row items-baseline justify-between mb-4">
          <View>
            <Text className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { month: "long" })}
            </Text>
            <Text className="text-2xl font-bold text-foreground">
              ${Math.abs(monthlySpending).toLocaleString("en-US", { minimumFractionDigits: 0 })}
              <Text className="text-base font-normal text-muted-foreground"> spent</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setSearchVisible(!searchVisible);
              if (!searchVisible) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                setSearchQuery("");
              }
            }}
            className="w-10 h-10 rounded-full bg-muted items-center justify-center"
          >
            {searchVisible ? (
              <X size={20} color={colors.mutedForeground} />
            ) : (
              <Search size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        </View>

        {/* Search input - expandable */}
        {searchVisible && (
          <View>
            <TextInput
              ref={searchInputRef}
              className="bg-muted rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Search transactions..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        )}
      </View>

      {/* Transaction List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        renderSectionHeader={({ section }) => <DateSectionHeader date={section.date} />}
        ListEmptyComponent={
          searchQuery ? (
            <SearchEmptyState query={searchQuery} />
          ) : (
            <TransactionsEmptyState />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          sections.length === 0 ? { flex: 1 } : { paddingBottom: 32 }
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}
