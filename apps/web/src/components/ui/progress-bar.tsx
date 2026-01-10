"use client";

import { motion } from "framer-motion";
import {
  progressBarStyles,
  getProgressBarHexColor,
  type ProgressBarProps,
} from "@somar/shared/styles";

/**
 * Animated progress bar with glow effect.
 * Uses shared styles from @somar/shared/styles.
 */
export function ProgressBar({ percentage }: ProgressBarProps) {
  const barColor = getProgressBarHexColor(percentage);
  const clampedPercentage = Math.min(percentage, 100);
  const { animation } = progressBarStyles;

  return (
    <div className={`relative ${progressBarStyles.trackHeight} ${progressBarStyles.track} ${progressBarStyles.trackBackground}`}>
      {/* Glow layer */}
      <motion.div
        className={`${progressBarStyles.barAbsolute} ${progressBarStyles.bar} ${progressBarStyles.glow}`}
        style={{ backgroundColor: barColor }}
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercentage}%` }}
        transition={{
          duration: animation.duration / 1000,
          delay: animation.delay / 1000,
          ease: animation.ease,
        }}
      />
      {/* Main bar */}
      <motion.div
        className={`${progressBarStyles.barAbsolute} ${progressBarStyles.bar}`}
        style={{ backgroundColor: barColor }}
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercentage}%` }}
        transition={{
          duration: animation.duration / 1000,
          delay: animation.delay / 1000,
          ease: animation.ease,
        }}
      />
    </div>
  );
}
