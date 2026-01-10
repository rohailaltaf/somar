import { View } from "react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

interface SkeletonProps {
  className?: string;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  borderRadius?: number;
}

/**
 * Animated skeleton placeholder.
 */
export function Skeleton({
  className = "",
  width,
  height,
  borderRadius = 6,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-muted ${className}`}
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }}
    />
  );
}

/**
 * Transaction row skeleton.
 */
export function TransactionRowSkeleton() {
  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="flex-1 mr-4">
        <Skeleton width="55%" height={16} className="mb-2" />
        <Skeleton width="35%" height={14} />
      </View>
      <Skeleton width={70} height={18} />
    </View>
  );
}

/**
 * Loading state for transactions list.
 */
export function TransactionsLoadingState() {
  return (
    <View className="flex-1 bg-background">
      {/* Header skeleton */}
      <View className="px-5 py-3 bg-surface border-b border-border-subtle">
        <Skeleton width={100} height={16} />
      </View>
      {/* Transaction skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </View>
  );
}

