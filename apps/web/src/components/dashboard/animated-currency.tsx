"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { formatCurrency } from "@somar/shared";
import type { AnimatedCurrencyProps } from "@somar/shared/components";
import { animatedCurrencyStyles } from "@somar/shared/styles";

/**
 * Animated currency display with counting animation.
 * Uses shared styles from @somar/shared/styles.
 */
export function AnimatedCurrency({ value, duration = 1500 }: AnimatedCurrencyProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: duration / 1000, // Convert ms to seconds for framer-motion
      ease: [0.16, 1, 0.3, 1],
    });

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded, duration]);

  const formatted = formatCurrency(displayValue);
  const [dollars, cents] = formatted.split(".");

  return (
    <div className={`flex ${animatedCurrencyStyles.container} gap-2`}>
      <motion.span
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`${animatedCurrencyStyles.fontFamily.web} text-6xl sm:text-7xl lg:text-8xl ${animatedCurrencyStyles.dollars} ${animatedCurrencyStyles.dollarsColor}`}
      >
        {dollars}
      </motion.span>
      {cents && (
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`${animatedCurrencyStyles.fontFamily.web} text-[2.5rem] ${animatedCurrencyStyles.centsColor}`}
        >
          .{cents}
        </motion.span>
      )}
    </div>
  );
}
