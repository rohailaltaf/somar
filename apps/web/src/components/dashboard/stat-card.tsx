"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { StatCardProps } from "@somar/shared/components";
import {
  bentoCardStyles,
  getBentoValueClass,
  getBentoIconContainerClass,
} from "@somar/shared/styles";

/**
 * Stat card for dashboard bento grid.
 * Uses shared styles from @somar/shared/styles.
 */
export function StatCard({
  href,
  icon: Icon,
  iconColorClass,
  value,
  label,
  highlight = false,
  delay = 0,
}: StatCardProps) {
  const { gradients, container } = bentoCardStyles;

  const gridClasses = "col-span-6 lg:col-span-5";

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`relative ${bentoCardStyles.borderRadiusClass} overflow-hidden group transition-all duration-300 hover:scale-[1.01]`}
        style={{ minHeight: container.minHeight }}
      >
        {/* Base background */}
        <div className="absolute inset-0 bg-background" />

        {/* Animated gradient border for highlight state */}
        {highlight && (
          <>
            <div
              className={`absolute inset-0 ${bentoCardStyles.borderRadiusClass} p-[1px] opacity-60`}
              style={{
                background: `linear-gradient(135deg, ${gradients.oklch.borderStart} 0%, ${gradients.oklch.borderVia} 50%, ${gradients.oklch.borderStart} 100%)`,
              }}
            />
            <div
              className={`absolute inset-[1px] ${bentoCardStyles.borderRadiusClass}`}
              style={{
                background: `linear-gradient(135deg, ${gradients.oklch.bgStart} 0%, ${gradients.oklch.bgEnd} 100%)`,
              }}
            />
            <div className={`absolute inset-0 ${bentoCardStyles.borderRadiusClass} animate-pulse-glow bg-primary`} />
          </>
        )}

        {/* Non-highlight border */}
        {!highlight && (
          <div className={`absolute inset-0 ${bentoCardStyles.borderRadiusClass} ${bentoCardStyles.borderNormal}`} />
        )}

        {/* Content */}
        <div className="relative p-4 flex flex-col justify-between" style={{ minHeight: container.minHeight }}>
          <div className={`flex ${bentoCardStyles.header}`}>
            <div className={getBentoIconContainerClass(highlight)}>
              <Icon className={`${bentoCardStyles.icon} ${iconColorClass}`} />
            </div>
            <ChevronRight className={`${bentoCardStyles.chevron} group-hover:translate-x-1 transition-all`} />
          </div>

          <div className={bentoCardStyles.valueSection}>
            <p className={`${bentoCardStyles.value} ${getBentoValueClass(highlight, value)}`}>
              {value}
            </p>
            <p className={bentoCardStyles.label}>{label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Wrap with Link if href is provided
  if (href) {
    return (
      <Link href={href} className={`block ${gridClasses}`}>
        {content}
      </Link>
    );
  }

  return <div className={gridClasses}>{content}</div>;
}
