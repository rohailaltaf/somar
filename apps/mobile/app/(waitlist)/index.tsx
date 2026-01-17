import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Defs, RadialGradient, Stop, Rect, Line } from "react-native-svg";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers";
import { authFormStyles } from "@somar/shared/styles";
import { Badge } from "../../src/components/ui/badge";
import { CheckCircle2, LogOut, Play } from "lucide-react-native";

const styles = authFormStyles.waitlist;
const colors = authFormStyles.waitlist.colors.hex;
const dims = authFormStyles.waitlist.dimensions;

// Floating orb positions for decorative elements (percentages as decimals)
const orbs = [
  { x: 0.15, y: 0.20, size: 3, delay: 0, duration: 4000 },
  { x: 0.85, y: 0.25, size: 2, delay: 500, duration: 5000 },
  { x: 0.10, y: 0.70, size: 4, delay: 1000, duration: 4500 },
  { x: 0.90, y: 0.65, size: 2, delay: 1500, duration: 5500 },
  { x: 0.50, y: 0.85, size: 3, delay: 2000, duration: 4000 },
  { x: 0.25, y: 0.45, size: 2, delay: 800, duration: 5000 },
  { x: 0.75, y: 0.40, size: 2, delay: 1200, duration: 4500 },
];

function FloatingOrb({ x, y, size, delay, duration }: (typeof orbs)[0]) {
  const { width, height } = Dimensions.get("window");
  const progress = useSharedValue(0);

  useEffect(() => {
    // Single progress value that drives all animations, matching web's keyframe approach
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate progress to match web's [0.3, 0.8, 0.3] pattern
    const opacity = 0.3 + progress.value * 0.5;
    const scale = 1 + progress.value * 0.2;
    const translateY = -10 * progress.value;

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: width * x,
          top: height * y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.orb,
          // Glow effect using shadow
          shadowColor: colors.orb,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size * 2,
          elevation: 5,
        },
        animatedStyle,
      ]}
    />
  );
}

function WaitlistAtmosphericBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Primary nebula - purple, top-left */}
          <RadialGradient id="nebulaPrimary" cx="-20%" cy="-30%" rx="80%" ry="80%">
            <Stop offset="0%" stopColor={colors.nebulaPrimarySolid} stopOpacity="0.15" />
            <Stop offset="50%" stopColor={colors.nebulaPrimarySolid} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.nebulaPrimarySolid} stopOpacity="0" />
          </RadialGradient>
          {/* Secondary nebula - indigo, bottom-right */}
          <RadialGradient id="nebulaSecondary" cx="115%" cy="120%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor={colors.nebulaSecondarySolid} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={colors.nebulaSecondarySolid} stopOpacity="0" />
          </RadialGradient>
          {/* Accent nebula - gold, top-right */}
          <RadialGradient id="nebulaAccent" cx="90%" cy="20%" rx="30%" ry="30%">
            <Stop offset="0%" stopColor={colors.nebulaAccentSolid} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.nebulaAccentSolid} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaPrimary)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaSecondary)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaAccent)" />
      </Svg>

      {/* Subtle grid overlay */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.015 }]}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 20 }).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1="0"
              y1={i * dims.gridSpacing}
              x2="100%"
              y2={i * dims.gridSpacing}
              stroke={colors.gridLine}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * dims.gridSpacing}
              y1="0"
              x2={i * dims.gridSpacing}
              y2="100%"
              stroke={colors.gridLine}
              strokeWidth="0.5"
            />
          ))}
        </Svg>
      </View>

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}
    </View>
  );
}

export default function WaitlistScreen() {
  const { session, isLoading, logout, enterDemoMode } = useAuth();
  const router = useRouter();
  const [isEnteringDemo, setIsEnteringDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleEnterDemo = async () => {
    setIsEnteringDemo(true);
    setDemoError(null);
    try {
      const success = await enterDemoMode();
      if (success) {
        router.replace("/");
      } else {
        setDemoError("Failed to enter demo mode");
      }
    } catch {
      setDemoError("Failed to enter demo mode");
    } finally {
      setIsEnteringDemo(false);
    }
  };

  if (isLoading) {
    return (
      <View className={authFormStyles.loading.container}>
        <View className={authFormStyles.loading.spinner} />
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <WaitlistAtmosphericBackground />

      <View className={styles.content}>
        {/* Status badge */}
        <Animated.View entering={FadeInDown.duration(600)} className={styles.badgeWrapper}>
          <Badge variant="success">Application Received</Badge>
        </Animated.View>

        {/* Hero section */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(100)}
          className={styles.hero.container}
        >
          <View className={styles.hero.titleRow}>
            <Text
              className="text-5xl"
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                color: colors.heroText,
              }}
            >
              You're on{" "}
            </Text>
            <MaskedView
              maskElement={
                <Text
                  className="text-5xl"
                  style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}
                >
                  the list
                </Text>
              }
            >
              <LinearGradient
                colors={[colors.heroGradientStart, colors.heroGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  className="text-5xl opacity-0"
                  style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}
                >
                  the list
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>
          <Text className={styles.hero.subtitle}>
            We're reviewing your application. You'll be among the first to
            experience a new way to understand your finances.
          </Text>
        </Animated.View>

        {/* Email card with gradient border */}
        <Animated.View
          entering={FadeInUp.duration(700).delay(300)}
          className={styles.emailCard.outer}
          style={{ alignSelf: "stretch" }}
        >
          <LinearGradient
            colors={[
              colors.cardGradientStart,
              colors.cardGradientMid,
              colors.cardGradientEnd,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              borderRadius: dims.cardGradientRadius,
              padding: dims.cardGradientPadding,
            }}
          >
            <View className={styles.emailCard.inner}>
              <Text className={styles.emailCard.label}>Signed in as</Text>
              <Text className={styles.emailCard.email}>{session?.user?.email}</Text>
            </View>
          </LinearGradient>

          {/* Checkmark icon */}
          <View
            className={styles.emailCard.iconWrapper}
            style={{
              backgroundColor: colors.checkmarkBg,
              shadowColor: colors.checkmarkIcon,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <CheckCircle2 size={dims.iconMedium} color={colors.checkmarkIcon} />
          </View>
        </Animated.View>

        {/* Info section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(500)}
          className={styles.info.container}
        >
          <Text className={styles.info.text}>
            You'll receive an email at this address once approved.{"\n"}
            <Text className={styles.info.highlight}>
              This usually happens within 24 hours.
            </Text>
          </Text>
        </Animated.View>

        {/* Demo button */}
        <Animated.View entering={FadeIn.duration(600).delay(600)} className="mb-6">
          <TouchableOpacity
            onPress={handleEnterDemo}
            disabled={isEnteringDemo}
            activeOpacity={0.8}
            style={{ opacity: isEnteringDemo ? 0.7 : 1 }}
          >
            <LinearGradient
              colors={[colors.demoButtonBg, colors.demoButtonBgHover]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className={styles.demoButton}
              style={{ borderRadius: 12 }}
            >
              {isEnteringDemo ? (
                <ActivityIndicator size="small" color={colors.demoButtonText} />
              ) : (
                <Play size={20} color={colors.demoButtonText} />
              )}
              <Text className={styles.demoButtonText} style={{ color: colors.demoButtonText }}>
                {isEnteringDemo ? "Starting demo..." : "Try out a demo"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {demoError && (
            <Text className="text-destructive text-sm text-center mt-2">
              {demoError}
            </Text>
          )}
        </Animated.View>

        {/* Sign out button */}
        <Animated.View entering={FadeIn.duration(600).delay(800)}>
          <TouchableOpacity
            onPress={logout}
            className={styles.signOutButton}
            activeOpacity={0.7}
          >
            <LogOut size={dims.iconSmall} color={colors.mutedForeground} />
            <Text className={styles.signOutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
