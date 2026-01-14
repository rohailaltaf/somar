import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect, Line, Circle } from "react-native-svg";
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
import { useAuth } from "../../src/providers";
import { authFormStyles } from "@somar/shared/styles";
import { Check, Sparkles, LogOut } from "lucide-react-native";
import { useEffect } from "react";

const styles = authFormStyles.waitlist;
const colors = authFormStyles.waitlist.colors.hex;

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
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.8, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-10, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, duration, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

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

      {/* Subtle grid overlay - 80px spacing to match web */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.015 }]}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 20 }).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1="0"
              y1={i * 80}
              x2="100%"
              y2={i * 80}
              stroke={colors.gridLine}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * 80}
              y1="0"
              x2={i * 80}
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
  const { session, isLoading, logout } = useAuth();

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
        <Animated.View
          entering={FadeInDown.duration(600)}
          className={styles.statusBadge}
          style={{
            backgroundColor: colors.statusBadgeBg,
          }}
        >
          <View
            className={styles.statusDot}
            style={{ backgroundColor: colors.statusDot }}
          />
          <Text style={{ color: colors.statusBadgeText, fontSize: 12, fontWeight: "500" }}>
            Application Received
          </Text>
        </Animated.View>

        {/* Hero section */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(100)}
          className={styles.hero.container}
        >
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular",
              fontStyle: "italic",
              fontSize: 48,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.heroText }}>You're on </Text>
            <Text style={{ color: colors.heroGradientStart }}>the list</Text>
          </Text>
          <Text className={styles.hero.subtitle}>
            We're reviewing your application. You'll be among the first to
            experience a new way to understand your finances.
          </Text>
        </Animated.View>

        {/* Email card with gradient border */}
        <Animated.View
          entering={FadeInUp.duration(700).delay(300)}
          style={{ width: "100%", maxWidth: 320, marginBottom: 32 }}
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
              borderRadius: 16,
              padding: 1,
            }}
          >
            <View
              style={{
                backgroundColor: colors.cardSurface,
                borderRadius: 15,
                padding: 24,
              }}
            >
              <Text className={styles.emailCard.label}>Signed in as</Text>
              <Text className={styles.emailCard.email}>{session?.user?.email}</Text>
            </View>
          </LinearGradient>

          {/* Checkmark icon */}
          <View
            style={{
              position: "absolute",
              top: -12,
              right: -12,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.checkmarkBg,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.checkmarkIcon,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Check size={20} color={colors.checkmarkIcon} />
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

        {/* Feature preview hint */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(650)}
          className={styles.featurePreview}
          style={{
            backgroundColor: colors.featurePreviewBg,
            borderWidth: 1,
            borderColor: colors.featurePreviewBorder,
          }}
        >
          <Sparkles size={16} color={colors.featurePreviewIcon} />
          <Text className="text-xs text-muted-foreground flex-1">
            Smart categorization, beautiful insights, and total control over
            your financial data.
          </Text>
        </Animated.View>

        {/* Sign out button */}
        <Animated.View entering={FadeIn.duration(600).delay(800)}>
          <TouchableOpacity
            onPress={logout}
            className={styles.signOutButton}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={colors.mutedForeground} />
            <Text className="text-sm text-muted-foreground">Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
