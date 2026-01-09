import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import {
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  Globe,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAccounts } from "@somar/shared/hooks";
import { oklchToHex } from "@somar/shared/utils";
import { colors } from "@/src/lib/theme";

export default function WalletScreen() {
  const { data: accounts = [], isLoading, refetch } = useAccounts();

  // Separate accounts into connected and manual
  const connectedAccounts = accounts.filter((a) => a.plaidAccountId);
  const manualAccounts = accounts.filter((a) => !a.plaidAccountId);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "credit_card":
        return CreditCard;
      case "investment":
        return TrendingUp;
      default:
        return Building2;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "credit_card":
        return "Credit Card";
      case "checking":
        return "Checking";
      case "investment":
        return "Investment";
      case "loan":
        return "Loan";
      default:
        return type;
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4">
        <WalletSkeleton />
      </View>
    );
  }

  const hasNoAccounts = accounts.length === 0;

  return (
    <View className="flex-1 bg-background">
      {/* Atmospheric Background */}
      <View className="absolute inset-0 pointer-events-none overflow-hidden">
        <View
          className="absolute w-[70vw] h-[70vh] rounded-full opacity-20"
          style={{
            top: "-20%",
            left: "-10%",
            backgroundColor: oklchToHex("oklch(0.25 0.15 280)"),
            transform: [{ scale: 1.5 }],
          }}
        />
        <View
          className="absolute w-[50vw] h-[60vh] rounded-full opacity-15"
          style={{
            top: "20%",
            right: "-15%",
            backgroundColor: oklchToHex("oklch(0.35 0.12 200)"),
          }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="px-4 pt-4 pb-2"
        >
          <Text className="text-2xl font-semibold text-foreground">
            Wallet
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Your connected accounts
          </Text>
        </Animated.View>

        {/* Empty State */}
        {hasNoAccounts && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            className="mx-4 mt-6"
          >
            <View
              className="rounded-2xl p-8 items-center border"
              style={{
                backgroundColor: oklchToHex("oklch(0.12 0.02 260)"),
                borderColor: "rgba(46, 50, 66, 0.5)",
              }}
            >
              <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-5">
                <Building2 size={28} color={colors.mutedForeground} />
              </View>
              <Text className="font-semibold text-foreground text-lg text-center mb-2">
                No accounts connected
              </Text>
              <Text className="text-muted-foreground text-sm text-center leading-5 max-w-[280px]">
                Connect your bank or add manual accounts on the web app to see
                them here.
              </Text>

              {/* Web link hint */}
              <View className="flex-row items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-primary/10">
                <Globe size={16} color={colors.primary} />
                <Text className="text-sm text-primary font-medium">
                  Use web app to manage accounts
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Connected Accounts Section */}
        {connectedAccounts.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            className="mx-4 mt-6"
          >
            {/* Section Header */}
            <View className="flex-row items-center gap-2 mb-4">
              <View className="p-1.5 rounded-lg bg-primary/20">
                <Building2 size={16} color={colors.primary} />
              </View>
              <Text className="text-base font-semibold text-foreground">
                Connected Accounts
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-primary/10">
                <Text className="text-xs font-medium text-primary">
                  {connectedAccounts.length}
                </Text>
              </View>
            </View>

            {/* Account Cards */}
            <View
              className="rounded-2xl overflow-hidden border"
              style={{
                backgroundColor: oklchToHex("oklch(0.12 0.02 260)"),
                borderColor: "rgba(46, 50, 66, 0.5)",
              }}
            >
              {connectedAccounts.map((account, index) => {
                const AccountIcon = getAccountIcon(account.type);
                const isLast = index === connectedAccounts.length - 1;

                return (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="active:opacity-70"
                  >
                    <View
                      className="flex-row items-center px-4 py-3.5"
                      style={{
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: "rgba(46, 50, 66, 0.5)",
                      }}
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center bg-primary/10 mr-3">
                        <AccountIcon size={18} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {account.name}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {getAccountTypeLabel(account.type)}
                        </Text>
                      </View>
                      <View className="px-2 py-1 rounded-md bg-success/10">
                        <Text className="text-[10px] font-medium text-success">
                          Synced
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Manual Accounts Section */}
        {manualAccounts.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            className="mx-4 mt-6"
          >
            {/* Section Header */}
            <View className="flex-row items-center gap-2 mb-4">
              <View className="p-1.5 rounded-lg bg-warning/15">
                <Wallet size={16} color={colors.warning} />
              </View>
              <Text className="text-base font-semibold text-foreground">
                Manual Accounts
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-warning/10">
                <Text className="text-xs font-medium text-warning">
                  {manualAccounts.length}
                </Text>
              </View>
            </View>

            {/* Account Cards */}
            <View
              className="rounded-2xl overflow-hidden border"
              style={{
                backgroundColor: oklchToHex("oklch(0.12 0.02 260)"),
                borderColor: "rgba(46, 50, 66, 0.5)",
              }}
            >
              {manualAccounts.map((account, index) => {
                const AccountIcon = getAccountIcon(account.type);
                const isLast = index === manualAccounts.length - 1;

                return (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="active:opacity-70"
                  >
                    <View
                      className="flex-row items-center px-4 py-3.5"
                      style={{
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: "rgba(46, 50, 66, 0.5)",
                      }}
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center bg-warning/10 mr-3">
                        <AccountIcon size={18} color={colors.warning} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {account.name}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {getAccountTypeLabel(account.type)}
                        </Text>
                      </View>
                      <View className="px-2 py-1 rounded-md bg-muted">
                        <Text className="text-[10px] font-medium text-muted-foreground">
                          CSV Import
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Web App Hint (when has accounts) */}
        {!hasNoAccounts && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            className="mx-4 mt-6"
          >
            <View
              className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl"
              style={{
                backgroundColor: oklchToHex("oklch(0.15 0.02 260)"),
              }}
            >
              <Globe size={18} color={colors.mutedForeground} />
              <Text className="flex-1 text-sm text-muted-foreground">
                To add or manage accounts, use the web app
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function WalletSkeleton() {
  return (
    <View className="space-y-6">
      {/* Header skeleton */}
      <View className="pt-4">
        <View className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
        <View className="h-4 w-40 rounded-lg bg-muted animate-pulse mt-2" />
      </View>

      {/* Section skeleton */}
      <View className="mt-6">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <View className="h-5 w-32 rounded-lg bg-muted animate-pulse" />
        </View>

        <View className="rounded-2xl bg-card border border-border overflow-hidden">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-row items-center px-4 py-3.5 border-b border-border last:border-b-0"
            >
              <View className="w-10 h-10 rounded-xl bg-muted animate-pulse mr-3" />
              <View className="flex-1">
                <View className="h-4 w-28 rounded bg-muted animate-pulse" />
                <View className="h-3 w-20 rounded bg-muted animate-pulse mt-1.5" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
