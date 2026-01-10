import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Line } from "react-native-svg";

/**
 * Atmospheric background with nebula effect and subtle grid.
 * Matches the web dashboard's deep space aesthetic.
 */
export function AtmosphericBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Primary nebula - oklch(0.25 0.15 280) at 12% */}
          <RadialGradient id="nebulaPrimary" cx="-10%" cy="-20%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor="#1d0166" stopOpacity="0.12" />
            <Stop offset="50%" stopColor="#1d0166" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#1d0166" stopOpacity="0" />
          </RadialGradient>
          {/* Secondary glow - oklch(0.35 0.12 200) at 8% */}
          <RadialGradient id="nebulaSecondary" cx="115%" cy="30%" rx="50%" ry="60%">
            <Stop offset="0%" stopColor="#004a53" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#004a53" stopOpacity="0" />
          </RadialGradient>
          {/* Accent highlight - oklch(0.45 0.18 260) at 6% */}
          <RadialGradient id="nebulaAccent" cx="20%" cy="110%" rx="40%" ry="40%">
            <Stop offset="0%" stopColor="#044cb6" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#044cb6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaPrimary)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaSecondary)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#nebulaAccent)" />
      </Svg>

      {/* Subtle grid overlay - 60px spacing to match web */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.02 }]}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 15 }).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1="0"
              y1={i * 60}
              x2="100%"
              y2={i * 60}
              stroke="#5d646f"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * 60}
              y1="0"
              x2={i * 60}
              y2="100%"
              stroke="#5d646f"
              strokeWidth="0.5"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
