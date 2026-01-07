import React from "react";
import { View } from "react-native";
import type { ThemeColors } from "../../lib/theme";

interface DashboardSkeletonProps {
  colors: ThemeColors;
}

/**
 * Full dashboard loading skeleton.
 * Matches the dashboard layout with hero, bento cards, and sections.
 */
export function DashboardSkeleton({ colors }: DashboardSkeletonProps) {
  return (
    <View style={{ flex: 1 }}>
      {/* Hero skeleton */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ width: 80, height: 12, backgroundColor: colors.muted, borderRadius: 6, marginBottom: 16 }} />
        <View style={{ width: 200, height: 48, backgroundColor: colors.muted, borderRadius: 8, marginBottom: 16 }} />
        <View style={{ width: 120, height: 28, backgroundColor: colors.muted, borderRadius: 14 }} />
      </View>

      {/* Bento cards skeleton */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1, height: 140, backgroundColor: colors.muted, borderRadius: 16 }} />
        <View style={{ flex: 1, height: 140, backgroundColor: colors.muted, borderRadius: 16 }} />
      </View>

      {/* Budget bar skeleton */}
      <View style={{ height: 80, backgroundColor: colors.muted, borderRadius: 16, marginBottom: 24 }} />

      {/* Categories skeleton */}
      <View style={{ height: 200, backgroundColor: colors.muted, borderRadius: 16 }} />
    </View>
  );
}
