import React from "react";
import { View } from "react-native";

/**
 * Full dashboard loading skeleton.
 * Matches the dashboard layout with hero, bento cards, and sections.
 */
export function DashboardSkeleton() {
  return (
    <View className="flex-1">
      {/* Hero skeleton */}
      <View className="mb-5">
        <View className="w-20 h-3 bg-muted rounded-md mb-4" />
        <View className="w-[200px] h-12 bg-muted rounded-lg mb-4" />
        <View className="w-[120px] h-7 bg-muted rounded-full" />
      </View>

      {/* Bento cards skeleton */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 h-[140px] bg-muted rounded-2xl" />
        <View className="flex-1 h-[140px] bg-muted rounded-2xl" />
      </View>

      {/* Budget bar skeleton */}
      <View className="h-20 bg-muted rounded-2xl mb-6" />

      {/* Categories skeleton */}
      <View className="h-[200px] bg-muted rounded-2xl" />
    </View>
  );
}
