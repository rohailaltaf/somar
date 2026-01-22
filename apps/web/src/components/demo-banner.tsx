"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { demoBannerStyles, type DemoBannerProps } from "@somar/shared/styles";

const styles = demoBannerStyles;
const colors = styles.colors.oklch;

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <motion.div
      className={styles.container}
      style={{
        backgroundColor: colors.background,
        minHeight: styles.heights.banner,
      }}
      initial={{ y: -styles.heights.banner, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <AlertTriangle
            size={styles.dimensions.iconSize}
            style={{ color: colors.icon }}
          />
        </div>
        <div>
          <p className={styles.text} style={{ color: colors.text }}>
            Demo Mode
          </p>
          <p className={styles.subtext} style={{ color: colors.textSecondary }}>
            Using sample data
          </p>
        </div>
      </div>

      <motion.button
        onClick={onExit}
        className={styles.exitButton}
        style={{ color: colors.text }}
        whileHover={{ backgroundColor: colors.buttonHover }}
        whileTap={{ scale: 0.95 }}
      >
        <X size={styles.dimensions.exitIconSize} />
        <span className={styles.exitButtonText}>Exit Demo</span>
      </motion.button>
    </motion.div>
  );
}
