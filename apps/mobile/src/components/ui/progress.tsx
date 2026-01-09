import { forwardRef, useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/src/lib/utils";
import { hexColors, timing, easing } from "@somar/shared/theme";

/**
 * Progress component matching shadcn/ui Progress API.
 *
 * @example
 * // Basic progress
 * <Progress value={60} />
 *
 * // With custom color
 * <Progress value={80} indicatorColor={hexColors.warning} />
 *
 * // Animated on mount
 * <Progress value={75} animated delay={300} />
 */

export interface ProgressProps extends ViewProps {
  /** Progress value (0-100) */
  value?: number;
  /** Additional class names for the track */
  className?: string;
  /** Additional class names for the indicator */
  indicatorClassName?: string;
  /** Custom indicator color */
  indicatorColor?: string;
  /** Whether to animate the progress */
  animated?: boolean;
  /** Animation delay in ms */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
}

export const Progress = forwardRef<View, ProgressProps>(
  (
    {
      value = 0,
      className,
      indicatorClassName,
      indicatorColor,
      animated = false,
      delay = 0,
      duration = timing.slow,
      ...props
    },
    ref
  ) => {
    const progress = useSharedValue(animated ? 0 : value);

    useEffect(() => {
      if (animated) {
        progress.value = withDelay(
          delay,
          withTiming(value, {
            duration,
            easing: Easing.bezier(...easing.out),
          })
        );
      } else {
        progress.value = value;
      }
    }, [value, animated, delay, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
    }));

    return (
      <View
        ref={ref}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <Animated.View
          className={cn("h-full rounded-full bg-primary", indicatorClassName)}
          style={[
            indicatorColor ? { backgroundColor: indicatorColor } : undefined,
            animatedStyle,
          ]}
        />
      </View>
    );
  }
);

Progress.displayName = "Progress";

/**
 * Circular progress indicator.
 */
export interface CircularProgressProps extends ViewProps {
  /** Progress value (0-100) */
  value?: number;
  /** Size of the circle */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Track color */
  trackColor?: string;
  /** Indicator color */
  indicatorColor?: string;
  /** Additional class names */
  className?: string;
}

export const CircularProgress = forwardRef<View, CircularProgressProps>(
  (
    {
      value = 0,
      size = 40,
      strokeWidth = 4,
      trackColor = hexColors.muted,
      indicatorColor = hexColors.primary,
      className,
      ...props
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <View
        ref={ref}
        className={cn("items-center justify-center", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        {/* This is a simplified version - for full SVG support, use react-native-svg */}
        <View
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          }}
        />
        <View
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: indicatorColor,
            borderLeftColor: "transparent",
            borderBottomColor: "transparent",
            transform: [{ rotate: `${(value / 100) * 360 - 90}deg` }],
          }}
        />
      </View>
    );
  }
);

CircularProgress.displayName = "CircularProgress";
